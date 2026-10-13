import React, { createContext, useContext, useState, useEffect } from 'react';
import { onIdTokenChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './firebase';
import { apiUrl } from './api';

export type User = {
  id: number;
  email: string;
  class_level?: string;
  board?: string;
  is_2fa_enabled?: boolean;
  username?: string;
  uid?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  requires2FA: boolean;
  setRequires2FA: (val: boolean) => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
  syncUser: (token: string) => Promise<{user: User, requires2FA: boolean}>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CACHED_USER_KEY = 'studyos_cached_user';
const CACHED_TOKEN_KEY = 'token';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Synchronously initialize from localStorage to eliminate white flash and stay logged in
  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem(CACHED_TOKEN_KEY);
    } catch {
      return null;
    }
  });

  const [user, setUser] = useState<User | null>(() => {
    try {
      const cached = localStorage.getItem(CACHED_USER_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });

  // If token is already in localStorage, don't block render with loading spinner
  const [loading, setLoading] = useState<boolean>(() => {
    try {
      return !localStorage.getItem(CACHED_TOKEN_KEY);
    } catch {
      return true;
    }
  });

  const [requires2FA, setRequires2FA] = useState(false);

  const syncUser = async (authToken: string): Promise<{user: User, requires2FA: boolean}> => {
    const res = await fetch(apiUrl('/api/user/me'), {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    
    if (!res.ok) {
      let errMsg = 'Failed to sync user';
      try {
        const errJson = await res.json();
        errMsg = errJson.error || errMsg;
      } catch {}
      throw new Error(errMsg);
    }

    const data = await res.json();
    
    setRequires2FA(data.requires2FA);
    if (!data.requires2FA && data.user) {
      const fullUser: User = { ...data.user, uid: auth.currentUser?.uid };
      setUser(fullUser);
      try {
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(fullUser));
      } catch (e) {
        console.error('Failed to cache user profile in localStorage:', e);
      }
    } else if (data.requires2FA) {
      setUser(null);
    }
    return data;
  };

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const authToken = await firebaseUser.getIdToken();
          setToken(authToken);
          localStorage.setItem(CACHED_TOKEN_KEY, authToken);

          try {
            await syncUser(authToken);
          } catch (syncError) {
            // CRITICAL: If backend sync fails (offline/slow connection), keep existing session!
            // Never wipe user credentials on network sync errors.
            console.warn('[AuthContext] Background user profile sync failed, retaining cached profile:', syncError);
          }
        } catch (error) {
          console.error('[AuthContext] Error getting refreshed ID token:', error);
        }
      } else {
        // Only clear credentials if user explicitly signed out and auth has completed
        if (!auth.currentUser && !localStorage.getItem(CACHED_TOKEN_KEY)) {
          setUser(null);
          setToken(null);
          localStorage.removeItem(CACHED_TOKEN_KEY);
          localStorage.removeItem(CACHED_USER_KEY);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (e) {
      console.error('Firebase signout error:', e);
    }
    setUser(null);
    setToken(null);
    setRequires2FA(false);
    localStorage.removeItem(CACHED_TOKEN_KEY);
    localStorage.removeItem(CACHED_USER_KEY);
  };

  const updateUser = (data: Partial<User>) => {
    setUser(prev => {
      if (!prev) return null;
      const updated = { ...prev, ...data };
      try {
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to update cached user:', e);
      }
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, requires2FA, setRequires2FA, logout, updateUser, syncUser }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
