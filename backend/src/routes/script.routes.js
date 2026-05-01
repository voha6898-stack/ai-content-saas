const express = require('express');
const { protect } = require('../middlewares/auth.middleware');
const {
  generate, getHistory, deleteScript, toggleFavorite, generateValidation,
} = require('../controllers/script.controller');

const router = express.Router();

router.use(protect);

router.post('/generate',       generateValidation, generate);
router.get('/history',         getHistory);
router.delete('/:id',          deleteScript);
router.patch('/:id/favorite',  toggleFavorite);

module.exports = router;
