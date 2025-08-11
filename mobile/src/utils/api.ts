import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Configuración automática de la URL del backend
const getApiUrl = () => {
  // Para producción
  // return 'https://tu-backend-url.com';

  // Para desarrollo
  if (Platform.OS === 'web') {
    // En web usa localhost
    return 'http://localhost:3100';
  } else {
    // En dispositivos móviles - Usar la IP real de la red
    return 'http://192.168.9.101:3100';

    // IPs alternativas si la principal no funciona:
    // return 'http://192.168.248.1:3100';  // VMware adapter
    // return 'http://10.2.0.2:3100';       // ProtonVPN
  }
};

const API_URL = getApiUrl();

export const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 segundos
  // No establecer Content-Type por defecto para permitir FormData
});

// Request interceptor to add auth token
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error getting token from secure store:', error);
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        await SecureStore.deleteItemAsync('token');
        await SecureStore.deleteItemAsync('user');
      } catch (secureStoreError) {
        console.error('Error clearing secure store:', secureStoreError);
      }
      // En React Native, necesitarías navegar a la pantalla de login
      // Esto se manejará en el AuthContext
    }
    return Promise.reject(error);
  }
);

export default api;
