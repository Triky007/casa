const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Configuración para resolver problemas de web bundling
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

config.resolver.alias = {
  'react-native': 'react-native-web',
};

module.exports = config;
