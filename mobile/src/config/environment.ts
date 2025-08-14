import { Platform } from 'react-native';

// Configuración de entornos
export const ENVIRONMENTS = {
  development: {
    name: 'development',
    apiUrl: Platform.OS === 'web' 
      ? 'http://localhost:3110' 
      : 'http://192.168.9.101:3110',
    timeout: 10000,
    debug: true
  },
  production: {
    name: 'production',
    apiUrl: 'https://api.family.triky.app',
    timeout: 30000,
    debug: false
  }
};

// Cambiar aquí para alternar entre entornos
export const CURRENT_ENVIRONMENT = 'development'; // 'development' | 'production'

// Configuración activa
export const config = ENVIRONMENTS[CURRENT_ENVIRONMENT as keyof typeof ENVIRONMENTS];

// Log de configuración
console.log('🌐 Environment Configuration:', {
  environment: config.name,
  apiUrl: config.apiUrl,
  platform: Platform.OS,
  timeout: config.timeout
});
