const express = require('express');
const cors    = require('cors');
const rateLimit = require('express-rate-limit');

const authRoutes         = require('./src/routes/auth.routes');
const contentRoutes      = require('./src/routes/content.routes');
const distributionRoutes = require('./src/routes/distribution.routes');
const pipelineRoutes     = require('./src/routes/pipeline.routes');
const monetizationRoutes = require('./src/routes/monetization.routes');
const analyticsRoutes    = require('./src/routes/analytics.routes');
const automationRoutes   = require('./src/routes/automation.routes');
const adminRoutes        = require('./src/routes/admin.routes');
const errorMiddleware    = require('./src/middlewares/error.middleware');

const app = express();

// ── CORS ──────────────────────────────────────────────
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    // Allow any Vercel preview/production deploy for this project
    if (/\.vercel\.app$/.test(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

// ── Stripe Webhook — raw body TRƯỚC express.json() ───
app.use('/api/payment', require('./src/routes/payment.routes'));

// ── Body Parser ───────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ── Global Rate Limit ─────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:      Number(process.env.RATE_LIMIT_MAX)        || 200,
  message:  { success: false, message: 'Quá nhiều request, thử lại sau.' },
});
app.use('/api', globalLimiter);

// ── Routes ────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/content',      contentRoutes);
app.use('/api/distribution', distributionRoutes);
app.use('/api/pipeline',     pipelineRoutes);
app.use('/api/monetization', monetizationRoutes);
app.use('/api/analytics',    analyticsRoutes);
app.use('/api/automation',   automationRoutes);
app.use('/api/admin',        adminRoutes);

// ── Health check ──────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'ContentAI Platform v2 running',
    timestamp: new Date(),
    modules: ['auth', 'content', 'distribution', 'pipeline', 'monetization', 'analytics'],
  });
});

// ── 404 ───────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint không tồn tại' });
});

// ── Global Error Handler ──────────────────────────────
app.use(errorMiddleware);

module.exports = app;
