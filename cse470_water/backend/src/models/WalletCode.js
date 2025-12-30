const mongoose = require('mongoose');

const WalletCodeSchema = new mongoose.Schema({
  code: { type: String, unique: true },
  amount: { type: Number, required: true },

  isUsed: { type: Boolean, default: false },
  usedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  usedAt: Date,

  createdAt: { type: Date, default: Date.now }
});

module.exports =
  mongoose.models.WalletCode ||
  mongoose.model('WalletCode', WalletCodeSchema);
