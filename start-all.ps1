# ── AI Content SaaS — Start All Services ───────────────────────────────────
# Chạy lệnh này bằng PowerShell để khởi động toàn bộ hệ thống:
#   powershell -ExecutionPolicy Bypass -File "C:\Users\Admin\ai-content-saas\start-all.ps1"

$ROOT    = "C:\Users\Admin\ai-content-saas"
$REDIS   = "C:\Redis5\redis-server.exe"
$REDIS_PORT = 6380

Write-Host ""
Write-Host "=== AI Content SaaS — Khởi động hệ thống ===" -ForegroundColor Cyan
Write-Host ""

# ── 1. Redis 5 ───────────────────────────────────────────────────────────────
$redisRunning = (& "C:\Redis5\redis-cli.exe" -p $REDIS_PORT ping 2>$null) -eq "PONG"
if ($redisRunning) {
    Write-Host "✅ Redis 5 đã chạy (port $REDIS_PORT)" -ForegroundColor Green
} else {
    Write-Host "🔴 Đang khởi động Redis 5 (port $REDIS_PORT)..." -ForegroundColor Yellow
    Start-Process -FilePath $REDIS -ArgumentList "--port $REDIS_PORT" -WindowStyle Minimized
    Start-Sleep -Seconds 2
    $redisRunning = (& "C:\Redis5\redis-cli.exe" -p $REDIS_PORT ping 2>$null) -eq "PONG"
    if ($redisRunning) {
        Write-Host "✅ Redis 5 đã khởi động" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Redis 5 không khởi động được — BullMQ workers sẽ bị tắt" -ForegroundColor Red
    }
}

# ── 2. Backend (Node.js / Express) ──────────────────────────────────────────
$port5000 = netstat -ano | Select-String ":5000\s.*LISTENING"
if ($port5000) {
    Write-Host "✅ Backend đã chạy (port 5000)" -ForegroundColor Green
} else {
    Write-Host "🔴 Đang khởi động Backend..." -ForegroundColor Yellow
    $backendLog = "$ROOT\backend-startup.log"
    Start-Process -FilePath "node" -ArgumentList "server.js" `
        -WorkingDirectory "$ROOT\backend" `
        -RedirectStandardOutput $backendLog `
        -WindowStyle Minimized
    Start-Sleep -Seconds 5
    if (netstat -ano | Select-String ":5000\s.*LISTENING") {
        Write-Host "✅ Backend đã khởi động (port 5000)" -ForegroundColor Green
        Get-Content $backendLog -ErrorAction SilentlyContinue | ForEach-Object { Write-Host "   $_" }
    } else {
        Write-Host "⚠️  Backend lỗi — xem log: $backendLog" -ForegroundColor Red
    }
}

# ── 3. Frontend (Next.js) ────────────────────────────────────────────────────
$port3000 = netstat -ano | Select-String ":3000\s.*LISTENING"
if ($port3000) {
    Write-Host "✅ Frontend đã chạy (port 3000)" -ForegroundColor Green
} else {
    Write-Host "🔴 Đang khởi động Frontend (Next.js)..." -ForegroundColor Yellow
    Start-Process -FilePath "npm" -ArgumentList "run dev" `
        -WorkingDirectory "$ROOT\frontend" `
        -WindowStyle Minimized
    Start-Sleep -Seconds 8
    if (netstat -ano | Select-String ":3000\s.*LISTENING") {
        Write-Host "✅ Frontend đã khởi động (port 3000)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Frontend chưa sẵn sàng — có thể đang build, chờ thêm 10-20 giây" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "=== Hệ thống sẵn sàng ===" -ForegroundColor Cyan
Write-Host "   Frontend : http://localhost:3000" -ForegroundColor White
Write-Host "   Backend  : http://localhost:5000" -ForegroundColor White
Write-Host "   Redis 5  : localhost:$REDIS_PORT" -ForegroundColor White
Write-Host ""
