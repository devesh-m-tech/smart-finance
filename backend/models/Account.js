const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  balance: { type: Number, required: true, default: 0 },
  iconType: { type: String, default: 'Landmark' },
  linkedAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null }, // Null if independent bank, Account ID if it's a UPI wallet mapped to a bank
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Account', AccountSchema);
