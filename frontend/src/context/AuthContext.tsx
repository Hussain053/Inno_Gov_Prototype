import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, UserRole } from '../types';
import authService from '../services/authService';

import { DEMO_ACCOUNTS } from '../mock/demoAccounts';

interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: () => boolean;
  refreshUser: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('innogov_token'));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('innogov_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const role = user?.role || null;

  const refreshUser = useCallback(async (): Promise<User | null> => {
    const currentToken = localStorage.getItem('innogov_token');
    if (!currentToken) {
      setUser(null);
      setIsLoading(false);
      return null;
    }

    // Upgrade any cached demo session to a real backend session when the API is reachable.
    if (currentToken.startsWith('demo_token_')) {
      const saved = localStorage.getItem('innogov_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const demoPersona = Object.values(DEMO_ACCOUNTS).find(
            (acc) => acc.email.toLowerCase() === parsed.email?.toLowerCase()
          );

          if (demoPersona) {
            try {
              const tokenData = await authService.login(demoPersona.email, demoPersona.password);
              localStorage.setItem('innogov_token', tokenData.access_token);
              setToken(tokenData.access_token);

              const userData = await authService.getMe();
              setUser(userData);
              localStorage.setItem('innogov_user', JSON.stringify(userData));
              setIsLoading(false);
              return userData;
            } catch (loginErr) {
              console.warn('Failed to upgrade cached demo session to real backend session:', loginErr);
              setUser(parsed);
              setIsLoading(false);
              return parsed;
            }
          }
        } catch {
          // Fall through to the normal cached-user handling below.
        }
      }
    }

    try {
      const userData = await authService.getMe();
      setUser(userData);
      localStorage.setItem('innogov_user', JSON.stringify(userData));
      return userData;
    } catch (err) {
      console.warn('Failed to refresh user profile from backend:', err);

      const saved = localStorage.getItem('innogov_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const demoPersona = Object.values(DEMO_ACCOUNTS).find(
            (acc) => acc.email.toLowerCase() === parsed.email?.toLowerCase()
          );

          if (demoPersona) {
            try {
              const tokenData = await authService.login(demoPersona.email, demoPersona.password);
              localStorage.setItem('innogov_token', tokenData.access_token);
              setToken(tokenData.access_token);

              const refreshedUser = await authService.getMe();
              setUser(refreshedUser);
              localStorage.setItem('innogov_user', JSON.stringify(refreshedUser));
              return refreshedUser;
            } catch {
              // If demo re-login is unavailable, fall back to cached user.
            }
          }

          setUser(parsed);
          return parsed;
        } catch {}
      }

      localStorage.removeItem('innogov_token');
      localStorage.removeItem('innogov_user');
      setToken(null);
      setUser(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<User> => {
    setIsLoading(true);
    try {
      const tokenData = await authService.login(email, password);
      localStorage.setItem('innogov_token', tokenData.access_token);
      setToken(tokenData.access_token);

      const userData = await authService.getMe();
      setUser(userData);
      localStorage.setItem('innogov_user', JSON.stringify(userData));
      return userData;
    } catch (err: any) {
      // Offline fallback: if backend is unreachable, check if this is a known demo persona
      const isNetworkError = !err.response || err.code === 'ERR_NETWORK' || err.message?.includes('Network Error');
      const demoPersona = Object.values(DEMO_ACCOUNTS).find(
        (acc) => acc.email.toLowerCase() === email.trim().toLowerCase()
      );

      if (isNetworkError && demoPersona) {
        console.info(`Backend offline. Activating offline demo persona for ${demoPersona.role}`);
        const mockUser: User = {
          id: demoPersona.role === 'STARTUP' ? 1 : demoPersona.role === 'GOVERNMENT' ? 2 : demoPersona.role === 'EVALUATOR' ? 3 : 4,
          name: demoPersona.roleName,
          email: demoPersona.email,
          role: demoPersona.role,
          organization: demoPersona.organization,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        const demoToken = `demo_token_${demoPersona.role.toLowerCase()}`;
        localStorage.setItem('innogov_token', demoToken);
        localStorage.setItem('innogov_user', JSON.stringify(mockUser));
        setToken(demoToken);
        setUser(mockUser);
        return mockUser;
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('innogov_token');
    localStorage.removeItem('innogov_user');
    setToken(null);
    setUser(null);
    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  };

  const isAuthenticated = (): boolean => {
    return !!token && !!user;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        isLoading,
        login,
        logout,
        isAuthenticated,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
