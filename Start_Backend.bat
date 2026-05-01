@echo off
chcp 65001 >nul
title ContentAI — Backend (Port 5000)
cd /d "%~dp0backend"

echo.
echo  ==========================================
echo    ContentAI Backend dang khoi dong...
echo    http://localhost:5000
echo  ==========================================
echo.

node -e "require('./src/config/db')" 2>nul
npm run dev

pause
