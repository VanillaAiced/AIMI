import React from 'react';
import { Navigate } from 'react-router-dom';

// usage: <ProtectedRoute role="admin"><AdminPage/></ProtectedRoute>
const ProtectedRoute = ({ role, children }) => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return <Navigate to="/login" replace />;
    const user = JSON.parse(raw);
    const userRole = user.role || 'student';
    if (role && userRole !== role) return <Navigate to="/" replace />;
    return children;
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
