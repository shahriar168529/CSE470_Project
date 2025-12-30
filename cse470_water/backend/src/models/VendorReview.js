const mongoose = require('mongoose');

const VendorReviewSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },

    // last reviewed order (latest refill)
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true
    },

    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },

    comment: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true
  }
);

/* ======================================================
   ONE REVIEW PER CUSTOMER PER VENDOR
   ====================================================== */
VendorReviewSchema.index(
  { vendor: 1, customer: 1 },
  { unique: true }
);

/* ======================================================
   SAFE EXPORT
   ====================================================== */
module.exports =
  mongoose.models.VendorReview ||
  mongoose.model('VendorReview', VendorReviewSchema);
