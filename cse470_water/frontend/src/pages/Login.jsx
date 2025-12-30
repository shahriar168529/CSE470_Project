import React, { useState } from 'react';
import API from '../services/api';

import logo from '../assets/logo.png';
import bg from '../assets/login-bg.jpg';
import waterVideo from '../assets/Liquid Water Drop Background for Title Animation.mp4';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /* ================= SEND OTP ================= */
  const sendOtp = async () => {
    if (!phone.trim()) {
      setError('Please enter phone number');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await API.post('/auth/otp', { phone: phone.trim() });
      setStep('otp');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  /* ================= VERIFY OTP ================= */
  const verifyOtp = async () => {
    if (!otp.trim()) {
      setError('Please enter OTP');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await API.post('/auth/verify', {
        phone: phone.trim(),
        otp: otp.trim()
      });

      const { token, user } = res.data;
      localStorage.setItem('token', token);
      localStorage.setItem('role', user.role);

      window.location.href =
        user.role === 'admin'
          ? '/admin'
          : user.role === 'vendor'
          ? '/vendor'
          : '/';
    } catch (err) {
      setError(err.response?.data?.error || 'OTP verification failed');
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
            Build a cleaner,<br />greener future
          </h2>

          <div style={subtitleBadge}>
            Smart <br />Reusable Water System
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div style={rightPanel}>
          <h2 style={formTitle}>
            {step === 'phone' ? 'Login' : 'Verify OTP'}
          </h2>

          <p style={formSubtitle}>
            {step === 'phone'
              ? 'Enter your phone number to continue'
              : 'Enter the OTP sent to your phone'}
          </p>

          {error && <div style={errorBox}>{error}</div>}

          {step === 'phone' && (
            <>
              <input
                style={input}
                placeholder="Phone number"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                disabled={loading}
              />

              <button style={button} onClick={sendOtp} disabled={loading}>
                {loading ? 'Sending OTP...' : 'Send OTP'}
              </button>

              <p style={linkText}>
                New user?{' '}
                <span
                  style={link}
                  onClick={() => (window.location.href = '/register')}
                >
                  Create an account
                </span>
              </p>
            </>
          )}

          {step === 'otp' && (
            <>
              <input
                style={input}
                placeholder="Enter OTP"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                disabled={loading}
              />

              <button style={button} onClick={verifyOtp} disabled={loading}>
                {loading ? 'Verifying...' : 'Login'}
              </button>

              <p style={back} onClick={() => setStep('phone')}>
                ← Change phone number
              </p>
            </>
          )}
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
  background: 'rgba(0,0,0,0.55)',
  zIndex: 1
};

/* MAIN CONTAINER */
const authBox = {
  display: 'flex',
  width: 900,
  height: 520,
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
  fontSize: 28,
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
  color: '#fff',
  letterSpacing: '0.5px',
  lineHeight: '1.3'
};

/* RIGHT PANEL */
const rightPanel = {
  flex: 1,
  padding: 50,
  background: 'rgba(24, 58, 78, 0.95)', // 🌊 water-matching card color
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

const back = {
  marginTop: 12,
  fontSize: 13,
  cursor: 'pointer',
  opacity: 0.85
};
