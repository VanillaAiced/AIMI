import React from 'react';
import { Navigate } from 'react-router-dom';

// usage: <ProtectedRoute role="admin"><AdminPage/></ProtectedRoute>
const ProtectedRoute = ({ role, children }) => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return <Navigate to="/login" replace />;
    const user = JSON.parse(raw);
    // Expect authoritative role to be provided by the server and persisted to localStorage
    const userRole = user.role;
    if (!userRole) return <Navigate to="/login" replace />;
    if (role && userRole !== role) return <Navigate to="/" replace />;
    return children;
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
