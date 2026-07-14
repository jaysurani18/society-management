import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Login from '../pages/auth/Login.jsx';
import AdminDashboard from '../pages/admin/AdminDashboard.jsx';
import CommitteeDashboard from '../pages/committee/CommitteeDashboard.jsx';
import ResidentDashboard from '../pages/resident/ResidentDashboard.jsx';
import RequestDetails from '../pages/resident/RequestDetails.jsx';
import ResidentComplaints from '../pages/resident/ResidentComplaints.jsx';
import ComplaintDetails from '../pages/shared/ComplaintDetails.jsx';
import ProfileSettings from '../pages/shared/ProfileSettings.jsx';

// Role Guard Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-900 font-medium text-sm">
        Initializing session...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Prevent out-of-bounds access by redirecting the user to their actual role dashboard
    if (user.role === 'ADMIN') return <Navigate to="/admin/dashboard" replace />;
    if (user.role === 'COMMITTEE') return <Navigate to="/committee/dashboard" replace />;
    return <Navigate to="/resident/dashboard" replace />;
  }

  return children;
};

export default function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      {/* Public / Auth Gate */}
      <Route
        path="/login"
        element={
          !user ? (
            <Login />
          ) : user.role === 'ADMIN' ? (
            <Navigate to="/admin/dashboard" replace />
          ) : user.role === 'COMMITTEE' ? (
            <Navigate to="/committee/dashboard" replace />
          ) : (
            <Navigate to="/resident/dashboard" replace />
          )
        }
      />

      {/* Protected Dashboards */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/committee/dashboard"
        element={
          <ProtectedRoute allowedRoles={['COMMITTEE']}>
            <CommitteeDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/committee/requests/:id"
        element={
          <ProtectedRoute allowedRoles={['COMMITTEE']}>
            <RequestDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resident/dashboard"
        element={
          <ProtectedRoute allowedRoles={['RESIDENT']}>
            <ResidentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resident/complaints"
        element={
          <ProtectedRoute allowedRoles={['RESIDENT']}>
            <ResidentComplaints />
          </ProtectedRoute>
        }
      />

      <Route
        path="/resident/requests/:id"
        element={
          <ProtectedRoute allowedRoles={['RESIDENT']}>
            <RequestDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/complaints/:id"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'COMMITTEE', 'RESIDENT']}>
            <ComplaintDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={['ADMIN', 'COMMITTEE', 'RESIDENT']}>
            <ProfileSettings />
          </ProtectedRoute>
        }
      />

      {/* Fallback Catch-all Route */}
      <Route
        path="*"
        element={
          user ? (
            user.role === 'ADMIN' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : user.role === 'COMMITTEE' ? (
              <Navigate to="/committee/dashboard" replace />
            ) : (
              <Navigate to="/resident/dashboard" replace />
            )
          ) : (
            <Navigate to="/login" replace />
          )
        }
      />
    </Routes>
  );
}
