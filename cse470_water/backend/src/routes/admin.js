const express = require('express');
const router = express.Router();
const crypto = require('crypto');

const auth = require('../middleware/auth');
const role = require('../middleware/role');

const User = require('../models/User');
const WalletCode = require('../models/WalletCode');

/* =========================
   HELPER: CITY EXTRACTOR
   Address format: "street, city"
   ========================= */
const extractCity = (address) => {
  if (!address) return null;

  const parts = address.split(',');
  return parts.length > 1
    ? parts[parts.length - 1].trim()
    : null;
};

/* =========================
   HELPER: GOOGLE MAP LINK
   ========================= */
const makeMapLink = (address) => {
  if (!address) return null;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
};

/* =========================
   ADMIN DASHBOARD STATS
   ========================= */
router.get('/stats', auth, role(['admin']), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const customers = await User.countDocuments({ role: 'customer' });
    const vendors = await User.countDocuments({ role: 'vendor' });
    const pendingVendors = await User.countDocuments({
      role: 'vendor',
      isApproved: false
    });

    res.json({
      totalUsers,
      customers,
      vendors,
      pendingVendors
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load admin stats' });
  }
});

/* =========================
   ALL USERS (WITH CITY)
   ========================= */
router.get('/users', auth, role(['admin']), async (req, res) => {
  try {
    const users = await User.find().select(
      'name phone address role walletBalance isApproved createdAt'
    );

    const formattedUsers = users.map(user => ({
      ...user.toObject(),
      city: extractCity(user.address),
      mapLink: makeMapLink(user.address)
    }));

    res.json(formattedUsers);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/* =========================
   ALL VENDORS (WITH CITY)
   ========================= */
router.get('/vendors', auth, role(['admin']), async (req, res) => {
  try {
    const vendors = await User.find({ role: 'vendor' }).select(
      'name phone address isApproved createdAt'
    );

    const formattedVendors = vendors.map(vendor => ({
      ...vendor.toObject(),
      city: extractCity(vendor.address),
      mapLink: makeMapLink(vendor.address)
    }));

    res.json(formattedVendors);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

/* =========================
   PENDING VENDORS (WITH CITY)
   ========================= */
router.get('/vendors/pending', auth, role(['admin']), async (req, res) => {
  try {
    const vendors = await User.find({
      role: 'vendor',
      isApproved: false
    }).select('name phone address createdAt');

    const formattedVendors = vendors.map(vendor => ({
      ...vendor.toObject(),
      city: extractCity(vendor.address),
      mapLink: makeMapLink(vendor.address)
    }));

    res.json(formattedVendors);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch pending vendors' });
  }
});

/* =========================
   APPROVE VENDOR
   ========================= */
router.post('/vendors/:id/approve', auth, role(['admin']), async (req, res) => {
  try {
    const vendor = await User.findById(req.params.id);

    if (!vendor || vendor.role !== 'vendor') {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    vendor.isApproved = true;
    await vendor.save();

    res.json({ message: 'Vendor approved successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve vendor' });
  }
});

/* =========================
   GENERATE WALLET CODE
   ========================= */
router.post('/wallet-codes', auth, role(['admin']), async (req, res) => {
  try {
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const code = crypto.randomBytes(4).toString('hex').toUpperCase();

    const walletCode = new WalletCode({
      code,
      amount
    });

    await walletCode.save();
    res.json(walletCode);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create wallet code' });
  }
});

/* =========================
   ALL WALLET CODES
   ========================= */
router.get('/wallet-codes', auth, role(['admin']), async (req, res) => {
  try {
    const codes = await WalletCode.find()
      .populate('usedBy', 'name phone address')
      .sort({ createdAt: -1 });

    const formattedCodes = codes.map(code => ({
      ...code.toObject(),
      usedBy: code.usedBy
        ? {
            ...code.usedBy.toObject(),
            city: extractCity(code.usedBy.address),
            mapLink: makeMapLink(code.usedBy.address)
          }
        : null
    }));

    res.json(formattedCodes);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch wallet codes' });
  }
});

module.exports = router;
