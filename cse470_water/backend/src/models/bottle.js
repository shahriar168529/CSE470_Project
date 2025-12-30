const mongoose = require('mongoose');

const BottleSchema = new mongoose.Schema({
  bottleCode: { type: String, unique: true },
  qrToken: { type: String },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  purchaseDate: { type: Date, default: Date.now },
  refillCount: { type: Number, default: 0 },
  maxExpectedRefills: { type: Number, default: 10 },

  status: { type: String, enum: ['active', 'lost', 'retired'], default: 'active' },
  lastRefilledAt: Date
});

// SAFE EXPORT
module.exports = mongoose.models.Bottle || mongoose.model('Bottle', BottleSchema);
