import React, { useEffect, useState } from 'react';
import API from '../services/api';
import waterVideo from '../assets/Liquid Water Drop Background for Title Animation.mp4';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingVendors, setPendingVendors] = useState([]);
  const [walletCodes, setWalletCodes] = useState([]);

  /* NEW ANALYTICS */
  const [revenue, setRevenue] = useState(null);
  const [vendorScores, setVendorScores] = useState([]);
  const [walletStats, setWalletStats] = useState(null);
  const [alerts, setAlerts] = useState([]);

  const [roleFilter, setRoleFilter] = useState('all');
  const [redeemAmount, setRedeemAmount] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [loading, setLoading] = useState(true);

  /* LOGOUT */
  const logout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  /* LOAD ALL DATA */
  const loadData = async () => {
    try {
      const [
        s,
        u,
        p,
        codes,
        rev,
        vendorPerf,
        walletEff,
        fraudAlerts
      ] = await Promise.all([
        API.get('/admin/stats'),
        API.get('/admin/users'),
        API.get('/admin/vendors/pending'),
        API.get('/admin/wallet-codes'),

        /* NEW */
        API.get('/admin/analytics/revenue'),
        API.get('/admin/analytics/vendor-performance'),
        API.get('/admin/analytics/wallet-efficiency'),
        API.get('/admin/analytics/alerts')
      ]);

      setStats(s.data);
      setUsers(u.data);
      setPendingVendors(p.data);
      setWalletCodes(codes.data || []);

      setRevenue(rev.data);
      setVendorScores(vendorPerf.data || []);
      setWalletStats(walletEff.data);
      setAlerts(fraudAlerts.data || []);
    } catch (err) {
      console.error(err);
      alert('Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  /* ACTIONS */
  const generateWalletCode = async () => {
    if (!redeemAmount || redeemAmount <= 0) {
      return alert('Enter a valid amount');
    }

    const res = await API.post('/admin/wallet-codes', {
      amount: redeemAmount
    });

    setGeneratedCode(res.data.code);
    setRedeemAmount('');
    loadData();
  };

  const approveVendor = async (id) => {
    await API.post(`/admin/vendors/${id}/approve`);
    loadData();
  };

  const filteredUsers =
    roleFilter === 'all'
      ? users
      : users.filter(u => u.role === roleFilter);

  if (loading) {
    return (
      <p style={{ color: '#fff', textAlign: 'center', marginTop: 80 }}>
        Loading…
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

      <div style={dashboardCard}>
        {/* HEADER */}
        <header style={header}>
          <h2>💧 ReWater Admin Dashboard</h2>
          <div>
            <select
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
              style={select}
            >
              <option value="all">All roles</option>
              <option value="customer">Customer</option>
              <option value="vendor">Vendor</option>
              <option value="admin">Admin</option>
            </select>
            <button onClick={logout} style={logoutBtn}>Logout</button>
          </div>
        </header>

        {/* CORE STATS */}
        <section style={statsGrid}>
          <StatCard label="Total Users" value={stats.totalUsers} />
          <StatCard label="Customers" value={stats.customers} />
          <StatCard label="Vendors" value={stats.vendors} />
          <StatCard label="Pending Vendors" value={stats.pendingVendors} />
        </section>

        {/* PLATFORM REVENUE */}
        <section style={glassCard}>
          <h3>💰 Platform Revenue Analytics</h3>
          <p>Today: ৳ {revenue?.todayRevenue}</p>
          <p>This Month: ৳ {revenue?.monthRevenue}</p>
          <p>All Time: ৳ {revenue?.totalRevenue}</p>
        </section>

        {/* WALLET EFFICIENCY */}
        <section style={glassCard}>
          <h3>💳 Wallet Code Efficiency</h3>
          <p>Total Codes: {walletStats?.totalCodes}</p>
          <p>Redeemed: {walletStats?.redeemedCodes} ({walletStats?.redemptionRate}%)</p>
          <p>Unused Value: ৳ {walletStats?.unusedValue}</p>
        </section>

        {/* VENDOR PERFORMANCE */}
        <section style={glassCard}>
          <h3>🏆 Vendor Performance Score</h3>
          <table style={table}>
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Rating</th>
                <th>Orders</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {vendorScores.map(v => (
                <tr key={v.vendorId}>
                  <td>{v.name}</td>
                  <td>{v.avgRating}</td>
                  <td>{v.completedOrders}</td>
                  <td>{v.score}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* FRAUD ALERTS */}
        <section style={glassCard}>
          <h3>🚨 Smart Fraud & Abuse Alerts</h3>
          {alerts.length === 0 ? (
            <p>No suspicious activity detected</p>
          ) : (
            alerts.map((a, i) => (
              <p key={i}>⚠️ {a.message}</p>
            ))
          )}
        </section>

        {/* WALLET CODE GENERATOR */}
        <section style={glassCard}>
          <h3>💳 Generate Wallet Redeem Code</h3>
          <input
            type="number"
            placeholder="Amount (BDT)"
            value={redeemAmount}
            onChange={e => setRedeemAmount(e.target.value)}
            style={input}
          />
          <button style={primaryBtn} onClick={generateWalletCode}>
            Generate Code
          </button>

          {generatedCode && (
            <div style={codeBox}>
              <b>Generated Code:</b>
              <div style={codeText}>{generatedCode}</div>
            </div>
          )}
        </section>

        {/* WALLET CODES LIST */}
        <section style={glassCard}>
          <h3>🔐 Wallet Redeem Codes</h3>
          <table style={table}>
            <thead>
              <tr>
                <th>Code</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Used By</th>
              </tr>
            </thead>
            <tbody>
              {walletCodes.map(c => (
                <tr key={c._id}>
                  <td>{c.code}</td>
                  <td>৳{c.amount}</td>
                  <td style={{ color: c.isUsed ? '#ff7676' : '#00e3ae' }}>
                    {c.isUsed ? 'Used' : 'Unused'}
                  </td>
                  <td>{c.usedBy?.phone || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* USERS */}
        <section style={glassCard}>
          <h3>👥 All Users</h3>
          <table style={table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Role</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.phone}</td>
                  <td>{u.address || '—'}</td>
                  <td>{u.role}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* PENDING VENDORS */}
        <section style={glassCard}>
          <h3>⏳ Pending Vendor Approvals</h3>
          {pendingVendors.length === 0 ? (
            <p>No pending vendors</p>
          ) : (
            <table style={table}>
              <tbody>
                {pendingVendors.map(v => (
                  <tr key={v._id}>
                    <td>{v.name}</td>
                    <td>{v.phone}</td>
                    <td>{v.address}</td>
                    <td>
                      <button
                        style={primaryBtn}
                        onClick={() => approveVendor(v._id)}
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}

/* SMALL COMPONENT */
const StatCard = ({ label, value }) => (
  <div style={statCard}>
    <p style={{ opacity: 0.8 }}>{label}</p>
    <h2>{value}</h2>
  </div>
);

/* ================= STYLES ================= */

const page = { minHeight: '100vh', position: 'relative', fontFamily: 'Tahoma' };
const videoBg = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' };
const overlay = { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)' };

const dashboardCard = {
  position: 'relative',
  zIndex: 2,
  maxWidth: 1400,
  margin: '40px auto',
  padding: 30,
  borderRadius: 22,
  background: 'rgba(31,30,46,0.75)',
  backdropFilter: 'blur(18px)',
  color: '#fff'
};

const header = { display: 'flex', justifyContent: 'space-between', marginBottom: 25 };
const select = { padding: 8, borderRadius: 8, marginRight: 12, border: 'none' };
const logoutBtn = { padding: '8px 14px', borderRadius: 8, border: 'none', background: '#6c63ff', color: '#fff' };

const statsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 20, marginBottom: 30 };
const statCard = { background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(14px)', padding: 20, borderRadius: 16 };

const glassCard = { background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(16px)', borderRadius: 18, padding: 20, marginBottom: 25 };
const input = { width: '260px', padding: 8, borderRadius: 6, border: 'none', marginBottom: 10 };
const primaryBtn = { padding: '8px 14px', borderRadius: 6, border: 'none', background: '#6c63ff', color: '#fff', cursor: 'pointer' };

const table = { width: '100%', borderCollapse: 'collapse' };
const codeBox = { marginTop: 10, padding: 10, background: 'rgba(0,0,0,0.25)', borderRadius: 8 };
const codeText = { fontSize: 18, letterSpacing: 1 };
