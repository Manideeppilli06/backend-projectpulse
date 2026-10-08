import { createContext, useContext, useEffect, useState } from 'react';
import { api, TOKEN_KEY, USER_KEY } from '../api/client';

const AuthContext = createContext(null);

function loadStoredUser() {
  try {
    const stored = localStorage.getItem(USER_KEY);
    return stored && localStorage.getItem(TOKEN_KEY) ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(loadStoredUser);

  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener('pp:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('pp:unauthorized', handleUnauthorized);
  }, []);

  function saveSession(response) {
    const profile = { name: response.name, email: response.email };
    localStorage.setItem(TOKEN_KEY, response.token);
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
    setUser(profile);
  }

  async function login(email, password) {
    saveSession(await api('/api/auth/login', { method: 'POST', body: { email, password } }));
  }

  async function register(name, email, password) {
    saveSession(await api('/api/auth/register', { method: 'POST', body: { name, email, password } }));
  }

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}