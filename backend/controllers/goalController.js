const Goal = require('../models/Goal');
const { sendNotification } = require('../services/notificationService');

exports.getGoals = async (req, res) => {
  try {
    const goals = await Goal.find({ user: req.user.id }).sort({ createdAt: -1 }).lean();
    
    const mappedGoals = goals.map(g => ({
      id: g._id.toString(),
      title: g.title,
      target: g.target,
      currentSaved: g.currentSaved,
      targetMonths: g.targetMonths,
      createdAt: g.createdAt
    }));

    res.status(200).json(mappedGoals);
  } catch (error) {
    res.status(500).json({ message: 'Server error fetching goals' });
  }
};

exports.addGoal = async (req, res) => {
  const { title, target, targetMonths } = req.body;
  
  try {
    const newGoal = new Goal({
      user: req.user.id,
      title: title || 'New Goal',
      target: target || 0,
      currentSaved: 0,
      targetMonths: targetMonths || 12
    });
    
    const savedGoal = await newGoal.save();
    
    await sendNotification(req, req.user.id, 'New Goal Created', `You've set a goal to save ₹${target.toLocaleString()} for ${title}. You got this!`);

    res.status(201).json({
      id: savedGoal._id.toString(),
      title: savedGoal.title,
      target: savedGoal.target,
      currentSaved: savedGoal.currentSaved,
      targetMonths: savedGoal.targetMonths,
      createdAt: savedGoal.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding goal' });
  }
};

exports.addCashToGoal = async (req, res) => {
  const { amount } = req.body;
  
  try {
    const goal = await Goal.findOne({ _id: req.params.id, user: req.user.id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    
    const prevSaved = goal.currentSaved;
    goal.currentSaved += Number(amount);
    if (goal.currentSaved > goal.target) {
      goal.currentSaved = goal.target;
    }
    
    const savedGoal = await goal.save();
    
    if (goal.currentSaved >= goal.target && prevSaved < goal.target) {
      await sendNotification(req, req.user.id, 'Goal Achieved! 🎉', `Congratulations! You've fully funded your goal: ${goal.title}.`);
    } else {
      await sendNotification(req, req.user.id, 'Progress Made!', `You added ₹${Number(amount).toLocaleString()} towards ${goal.title}.`);
    }

    res.status(200).json({
      id: savedGoal._id.toString(),
      title: savedGoal.title,
      target: savedGoal.target,
      currentSaved: savedGoal.currentSaved,
      targetMonths: savedGoal.targetMonths,
      createdAt: savedGoal.createdAt
    });
  } catch (error) {
    res.status(500).json({ message: 'Error adding cash to goal' });
  }
};

exports.deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!goal) {
      return res.status(404).json({ message: 'Goal not found' });
    }
    res.status(200).json({ message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting goal' });
  }
};
