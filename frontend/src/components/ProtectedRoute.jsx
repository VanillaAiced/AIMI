import React from 'react';
import { Navigate, Link } from 'react-router-dom';

// usage: <ProtectedRoute role="admin"><AdminPage/></ProtectedRoute>
const ProtectedRoute = ({ role, children }) => {
  try {
    const raw = localStorage.getItem('user');
    if (!raw) return <Navigate to="/login" replace />;
    const user = JSON.parse(raw);
    // Expect authoritative role to be provided by the server and persisted to localStorage
    const userRole = user.role;
    if (!userRole) return <Navigate to="/login" replace />;
    if (role && userRole !== role) {
      // Show a clear message when the user lacks the required role instead of
      // silently navigating away so they understand why access is denied.
      return (
        <div className="container py-5">
          <div className="alert alert-warning text-center">
            <h5 className="mb-2">Admin Only</h5>
            <p className="mb-3">You don't have permission to access this page. Contact an administrator or sign in with an admin account.</p>
            <div>
              <Link to="/" className="btn btn-primary me-2">Home</Link>
              <Link to="/login" className="btn btn-secondary">Sign in</Link>
            </div>
          </div>
        </div>
      );
    }
    return children;
  } catch (e) {
    return <Navigate to="/login" replace />;
  }
};

export default ProtectedRoute;
