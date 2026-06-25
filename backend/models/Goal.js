const mongoose = require('mongoose');

const GoalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  target: { type: Number, required: true },
  currentSaved: { type: Number, default: 0 },
  targetMonths: { type: Number, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Goal', GoalSchema);
