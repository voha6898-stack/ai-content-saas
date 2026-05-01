const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const { generate, getHistory, getOne, deletePlan, generateValidation } = require('../controllers/growth.controller');

const router = express.Router();
router.use(protect);

router.post('/generate',  generateValidation, generate);
router.get('/history',    getHistory);
router.get('/:id',        getOne);
router.delete('/:id',     deletePlan);

module.exports = router;
