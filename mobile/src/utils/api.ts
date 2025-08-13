import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { config } from '../config/environment';

export const api = axios.create({
  baseURL: config.apiUrl,
  timeout: config.timeout,
  // No establecer Content-Type por defecto para permitir FormData
});

// Request interceptor to add auth token
api.interceptors.request.use(async (config) => {
  try {
    const token = await SecureStore.getItemAsync('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log de requests en modo debug
    if (config.debug) {
      console.log('📤 API Request:', {
        method: config.method?.toUpperCase(),
        url: `${config.baseURL}${config.url}`,
        hasAuth: !!token
      });
    }
  } catch (error) {
    console.error('Error getting token from secure store:', error);
  }
  return config;
});

// Response interceptor to handle auth errors and connection issues
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Log del error para debug
    console.error('🚨 API Error:', {
      message: error.message,
      status: error.response?.status,
      url: error.config?.url,
      baseURL: error.config?.baseURL
    });

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

    // Mejorar mensajes de error para timeouts y conexión
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      error.message = 'Timeout: El servidor tardó demasiado en responder. Verifica tu conexión a internet.';
    } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
      error.message = 'Error de red: No se puede conectar al servidor. Verifica tu conexión a internet.';
    }

    return Promise.reject(error);
  }
);

export default api;
