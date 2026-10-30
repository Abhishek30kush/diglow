import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Flame } from 'lucide-react';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-cream-100 flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-burgundy-900 flex items-center justify-center border border-gold-500 animate-spin">
          <Flame className="w-6 h-6 text-gold-400" />
        </div>
        <p className="font-serif text-sm font-semibold text-burgundy-900 tracking-wider">
          Verifying DiGlow Admin Session...
        </p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location }} replace />;
  }

  return children;
}
