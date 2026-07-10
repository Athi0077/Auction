import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://auction-b1mv.onrender.com';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [mode, setMode] = useState(localStorage.getItem('mode') || 'bidder'); // 'bidder' or 'auctioneer'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Validate token on mount
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`${BACKEND_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setUser(data);
        } else {
          // Token expired or invalid
          logout();
        }
      } catch (err) {
        console.error('Failed to verify token', err);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser({
        _id: data._id,
        username: data.username,
        email: data.email,
        role: data.role,
        isAdmin: data.isAdmin,
      });
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const register = async (username, email, password, phone) => {
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, phone }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser({
        _id: data._id,
        username: data.username,
        email: data.email,
        phone: data.phone,
        role: data.role,
        isAdmin: data.isAdmin,
      });
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken('');
    setUser(null);
    setError(null);
  };

  const toggleMode = () => {
    const newMode = mode === 'bidder' ? 'auctioneer' : 'bidder';
    localStorage.setItem('mode', newMode);
    setMode(newMode);
  };

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem('wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const toggleWishlist = (itemId) => {
    setWishlist((prev) => {
      const updated = prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId];
      localStorage.setItem('wishlist', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        mode,
        loading,
        error,
        login,
        register,
        logout,
        toggleMode,
        setError,
        wishlist,
        toggleWishlist,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
