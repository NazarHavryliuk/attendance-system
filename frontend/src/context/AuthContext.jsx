import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setUser(null);
      setStudentProfile(null);
      setLoading(false);
      return;
    }

    try {
      const response = await authApi.me();
      setUser(response.data.data.user);
      setStudentProfile(response.data.data.studentProfile || null);
    } catch (error) {
      localStorage.removeItem('token');
      setUser(null);
      setStudentProfile(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMe();
  }, []);

  const login = async (email, password) => {
    const response = await authApi.login({ email, password });
    localStorage.setItem('token', response.data.data.token);
    await loadMe();
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setStudentProfile(null);
  };

  const value = useMemo(
    () => ({
      user,
      studentProfile,
      loading,
      login,
      logout,
      refreshProfile: loadMe,
      isAuthenticated: Boolean(user),
    }),
    [user, studentProfile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
