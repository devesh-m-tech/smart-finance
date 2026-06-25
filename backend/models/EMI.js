const mongoose = require('mongoose');

const EMISchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  loanType: { type: String, required: true },
  totalAmount: { type: Number, required: true },
  monthlyAmount: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  dueDateOfMonth: { type: Number, required: true },
  paidAmount: { type: Number, default: 0 },
  remainingAmount: { type: Number },
  lastPaidDate: { type: Date },
  status: { type: String, enum: ['Active', 'Completed', 'Defaulted'], default: 'Active' },
});

// Pre-save calculation
EMISchema.pre('save', function(next) {
  this.remainingAmount = this.totalAmount - this.paidAmount;
  next();
});

module.exports = mongoose.model('EMI', EMISchema);
