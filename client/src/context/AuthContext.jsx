import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api.js';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Admin State
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('diglow_admin_token'));
  const [adminLoading, setAdminLoading] = useState(true);

  // Customer State
  const [customer, setCustomer] = useState(null);
  const [customerToken, setCustomerToken] = useState(() =>
    localStorage.getItem('diglow_customer_token')
  );
  const [customerLoading, setCustomerLoading] = useState(true);

  // Verify Admin Session
  useEffect(() => {
    async function verifyAdminSession() {
      if (!token) {
        setAdmin(null);
        setAdminLoading(false);
        return;
      }

      try {
        const res = await api.getAdminProfile();
        if (res.success && res.admin) {
          setAdmin(res.admin);
        } else {
          logoutAdmin();
        }
      } catch (err) {
        logoutAdmin();
      } finally {
        setAdminLoading(false);
      }
    }

    verifyAdminSession();
  }, [token]);

  // Verify Customer Session
  useEffect(() => {
    async function verifyCustomerSession() {
      if (!customerToken) {
        setCustomer(null);
        setCustomerLoading(false);
        return;
      }

      try {
        const res = await api.getCustomerProfile();
        if (res.success && res.user) {
          setCustomer(res.user);
        } else {
          logoutCustomer();
        }
      } catch (err) {
        logoutCustomer();
      } finally {
        setCustomerLoading(false);
      }
    }

    verifyCustomerSession();
  }, [customerToken]);

  // Admin Actions
  const loginAdmin = async (email, password) => {
    const res = await api.adminLogin({ email, password });
    if (res.success && res.token) {
      localStorage.setItem('diglow_admin_token', res.token);
      setToken(res.token);
      setAdmin(res.admin);
      return res;
    }
    throw new Error(res.message || 'Login failed.');
  };

  const logoutAdmin = () => {
    localStorage.removeItem('diglow_admin_token');
    setToken(null);
    setAdmin(null);
  };

  // Customer Actions
  const loginCustomer = async (email, password) => {
    const res = await api.customerLogin({ email, password });
    if (res.success && res.token) {
      localStorage.setItem('diglow_customer_token', res.token);
      setCustomerToken(res.token);
      setCustomer(res.user);
      return res;
    }
    throw new Error(res.message || 'Login failed.');
  };

  const registerCustomer = async (formData) => {
    const res = await api.customerRegister(formData);
    if (res.success && res.token) {
      localStorage.setItem('diglow_customer_token', res.token);
      setCustomerToken(res.token);
      setCustomer(res.user);
      return res;
    }
    throw new Error(res.message || 'Registration failed.');
  };

  const logoutCustomer = () => {
    localStorage.removeItem('diglow_customer_token');
    setCustomerToken(null);
    setCustomer(null);
  };

  const refreshCustomerProfile = async () => {
    try {
      const res = await api.getCustomerProfile();
      if (res.success && res.user) {
        setCustomer(res.user);
      }
    } catch (err) {
      console.warn('Failed to refresh customer profile:', err.message);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        // Admin
        admin,
        token,
        isAuthenticated: !!admin,
        loading: adminLoading,
        login: loginAdmin,
        logout: logoutAdmin,

        // Customer
        customer,
        customerToken,
        isCustomerAuthenticated: !!customer,
        customerLoading,
        loginCustomer,
        registerCustomer,
        logoutCustomer,
        refreshCustomerProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
