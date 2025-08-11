const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(
    {
      ...env,
      babel: {
        dangerouslyAddModulePathsToTranspile: [
          '@react-navigation',
          'react-native-vector-icons',
        ],
      },
    },
    argv
  );

  // Configuración adicional para resolver problemas de bundling
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native$': 'react-native-web',
    'react-native-vector-icons': 'react-native-vector-icons/dist',
  };

  return config;
};
