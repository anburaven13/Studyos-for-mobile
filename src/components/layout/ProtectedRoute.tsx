import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute() {
  const { user, token, requires2FA } = useAuth();

  if (requires2FA) {
    return <Navigate to="/login" replace />;
  }

  if (token && user === null) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (token && user && !user.class_level) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
}
