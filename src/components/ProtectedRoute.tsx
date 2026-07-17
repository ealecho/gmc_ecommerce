import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) => {
  const { isConfigured, isLoading, user, isAdmin } = useAuth();

  if (!isConfigured) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-bold uppercase mb-4">Auth is not configured</h1>
        <p className="text-gray-500 font-mono max-w-xl">
          Add `VITE_NEON_AUTH_URL` and the server auth environment variables to enable this page.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="min-h-[60vh] flex items-center justify-center font-mono text-sm">Loading account...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-bold uppercase mb-4">Sign in required</h1>
        <p className="text-gray-500 font-mono mb-8">Use your account before accessing this page.</p>
        <Link to="/sign-in" className="bg-black text-white px-8 py-3 rounded-full font-medium uppercase tracking-wide hover:bg-gray-800 transition-colors">
          Sign in
        </Link>
      </div>
    );
  }

  if (adminOnly && !isAdmin) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-bold uppercase mb-4">Admin access required</h1>
        <p className="text-gray-500 font-mono">Your account does not have product management access.</p>
      </div>
    );
  }

  return children;
};

export default ProtectedRoute;
