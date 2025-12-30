const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

const User = require('../models/User');
const Bottle = require('../models/Bottle');
const Order = require('../models/Order');
const WalletCode = require('../models/WalletCode');

const auth = require('../middleware/auth');
const { generateOTP } = require('../utils/otp');

const JWT_SECRET = process.env.JWT_SECRET || 'jwtsecret';
const OTP_EXPIRY_MIN = Number(process.env.OTP_EXPIRY_MIN || 10);

// DEV ONLY
const OTP_STORE = new Map();

const normalizePhone = phone => phone.replace(/\s+/g, '');

/* ================= REGISTER ================= */
router.post('/register', async (req, res) => {
  try {
    let { name, phone, address, role } = req.body;

    if (!name || !phone || !address || !role) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (!['customer', 'vendor'].includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    phone = normalizePhone(phone);

    if (await User.findOne({ phone })) {
      return res.status(400).json({ error: 'Phone already registered' });
    }

    const user = new User({
      name,
      phone,
      address,
      role,
      isApproved: role === 'customer'
    });

    await user.save();
    res.status(201).json({ message: 'Registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed' });
  }
});

/* ================= SEND OTP ================= */
router.post('/otp', async (req, res) => {
  let { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });

  phone = normalizePhone(phone);

  const user = await User.findOne({ phone });
  if (!user) return res.status(404).json({ error: 'User not found' });

  const otp = generateOTP();
  OTP_STORE.set(phone, {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MIN * 60 * 1000
  });

  console.log(`OTP for ${phone}: ${otp}`);
  res.json({ message: 'OTP sent' });
});

/* ================= VERIFY OTP ================= */
router.post('/verify', async (req, res) => {
  let { phone, otp } = req.body;
  phone = normalizePhone(phone);

  const record = OTP_STORE.get(phone);
  if (!record || record.expiresAt < Date.now()) {
    return res.status(400).json({ error: 'OTP expired' });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ error: 'Invalid OTP' });
  }

  const user = await User.findOne({ phone });
  if (user.role === 'vendor' && !user.isApproved) {
    return res.status(403).json({ error: 'Vendor not approved' });
  }

  const token = jwt.sign(
    { id: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  OTP_STORE.delete(phone);

  res.json({
    token,
    user: {
      id: user._id,
      role: user.role
    }
  });
});

/* ================= GET PROFILE ================= */
router.get('/me', auth, async (req, res) => {
  res.json({
    _id: req.user._id,
    name: req.user.name,
    phone: req.user.phone,
    address: req.user.address,
    role: req.user.role,
    walletBalance: req.user.walletBalance,
    ecoPoints: req.user.ecoPoints,
    monthlyWaterDemand: req.user.monthlyWaterDemand
  });
});

/* ================= SET WATER DEMAND ================= */
router.post('/water-demand', auth, async (req, res) => {
  const { demand } = req.body;

  if (!demand || demand <= 0) {
    return res.status(400).json({ error: 'Invalid demand' });
  }

  req.user.monthlyWaterDemand = Number(demand);
  await req.user.save();

  res.json({
    message: 'Water demand updated',
    demand: req.user.monthlyWaterDemand
  });
});

/* ================= WALLET CODE ================= */
router.post('/redeem', auth, async (req, res) => {
  const walletCode = await WalletCode.findOne({ code: req.body.code });

  if (!walletCode || walletCode.isUsed) {
    return res.status(400).json({ error: 'Invalid code' });
  }

  walletCode.isUsed = true;
  walletCode.usedBy = req.user._id;
  await walletCode.save();

  req.user.walletBalance += walletCode.amount;
  await req.user.save();

  res.json({ newBalance: req.user.walletBalance });
});

/* ================= CARD TOPUP ================= */
router.post('/card-topup', auth, async (req, res) => {
  const { amount } = req.body;
  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  req.user.walletBalance += Number(amount);
  await req.user.save();

  res.json({ newBalance: req.user.walletBalance });
});

module.exports = router;
