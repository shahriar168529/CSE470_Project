const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const role = require('../middleware/role');

const Order = require('../models/order');
const WalletCode = require('../models/WalletCode');
const VendorReview = require('../models/VendorReview');
const User = require('../models/User');

/* ============================================
   PLATFORM REVENUE ANALYTICS
   GET /api/admin/analytics/revenue
============================================ */
router.get('/revenue', auth, role(['admin']), async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const completedOrders = await Order.find({ status: 'completed' });

    const todayRevenue = completedOrders
      .filter(o => o.createdAt >= startOfDay)
      .reduce((s, o) => s + (o.amount || 0), 0);

    const monthRevenue = completedOrders
      .filter(o => o.createdAt >= startOfMonth)
      .reduce((s, o) => s + (o.amount || 0), 0);

    const totalRevenue = completedOrders
      .reduce((s, o) => s + (o.amount || 0), 0);

    res.json({
      todayRevenue,
      monthRevenue,
      totalRevenue
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Revenue analytics failed' });
  }
});
/* ============================================
   VENDOR PERFORMANCE SCORE
   GET /api/admin/analytics/vendor-performance
============================================ */
router.get('/vendor-performance', auth, role(['admin']), async (req, res) => {
  try {
    const vendors = await User.find({ role: 'vendor', isApproved: true });

    const results = [];

    for (const v of vendors) {
      const completedOrders = await Order.countDocuments({
        vendor: v._id,
        status: 'completed'
      });

      const reviews = await VendorReview.find({ vendor: v._id });
      const avgRating =
        reviews.length === 0
          ? 0
          : reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

      // simple scoring model
      const score =
        avgRating * 40 +
        Math.min(completedOrders, 50) * 0.8; // cap influence

      results.push({
        vendorId: v._id,
        name: v.name,
        avgRating: Number(avgRating.toFixed(2)),
        completedOrders,
        score: Math.round(score)
      });
    }

    res.json(results.sort((a, b) => b.score - a.score));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Vendor performance failed' });
  }
});
/* ============================================
   WALLET CODE EFFICIENCY
   GET /api/admin/analytics/wallet-efficiency
============================================ */
router.get('/wallet-efficiency', auth, role(['admin']), async (req, res) => {
  try {
    const codes = await WalletCode.find();

    const total = codes.length;
    const used = codes.filter(c => c.isUsed).length;
    const unusedValue = codes
      .filter(c => !c.isUsed)
      .reduce((s, c) => s + c.amount, 0);

    res.json({
      totalCodes: total,
      redeemedCodes: used,
      redemptionRate: total ? Math.round((used / total) * 100) : 0,
      unusedValue
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Wallet analytics failed' });
  }
});
/* ============================================
   SMART FRAUD ALERTS
   GET /api/admin/analytics/alerts
============================================ */
router.get('/alerts', auth, role(['admin']), async (req, res) => {
  try {
    const alerts = [];

    const now = new Date();
    const oneHourAgo = new Date(now - 60 * 60 * 1000);
    const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);

    // vendors doing too many refills
    const suspiciousVendors = await Order.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: { $gte: oneHourAgo }
        }
      },
      {
        $group: {
          _id: '$vendor',
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gte: 10 } }
      }
    ]);

    suspiciousVendors.forEach(v => {
      alerts.push({
        type: 'vendor',
        message: `Vendor completed ${v.count} refills in 1 hour`
      });
    });

    // customers redeeming too many codes
    const suspiciousCodes = await WalletCode.aggregate([
      {
        $match: {
          isUsed: true,
          usedAt: { $gte: oneDayAgo }
        }
      },
      {
        $group: {
          _id: '$usedBy',
          count: { $sum: 1 }
        }
      },
      {
        $match: { count: { $gte: 3 } }
      }
    ]);

    suspiciousCodes.forEach(c => {
      alerts.push({
        type: 'customer',
        message: `Customer redeemed ${c.count} wallet codes today`
      });
    });

    res.json(alerts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Alert system failed' });
  }
});

module.exports = router;
