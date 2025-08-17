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
    apiUrl: getDevelopmentApiUrl(),
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
