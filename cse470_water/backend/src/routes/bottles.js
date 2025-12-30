const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

const Bottle = require('../models/Bottle');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { signQR } = require('../utils/qr');

/* =====================
   CONSTANTS
===================== */
const BOTTLE_PRICE = 80;

/* ======================================================
   BUY A NEW BOTTLE (৳80)
   POST /api/bottles/buy
   ====================================================== */
router.post('/buy', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.walletBalance < BOTTLE_PRICE) {
      return res.status(400).json({
        error: 'Insufficient wallet balance'
      });
    }

    // Deduct wallet balance
    user.walletBalance -= BOTTLE_PRICE;
    await user.save();

    // Generate unique bottle code
    const bottleCode = `RW-${Date.now().toString(36)}-${Math.floor(Math.random() * 1000)}`;

    // QR payload
    const payload = {
      bottleId: uuidv4(),
      owner: user._id,
      bottleCode,
      issuedAt: new Date().toISOString()
    };

    const bottle = new Bottle({
      bottleCode,
      qrToken: signQR(payload),
      owner: user._id,
      purchaseDate: new Date()
    });

    await bottle.save();

    res.status(201).json({
      message: 'Bottle purchased successfully',
      bottle,
      newBalance: user.walletBalance
    });
  } catch (err) {
    console.error('Bottle purchase error:', err);
    res.status(500).json({ error: 'Failed to purchase bottle' });
  }
});

/* ======================================================
   GET ALL BOTTLES OF LOGGED-IN CUSTOMER
   GET /api/bottles
   ====================================================== */
router.get('/', auth, async (req, res) => {
  try {
    const bottles = await Bottle.find({ owner: req.user._id })
      .sort({ purchaseDate: -1 });

    res.json({ bottles });
  } catch (err) {
    console.error('Fetch bottles error:', err);
    res.status(500).json({ error: 'Failed to load bottles' });
  }
});

/* ======================================================
   GET SINGLE BOTTLE BY ID
   GET /api/bottles/:id
   ====================================================== */
router.get('/:id', auth, async (req, res) => {
  try {
    const bottle = await Bottle.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!bottle) {
      return res.status(404).json({ error: 'Bottle not found' });
    }

    res.json({ bottle });
  } catch (err) {
    console.error('Fetch bottle error:', err);
    res.status(500).json({ error: 'Failed to fetch bottle' });
  }
});

module.exports = router;
