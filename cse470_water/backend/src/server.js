const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

/* ================= APP INIT ================= */
const app = express();
const PORT = process.env.PORT || 4000;

/* ================= MIDDLEWARE ================= */
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

/* ================= DB CONNECT ================= */
const connectDB = require('./config/db');

connectDB(process.env.MONGO_URI)
  .then(() => console.log('✅ Database connected'))
  .catch(err => {
    console.error('❌ Database connection failed:', err);
    process.exit(1);
  });

/* ================= ROUTES ================= */
app.use('/api/admin/analytics', require('./routes/adminAnalytics'));

/* AUTH & USERS */
app.use('/api/auth', require('./routes/auth'));

/* ADMIN */
app.use('/api/admin', require('./routes/admin'));

/* BOTTLES */
app.use('/api/bottles', require('./routes/bottles'));

/* ORDERS */
app.use('/api/orders', require('./routes/orders'));

/* PAYMENTS */
app.use('/api/payments', require('./routes/payments'));

/* AI */
app.use('/api/ai', require('./routes/ai'));

/* VENDORS */
app.use('/api/vendors', require('./routes/vendors'));

/* REVIEWS (NEW FEATURE) */
app.use('/api/reviews', require('./routes/reviews'));

/* ================= HEALTH CHECK ================= */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

/* ================= 404 HANDLER ================= */
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

/* ================= ERROR HANDLER ================= */
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

/* ================= START SERVER ================= */
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
