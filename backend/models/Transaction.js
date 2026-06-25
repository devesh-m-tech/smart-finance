const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  cat: { type: String, required: true },
  date: { type: String, required: true },
  amt: { type: String, required: true },
  isExpense: { type: Boolean, required: true },
  numericAmount: { type: Number, required: true },
  sourceAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true },
  sourceAccountName: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
