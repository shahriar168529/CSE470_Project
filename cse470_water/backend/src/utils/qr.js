const crypto = require('crypto');
const QR_HMAC_SECRET = process.env.QR_HMAC_SECRET || 'qrsecret';

function signQR(payloadObj) {
  const payload = JSON.stringify(payloadObj);
  const sig = crypto.createHmac('sha256', QR_HMAC_SECRET).update(payload).digest('base64');
  return Buffer.from(JSON.stringify({ payloadObj, sig })).toString('base64');
}

function verifyQR(qrString) {
  try {
    const decoded = Buffer.from(qrString, 'base64').toString();
    const { payloadObj, sig } = JSON.parse(decoded);
    const recalced = crypto.createHmac('sha256', QR_HMAC_SECRET).update(JSON.stringify(payloadObj)).digest('base64');
    return { valid: sig === recalced, payload: payloadObj };
  } catch (err) {
    return { valid: false, error: err.message };
  }
}

module.exports = { signQR, verifyQR };
