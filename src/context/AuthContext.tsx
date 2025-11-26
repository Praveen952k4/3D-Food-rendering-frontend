import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { verifyOTP as verifyOTPApi } from '../services/api';

interface User {
  id: string;
  phone: string;
  name: string;
  email: string;
  role: 'customer' | 'admin';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (phone: string, otp: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Load from localStorage on mount
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = async (phone: string, otp: string) => {
    try {
      const response = await verifyOTPApi(phone, otp);
      const { token: newToken, user: newUser } = response.data;

      setToken(newToken);
      setUser(newUser);

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(newUser));
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    token,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
