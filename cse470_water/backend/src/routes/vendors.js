const express = require('express');
const router = express.Router();

const auth = require('../middleware/auth');
const role = require('../middleware/role');

const User = require('../models/User');
const Order = require('../models/order');
const VendorContent = require('../models/VendorContent');
const VendorReview = require('../models/VendorReview');

const { extractCity } = require('../utils/city');

/* ======================================================
   VENDOR DASHBOARD (VENDOR ONLY)
   ====================================================== */
router.get('/dashboard', auth, role(['vendor']), async (req, res) => {
  try {
    const pendingOrders = await Order.find({
      vendor: req.user._id,
      status: 'pending'
    })
      .populate('customer', 'name phone')
      .populate('bottle', 'bottleCode');

    const completedOrders = await Order.find({
      vendor: req.user._id,
      status: 'completed'
    })
      .populate('customer', 'name phone')
      .populate('bottle', 'bottleCode');

    const totalEarnings = completedOrders.reduce(
      (sum, o) => sum + (o.amount || 0),
      0
    );

    res.json({
      pendingOrders,
      completedOrders,
      totalEarnings
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Vendor dashboard failed' });
  }
});

/* ======================================================
   UPLOAD CONTENT (VENDOR ONLY)
   ====================================================== */
router.post('/content', auth, role(['vendor']), async (req, res) => {
  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'Image URL required' });
    }

    const content = await VendorContent.create({
      vendor: req.user._id,
      imageUrl
    });

    res.json(content);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Content upload failed' });
  }
});

/* ======================================================
   GET MY CONTENTS (VENDOR)
   ====================================================== */
router.get('/content', auth, role(['vendor']), async (req, res) => {
  try {
    const contents = await VendorContent.find({
      vendor: req.user._id
    }).sort({ createdAt: -1 });

    res.json(contents);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load vendor contents' });
  }
});

/* ======================================================
   PUBLIC: GET APPROVED VENDORS + AVG RATING
   ====================================================== */
router.get('/public/vendors', async (req, res) => {
  try {
    const vendors = await User.aggregate([
      {
        $match: {
          role: 'vendor',
          isApproved: true
        }
      },
      {
        $lookup: {
          from: 'vendorreviews',
          localField: '_id',
          foreignField: 'vendor',
          as: 'reviews'
        }
      },
      {
        $addFields: {
          avgRating: {
            $cond: [
              { $gt: [{ $size: '$reviews' }, 0] },
              { $avg: '$reviews.rating' },
              null
            ]
          },
          reviewCount: { $size: '$reviews' }
        }
      },
      {
        $project: {
          password: 0,
          reviews: 0
        }
      }
    ]);

    const formattedVendors = vendors.map(v => ({
      ...v,
      city: extractCity(v.address)
    }));

    res.json(formattedVendors);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load vendors' });
  }
});

/* ======================================================
   PUBLIC: GET CONTENTS BY VENDOR
   ====================================================== */
router.get('/content/public', async (req, res) => {
  try {
    const { vendorId } = req.query;
    if (!vendorId) return res.json([]);

    const contents = await VendorContent.find({ vendor: vendorId })
      .sort({ createdAt: -1 });

    res.json(contents);
  } catch (err) {
    console.error(err);
    res.status(500).json([]);
  }
});

/* ======================================================
   COMPLETE ORDER (VENDOR ONLY)
   ====================================================== */
router.post('/orders/:id/complete', auth, role(['vendor']), async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      vendor: req.user._id
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.status = 'completed';
    order.completedAt = new Date();
    await order.save();

    res.json({ message: 'Order completed' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to complete order' });
  }
});
/* ======================================================
   GET MY REVIEWS (VENDOR ONLY – READ ONLY)
   GET /api/vendors/reviews
   ====================================================== */
router.get('/reviews', auth, role(['vendor']), async (req, res) => {
  try {
    const reviews = await VendorReview.find({
      vendor: req.user._id
    })
      .populate('customer', 'name')
      .sort({ updatedAt: -1 });

    res.json(reviews);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load reviews' });
  }
});

module.exports = router;
