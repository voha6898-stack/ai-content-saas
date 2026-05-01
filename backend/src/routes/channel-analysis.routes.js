const router = require('express').Router();
const { protect } = require('../middlewares/auth.middleware');
const ctrl = require('../controllers/channel-analysis.controller');

router.use(protect);

router.post('/',           ctrl.analyze);
router.post('/:id/rewrite', ctrl.rewrite);
router.get('/',            ctrl.getHistory);
router.get('/:id',         ctrl.getOne);
router.delete('/:id',      ctrl.deleteOne);

module.exports = router;
