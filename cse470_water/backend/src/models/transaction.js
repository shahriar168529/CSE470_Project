const mongoose = require('mongoose');

const TransactionSchema = new mongoose.Schema({
  order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  gateway: { type: String },
  gatewayTxnId: { type: String },
  amount: { type: Number },
  status: { type: String, enum: ['success','failed'] },
  createdAt: { type: Date, default: Date.now }
});

// safe export to avoid OverwriteModelError on nodemon reload
module.exports = mongoose.models.Transaction || mongoose.model('Transaction', TransactionSchema);
