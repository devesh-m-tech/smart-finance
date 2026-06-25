const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, goalController.getGoals);
router.post('/add', protect, goalController.addGoal);
router.put('/:id/add-cash', protect, goalController.addCashToGoal);
router.delete('/:id', protect, goalController.deleteGoal);

module.exports = router;
