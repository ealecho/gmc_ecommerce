import React from 'react';
import { AuthView } from '@neondatabase/auth-ui';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
  const location = useLocation();
  const path = location.pathname.split('/').filter(Boolean).pop() || 'sign-in';
  const { isConfigured } = useAuth();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-12">
      <Link to="/" className="text-2xl font-bold tracking-tighter uppercase mb-8">
        KITENGI
      </Link>

      <div className="auth-card w-full max-w-md rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
        {isConfigured ? (
          <AuthView path={path} />
        ) : (
          <div className="text-center">
            <h1 className="text-2xl font-bold uppercase mb-3">Neon Auth needed</h1>
            <p className="font-mono text-sm text-gray-500">
              Set `VITE_NEON_AUTH_URL` and `VITE_NEON_DATA_API_URL` before using sign-in or sign-up.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuthPage;
