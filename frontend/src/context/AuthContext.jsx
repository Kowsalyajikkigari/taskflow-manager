import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* On mount, try to fetch profile with existing token */
  useEffect(() => {
    const token = localStorage.getItem('access');
    if (!token) {
      setLoading(false);
      return;
    }

    api
      .get('/auth/profile/')
      .then((res) => setUser(res.data))
      .catch(() => {
        localStorage.removeItem('access');
        localStorage.removeItem('refresh');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (username, password) => {
    const { data } = await api.post('/auth/login/', {
      username,
      password,
    });
    localStorage.setItem('access', data.access);
    localStorage.setItem('refresh', data.refresh);
    const profile = await api.get('/auth/profile/');
    setUser(profile.data);
  };

  const register = async (username, password, password_confirm, email) => {
    await api.post('/auth/register/', {
      username,
      password,
      password_confirm,
      email,
    });
    // Auto-login after registration
    return login(username, password);
  };

  const logout = () => {
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside <AuthProvider>');
  return ctx;
}
