@echo off
title AI Token Monitor - Remove Auto-Start

echo ======================================================================
echo    AI Token Monitor - Remove Windows Auto-Start
echo ======================================================================
echo.

set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\AITokenMonitor.lnk"

if exist "%SHORTCUT_PATH%" (
    del /f /q "%SHORTCUT_PATH%"
    echo [✓] Removed startup shortcut from:
    echo     "%SHORTCUT_PATH%"
) else (
    echo [i] No startup shortcut found.
)

echo.
echo [i] Stopping background Node server instances...
powershell -NoProfile -Command "Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like '*server.cjs*' } | Stop-Process -Force" 2>nul

echo.
echo ======================================================================
echo  [SUCCESS] ยกเลิกการเปิดโปรแกรมอัตโนมัติตอนเปิดเครื่องเรียบร้อยแล้ว
echo ======================================================================
echo.
pause
