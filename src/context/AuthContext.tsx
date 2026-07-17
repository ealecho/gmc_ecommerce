import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authClient } from '../lib/neonClient';
import { apiRequest, setAccessTokenProvider } from '../lib/api';
import { UserProfile } from '../types';

export interface AuthContextType {
  authClient: any;
  isConfigured: boolean;
  isLoading: boolean;
  session: any;
  user: any;
  profile: UserProfile | null;
  isAdmin: boolean;
  refreshSession: () => Promise<any>;
  refreshProfile: () => Promise<UserProfile | null>;
  getAccessToken: () => Promise<string | null>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const sessionUser = (session: any) => session?.user || session?.data?.user || session?.session?.user || null;

const sessionToken = (session: any) =>
  session?.accessToken ||
  session?.access_token ||
  session?.token ||
  session?.session?.token ||
  session?.session?.accessToken ||
  session?.session?.access_token ||
  session?.data?.accessToken ||
  session?.data?.access_token ||
  session?.data?.session?.token ||
  session?.data?.session?.accessToken ||
  session?.data?.session?.access_token ||
  null;

export const useAuth = () => {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return value;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(authClient));
  const currentUser = useMemo(() => sessionUser(session), [session]);
  const currentUserId = currentUser?.id || currentUser?.sub || null;

  const refreshSession = useCallback(async () => {
    if (!authClient?.getSession) {
      setIsLoading(false);
      return null;
    }

    const currentSession = await authClient.getSession();
    setSession(currentSession);
    setIsLoading(false);
    return currentSession;
  }, []);

  const getAccessToken = useCallback(async () => {
    // Neon Auth (Better Auth) keeps the raw JWT on the session at
    // data.session.token, and the token is short-lived (~15 min). After an
    // external redirect (e.g. returning from Mayar payment) any in-memory token
    // may be stale, so always fetch a FRESH session and read the token from it
    // rather than trusting cached React state.
    const client = authClient as any;

    // Preferred: the dedicated /token endpoint, exposed as authClient.token().
    try {
      const result = await client?.token?.();
      const token = result?.data?.token || result?.token || null;
      if (token) return token;
    } catch {
      // Fall through.
    }

    // Fallback: a fresh getSession() carries the JWT at data.session.token.
    try {
      const fresh = await client?.getSession?.();
      const token = sessionToken(fresh);
      if (token) return token;
    } catch {
      // Fall through.
    }

    // Last resort: whatever is in the cached session state.
    return sessionToken(session);
  }, [session]);

  const refreshProfile = useCallback(async () => {
    if (!currentUserId) {
      setProfile(null);
      return null;
    }

    const { user } = await apiRequest('/api/me');
    setProfile(user);
    return user;
  }, [currentUserId]);

  useEffect(() => {
    setAccessTokenProvider(getAccessToken);
    return () => setAccessTokenProvider(null);
  }, [getAccessToken]);

  useEffect(() => {
    let isMounted = true;

    refreshSession().catch(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    });

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshSession().catch(() => {});
      }
    };

    window.addEventListener('focus', refreshSession);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      window.removeEventListener('focus', refreshSession);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshSession]);

  useEffect(() => {
    refreshProfile().catch(() => setProfile(null));
  }, [refreshProfile]);

  const signOut = useCallback(async () => {
    await authClient?.signOut?.();
    setSession(null);
    setProfile(null);
  }, []);

  const value = useMemo(
    () => ({
      authClient,
      isConfigured: Boolean(authClient),
      isLoading,
      session,
      user: currentUser,
      profile,
      isAdmin: profile?.role === 'admin',
      refreshSession,
      refreshProfile,
      getAccessToken,
      signOut,
    }),
    [currentUser, getAccessToken, isLoading, profile, refreshProfile, refreshSession, session, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
