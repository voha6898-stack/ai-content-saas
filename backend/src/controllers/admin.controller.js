const ExcelJS        = require('exceljs');
const User           = require('../models/User.model');
const Content        = require('../models/Content.model');
const DistributionJob = require('../models/DistributionJob.model');
const PaymentRequest = require('../models/PaymentRequest.model');

const PRO_DAYS = parseInt(process.env.PRO_DAYS) || 30;

// ── helpers ────────────────────────────────────────────
function headerStyle(ws, row) {
  row.eachCell((cell) => {
    cell.font      = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border    = {
      bottom: { style: 'thin', color: { argb: 'FF334155' } },
    };
  });
  ws.getRow(1).height = 24;
}

function autoWidth(ws) {
  ws.columns.forEach((col) => {
    let max = col.header ? col.header.length + 4 : 10;
    col.eachCell({ includeEmpty: false }, (cell) => {
      const len = cell.value ? String(cell.value).length : 0;
      if (len > max) max = len;
    });
    col.width = Math.min(max + 2, 60);
  });
}

// ── GET /api/admin/export/users ────────────────────────
const exportUsers = async (req, res, next) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 }).lean();

    const wb = new ExcelJS.Workbook();
    wb.creator = 'ContentAI Platform';
    wb.created = new Date();

    // ── Sheet 1: Danh sách người dùng ──
    const wsUsers = wb.addWorksheet('Người dùng');
    wsUsers.columns = [
      { header: 'STT',         key: 'stt',       },
      { header: 'Họ tên',      key: 'name',      },
      { header: 'Email',       key: 'email',     },
      { header: 'Plan',        key: 'plan',      },
      { header: 'Credits',     key: 'credits',   },
      { header: 'Ngày đăng ký',key: 'createdAt', },
      { header: 'Plan hết hạn',key: 'expiresAt', },
    ];

    users.forEach((u, i) => {
      const row = wsUsers.addRow({
        stt:       i + 1,
        name:      u.name,
        email:     u.email,
        plan:      u.plan.toUpperCase(),
        credits:   u.credits,
        createdAt: new Date(u.createdAt).toLocaleString('vi-VN'),
        expiresAt: u.planExpiresAt ? new Date(u.planExpiresAt).toLocaleString('vi-VN') : '—',
      });
      // màu pro
      if (u.plan === 'pro') {
        row.getCell('plan').font = { bold: true, color: { argb: 'FFFBBF24' } };
      }
    });

    headerStyle(wsUsers, wsUsers.getRow(1));
    autoWidth(wsUsers);

    // ── Sheet 2: Thống kê tổng hợp ──
    const wsStats = wb.addWorksheet('Thống kê');
    const totalUsers    = users.length;
    const proUsers      = users.filter(u => u.plan === 'pro').length;
    const freeUsers     = totalUsers - proUsers;
    const today         = new Date(); today.setHours(0,0,0,0);
    const newToday      = users.filter(u => new Date(u.createdAt) >= today).length;

    wsStats.addRow(['Chỉ số', 'Giá trị']);
    headerStyle(wsStats, wsStats.getRow(1));
    wsStats.addRow(['Tổng người dùng',     totalUsers]);
    wsStats.addRow(['Người dùng Pro',      proUsers]);
    wsStats.addRow(['Người dùng Free',     freeUsers]);
    wsStats.addRow(['Đăng ký hôm nay',     newToday]);
    wsStats.addRow(['Tỷ lệ chuyển đổi',   totalUsers ? `${((proUsers/totalUsers)*100).toFixed(1)}%` : '0%']);
    wsStats.addRow(['Xuất lúc',            new Date().toLocaleString('vi-VN')]);
    wsStats.columns = [{ width: 24 }, { width: 20 }];

    // ── Gửi file ──
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="users_${Date.now()}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/export/content ─────────────────────
const exportContent = async (req, res, next) => {
  try {
    const contents = await Content.find()
      .populate('userId', 'name email plan')
      .sort({ createdAt: -1 })
      .limit(5000)
      .lean();

    const wb = new ExcelJS.Workbook();
    wb.creator = 'ContentAI Platform';

    // ── Sheet 1: Chi tiết nội dung ──
    const ws = wb.addWorksheet('Nội dung đã tạo');
    ws.columns = [
      { header: 'STT',           key: 'stt'       },
      { header: 'Người dùng',    key: 'userName'  },
      { header: 'Email',         key: 'email'     },
      { header: 'Plan',          key: 'plan'      },
      { header: 'Nền tảng',      key: 'platform'  },
      { header: 'Chủ đề',        key: 'topic'     },
      { header: 'Tiêu đề',       key: 'title'     },
      { header: 'Yêu thích',     key: 'favorite'  },
      { header: 'Ngày tạo',      key: 'createdAt' },
    ];

    contents.forEach((c, i) => {
      ws.addRow({
        stt:       i + 1,
        userName:  c.userId?.name  || '—',
        email:     c.userId?.email || '—',
        plan:      (c.userId?.plan || '—').toUpperCase(),
        platform:  c.platform,
        topic:     c.topic?.substring(0, 80),
        title:     c.output?.title?.substring(0, 100) || '—',
        favorite:  c.isFavorite ? 'Có' : 'Không',
        createdAt: new Date(c.createdAt).toLocaleString('vi-VN'),
      });
    });

    headerStyle(ws, ws.getRow(1));
    autoWidth(ws);

    // ── Sheet 2: Breakdown theo platform ──
    const wsBreak = wb.addWorksheet('Theo nền tảng');
    wsBreak.addRow(['Nền tảng', 'Số bài']);
    headerStyle(wsBreak, wsBreak.getRow(1));
    const byPlatform = {};
    contents.forEach(c => { byPlatform[c.platform] = (byPlatform[c.platform] || 0) + 1; });
    Object.entries(byPlatform).sort((a,b) => b[1]-a[1]).forEach(([p, n]) => wsBreak.addRow([p, n]));
    wsBreak.columns = [{ width: 16 }, { width: 12 }];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="content_${Date.now()}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/export/full ─────────────────────────
// Xuất tất cả vào 1 file Excel nhiều sheet
const exportFull = async (req, res, next) => {
  try {
    const [users, contents, jobs] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }).lean(),
      Content.find().populate('userId', 'name email').sort({ createdAt: -1 }).limit(5000).lean(),
      DistributionJob.find().populate('userId', 'name email').populate('contentId', 'topic platform').sort({ createdAt: -1 }).limit(2000).lean(),
    ]);

    const wb = new ExcelJS.Workbook();
    wb.creator = 'ContentAI Platform';
    wb.created = new Date();

    // Sheet: Users
    const wsU = wb.addWorksheet('👥 Người dùng');
    wsU.columns = [
      { header: 'STT', key: 'stt' }, { header: 'Họ tên', key: 'name' },
      { header: 'Email', key: 'email' }, { header: 'Plan', key: 'plan' },
      { header: 'Credits', key: 'credits' }, { header: 'Ngày đăng ký', key: 'createdAt' },
    ];
    users.forEach((u, i) => wsU.addRow({ stt: i+1, name: u.name, email: u.email, plan: u.plan.toUpperCase(), credits: u.credits, createdAt: new Date(u.createdAt).toLocaleString('vi-VN') }));
    headerStyle(wsU, wsU.getRow(1));
    autoWidth(wsU);

    // Sheet: Content
    const wsC = wb.addWorksheet('📝 Nội dung');
    wsC.columns = [
      { header: 'STT', key: 'stt' }, { header: 'Người dùng', key: 'user' },
      { header: 'Nền tảng', key: 'platform' }, { header: 'Chủ đề', key: 'topic' },
      { header: 'Tiêu đề', key: 'title' }, { header: 'Ngày tạo', key: 'createdAt' },
    ];
    contents.forEach((c, i) => wsC.addRow({ stt: i+1, user: c.userId?.name || '—', platform: c.platform, topic: c.topic?.substring(0,80), title: c.output?.title?.substring(0,100) || '—', createdAt: new Date(c.createdAt).toLocaleString('vi-VN') }));
    headerStyle(wsC, wsC.getRow(1));
    autoWidth(wsC);

    // Sheet: Distribution Jobs
    const wsJ = wb.addWorksheet('📤 Lịch đăng');
    wsJ.columns = [
      { header: 'STT', key: 'stt' }, { header: 'Người dùng', key: 'user' },
      { header: 'Nền tảng', key: 'platform' }, { header: 'Trạng thái', key: 'status' },
      { header: 'Lên lịch lúc', key: 'scheduledAt' }, { header: 'Ngày tạo', key: 'createdAt' },
    ];
    jobs.forEach((j, i) => wsJ.addRow({ stt: i+1, user: j.userId?.name || '—', platform: j.platform, status: j.status, scheduledAt: j.scheduledAt ? new Date(j.scheduledAt).toLocaleString('vi-VN') : '—', createdAt: new Date(j.createdAt).toLocaleString('vi-VN') }));
    headerStyle(wsJ, wsJ.getRow(1));
    autoWidth(wsJ);

    // Sheet: Summary
    const wsS = wb.addWorksheet('📊 Tổng hợp');
    wsS.columns = [{ header: 'Chỉ số', key: 'label' }, { header: 'Giá trị', key: 'value' }];
    headerStyle(wsS, wsS.getRow(1));
    const proCount = users.filter(u => u.plan === 'pro').length;
    [
      ['Tổng người dùng',     users.length],
      ['Người dùng Pro',      proCount],
      ['Người dùng Free',     users.length - proCount],
      ['Tổng nội dung',       contents.length],
      ['Tổng jobs phân phối', jobs.length],
      ['Jobs thành công',     jobs.filter(j => j.status === 'completed').length],
      ['Jobs thất bại',       jobs.filter(j => j.status === 'failed').length],
      ['Xuất lúc',            new Date().toLocaleString('vi-VN')],
    ].forEach(([label, value]) => wsS.addRow({ label, value }));
    wsS.columns = [{ width: 26 }, { width: 20 }];

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="contentai_export_${Date.now()}.xlsx"`);
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/stats ───────────────────────────────
const getStats = async (req, res, next) => {
  try {
    const [totalUsers, proUsers, totalContent, totalJobs] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ plan: 'pro' }),
      Content.countDocuments(),
      DistributionJob.countDocuments(),
    ]);

    const today = new Date(); today.setHours(0,0,0,0);
    const [newUsersToday, contentToday] = await Promise.all([
      User.countDocuments({ createdAt: { $gte: today } }),
      Content.countDocuments({ createdAt: { $gte: today } }),
    ]);

    // Top 5 users by content count
    const topUsers = await Content.aggregate([
      { $group: { _id: '$userId', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { name: '$user.name', email: '$user.email', plan: '$user.plan', count: 1 } },
    ]);

    res.json({
      success: true,
      stats: {
        users: { total: totalUsers, pro: proUsers, free: totalUsers - proUsers, newToday: newUsersToday },
        content: { total: totalContent, today: contentToday },
        jobs: { total: totalJobs },
        conversionRate: totalUsers ? `${((proUsers/totalUsers)*100).toFixed(1)}%` : '0%',
      },
      topUsers,
    });
  } catch (err) {
    next(err);
  }
};

// ── GET /api/admin/payment-requests ──────────────────────────────────────────
const getPaymentRequests = async (req, res, next) => {
  try {
    const [requests, pendingCount] = await Promise.all([
      PaymentRequest.find()
        .populate('userId', 'name email plan')
        .sort({ createdAt: -1 })
        .limit(200)
        .lean(),
      PaymentRequest.countDocuments({ status: 'pending' }),
    ]);

    res.json({ success: true, requests, pendingCount });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/admin/payment-requests/:id/approve ─────────────────────────────
const approvePaymentRequest = async (req, res, next) => {
  try {
    const request = await PaymentRequest.findById(req.params.id).populate('userId');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Yêu cầu đã được xử lý rồi.' });
    }

    const planExpiresAt = new Date();
    planExpiresAt.setDate(planExpiresAt.getDate() + PRO_DAYS);

    await User.findByIdAndUpdate(request.userId._id, {
      plan:          'pro',
      credits:       999999,
      planExpiresAt,
    });

    request.status     = 'approved';
    request.approvedAt = new Date();
    request.approvedBy = req.user?.email || 'admin';
    await request.save();

    console.log(`✅ Admin duyệt Pro: ${request.userId.email} (${PRO_DAYS} ngày)`);
    res.json({ success: true, message: `Đã nâng cấp "${request.userId.name}" lên Pro ${PRO_DAYS} ngày.` });
  } catch (err) {
    next(err);
  }
};

// ── PATCH /api/admin/payment-requests/:id/reject ──────────────────────────────
const rejectPaymentRequest = async (req, res, next) => {
  try {
    const { note } = req.body;
    const request = await PaymentRequest.findById(req.params.id).populate('userId');
    if (!request) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy yêu cầu.' });
    }
    if (request.status !== 'pending') {
      return res.status(400).json({ success: false, message: 'Yêu cầu đã được xử lý rồi.' });
    }

    request.status = 'rejected';
    request.note   = note || '';
    await request.save();

    console.log(`❌ Admin từ chối: ${request.userId?.email}`);
    res.json({ success: true, message: 'Đã từ chối yêu cầu.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  exportUsers, exportContent, exportFull, getStats,
  getPaymentRequests, approvePaymentRequest, rejectPaymentRequest,
};
