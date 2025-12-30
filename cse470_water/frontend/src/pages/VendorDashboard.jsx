import React, { useEffect, useState } from 'react';
import API from '../services/api';
import waterVideo from '../assets/Liquid Water Drop Background for Title Animation.mp4';

export default function VendorDashboard() {
  const [loading, setLoading] = useState(true);

  /* ================= DATA ================= */
  const [pendingOrders, setPendingOrders] = useState([]);
  const [completedOrders, setCompletedOrders] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);

  /* ================= CONTENT ================= */
  const [imageUrl, setImageUrl] = useState('');
  const [myContents, setMyContents] = useState([]);

  /* ================= LOGOUT ================= */
  const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  /* ================= LOAD DASHBOARD ================= */
  const loadDashboard = async () => {
    try {
      const res = await API.get('/vendors/dashboard');

      setPendingOrders(res.data.pendingOrders || []);
      setCompletedOrders(res.data.completedOrders || []);
      setTotalEarnings(res.data.totalEarnings || 0);
    } catch {
      alert('Failed to load vendor dashboard');
    }
  };

  /* ================= LOAD CONTENTS ================= */
  const loadMyContents = async () => {
    try {
      const res = await API.get('/vendors/content');
      setMyContents(res.data || []);
    } catch {
      alert('Failed to load uploaded contents');
    }
  };

  /* ================= UPLOAD CONTENT ================= */
  const uploadContent = async () => {
    if (!imageUrl) return alert('Enter image URL');

    try {
      await API.post('/vendors/content', { imageUrl });
      setImageUrl('');
      loadMyContents();
    } catch {
      alert('Upload failed');
    }
  };

  /* ================= COMPLETE ORDER ================= */
  const completeOrder = async (id) => {
    if (!window.confirm('Mark this refill as completed?')) return;

    try {
      await API.post(`/vendors/orders/${id}/complete`);
      loadDashboard();
    } catch {
      alert('Failed to complete order');
    }
  };

  useEffect(() => {
    Promise.all([loadDashboard(), loadMyContents()])
      .finally(() => setLoading(false));
  }, []);

  /* ================= SMART ASSISTANT ================= */
  const assistantMessages = [];

  if (pendingOrders.length > 0) {
    assistantMessages.push(
      `🚚 You have ${pendingOrders.length} pending refill(s). Completing them faster improves customer trust.`
    );
  } else {
    assistantMessages.push('✅ No pending refills right now.');
  }

  if (completedOrders.length > 0) {
    assistantMessages.push(
      `⭐ You have completed ${completedOrders.length} refill(s). Keep up the good work!`
    );
  }

  if (totalEarnings > 0) {
    assistantMessages.push(`💰 Total earnings so far: ৳${totalEarnings}.`);
  }

  if (assistantMessages.length < 3) {
    assistantMessages.push('🌱 You are doing great today!');
  }

  /* ================= RENDER ================= */
  if (loading) {
    return (
      <p style={{ color: '#fff', textAlign: 'center', marginTop: 100 }}>
        Loading vendor dashboard…
      </p>
    );
  }

  return (
    <div style={page}>
      {/* 🎥 BACKGROUND VIDEO */}
      <video autoPlay muted loop playsInline style={videoBg}>
        <source src={waterVideo} type="video/mp4" />
      </video>
      <div style={overlay} />

      <div style={dashboard}>
        {/* HEADER */}
        <header style={header}>
          <h2>🚚 Vendor Dashboard</h2>
          <button style={logoutBtn} onClick={logout}>Logout</button>
        </header>

        {/* 💰 EARNINGS */}
        <Glass large>
          <h2>💰 Total Earnings</h2>
          <p style={{ fontSize: 32, fontWeight: 600 }}>৳ {totalEarnings}</p>
        </Glass>

        {/* 🤖 SMART ASSISTANT */}
        <Glass large>
          <h3>🤖 Vendor Smart Assistant</h3>
          <ul style={{ paddingLeft: 18, lineHeight: 1.8 }}>
            {assistantMessages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </Glass>

        {/* 📤 UPLOAD CONTENT */}
        <Glass>
          <h3>🖼 Upload Content</h3>

          <input
            style={input}
            placeholder="Paste image URL"
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
          />

          <button style={primaryBtn} onClick={uploadContent}>
            Upload
          </button>
        </Glass>

        {/* 🖼 MY CONTENTS */}
        <Glass>
          <h3>📁 My Uploaded Contents</h3>

          {myContents.length === 0 ? (
            <p style={{ opacity: 0.8 }}>No uploads yet</p>
          ) : (
            <div style={imageGrid}>
              {myContents.map(c => (
                <img
                  key={c._id}
                  src={c.imageUrl}
                  alt="vendor upload"
                  style={imageThumb}
                />
              ))}
            </div>
          )}
        </Glass>

        {/* 📦 ORDERS */}
        <div style={twoCol}>
          <Glass>
            <h3>🚚 Pending Refills</h3>

            {pendingOrders.length === 0 ? (
              <p>No pending refills</p>
            ) : (
              pendingOrders.map(o => (
                <div key={o._id} style={orderRow}>
                  <div>
                    <b>{o.customer?.name}</b>
                    <p style={{ fontSize: 13 }}>
                      Bottle QR: {o.bottle?.bottleCode}
                    </p>
                  </div>
                  <button
                    style={smallBtn}
                    onClick={() => completeOrder(o._id)}
                  >
                    Complete
                  </button>
                </div>
              ))
            )}
          </Glass>

          <Glass>
            <h3>✅ Completed Refills</h3>

            {completedOrders.length === 0 ? (
              <p>No completed refills</p>
            ) : (
              completedOrders.map(o => (
                <p key={o._id}>
                  Bottle QR: {o.bottle?.bottleCode} <br />
                  <small>
                    {new Date(o.completedAt).toLocaleString()}
                  </small>
                </p>
              ))
            )}
          </Glass>
        </div>
      </div>
    </div>
  );
}

/* ================= GLASS ================= */
function Glass({ children, large }) {
  return (
    <div style={{ ...glass, gridColumn: large ? '1 / -1' : 'auto' }}>
      {children}
    </div>
  );
}

/* ================= STYLES ================= */

const page = {
  minHeight: '100vh',
  position: 'relative',
  fontFamily: 'Tahoma, sans-serif'
};

const videoBg = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  zIndex: 0
};

const overlay = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(0,0,0,0.65)',
  zIndex: 1,
  pointerEvents: 'none'
};

const dashboard = {
  position: 'relative',
  zIndex: 2,
  maxWidth: 1200,
  margin: '40px auto',
  padding: 20,
  color: '#fff'
};

const header = {
  display: 'flex',
  justifyContent: 'space-between',
  marginBottom: 25
};

const logoutBtn = {
  background: '#6c63ff',
  border: 'none',
  color: '#fff',
  padding: '8px 16px',
  borderRadius: 8,
  cursor: 'pointer'
};

const twoCol = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 20
};

const glass = {
  background: 'rgba(255,255,255,0.14)',
  backdropFilter: 'blur(18px)',
  borderRadius: 18,
  padding: 24,
  marginBottom: 20
};

const input = {
  width: '100%',
  padding: 10,
  borderRadius: 8,
  border: 'none',
  marginBottom: 10
};

const primaryBtn = {
  width: '100%',
  padding: 10,
  borderRadius: 8,
  border: 'none',
  background: '#00e3ae',
  color: '#003c33',
  cursor: 'pointer'
};

const smallBtn = {
  padding: '6px 10px',
  borderRadius: 6,
  border: 'none',
  background: '#6c63ff',
  color: '#fff',
  cursor: 'pointer'
};

const orderRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 10
};

const imageGrid = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, 100px)',
  gap: 12
};

const imageThumb = {
  width: 100,
  height: 100,
  objectFit: 'cover',
  borderRadius: 10
};
