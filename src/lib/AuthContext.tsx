import React, { createContext, useContext, useState, useEffect } from 'react';
import { onIdTokenChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from './firebase';

type User = {
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

  const [loading, setLoading] = useState<boolean>(() => {
    try {
      return !localStorage.getItem(CACHED_TOKEN_KEY);
    } catch {
      return true;
    }
  });

  const [requires2FA, setRequires2FA] = useState(false);

  const syncUser = async (authToken: string): Promise<{user: User, requires2FA: boolean}> => {
    const res = await fetch('/api/user/me', {
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    const data = await res.json();
    if (!res.ok) {
      const error: any = new Error(data.error || 'Failed to sync user');
      error.status = res.status;
      throw error;
    }
    
    setRequires2FA(data.requires2FA);
    if (!data.requires2FA && data.user) {
      const fullUser = { ...data.user, uid: auth.currentUser?.uid };
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
    if (typeof window !== 'undefined' && localStorage.getItem('studyos_test_mode') === 'true') {
      setLoading(false);
      return;
    }

    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const authToken = await firebaseUser.getIdToken();
          setToken(authToken);
          localStorage.setItem('token', authToken);
          await syncUser(authToken);
        } catch (error: any) {
          console.error('Error syncing user:', error);
          // Only wipe session if the token was explicitly invalid / unauthorized (401/403)
          if (error?.status === 401 || error?.status === 403) {
            setUser(null);
            setToken(null);
            localStorage.removeItem('token');
            localStorage.removeItem(CACHED_USER_KEY);
          } else {
            // Keep existing cached session on network hiccups / database cold start
            try {
              const cached = localStorage.getItem(CACHED_USER_KEY);
              if (cached) setUser(JSON.parse(cached));
            } catch {}
          }
        }
      } else {
        setUser(null);
        setToken(null);
        localStorage.removeItem('token');
        localStorage.removeItem(CACHED_USER_KEY);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem(CACHED_USER_KEY);
  };

  const updateUser = (data: Partial<User>) => {
    setUser(prev => {
      const updated = prev ? { ...prev, ...data } : null;
      if (updated) {
        try {
          localStorage.setItem(CACHED_USER_KEY, JSON.stringify(updated));
        } catch {}
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
