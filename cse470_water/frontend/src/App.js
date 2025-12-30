import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import VendorDashboard from './pages/VendorDashboard';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  return (
    // 🔥 KEY forces remount when token changes
    <Routes key={token || 'guest'}>
      {/* PUBLIC */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* CUSTOMER */}
      <Route
        path="/"
        element={
          token && role === 'customer'
            ? <Dashboard />
            : <Navigate to="/login" replace />
        }
      />

      {/* VENDOR */}
      <Route
        path="/vendor"
        element={
          token && role === 'vendor'
            ? <VendorDashboard />
            : <Navigate to="/login" replace />
        }
      />

      {/* ADMIN */}
      <Route
        path="/admin"
        element={
          token && role === 'admin'
            ? <AdminDashboard />
            : <Navigate to="/login" replace />
        }
      />

      {/* FALLBACK */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
