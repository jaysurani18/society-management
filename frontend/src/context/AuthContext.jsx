import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize: Check localStorage for token and fetch profile on boot
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('society_jwt');
      if (token) {
        try {
          // Verify session via the GET /auth/me API
          const response = await api.get('/auth/me');
          if (response.data?.status === 'success' && response.data?.data?.user) {
            setUser(response.data.data.user);
          } else {
            localStorage.removeItem('society_jwt');
          }
        } catch (error) {
          console.error('Session validation check failed:', error.message);
          localStorage.removeItem('society_jwt');
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Login handler
  const login = async (email, password) => {
    setLoading(true);
    try {
      const response = await api.post('/auth/login', { email, password });
      if (response.data?.status === 'success' && response.data?.data?.token) {
        const { token, user: loggedUser } = response.data.data;
        localStorage.setItem('society_jwt', token);
        setUser(loggedUser);
        setLoading(false);
        return { success: true, user: loggedUser };
      } else {
        throw new Error('Unexpected response format during authentication');
      }
    } catch (error) {
      setLoading(false);
      const message = error.response?.data?.message || error.message || 'Login failed';
      return { success: false, error: message };
    }
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('society_jwt');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
