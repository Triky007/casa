import { Platform } from 'react-native';

// Función para obtener la IP del desarrollo
const getDevelopmentApiUrl = () => {
  if (Platform.OS === 'web') {
    return 'http://localhost:3110';
  }

  // Lista de IPs detectadas en tu red (basado en el script de detección)
  const possibleIPs = [
    'http://192.168.9.101:3110',  // IP confirmada que funciona desde el teléfono
    'http://10.2.0.2:3110',       // IP principal detectada
    'http://192.168.96.1:3110',   // IP alternativa detectada
    'http://localhost:3110'       // Fallback
  ];

  // Usar la IP que funciona desde el teléfono
  return possibleIPs[0];
};

// Configuración de entornos
export const ENVIRONMENTS = {
  development: {
    name: 'development',
    apiUrl: process.env.EXPO_PUBLIC_API_URL || getDevelopmentApiUrl(),
    timeout: 10000,
    debug: process.env.EXPO_PUBLIC_DEBUG === 'true' || true
  },
  production: {
    name: 'production',
    apiUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.family.triky.app',
    timeout: 30000,
    debug: process.env.EXPO_PUBLIC_DEBUG === 'true' || false
  }
};

// Función para detectar automáticamente el entorno
const detectEnvironment = (): 'development' | 'production' => {
  // Primero, intentar usar variable de entorno de Expo
  const envFromExpo = process.env.EXPO_PUBLIC_ENVIRONMENT;
  if (envFromExpo === 'production' || envFromExpo === 'development') {
    return envFromExpo;
  }

  // Si estamos en web, podemos usar window.location
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'family.triky.app' || hostname === 'api.family.triky.app') {
      return 'production';
    }
    return 'development';
  }

  // Para móvil, usar Constants para detectar si es una build de producción
  try {
    // @ts-ignore
    const Constants = require('expo-constants').default;
    if (Constants.manifest?.releaseChannel || Constants.executionEnvironment === 'standalone') {
      return 'production';
    }
  } catch (e) {
    // Si no está disponible expo-constants, continuar
  }

  // Por defecto, usar development para desarrollo local
  return 'development';
};

// Detectar entorno automáticamente
export const CURRENT_ENVIRONMENT = detectEnvironment();

// Configuración activa
export const config = ENVIRONMENTS[CURRENT_ENVIRONMENT as keyof typeof ENVIRONMENTS];

// Log de configuración
console.log('🌐 Environment Configuration:', {
  environment: config.name,
  apiUrl: config.apiUrl,
  platform: Platform.OS,
  timeout: config.timeout
});
