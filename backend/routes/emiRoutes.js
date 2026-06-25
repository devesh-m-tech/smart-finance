const express = require('express');
const router = express.Router();
const emiController = require('../controllers/emiController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, emiController.getEMIs);
router.post('/add', protect, emiController.addEMI);
router.put('/:id/pay', protect, emiController.payEMI);

module.exports = router;
