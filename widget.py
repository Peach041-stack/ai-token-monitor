import tkinter as tk
from tkinter import ttk
import subprocess
import json
import threading
import time
import os
import pystray
from PIL import Image, ImageDraw
import win32gui
from plyer import notification

CONFIG_FILE = "widget_config.json"
DEFAULT_BUDGET = 20.0

def extract_json(output):
    try:
        # Find first { or [ to parse multi-line JSON
        start = -1
        for i, c in enumerate(output):
            if c in '{[':
                start = i
                break
        if start != -1:
            return json.loads(output[start:])
    except: pass
    return None

class FloatingWidget:
    def __init__(self, root):
        self.root = root
        self.root.title("AI Usage V2")
        self.root.overrideredirect(True)
        self.root.wm_attributes("-topmost", True)
        self.root.wm_attributes("-alpha", 0.95)
        
        print("Widget Initializing...")
        self.root.update_idletasks()
        
        self.bg_color = "#1e1e1e"
        self.fg_color = "#ffffff"
        self.root.configure(bg=self.bg_color)
        
        self.width = 380
        self.height = 360
        x = self.root.winfo_screenwidth() - self.width - 50
        y = 50
        self.root.geometry(f"{self.width}x{self.height}+{x}+{y}")
        
        self.offset_x = 0
        self.offset_y = 0
        self.is_visible = True
        self.has_notified = False
        
        self.load_config()
        
        # State Data
        self.active_project = None
        self.overview_data = {"cost": 0, "savings": 0}
        self.models_data = []
        self.optimize_grade = "N/A"
        self.yield_data = {"productive": 0, "abandoned": 0, "reverted": 0}

        self.create_widgets()
        
        self.fetch_thread = threading.Thread(target=self.fetch_data_loop, daemon=True)
        self.fetch_thread.start()
        
    def load_config(self):
        self.budget = DEFAULT_BUDGET
        if os.path.exists(CONFIG_FILE):
            try:
                with open(CONFIG_FILE, "r") as f:
                    c = json.load(f)
                    self.budget = c.get("budget", DEFAULT_BUDGET)
            except: pass

    def create_widgets(self):
        self.header = tk.Frame(self.root, bg="#2d2d30", cursor="fleur", height=30)
        self.header.pack(fill="x")
        self.header.pack_propagate(False)
        self.header.bind("<ButtonPress-1>", self.start_move)
        self.header.bind("<B1-Motion>", self.do_move)
        
        self.title_lbl = tk.Label(self.header, text="AI Usage [Global]", bg="#2d2d30", fg="#aaaaaa", font=("Segoe UI", 9, "bold"))
        self.title_lbl.pack(side="left", padx=10, pady=5)
        
        # Close button since we removed tray
        close_btn = tk.Label(self.header, text="✕", bg="#2d2d30", fg="#ff5555", font=("Segoe UI", 10, "bold"), cursor="hand2")
        close_btn.pack(side="right", padx=10, pady=2)
        close_btn.bind("<Button-1>", lambda e: self.root.destroy())

        self.content = tk.Frame(self.root, bg=self.bg_color)
        self.content.pack(fill="both", expand=True)

        style = ttk.Style()
        style.theme_use('default')
        style.configure("TNotebook", background=self.bg_color, borderwidth=0)
        style.configure("TNotebook.Tab", background="#2d2d30", foreground="#aaaaaa", borderwidth=0, padding=[10, 5])
        style.map("TNotebook.Tab", background=[("selected", "#3b82f6")], foreground=[("selected", "#ffffff")])

        self.notebook = ttk.Notebook(self.content)
        self.notebook.pack(fill="both", expand=True, padx=10, pady=10)
        
        self.tab_overview = tk.Frame(self.notebook, bg=self.bg_color)
        self.tab_models = tk.Frame(self.notebook, bg=self.bg_color)
        self.tab_optimize = tk.Frame(self.notebook, bg=self.bg_color)
        
        self.notebook.add(self.tab_overview, text="Overview")
        self.notebook.add(self.tab_models, text="Models")
        self.notebook.add(self.tab_optimize, text="Yield & Health")

        # Overview Tab
        self.lbl_cost = tk.Label(self.tab_overview, text="Loading Data...", bg=self.bg_color, fg="#10b981", font=("Segoe UI", 24, "bold"))
        self.lbl_cost.pack(pady=10)
        
        self.lbl_budget = tk.Label(self.tab_overview, text=f"Budget: ${self.budget:.2f}", bg=self.bg_color, fg="#aaaaaa")
        self.lbl_budget.pack()

        # Add a progress bar to make it look nicer
        self.canvas_prog = tk.Canvas(self.tab_overview, height=8, bg="#333333", highlightthickness=0)
        self.canvas_prog.pack(fill="x", padx=20, pady=15)
        
        def resize_prog(event):
            self.canvas_prog.delete("all")
            c = self.overview_data.get("cost", 0)
            ratio = min(c / self.budget, 1.0) if self.budget > 0 else 0
            color = "#ff5555" if c >= self.budget else "#3b82f6"
            self.canvas_prog.create_rectangle(0, 0, event.width * ratio, 8, fill=color, outline="")
        self.canvas_prog.bind("<Configure>", resize_prog)

        # Models Tab
        self.lbl_models = tk.Label(self.tab_models, text="Fetching model data...", bg=self.bg_color, fg="#aaaaaa", justify="left", font=("Consolas", 9))
        self.lbl_models.pack(pady=10, anchor="w", padx=10)

        # Optimize Tab
        self.lbl_health = tk.Label(self.tab_optimize, text="Setup Health: ?", bg=self.bg_color, fg="#ffffff", font=("Segoe UI", 12, "bold"))
        self.lbl_health.pack(pady=10)
        self.lbl_yield = tk.Label(self.tab_optimize, text="Yield: ?", bg=self.bg_color, fg="#aaaaaa", justify="left")
        self.lbl_yield.pack(pady=5)

    def fetch_data_loop(self):
        while True:
            # Detect Active Project Context
            try:
                window_title = win32gui.GetWindowText(win32gui.GetForegroundWindow())
                self.active_project = None
                if "Visual Studio Code" in window_title or "Cursor" in window_title:
                    parts = window_title.split("-")
                    if len(parts) > 1:
                        proj = parts[0].strip()
                        self.active_project = proj
            except Exception as e:
                pass

            CREATE_NO_WINDOW = 0x08000000
            
            # Fetch Overview (fast)
            try:
                res = subprocess.run("npx -y codeburn status --format json" + (" --project " + self.active_project if self.active_project else ""), shell=True, capture_output=True, text=True, encoding='utf-8', errors='ignore', creationflags=0x08000000)
                j = extract_json(res.stdout)
                if j and "month" in j:
                    self.overview_data = j["month"]
                    
                    cost = self.overview_data["cost"]
                    if cost >= self.budget and not self.has_notified:
                        notification.notify(title="AI Budget Alert", message=f"You exceeded your weekly budget of ${self.budget}!", app_name="AI Widget", timeout=5)
                        self.has_notified = True
                    elif cost >= self.budget * 0.8 and not self.has_notified:
                        notification.notify(title="AI Budget Warning", message="You are at 80% of your AI budget.", app_name="AI Widget", timeout=5)
                        self.has_notified = True
            except: pass

            # Fetch Detailed Report (Models)
            try:
                res2 = subprocess.run("npx -y codeburn report -p week --format json" + (" --project " + self.active_project if self.active_project else ""), shell=True, capture_output=True, text=True, encoding='utf-8', errors='ignore', creationflags=0x08000000)
                j2 = extract_json(res2.stdout)
                if j2 and "models" in j2:
                    self.models_data = j2.get("models", [])[:5]
            except: pass

            # Fetch Optimize & Yield
            try:
                res3 = subprocess.run("npx -y codeburn optimize --format json", shell=True, capture_output=True, text=True, encoding='utf-8', errors='ignore', creationflags=0x08000000)
                j3 = extract_json(res3.stdout)
                if j3:
                    self.optimize_grade = j3.get("grade", "N/A")
                
                res4 = subprocess.run("npx -y codeburn yield -p week --format json" + (" --project " + self.active_project if self.active_project else ""), shell=True, capture_output=True, text=True, encoding='utf-8', errors='ignore', creationflags=0x08000000)
                j4 = extract_json(res4.stdout)
                if j4 and "summary" in j4:
                    self.yield_data = j4.get("summary", {})
            except: pass

            self.root.after(0, self.update_ui)
            time.sleep(60) # Fetch every 1 min for better responsiveness on active window

    def update_ui(self):
        title_text = f"AI Usage [{self.active_project if self.active_project else 'Global'}]"
        self.title_lbl.config(text=title_text)
        
        cost = self.overview_data.get("cost", 0)
        color = "#ff5555" if cost >= self.budget else "#10b981"
        self.lbl_cost.config(text=f"${cost:.2f}", fg=color)
        
        # Update progress bar
        w = self.canvas_prog.winfo_width()
        self.canvas_prog.delete("all")
        ratio = min(cost / self.budget, 1.0) if self.budget > 0 else 0
        bar_color = "#ff5555" if cost >= self.budget else "#3b82f6"
        self.canvas_prog.create_rectangle(0, 0, w * ratio, 8, fill=bar_color, outline="")
        
        # Models
        model_text = ""
        for m in self.models_data:
            model_text += f"{m['name'][:15]:<15} ${m['cost']:.2f}\n"
        if not model_text: model_text = "No models active."
        self.lbl_models.config(text=model_text)

        # Optimize & Yield
        color_grade = "#ff5555" if self.optimize_grade in ["D", "F"] else "#10b981"
        self.lbl_health.config(text=f"Setup Health Grade: {self.optimize_grade}", fg=color_grade)
        
        p_data = self.yield_data.get("productive", {}) if isinstance(self.yield_data, dict) else {}
        a_data = self.yield_data.get("abandoned", {}) if isinstance(self.yield_data, dict) else {}
        r_data = self.yield_data.get("reverted", {}) if isinstance(self.yield_data, dict) else {}
        
        # handle case where the data is just the cost float/int itself, or a dict containing cost
        p = float(p_data.get("costUSD", p_data.get("cost", 0))) if isinstance(p_data, dict) else float(p_data if p_data else 0)
        a = float(a_data.get("costUSD", a_data.get("cost", 0))) if isinstance(a_data, dict) else float(a_data if a_data else 0)
        r = float(r_data.get("costUSD", r_data.get("cost", 0))) if isinstance(r_data, dict) else float(r_data if r_data else 0)

        self.lbl_yield.config(text=f"Productive: ${p:.2f}\nAbandoned: ${a:.2f}\nReverted: ${r:.2f}")

    def start_move(self, event):
        self.offset_x = event.x
        self.offset_y = event.y
    def do_move(self, event):
        x = self.root.winfo_pointerx() - self.offset_x
        y = self.root.winfo_pointery() - self.offset_y
        self.root.geometry(f"+{x}+{y}")

if __name__ == "__main__":
    root = tk.Tk()
    app = FloatingWidget(root)
    root.mainloop()
