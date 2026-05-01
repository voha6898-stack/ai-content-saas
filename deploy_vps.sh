#!/bin/bash
# Script deploy lên VPS Ubuntu 20.04+
# Chạy: chmod +x deploy_vps.sh && ./deploy_vps.sh

set -e

echo "🚀 Bắt đầu deploy AI Content SaaS..."

# ── 1. Cài Node.js 18 ──────────────────────────────────
if ! command -v node &> /dev/null; then
  echo "📦 Cài Node.js 18..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
fi
echo "✅ Node.js: $(node -v)"

# ── 2. Cài PM2 (process manager) ───────────────────────
if ! command -v pm2 &> /dev/null; then
  echo "📦 Cài PM2..."
  sudo npm install -g pm2
fi

# ── 3. Cài Nginx ────────────────────────────────────────
if ! command -v nginx &> /dev/null; then
  echo "📦 Cài Nginx..."
  sudo apt-get install -y nginx
fi

# ── 4. Cài dependencies backend ────────────────────────
echo "📦 Cài dependencies backend..."
cd /var/www/ai-content-saas/backend
npm install --production

# ── 5. Cài dependencies + build frontend ───────────────
echo "🔨 Build frontend..."
cd /var/www/ai-content-saas/frontend
npm install
npm run build

# ── 6. Khởi động backend với PM2 ───────────────────────
echo "▶️  Khởi động backend..."
cd /var/www/ai-content-saas/backend
pm2 delete ai-backend 2>/dev/null || true
pm2 start server.js --name "ai-backend" --env production
pm2 save
pm2 startup

echo ""
echo "✅ Deploy hoàn tất!"
echo "   Backend chạy trên port 5000 (PM2)"
echo "   Frontend build xong tại: /var/www/ai-content-saas/frontend/.next"
echo ""
echo "📋 Tiếp theo: cấu hình Nginx (xem nginx.conf bên dưới)"
