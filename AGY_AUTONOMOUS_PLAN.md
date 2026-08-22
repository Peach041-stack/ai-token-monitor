# 🤖 Antigravity Autonomous Execution Plan (Dangerous Mode)
# Project: AI Token Monitor (`ai-token-monitor`)
# Target Repository: https://github.com/Peach041-stack/ai-token-monitor

> **Instruction for Antigravity CLI / AGY Runner:**
> Execute all steps in this plan sequentially in autonomous/dangerous mode without stopping or waiting for user confirmation. Verify each step before proceeding to the next.

---

## 🎯 Primary Goal
Fully automate, build, test, background-daemonize, and synchronize the **AI Token Observability Dashboard** with support for:
1. **Sub-Model Deep Tracking** (e.g. GPT-5.6, Claude Opus 5, Claude Fable 5, Gemini 3.0 Flash/Pro).
2. **Real-time Live SSE Token Stream** (Prompt / Completion / Cached / Reasoning Tokens).
3. **Activity Heatmap Grid** (365-day GitHub contribution style calendar).
4. **Silent Windows Auto-Start Daemon** (0 CMD window, background wscript runner).
5. **Dynamic Port Conflict Resolution** (Automatic fallback from 3001 -> 3002..).
6. **Clean Public GitHub Sync** under `Peach041-stack/ai-token-monitor`.

---

## 📋 Execution Steps

### Phase 1: Environment & Dependency Validation
- [ ] **Step 1.1**: Check Node.js and npm versions.
  ```powershell
  node -v
  npm -v
  ```
- [ ] **Step 1.2**: Install root TypeScript dependencies.
  ```powershell
  npm install
  ```
- [ ] **Step 1.3**: Install frontend dashboard dependencies.
  ```powershell
  cd token-dashboard
  npm install
  cd ..
  ```

---

### Phase 2: Core Engine & Sub-Model Verification
- [ ] **Step 2.1**: Run TypeScript typecheck and CLI simulation.
  ```powershell
  npx tsx src/index.ts
  npm run build
  ```
- [ ] **Step 2.2**: Verify that `server.cjs` accurately extracts sub-model names (`gpt-5.6`, `claude-opus-5`, `gemini-3.0`) from local session directories (`~/.codex/sessions`, `~/.claude/projects`, `~/.gemini/antigravity/brain`).
- [ ] **Step 2.3**: Verify that `GET /api/tokens/models` returns exact model-level token distributions.

---

### Phase 3: Frontend Dashboard Build & Assembly
- [ ] **Step 3.1**: Build production bundle for React Web App.
  ```powershell
  cd token-dashboard
  npm run build
  cd ..
  ```
- [ ] **Step 3.2**: Verify that `dist/index.html` and assets are generated with 0 errors.

---

### Phase 4: Silent Background Daemon & Auto-Start Setup
- [ ] **Step 4.1**: Execute `silent_start.vbs` to ensure backend bridge runs in background.
  ```powershell
  wscript silent_start.vbs
  ```
- [ ] **Step 4.2**: Test health endpoint to confirm background listener is active.
  ```powershell
  Start-Sleep -Seconds 2
  Invoke-RestMethod -Uri http://localhost:3001/api/health
  ```
- [ ] **Step 4.3**: Register auto-start shortcut in Windows Startup directory (`shell:startup`).
  ```powershell
  powershell -ExecutionPolicy Bypass -File -Command "& {
    $ws = New-Object -ComObject WScript.Shell;
    $s = $ws.CreateShortcut(\"$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\AITokenMonitor.lnk\");
    $s.TargetPath = 'wscript.exe';
    $s.Arguments = '\"' + (Get-Location).Path + '\silent_start.vbs\"';
    $s.WorkingDirectory = (Get-Location).Path;
    $s.Save();
  }"
  ```

---

### Phase 5: Privacy Audit & GitHub Synchronization
- [ ] **Step 5.1**: Ensure `.gitignore` strictly protects sensitive directories and session logs.
  - Verify `.env`, `*.jsonl`, `*.sqlite`, `node_modules`, and personal profile paths are ignored.
- [ ] **Step 5.2**: Stage all source code and documentation.
  ```powershell
  git add -A
  ```
- [ ] **Step 5.3**: Commit with author `peachza041 <peachza041@gmail.com>`.
  ```powershell
  git commit -m "feat(core): autonomous full-stack release with sub-model tracking and silent daemon"
  ```
- [ ] **Step 5.4**: Push cleanly to GitHub origin master.
  ```powershell
  git push origin master
  ```

---

### Phase 6: Final Launch & Live Stream Verification
- [ ] **Step 6.1**: Start frontend development server or preview server.
  ```powershell
  cd token-dashboard
  Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev"
  cd ..
  ```
- [ ] **Step 6.2**: Open browser at `http://localhost:5173` and verify `🟢 Live Stream Active`.

---

## ⚡ Execution Command
To run this plan autonomously via Antigravity CLI:

```bash
agy run --plan AGY_AUTONOMOUS_PLAN.md --danger
```
