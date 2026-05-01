@echo off
chcp 65001 >nul
title Test API

echo.
echo [1] Health check...
curl -s http://localhost:5000/api/health
echo.
echo.

echo [2] Dang ky tai khoan test...
curl -s -X POST http://localhost:5000/api/auth/register ^
  -H "Content-Type: application/json" ^
  -d "{\"name\":\"Test User\",\"email\":\"test@example.com\",\"password\":\"123456\"}"
echo.
echo.

echo [3] Dang nhap...
curl -s -X POST http://localhost:5000/api/auth/login ^
  -H "Content-Type: application/json" ^
  -d "{\"email\":\"test@example.com\",\"password\":\"123456\"}"
echo.

pause
