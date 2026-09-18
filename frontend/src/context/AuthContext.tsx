import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, UserRole } from '../types';
import authService from '../services/authService';


interface AuthContextType {
  user: User | null;
  token: string | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (email: string, password: string, expectedRole?: UserRole) => Promise<User>;
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

  const login = async (email: string, password: string, expectedRole?: UserRole): Promise<User> => {
    setIsLoading(true);
    try {
      const tokenData = await authService.login(email, password);
      localStorage.setItem('innogov_token', tokenData.access_token);
      const userData = await authService.getMe();

      if (expectedRole && userData.role !== expectedRole) {
        localStorage.removeItem('innogov_token');
        localStorage.removeItem('innogov_user');
        setToken(null);
        setUser(null);
        throw new Error(`These credentials belong to the ${userData.role.toLowerCase()} portal.`);
      }

      setToken(tokenData.access_token);
      setUser(userData);
      localStorage.setItem('innogov_user', JSON.stringify(userData));
      return userData;
    } catch (err: any) {
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
