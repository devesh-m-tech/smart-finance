const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const financeController = require('../controllers/financeController');

// All routes require auth
router.use(protect);

router.get('/', financeController.getFinanceData);
router.post('/accounts/add', financeController.addAccount);
router.put('/accounts/link', financeController.linkAccount);
router.post('/transactions/add', financeController.addTransaction);

module.exports = router;
