const router = require('express').Router();
const { protect }      = require('../middlewares/auth.middleware');
const { requireAdmin } = require('../middlewares/admin.middleware');
const {
  exportUsers, exportContent, exportFull, getStats,
  getPaymentRequests, approvePaymentRequest, rejectPaymentRequest,
  setupAdminSelf, getUsers, updateUser, deleteUser,
} = require('../controllers/admin.controller');

router.use(protect, requireAdmin);

// Admin self setup (nâng cấp account admin lên Pro unlimited)
router.post('/setup-self', setupAdminSelf);

// Stats & export
router.get('/stats',          getStats);
router.get('/export/users',   exportUsers);
router.get('/export/content', exportContent);
router.get('/export/full',    exportFull);

// User management
router.get('/users',          getUsers);
router.patch('/users/:id',    updateUser);
router.delete('/users/:id',   deleteUser);

// Payment requests
router.get('/payment-requests',               getPaymentRequests);
router.patch('/payment-requests/:id/approve', approvePaymentRequest);
router.patch('/payment-requests/:id/reject',  rejectPaymentRequest);

module.exports = router;
