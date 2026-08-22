@echo off
setlocal enabledelayedexpansion
title AI Token Monitor - Auto-Start Setup

echo ======================================================================
echo    AI Token Monitor - Windows Auto-Start Installation
echo ======================================================================
echo.

:: Get current folder dynamically
set "CURRENT_DIR=%~dp0"
:: Remove trailing backslash if present
if "%CURRENT_DIR:~-1%"=="\" set "CURRENT_DIR=%CURRENT_DIR:~0,-1%"

set "TARGET_VBS=%CURRENT_DIR%\silent_start.vbs"
set "STARTUP_FOLDER=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "SHORTCUT_PATH=%STARTUP_FOLDER%\AITokenMonitor.lnk"

echo [1/3] Detecting project path...
echo       Project Location: "%CURRENT_DIR%"
echo.

echo [2/3] Registering Silent Background Launcher in Windows Startup...
powershell -NoProfile -Command "$ws = New-Object -ComObject WScript.Shell; $s = $ws.CreateShortcut('%SHORTCUT_PATH%'); $s.TargetPath = 'wscript.exe'; $s.Arguments = '\"%TARGET_VBS%\"'; $s.WorkingDirectory = '%CURRENT_DIR%'; $s.Save()"

if exist "%SHORTCUT_PATH%" (
    echo [✓] Startup shortcut created at:
    echo     "%SHORTCUT_PATH%"
) else (
    echo [!] Warning: Could not create shortcut directly.
)

echo.
echo [3/3] Starting Background Bridge Server now (Silently)...
wscript "%TARGET_VBS%"

echo.
echo ======================================================================
echo  [SUCCESS] ระบบถูกตั้งค่าให้รันอัตโนมัติเบื้องหลังเรียบร้อยแล้ว!
echo  - เปิดเครื่องใหม่เมื่อไหร่ ระบบจะดักฟัง Token ทันทีโดยไม่ต้องเปิด CMD
echo  - หากต้องการยกเลิก สามารถรัน uninstall_autostart.bat ได้ตลอดเวลา
echo ======================================================================
echo.
pause
