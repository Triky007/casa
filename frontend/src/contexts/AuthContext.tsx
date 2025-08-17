import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType, FamilyBasicInfo, LoginResponse } from '../types';
import api from '../utils/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [family, setFamily] = useState<FamilyBasicInfo | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    const storedFamily = localStorage.getItem('family');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      if (storedFamily) {
        setFamily(JSON.parse(storedFamily));
      }

      // Verify token is still valid
      api.get('/api/user/me')
        .then(response => {
          setUser(response.data);
          localStorage.setItem('user', JSON.stringify(response.data));
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string, familyId?: number) => {
    try {
      // Siempre usar el endpoint con familia (más moderno y completo)
      console.log('Using login-with-family endpoint for user:', username, 'family:', familyId || 'none (superadmin)');
      const response = await api.post('/api/user/login-with-family', {
        username,
        password,
        family_id: familyId || null  // null para superadmin, número para usuarios regulares
      });

      const loginData: LoginResponse = response.data;

      setToken(loginData.access_token);
      setUser(loginData.user);
      setFamily(loginData.family || null);

      localStorage.setItem('token', loginData.access_token);
      localStorage.setItem('user', JSON.stringify(loginData.user));
      if (loginData.family) {
        localStorage.setItem('family', JSON.stringify(loginData.family));
        console.log('Login successful with family:', loginData.family.name);
      } else {
        localStorage.removeItem('family');
        console.log('Login successful without family (superadmin)');
      }
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);

      // Mejorar mensajes de error
      if (error.response?.status === 403) {
        throw new Error('No tienes permisos para acceder a esta familia');
      } else if (error.response?.status === 400 && error.response?.data?.detail?.includes('Family')) {
        throw new Error('Debes seleccionar una familia válida');
      } else if (error.response?.status === 401) {
        throw new Error('Usuario o contraseña incorrectos');
      }

      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to clear cookie
      await api.post('/api/user/logout');
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Clear local state regardless of API call result
      setUser(null);
      setFamily(null);
      setToken(null);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('family');
    }
  };

  const value: AuthContextType = {
    user,
    family,
    token,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
