@echo off
chcp 65001 >nul
title ContentAI — Frontend (Port 3000)
cd /d "%~dp0frontend"

echo.
echo  ==========================================
echo    ContentAI Frontend dang khoi dong...
echo    http://localhost:3000
echo  ==========================================
echo.

npm run dev

pause
