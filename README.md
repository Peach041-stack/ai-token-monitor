# 📊 AI Token Observability Dashboard (แดชบอร์ดติดตามการใช้งาน Token ของ AI)

> ระบบมอนิเตอร์และวิเคราะห์การใช้งาน Token ของ AI แบบ **Real-time** สำหรับผู้พัฒนาที่ใช้งาน **Codex (ChatGPT Desktop / Codex CLI), Antigravity (Google DeepMind), และ Claude (Claude Code / Cowork)**

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8?logo=tailwind-css)
![Recharts](https://img.shields.io/badge/Recharts-2.x-8884d8)
![NodeJS](https://img.shields.io/badge/Node.js-18%2B-green?logo=node.js)

---

## 🌟 ฟีเจอร์เด่น (Key Features)

- ⚡ **Real-Time Token Tracking:** ดักจับ Token (Input, Output, Reasoning, Cache) สดๆ ทันทีที่กดส่ง Prompt ใน **Codex GUI, Codex CLI, Antigravity, หรือ Claude Code**
- 📈 **Interactive Visualizations:** กราฟแนวโน้ม Recharts สลับได้ทั้ง **กราฟเส้น (Line)**, **กราฟแท่ง (Bar)**, และ **กราฟพื้นที่สะสม (Area Chart)**
- 📅 **ตัวกรองเวลาอัตโนมัติ (Time Filters & Auto Aggregation):**
  - **รายวัน (Daily):** 7 วัน, 14 วัน, 30 วัน หรือ 60 วันล่าสุด
  - **กำหนดช่วงเวลาเอง (Custom Date Range):** เลือกวันเริ่มต้น–สิ้นสุด กรองผลแบบ Real-time
  - **รายเดือน (Monthly):** รวมสถิติรายเดือนย้อนหลัง
- 🔘 **Model Toggles:** สลับเปิด/ปิดโมเดลเพื่อเปรียบเทียบสัดส่วนได้อย่างอิสระ
- 🍩 **Model Distribution:** ดูกราฟวงกลม Donut Chart แสดงสัดส่วนเปอร์เซ็นต์ และการประมาณการค่าใช้จ่าย (USD / THB)
- 📋 **Detailed Logs & Export:** ตารางสรุปเชิงลึกพร้อมปุ่มส่งออกรายงานเป็นไฟล์ **CSV (รองรับ Excel ภาษาไทย UTF-8 BOM)** และ **JSON**
- 🚀 **One-Click Run:** ดับเบิลคลิกไฟล์เดียว ติดตั้ง dependencies และเปิดระบบพร้อมหน้าเว็บให้อัตโนมัติ

---

## 🚀 วิธีเริ่มต้นใช้งานแบบคลิกเดียว (One-Click Start)

### บนระบบปฏิบัติการ Windows:
1. ดับเบิลคลิกที่ไฟล์ **`start.bat`**
2. ระบบจะทำการตรวจสอบ Node.js, ติดตั้ง Packages อัตโนมัติ (ถ้ายังไม่มี), รัน Real-time Bridge Server (Port 3001) และเปิดหน้าเว็บให้ที่ `http://localhost:5173` ทันที!

### หรือรันผ่าน Terminal:
```bash
# 1. เข้าสู่โฟลเดอร์ token-dashboard
cd token-dashboard

# 2. ติดตั้ง dependencies
npm install

# 3. เริ่มต้น Server ดักจับ Log และหน้าเว็บ
node server.cjs
npm run dev
```

---

## 🏗️ โครงสร้างสถาปัตยกรรม (Architecture)

```text
d:\Widget Usage\
├── start.bat                     # ⚡ ไฟล์ One-Click Launcher
├── standalone_dashboard.html     # 🌐 หน้าเว็บ Standalone Preview (เปิดได้ทันทีโดยไม่ต้องรัน Node)
├── token-dashboard/
│   ├── server.cjs                # 🤖 Real-time Log Watcher & SSE Bridge Server (Port 3001)
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── components/
│       │   ├── TokenDashboard.jsx     # หน้าแดชบอร์ดหลัก
│       │   ├── KPICards.jsx           # การ์ดสรุป KPI (Total, Avg, Top Model, Cost)
│       │   ├── FilterControls.jsx     # แผงควบคุมตัวกรองเวลาและโมเดล
│       │   ├── ChartSection.jsx       # กราฟแสดงแนวโน้ม (Line, Bar, Area)
│       │   ├── ModelDistribution.jsx  # กราฟวงกลม Donut Chart
│       │   ├── LiveTokenStream.jsx    # ตัวติดตาม Token สด (Real-time Stream)
│       │   └── TokenTable.jsx         # ตารางข้อมูลและปุ่ม Export CSV/JSON
│       └── utils/
│           └── mockDataGenerator.js   # โมเดลและฟังก์ชันประมวลผลข้อมูล
└── README.md
```

---

## 🔒 นโยบายความเป็นส่วนตัวและความปลอดภัย (Privacy & Security)

- โค้ดในโปรเจกต์นี้ **ไม่มีการเก็บหรือส่งออก API Key, Password, หรือข้อมูลส่วนตัวใดๆ ไปยังเซิร์ฟเวอร์ภายนอก**
- การทำงานเป็นการอ่าน Local Session Logs ในเครื่องของผู้ใช้ (`~/.codex/`, `~/.claude/`, `~/.gemini/`) ผ่าน Local Server (Port 3001) เท่านั้น
- ทุก Path ถูกเรียกใช้ผ่าน Dynamic User Home (`os.homedir()`) ไม่มี Hardcode ข้อมูลผู้ใช้

---

## 📄 ใบอนุญาต (License)

โปรเจกต์นี้เผยแพร่ภายใต้ [MIT License](LICENSE)
