import React, { useEffect, useState } from 'react';
import API from '../services/api';
import waterVideo from '../assets/Liquid Water Drop Background for Title Animation.mp4';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);

  /* ================= CORE DATA ================= */
  const [profile, setProfile] = useState(null);
  const [balance, setBalance] = useState(0);
  const [monthlyGoal, setMonthlyGoal] = useState(''); // liters

  const [bottles, setBottles] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);

  /* ================= ACTION STATES ================= */
  const [walletCode, setWalletCode] = useState('');
  const [cardAmount, setCardAmount] = useState('');
  const [selectedBottle, setSelectedBottle] = useState('');
  const [selectedVendor, setSelectedVendor] = useState('');

  /* ================= REVIEWS ================= */
  const [reviewData, setReviewData] = useState({});
  const [hiddenReviews, setHiddenReviews] = useState([]);

  /* ================= VENDOR CONTENTS ================= */
  const [activeVendor, setActiveVendor] = useState(null);
  const [vendorContents, setVendorContents] = useState([]);
  const [loadingContents, setLoadingContents] = useState(false);

  /* ================= CONSTANTS ================= */
  const BOTTLE_SIZE_L = 5;
  const REFILL_PRICE = 30;

  /* ================= LOGOUT ================= */
  const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  /* ================= LOAD DASHBOARD ================= */
  useEffect(() => {
    const load = async () => {
      try {
        const [me, bottleRes, vendorRes, completedRes] = await Promise.all([
          API.get('/auth/me'),
          API.get('/bottles'),
          API.get('/vendors/public/vendors'),
          API.get('/orders/completed')
        ]);

        setProfile(me.data);
        setBalance(me.data.walletBalance || 0);
        setMonthlyGoal(me.data.monthlyWaterDemand || '');
        setBottles(bottleRes.data.bottles || []);
        setVendors(vendorRes.data || []);
        setCompletedOrders(completedRes.data || []);
      } catch {
        alert('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  /* ================= CITY FILTER ================= */
  const customerCity = profile?.address
    ?.toLowerCase()
    .replace(/bangladesh/g, '')
    .split(',')
    .map(p => p.trim())
    .filter(Boolean)
    .slice(-1)[0];

  const recommendedVendors = vendors.filter(v => v.city === customerCity);

  /* ================= VENDOR RATING ================= */
  const getVendorRating = (vendor) => {
    if (vendor.avgRating) return vendor.avgRating;
    if (vendor.rating) return vendor.rating;
    if (vendor.reviewStats?.avg) return vendor.reviewStats.avg;
    return null;
  };

  /* ================= ACTIONS ================= */
  const redeemCode = async () => {
    const res = await API.post('/auth/redeem', { code: walletCode });
    setBalance(res.data.newBalance);
    setWalletCode('');
  };

  const cardTopup = async () => {
    const res = await API.post('/auth/card-topup', { amount: cardAmount });
    setBalance(res.data.newBalance);
    setCardAmount('');
  };

  const saveGoal = async () => {
    await API.post('/auth/water-demand', { demand: Number(monthlyGoal) });
    alert('Monthly goal saved (liters)');
  };

  const buyBottle = async () => {
    try {
      const res = await API.post('/bottles/buy');
      setBalance(res.data.newBalance);
      setBottles(prev => [...prev, res.data.bottle]);
      alert('Bottle purchased (5L)');
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to buy bottle');
    }
  };

  const requestRefill = async () => {
    await API.post('/orders/refill', {
      bottleId: selectedBottle,
      vendorId: selectedVendor
    });
    alert('Refill requested (৳30)');
  };

  /* ================= VENDOR CONTENTS ================= */
  const viewVendorContents = async (vendor) => {
    setActiveVendor(vendor);
    setLoadingContents(true);

    try {
      const res = await API.get('/vendors/content/public', {
        params: { vendorId: vendor._id }
      });
      setVendorContents(res.data || []);
    } catch {
      alert('Failed to load vendor contents');
    } finally {
      setLoadingContents(false);
    }
  };

  /* ================= REVIEWS (FIXED) ================= */
  const submitReview = async (orderId) => {
    const data = reviewData[orderId];
    if (!data?.rating) return alert('Please select a rating');

    const order = completedOrders.find(o => o._id === orderId);
    if (!order?.vendor?._id) return alert('Vendor not found');

    await API.post('/reviews', {
      orderId,
      vendorId: order.vendor._id,
      rating: data.rating,
      comment: data.comment || ''
    });

    setHiddenReviews(prev => [...prev, orderId]);
  };

  const denyReview = (orderId) => {
    setHiddenReviews(prev => [...prev, orderId]);
  };

  /* ================= MONTHLY USAGE ================= */
  const totalRefills = bottles.reduce((sum, b) => sum + b.refillCount, 0);
  const monthlyUsageLiters = totalRefills * BOTTLE_SIZE_L;

  const monthlyUsagePercent = monthlyGoal
    ? Math.round((monthlyUsageLiters / monthlyGoal) * 100)
    : 0;

  let usageStatus = 'On track';
  let usageColor = '#22c55e';

  if (monthlyUsagePercent >= 80 && monthlyUsagePercent < 100) {
    usageStatus = 'Nearing limit';
    usageColor = '#facc15';
  } else if (monthlyUsagePercent >= 100) {
    usageStatus = 'Limit exceeded';
    usageColor = '#ef4444';
  }

  /* ================= SMART ASSISTANT ================= */
  const agingBottles = bottles.filter(b => b.refillCount >= 5 && b.refillCount < 8);
  const expiredBottles = bottles.filter(b => b.refillCount >= 8);

  const assistantMessages = [];
  let assistantLevel = 'good';

  if (monthlyGoal) {
    if (monthlyUsagePercent < 60) {
      assistantMessages.push(`✅ You are on track (${monthlyUsagePercent}% used).`);
    } else if (monthlyUsagePercent < 90) {
      assistantMessages.push(`⚠️ You have used ${monthlyUsagePercent}% of your monthly goal.`);
      assistantLevel = 'warn';
    } else {
      assistantMessages.push(`🚨 Monthly water limit almost reached.`);
      assistantLevel = 'danger';
    }
  }

  if (agingBottles.length) {
    assistantMessages.push(`🧴 ${agingBottles.length} bottle(s) nearing end of life.`);
    assistantLevel = 'warn';
  }

  if (expiredBottles.length) {
    assistantMessages.push(`🚫 ${expiredBottles.length} bottle(s) should be replaced.`);
    assistantLevel = 'danger';
  }

  if (balance < REFILL_PRICE) {
    assistantMessages.push(`💰 Low balance. Refill requires ৳${REFILL_PRICE}.`);
    assistantLevel = 'danger';
  }

  if (assistantMessages.length < 3) {
    assistantMessages.push('🌱 Great job managing your water usage!');
  }

  /* ================= RENDER ================= */
  if (loading) {
    return <p style={{ color: '#fff', textAlign: 'center', marginTop: 100 }}>Loading…</p>;
  }

  return (
    <div style={page}>
      <video autoPlay muted loop playsInline style={videoBg}>
        <source src={waterVideo} type="video/mp4" />
      </video>
      <div style={overlay} />

      <div style={dashboardGrid}>
        <div style={header}>
          <h2>💧 Customer Dashboard</h2>
          <button style={logoutBtn} onClick={logout}>Logout</button>
        </div>

        {/* SMART ASSISTANT */}
        <Card full>
          <h3>🤖 Smart Water Assistant</h3>
          <div style={{
            ...assistantBox,
            ...(assistantLevel === 'danger'
              ? assistantDanger
              : assistantLevel === 'warn'
              ? assistantWarn
              : assistantGood)
          }}>
            <ul>
              {assistantMessages.map((m, i) => <li key={i}>{m}</li>)}
            </ul>
          </div>
        </Card>

        {/* BALANCE */}
        <Card>
          <h3>💰 Balance</h3>
          <h1>৳ {balance}</h1>
        </Card>

        {/* MONTHLY USAGE */}
        <Card>
          <h3>📊 Monthly Usage</h3>
          <h1>{monthlyUsageLiters} L</h1>
          {monthlyGoal ? (
            <>
              <p>{monthlyUsagePercent}% of goal</p>
              <p style={{ color: usageColor, fontWeight: 'bold' }}>{usageStatus}</p>
            </>
          ) : (
            <p>Set monthly goal (liters)</p>
          )}
        </Card>

        {/* WALLET */}
        <Card>
          <h3>💳 Wallet</h3>
          <input style={input} placeholder="Wallet code" value={walletCode}
            onChange={e => setWalletCode(e.target.value)} />
          <button style={primaryBtn} onClick={redeemCode}>Redeem</button>

          <input style={input} type="number" placeholder="Top-up amount" value={cardAmount}
            onChange={e => setCardAmount(e.target.value)} />
          <button style={accentBtn} onClick={cardTopup}>Top-up</button>
        </Card>

        {/* MONTHLY GOAL */}
        <Card>
          <h3>🎯 Monthly Goal (Liters)</h3>
          <input style={input} type="number" value={monthlyGoal}
            onChange={e => setMonthlyGoal(e.target.value)} />
          <button style={primaryBtn} onClick={saveGoal}>Save</button>
        </Card>

        {/* REFILL & BUY */}
        <Card>
          <h3>🚚 Refill & Bottle</h3>
          <small>💧 Refill ৳30 | 🧴 Bottle size 5L</small>

          <select style={input} onChange={e => setSelectedBottle(e.target.value)}>
            <option value="">Select Bottle</option>
            {bottles.map(b => (
              <option key={b._id} value={b._id}>{b.bottleCode} (5L)</option>
            ))}
          </select>

          <select style={input} onChange={e => setSelectedVendor(e.target.value)}>
            <option value="">Select Vendor</option>
            {recommendedVendors.map(v => (
              <option key={v._id} value={v._id}>{v.name}</option>
            ))}
          </select>

          <div style={actionRow}>
            <button style={primaryBtn} onClick={requestRefill}>Request Refill</button>
            <button style={accentBtn} onClick={buyBottle}>Buy Bottle</button>
          </div>
        </Card>

        {/* VENDORS */}
        <Card full>
          <h3>📍 Vendors in Your City</h3>
          <div style={vendorGrid}>
            {recommendedVendors.map(v => (
              <div key={v._id} style={vendorInnerCard}>
                <b>{v.name}</b>
                <p>⭐ {getVendorRating(v) ? `${getVendorRating(v).toFixed(1)} / 5` : 'No ratings yet'}</p>
                <p>{v.phone}</p>
                <p>{v.address}</p>
                <button style={secondaryBtn} onClick={() => viewVendorContents(v)}>
                  View Contents
                </button>
              </div>
            ))}
          </div>
        </Card>

        {/* VENDOR CONTENTS */}
        {activeVendor && (
          <Card full>
            <h3>📷 {activeVendor.name} — Contents</h3>
            {loadingContents ? 'Loading…' : (
              <div style={contentGrid}>
                {vendorContents.map(c => (
                  <img key={c._id} src={c.imageUrl} alt="" style={contentImage} />
                ))}
              </div>
            )}
          </Card>
        )}

        {/* REVIEWS */}
        <Card full>
          <h3>⭐ Rate Vendors</h3>
          {completedOrders
            .filter(o => !hiddenReviews.includes(o._id))
            .map(o => (
              <div key={o._id} style={reviewRow}>
                <b>{o.vendor.name}</b>

                <select
                  value={reviewData[o._id]?.rating || ''}
                  onChange={e =>
                    setReviewData(prev => ({
                      ...prev,
                      [o._id]: { ...prev[o._id], rating: +e.target.value }
                    }))
                  }
                >
                  <option value="">Rate</option>
                  {[5,4,3,2,1].map(r => (
                    <option key={r} value={r}>{r} ★</option>
                  ))}
                </select>

                <input
                  style={input}
                  placeholder="Optional comment"
                  value={reviewData[o._id]?.comment || ''}
                  onChange={e =>
                    setReviewData(prev => ({
                      ...prev,
                      [o._id]: { ...prev[o._id], comment: e.target.value }
                    }))
                  }
                />

                <div style={{ display: 'flex', gap: 6 }}>
                  <button style={primaryBtn} onClick={() => submitReview(o._id)}>Submit</button>
                  <button style={denyBtn} onClick={() => denyReview(o._id)}>Skip</button>
                </div>
              </div>
            ))}
        </Card>
      </div>
    </div>
  );
}

/* ================= COMPONENT ================= */
function Card({ children, full }) {
  return <div style={{ ...card, gridColumn: full ? '1 / -1' : 'span 4' }}>{children}</div>;
}

/* ================= STYLES ================= */
const page = { minHeight: '100vh', position: 'relative', fontFamily: 'Tahoma' };
const videoBg = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' };
const overlay = { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)' };

const dashboardGrid = {
  position: 'relative',
  maxWidth: 1400,
  margin: '30px auto',
  padding: 10,
  color: '#fff',
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gap: 20
};

const header = {
  gridColumn: '1 / -1',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center'
};

const card = {
  background: 'rgba(255,255,255,0.14)',
  backdropFilter: 'blur(18px)',
  borderRadius: 14,
  padding: 14
};

const assistantBox = { padding: 14, borderRadius: 12 };
const assistantGood = { background: 'rgba(34,197,94,0.2)' };
const assistantWarn = { background: 'rgba(250,204,21,0.2)' };
const assistantDanger = { background: 'rgba(239,68,68,0.25)' };

const vendorGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
  gap: 12
};

const vendorInnerCard = {
  background: 'rgba(0,0,0,0.35)',
  padding: 10,
  borderRadius: 10
};

const contentGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
  gap: 12
};

const contentImage = {
  width: '100%',
  height: 140,
  objectFit: 'cover',
  borderRadius: 10
};

const reviewRow = {
  display: 'grid',
  gridTemplateColumns: '1fr 100px 1fr 160px',
  gap: 10,
  marginBottom: 10
};

const actionRow = {
  display: 'flex',
  gap: 10,
  marginTop: 8
};

const input = { width: '100%', padding: 8, borderRadius: 6, border: 'none', marginBottom: 6 };
const primaryBtn = { padding: 8, borderRadius: 6, border: 'none', background: '#6c63ff', color: '#fff' };
const accentBtn = { ...primaryBtn, background: '#00e3ae', color: '#003c33' };
const secondaryBtn = { ...primaryBtn, background: '#22d3ee', color: '#003c33' };
const denyBtn = { ...primaryBtn, background: '#ef4444' };
const logoutBtn = { padding: '8px 14px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff' };
