@echo off
chcp 65001 >nul
title Push to GitHub

cd /d "%~dp0"

echo.
echo  ==========================================
echo    Push code len GitHub
echo  ==========================================
echo.

git init
git add .
git commit -m "feat: initial SaaS AI Content app"

echo.
echo  Nhap GitHub repo URL (vi du: https://github.com/yourname/ai-content-saas.git):
set /p REPO_URL="> "

git remote add origin %REPO_URL%
git branch -M main
git push -u origin main

echo.
echo  ✅ Da push len GitHub thanh cong!
echo.
pause
