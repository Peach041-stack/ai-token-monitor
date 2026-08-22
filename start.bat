@echo off
setlocal enabledelayedexpansion
title AI Token Observability Dashboard - One Click Launcher

echo ======================================================================
echo    AI Token Observability Dashboard (One-Click Launcher)
echo    Real-time Monitoring for Codex, Antigravity, and Claude
echo ======================================================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not found in PATH.
    echo Please install Node.js from https://nodejs.org/ and try again.
    echo.
    pause
    exit /b 1
)

echo [✓] Node.js detected: 
node -v
echo.

:: 2. Check and Install Dependencies if needed
cd /d "%~dp0\token-dashboard"
if not exist "node_modules\" (
    echo [!] First time run detected. Installing dependencies...
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo [ERROR] Failed to install npm dependencies.
        pause
        exit /b 1
    )
    echo [✓] Dependencies installed successfully!
    echo.
)

:: 3. Start Real-time Bridge Server (Port 3001) in background
echo [1/2] Starting Real-Time Log Bridge Server on Port 3001...
start "AI Token Bridge Server" /min cmd /c "node server.cjs"

:: 4. Start Vite React Frontend (Port 5173)
echo [2/2] Starting React Web Dashboard on Port 5173...
start "" http://localhost:5173
call npm run dev

pause
