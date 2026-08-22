<div align="center">

# 📊 AI Token Monitor (`ai-token-monitor`)

**A lightweight, local-first observability tool, token counter, and cost monitor for AI Coding Assistants & LLMs.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![CI Build](https://img.shields.io/badge/CI-passing-brightgreen.svg)](.github/workflows/ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js)](https://nodejs.org/)

[English](#-english-guide) • [ภาษาไทย](#-คู่มือภาษาไทย)

</div>

---

## 🌟 Key Features

- ⚡ **Real-Time Token Tracking:** Instantly captures Prompt, Completion, Reasoning, and Cached Tokens across **Codex (ChatGPT Desktop / CLI), Claude Code (Cowork), and Antigravity (Google DeepMind)**.
- 🔒 **Local-First & Privacy Guaranteed:** **Zero API keys or session payloads leave your computer.** All parsing is performed locally via file watchers and local streams.
- 💰 **Cost Tracking & Multi-Currency:** Real-time pricing mapping (USD / THB) calculated against standard provider API rates.
- 🚨 **Quota & Budget Alerting:** Set daily and monthly budget thresholds with proactive visual warnings.
- 🟩 **Activity Heatmap Grid:** GitHub-style contribution calendar visualizing daily token intensity over 365 days.
- 📈 **Multi-Chart Analytics:** Switch seamlessly between **Line Charts**, **Bar Charts**, and **Stacked Area Charts** with Thai/English formatting.
- 📋 **Export Reports:** Download filtered token analytics as **CSV (Excel UTF-8 BOM)** or **JSON** with a single click.
- 🚀 **One-Click Launcher:** Run `start.bat` for automatic dependency detection, background bridge daemon startup, and browser launch.

---

## 🚀 Quick Start (One-Click)

### Windows
Double-click **`start.bat`**.
The launcher will automatically install any missing dependencies, start the background bridge server (Port `3001`), launch the Vite React dashboard (Port `5173`), and open your default browser.

### Terminal (Cross-Platform)

```bash
# 1. Clone the repository
git clone https://github.com/Peach041-stack/ai-token-monitor.git
cd ai-token-monitor

# 2. Install dependencies
npm install
cd token-dashboard && npm install && cd ..

# 3. Configure environment (Optional)
cp .env.example .env

# 4. Start the Application
npm run dev
```

---

## ⚙️ Configuration (`.env`)

Copy `.env.example` to `.env` to configure optional custom budgets and alerts:

```env
PORT=3001
HOST=localhost
NODE_ENV=development

# Budget & Quota Thresholds (USD)
MONTHLY_BUDGET_USD=50.00
DAILY_BUDGET_USD=5.00
ALERT_THRESHOLD_PERCENT=80

# Currency Conversion
EXCHANGE_RATE_THB=35.50
```

---

## 📦 Project Architecture

```text
ai-token-monitor/
├── start.bat                     # ⚡ One-Click Windows Launcher
├── standalone_dashboard.html     # 🌐 Standalone Single-File Dashboard
├── .env.example                  # ⚙️ Configuration Template
├── .github/                      # 🤝 Community Guidelines & CI
│   ├── workflows/ci.yml          # 🤖 GitHub Actions CI Workflow
│   ├── ISSUE_TEMPLATE/           # 🐛 Bug & Feature Templates
│   └── pull_request_template.md  # 📋 PR Checklist Template
├── src/                          # 🧠 Core TypeScript Engine
│   ├── config/                   # ⚙️ Environment Configuration & Validation
│   ├── providers/                # 🔌 Provider Parsers (OpenAI, Anthropic, Gemini)
│   ├── core/                     # 🧮 Token Counter, Cost Calculator, Alert Manager
│   └── index.ts                  # 🚀 CLI & Engine Entry Point
└── token-dashboard/              # 🎨 Web UI Application
    ├── server.cjs                # 📡 Real-time Log Watcher & SSE Bridge
    └── src/                      # ⚛️ React Dashboard Components
```

---

## 💻 TypeScript CLI Usage

You can also run the core token counter and cost calculation engine via CLI:

```bash
# Run the TypeScript Core Engine
npm start

# Run in Development Mode with Hot Reload
npm run dev:cli

# Run Unit Tests
npm test
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
Copyright (c) 2026 **Peach041-stack**.
