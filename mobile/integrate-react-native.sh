#!/bin/bash

# Script para integrar React Native en un proyecto Xcode para generar un archivo .ipa
echo "🔧 Integrando React Native en el proyecto Xcode..."

# Verificar que estamos en el directorio correcto
if [ ! -f "app.json" ]; then
  echo "❌ Error: Este script debe ejecutarse desde el directorio raíz del proyecto mobile"
  exit 1
fi

# Verificar que existe el directorio ios
if [ ! -d "ios" ]; then
  echo "❌ Error: No se encontró el directorio ios. Ejecuta primero generate-ios-project.sh"
  exit 1
fi

# Instalar dependencias necesarias
echo "📦 Instalando dependencias de React Native..."
npm install

# Crear directorio para assets si no existe
echo "📁 Creando directorio para el bundle de JavaScript..."
mkdir -p ios/assets

# Generar el bundle de JavaScript
echo "🔨 Generando el bundle de JavaScript..."
npx react-native bundle --entry-file index.js --platform ios --dev false --bundle-output ios/assets/main.jsbundle --assets-dest ios/assets

# Verificar si se generó correctamente el bundle
if [ ! -f "ios/assets/main.jsbundle" ]; then
  echo "❌ Error: No se pudo generar el bundle de JavaScript"
  echo "Intenta ejecutar el comando manualmente:"
  echo "npx react-native bundle --entry-file index.js --platform ios --dev false --bundle-output ios/assets/main.jsbundle --assets-dest ios/assets"
  exit 1
fi

# Crear archivo de configuración para React Native en Xcode
echo "📝 Configurando el proyecto Xcode para React Native..."

# Actualizar AppDelegate.m para cargar React Native
cat > ios/FamilyTrikyApp/AppDelegate.m << 'EOL'
#import "AppDelegate.h"

#import <React/RCTBridge.h>
#import <React/RCTBundleURLProvider.h>
#import <React/RCTRootView.h>

@implementation AppDelegate

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                   moduleName:@"FamilyTrikyApp"
                                            initialProperties:nil];

  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
  UIViewController *rootViewController = [UIViewController new];
  rootViewController.view = rootView;
  self.window.rootViewController = rootViewController;
  [self.window makeKeyAndVisible];
  return YES;
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge
{
#if DEBUG
  return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
#endif
}

@end
EOL

# Actualizar Podfile para React Native
cat > ios/Podfile << 'EOL'
require_relative '../node_modules/react-native/scripts/react_native_pods'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

platform :ios, '12.0'

target 'FamilyTrikyApp' do
  config = use_native_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => false
  )

  # Pods for FamilyTrikyApp

  post_install do |installer|
    react_native_post_install(installer)
  end
end
EOL

# Crear archivo de script para la fase de compilación
mkdir -p ios/scripts
cat > ios/scripts/react-native-xcode.sh << 'EOL'
#!/bin/bash
# Script para incluir en la fase de compilación de Xcode

export NODE_BINARY=node
../node_modules/react-native/scripts/react-native-xcode.sh
EOL

# Hacer ejecutable el script
chmod +x ios/scripts/react-native-xcode.sh

echo "✅ Integración de React Native completada"
echo ""
echo "Para continuar:"
echo "1. Abre el proyecto en Xcode: open ios/FamilyTrikyApp.xcodeproj"
echo "2. Añade el bundle JavaScript al proyecto:"
echo "   - Haz clic derecho en el grupo principal"
echo "   - Selecciona 'Add Files to FamilyTrikyApp...'"
echo "   - Navega hasta ios/assets y selecciona main.jsbundle y la carpeta assets"
echo "3. Añade una fase de script de compilación:"
echo "   - Selecciona el proyecto en el navegador"
echo "   - Ve a 'Build Phases'"
echo "   - Haz clic en '+' y selecciona 'New Run Script Phase'"
echo "   - Añade: ${SRCROOT}/scripts/react-native-xcode.sh"
echo ""
echo "Sigue las instrucciones en XCODE_IPA_GUIDE.md para generar el archivo .ipa"
