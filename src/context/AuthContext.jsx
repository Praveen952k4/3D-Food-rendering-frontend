import React, { createContext, useContext, useState } from 'react';
import { verifyOTP as verifyOTPApi } from '../services/api';

const AuthContext = createContext(undefined);

// Read the saved session before the first render. Restoring it in an effect
// instead meant the first render always looked signed out, so opening or
// refreshing any deep link bounced the user to their default page.
const storedSession = () => {
  try {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (!token || !user) return { token: null, user: null };
    return { token, user: JSON.parse(user) };
  } catch {
    return { token: null, user: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [session] = useState(storedSession);
  const [user, setUser] = useState(session.user);
  const [token, setToken] = useState(session.token);

  const login = async (phone, otp) => {
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

  const updateUser = (updatedUser) => {
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
