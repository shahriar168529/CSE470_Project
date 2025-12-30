const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, required: true, unique: true },
    address: { type: String, required: true },

    role: {
      type: String,
      enum: ['customer', 'vendor', 'admin'],
      required: true
    },

    isApproved: { type: Boolean, default: false },

    walletBalance: { type: Number, default: 0 },
    ecoPoints: { type: Number, default: 0 },

    // ✅ NEW FEATURE
    monthlyWaterDemand: {
      type: Number,
      default: 0 // liters per month
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('User', userSchema);
