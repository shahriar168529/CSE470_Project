const express = require('express');
const router = express.Router();
const Transaction = require('../models/Transaction');
const Order = require('../models/Order');

router.post('/webhook', async (req, res) => {
  const { orderId, gateway, gatewayTxnId, amount, status } = req.body;
  const txn = new Transaction({ order: orderId, gateway, gatewayTxnId, amount, status });
  await txn.save();
  if (status === 'success') {
    await Order.findByIdAndUpdate(orderId, { paymentStatus: 'paid' });
  } else {
    await Order.findByIdAndUpdate(orderId, { paymentStatus: 'failed' });
  }
  res.send({ ok: true });
});

module.exports = router;
