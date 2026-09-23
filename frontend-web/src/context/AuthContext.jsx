import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/api/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser && token) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, [token]);

  const login = useCallback(async (email, password) => {
    const data = await authService.login(email, password);
    const jwt = data.token;
    // Decode JWT payload to extract role
    const payload = JSON.parse(atob(jwt.split('.')[1]));
    const role = payload['http://schemas.microsoft.com/ws/2008/06/identity/claims/role']
      || payload.role
      || payload.Role
      || 'FieldSales';
    const userName = payload['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name']
      || payload.unique_name
      || payload.name
      || email;

    const userObj = {
      email,
      name: userName,
      role,
      token: jwt,
    };

    localStorage.setItem('token', jwt);
    localStorage.setItem('user', JSON.stringify(userObj));
    setToken(jwt);
    setUser(userObj);
    return userObj;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const hasRole = useCallback(
    (roles) => {
      if (!user) return false;
      if (typeof roles === 'string') return user.role === roles;
      return roles.includes(user.role);
    },
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, hasRole, isAuthenticated: !!token }}>
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

export default AuthContext;
