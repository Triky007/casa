import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
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
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken = await SecureStore.getItemAsync('token');
      const storedUser = await SecureStore.getItemAsync('user');
      const storedFamily = await SecureStore.getItemAsync('family');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        if (storedFamily) {
          setFamily(JSON.parse(storedFamily));
        }

        // Verify token is still valid
        try {
          const response = await api.get('/api/user/me');
          setUser(response.data);
          await SecureStore.setItemAsync('user', JSON.stringify(response.data));
        } catch (error) {
          console.error('Token validation failed:', error);
          await logout();
        }
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string, familyId?: number) => {
    try {
      console.log('Attempting login with:', { username, familyId, baseURL: api.defaults.baseURL });

      let response;

      if (familyId !== undefined) {
        // Usar el nuevo endpoint con familia
        console.log('Using login-with-family endpoint...');
        response = await api.post('/api/user/login-with-family', {
          username,
          password,
          family_id: familyId
        });
      } else {
        // Usar el endpoint tradicional (para compatibilidad)
        console.log('Using traditional login endpoint...');
        const formData = new FormData();
        formData.append('username', username);
        formData.append('password', password);

        response = await api.post('/api/user/login', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      console.log('Login response received:', response.status);
      const loginData: LoginResponse = response.data;

      setToken(loginData.access_token);
      setUser(loginData.user);
      setFamily(loginData.family || null);

      await SecureStore.setItemAsync('token', loginData.access_token);
      await SecureStore.setItemAsync('user', JSON.stringify(loginData.user));
      if (loginData.family) {
        await SecureStore.setItemAsync('family', JSON.stringify(loginData.family));
      } else {
        await SecureStore.deleteItemAsync('family');
      }

      console.log('Login successful for user:', loginData.user.username, 'Family:', loginData.family?.name || 'None');
    } catch (error: any) {
      console.error('Login failed:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      setFamily(null);
      setToken(null);
      await SecureStore.deleteItemAsync('token');
      await SecureStore.deleteItemAsync('user');
      await SecureStore.deleteItemAsync('family');
    } catch (error) {
      console.error('Error during logout:', error);
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
