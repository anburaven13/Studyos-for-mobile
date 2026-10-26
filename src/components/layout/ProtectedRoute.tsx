import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { RootSkeletonLoader } from '../skeletons/PageSkeletons';

export default function ProtectedRoute() {
  const { user, token, loading, requires2FA } = useAuth();

  if (loading) {
    return <RootSkeletonLoader />;
  }

  if (requires2FA) {
    return <Navigate to="/login" replace />;
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (token && user && !user.class_level) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
