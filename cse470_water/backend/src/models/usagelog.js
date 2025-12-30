const mongoose = require('mongoose');

const UsageLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  litersUsed: { type: Number, required: true },
  logDate: { type: Date, required: true },

  createdAt: { type: Date, default: Date.now }
});

// SAFE EXPORT
module.exports = mongoose.models.UsageLog || mongoose.model('UsageLog', UsageLogSchema);
