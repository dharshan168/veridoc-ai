import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthState, Officer } from '../types';
import { authApi, getStoredOfficer, getToken, isDemoMode } from '../services/api';

interface AuthContextType extends AuthState {
  login: (officerId: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    officer: null,
    token: null,
    demoMode: false,
    isAuthenticated: false,
  });

  useEffect(() => {
    const token = getToken();
    const officer = getStoredOfficer();
    if (token && officer) {
      setState({ officer, token, demoMode: isDemoMode(), isAuthenticated: true });
    }
  }, []);

  const login = async (officerId: string, password: string) => {
    const res = await authApi.login(officerId, password);
    setState({ officer: res.officer, token: res.token, demoMode: res.demoMode, isAuthenticated: true });
  };

  const logout = () => {
    authApi.logout();
    setState({ officer: null, token: null, demoMode: false, isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
