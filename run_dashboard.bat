@echo off
title AI Token Real-Time Monitor Dashboard
echo ======================================================================
echo    Starting AI Token Observability Dashboard (Real-Time Live)
echo ======================================================================
echo.
echo [1/2] Starting Real-Time Log Bridge Server (Port 3001)...
cd /d "%~dp0\token-dashboard"
start "Token Bridge Server" cmd /k "node server.cjs"

echo [2/2] Starting React Vite Web App (Port 5173)...
start "" http://localhost:5173
npm run dev
pause
