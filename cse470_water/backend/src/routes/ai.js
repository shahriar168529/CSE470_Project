const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const UsageLog = require('../models/UsageLog');

router.get('/predict-usage', auth, async (req, res) => {
  const logs = await UsageLog.find({ user: req.user._id }).sort({ logDate: -1 }).limit(14);
  if (!logs.length) {
    return res.send({ nextRefillDays: null, reason: 'no usage data' });
  }
  const total = logs.reduce((s, l) => s + l.litersUsed, 0);
  const avgPerDay = total / logs.length;
  const remainingLiters = 5;
  const days = avgPerDay > 0 ? (remainingLiters / avgPerDay) : null;
  res.send({ avgPerDay, nextRefillDays: days });
});

module.exports = router;
