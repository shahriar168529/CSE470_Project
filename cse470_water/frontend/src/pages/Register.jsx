import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';

import logo from '../assets/logo.png';
import bg from '../assets/login-bg.jpg';
import waterVideo from '../assets/Liquid Water Drop Background for Title Animation.mp4';

export default function Register() {
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const register = async () => {
    if (!name || !phone || !address || !role) {
      setError('All fields are required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await API.post('/auth/register', {
        name,
        phone,
        address,
        role
      });

      alert('Registration successful. Please login using OTP.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={page}>
      {/* 🎥 BACKGROUND VIDEO */}
      <video autoPlay muted loop playsInline style={videoBg}>
        <source src={waterVideo} type="video/mp4" />
      </video>

      {/* DARK OVERLAY */}
      <div style={videoOverlay} />

      {/* AUTH CONTAINER */}
      <div style={authBox}>
        {/* LEFT PANEL */}
        <div style={{ ...leftPanel, backgroundImage: `url(${bg})` }}>
          <img src={logo} alt="logo" style={leftLogo} />

          <h2 style={leftTitle}>
            Join us in building<br />a greener future
          </h2>

          <div style={subtitleBadge}>
            Smart <br />Reusable Water System
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={rightPanel}>
          <h2 style={formTitle}>Create Account</h2>

          <p style={formSubtitle}>
            Register to start using the system
          </p>

          {error && <div style={errorBox}>{error}</div>}

          <input
            style={input}
            placeholder="Full name"
            value={name}
            onChange={e => setName(e.target.value)}
            disabled={loading}
          />

          <input
            style={input}
            placeholder="Phone number"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            disabled={loading}
          />

          <input
            style={input}
            placeholder="Address"
            value={address}
            onChange={e => setAddress(e.target.value)}
            disabled={loading}
          />

          <select
            style={input}
            value={role}
            onChange={e => setRole(e.target.value)}
            disabled={loading}
          >
            <option value="customer">Register as Customer</option>
            <option value="vendor">Register as Vendor</option>
          </select>

          <button style={button} onClick={register} disabled={loading}>
            {loading ? 'Registering...' : 'Create Account'}
          </button>

          <p style={linkText}>
            Already registered?{' '}
            <span style={link} onClick={() => navigate('/login')}>
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ================= STYLES ================= */

const page = {
  minHeight: '100vh',
  position: 'relative',
  overflow: 'hidden',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  fontFamily: 'Tahoma, sans-serif'
};

/* VIDEO */
const videoBg = {
  position: 'absolute',
  inset: 0,
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  zIndex: 0
};

const videoOverlay = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(0,0,0,0.6)',
  zIndex: 1
};

/* MAIN CONTAINER */
const authBox = {
  display: 'flex',
  width: 900,
  height: 560,
  borderRadius: 18,
  overflow: 'hidden',
  background: '#1b2e3c',
  boxShadow: '0 40px 90px rgba(0,0,0,0.75)',
  zIndex: 2
};

/* LEFT PANEL */
const leftPanel = {
  flex: 1,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  padding: 30,
  color: '#fff',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-end'
};

const leftLogo = {
  width: 80,
  marginBottom: 'auto'
};

const leftTitle = {
  fontSize: 26,
  fontWeight: 600,
  marginBottom: 12
};

const subtitleBadge = {
  display: 'inline-block',
  padding: '10px 16px',
  borderRadius: 10,
  background: 'rgba(0,0,0,0.45)',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  border: '1px solid rgba(255,255,255,0.6)',
  fontSize: 18,
  fontWeight: 500,
  color: '#ffffff',
  letterSpacing: '0.5px',
  lineHeight: '1.3'
};

/* RIGHT PANEL */
const rightPanel = {
  flex: 1,
  padding: 50,
  background: 'rgba(24, 58, 78, 0.95)', // 🌊 water-matching color
  color: '#fff'
};

const formTitle = {
  fontSize: 28,
  marginBottom: 8
};

const formSubtitle = {
  fontSize: 14,
  opacity: 0.85,
  marginBottom: 30
};

const input = {
  width: '100%',
  padding: 14,
  borderRadius: 8,
  border: 'none',
  marginBottom: 18,
  fontSize: 15,
  fontFamily: 'Tahoma, sans-serif'
};

const button = {
  width: '100%',
  padding: 14,
  borderRadius: 8,
  border: 'none',
  background: 'linear-gradient(135deg, #1f9bbd, #00e3ae)',
  color: '#fff',
  fontSize: 15,
  cursor: 'pointer',
  fontFamily: 'Tahoma, sans-serif'
};

const errorBox = {
  background: 'rgba(255,0,0,0.25)',
  padding: 10,
  borderRadius: 6,
  marginBottom: 15
};

const linkText = {
  marginTop: 18,
  fontSize: 14
};

const link = {
  color: '#00e3ae',
  fontWeight: 600,
  cursor: 'pointer'
};
