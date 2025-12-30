const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const role = require('../middleware/role');

const Order = require('../models/order');
const VendorReview = require('../models/VendorReview');

/* ======================================================
   CREATE / UPDATE REVIEW (LAST REFILL ONLY)
   ====================================================== */
router.post('/', auth, role(['customer']), async (req, res) => {
  try {
    let { rating, comment } = req.body;

    rating = Number(rating);
    comment = comment || '';

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be 1–5' });
    }

    // 🔎 Find LAST completed refill order
    const lastOrder = await Order.findOne({
      customer: req.user._id,
      status: 'completed',
      type: 'refill'
    }).sort({ createdAt: -1 });

    if (!lastOrder) {
      return res.status(403).json({ error: 'No completed refill found' });
    }

    // 🔁 Upsert review (overwrite previous)
    const review = await VendorReview.findOneAndUpdate(
      {
        vendor: lastOrder.vendor,
        customer: req.user._id
      },
      {
        vendor: lastOrder.vendor,
        customer: req.user._id,
        order: lastOrder._id,
        rating,
        comment
      },
      { new: true, upsert: true }
    );

    res.status(200).json(review);
  } catch (err) {
    console.error('REVIEW ERROR:', err);
    res.status(500).json({ error: 'Failed to submit review' });
  }
});

module.exports = router;
