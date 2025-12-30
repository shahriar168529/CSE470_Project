const mongoose = require('mongoose');

const OrderSchema = new mongoose.Schema({
  customer: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bottle: { type: mongoose.Schema.Types.ObjectId, ref: 'Bottle' },

  type: { type: String, enum: ['purchase', 'refill'], required: true },

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'completed', 'cancelled'],
    default: 'pending'
  },

  scheduledAt: Date,
  amount: Number,

  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed'],
    default: 'pending'
  },

  createdAt: { type: Date, default: Date.now }
});

// SAFE EXPORT
module.exports = mongoose.models.Order || mongoose.model('Order', OrderSchema);
