const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const Order = require('../models/Order');
const Bottle = require('../models/Bottle');
const User = require('../models/User');

const REFILL_PRICE = 30;

/* =====================================================
   CUSTOMER REQUEST REFILL
   POST /api/orders/refill
   ===================================================== */
router.post('/refill', auth, async (req, res) => {
  try {
    const { bottleId, vendorId, scheduledAt } = req.body;

    if (!bottleId || !vendorId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    /* ================= VALIDATE BOTTLE ================= */
    const bottle = await Bottle.findOne({
      _id: bottleId,
      owner: req.user._id
    });

    if (!bottle) {
      return res.status(404).json({ error: 'Bottle not found' });
    }

    /* ================= VALIDATE VENDOR ================= */
    const vendor = await User.findOne({
      _id: vendorId,
      role: 'vendor',
      isApproved: true
    });

    if (!vendor) {
      return res.status(400).json({ error: 'Invalid or unapproved vendor' });
    }

    /* ================= CHECK WALLET ================= */
    const user = await User.findById(req.user._id);

    if (user.walletBalance < REFILL_PRICE) {
      return res.status(400).json({ error: 'Insufficient wallet balance' });
    }

    /* ================= SCHEDULE VALIDATION ================= */
    let scheduleDate = null;
    if (scheduledAt) {
      scheduleDate = new Date(scheduledAt);
      if (isNaN(scheduleDate.getTime()) || scheduleDate < new Date()) {
        return res.status(400).json({ error: 'Invalid scheduled time' });
      }
    }

    /* ================= DEDUCT WALLET ================= */
    user.walletBalance -= REFILL_PRICE;
    await user.save();

    /* ================= CREATE ORDER ================= */
    const order = new Order({
      customer: user._id,
      vendor: vendor._id,
      bottle: bottle._id,
      type: 'refill',
      status: 'pending',
      scheduledAt: scheduleDate,
      amount: REFILL_PRICE
    });

    await order.save();

    res.status(201).json({
      message: 'Refill request sent successfully',
      order,
      newBalance: user.walletBalance
    });

  } catch (err) {
    console.error('Refill error:', err);
    res.status(500).json({ error: 'Failed to request refill' });
  }
});
/* ======================================================
   CUSTOMER COMPLETED REFILL ORDERS
   GET /api/orders/completed
   ====================================================== */
/* ======================================================
   GET /api/orders/completed
   Customer completed orders
   ====================================================== */
router.get('/completed', auth, async (req, res) => {
  try {
    const orders = await Order.find({
      customer: req.user._id,
      status: 'completed'
    })
      .populate('vendor', 'name phone address')
      .sort({ createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load completed orders' });
  }
});


module.exports = router;
