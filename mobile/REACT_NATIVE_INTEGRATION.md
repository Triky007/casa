# Integración de React Native en un proyecto Xcode

Esta guía te mostrará cómo integrar tu código React Native existente en el proyecto Xcode que has creado para generar un archivo .ipa.

## Requisitos previos

- Proyecto Xcode configurado según la guía XCODE_IPA_GUIDE.md
- Código React Native existente en tu proyecto mobile
- Node.js y npm instalados

## Paso 1: Preparar tu proyecto React Native

### Asegúrate de tener las dependencias correctas

1. Verifica que tu archivo `package.json` incluya las dependencias necesarias:

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-native": "^0.69.0"
    // Otras dependencias...
  }
}
```

2. Instala las dependencias si no lo has hecho:

```bash
npm install
```

## Paso 2: Configurar la integración de React Native en Xcode

### Modificar el AppDelegate para cargar React Native

1. Abre tu proyecto en Xcode
2. Abre el archivo `AppDelegate.m`
3. Reemplaza su contenido con el siguiente código:

```objc
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
```

### Configurar el Podfile

1. Abre el archivo `ios/Podfile` y asegúrate de que contenga:

```ruby
require_relative '../node_modules/react-native/scripts/react_native_pods'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

platform :ios, '12.0'

target 'FamilyTrikyApp' do
  config = use_native_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    # to enable hermes on iOS, change `false` to `true` and then install pods
    :hermes_enabled => false
  )

  # Pods for FamilyTrikyApp
  # Agrega aquí cualquier pod adicional que necesites

  post_install do |installer|
    react_native_post_install(installer)
  end
end
```

2. Instala los pods:

```bash
cd ios && pod install && cd ..
```

## Paso 3: Crear el bundle de JavaScript

Para una distribución en producción, necesitas crear un bundle JavaScript que se incluirá en tu aplicación:

1. Crea una carpeta para el bundle:

```bash
mkdir -p ios/assets
```

2. Genera el bundle JavaScript:

```bash
npx react-native bundle --entry-file index.js --platform ios --dev false --bundle-output ios/assets/main.jsbundle --assets-dest ios/assets
```

## Paso 4: Añadir el bundle a tu proyecto Xcode

1. Abre tu proyecto en Xcode
2. Haz clic derecho en el grupo principal de tu proyecto
3. Selecciona "Add Files to 'FamilyTrikyApp'..."
4. Navega hasta la carpeta `ios/assets` y selecciona `main.jsbundle` y la carpeta `assets`
5. Asegúrate de que "Copy items if needed" esté marcado
6. Haz clic en "Add"

## Paso 5: Configurar la compilación

1. Selecciona tu proyecto en el navegador de proyectos
2. Ve a "Build Phases"
3. Haz clic en "+" y selecciona "New Run Script Phase"
4. Añade el siguiente script:

```bash
export NODE_BINARY=node
../node_modules/react-native/scripts/react-native-xcode.sh
```

5. Asegúrate de que este script se ejecute antes de "Copy Bundle Resources"

## Paso 6: Compilar y generar el archivo .ipa

Ahora puedes seguir las instrucciones de la guía XCODE_IPA_GUIDE.md para compilar y generar el archivo .ipa:

1. Selecciona "Any iOS Device (arm64)" como destino
2. Ve a Product > Archive
3. Sigue los pasos para exportar el archivo .ipa

## Solución de problemas comunes

### Error "React/RCTBridge.h file not found"

- Asegúrate de haber instalado los pods correctamente
- Verifica que estás abriendo el archivo `.xcworkspace` y no el `.xcodeproj`

### Error "main.jsbundle not found"

- Verifica que has generado correctamente el bundle JavaScript
- Asegúrate de que has añadido el archivo al proyecto Xcode

### La aplicación se cierra inmediatamente al iniciar

- Verifica que el nombre del módulo en `AppDelegate.m` coincide con el nombre de tu aplicación en `app.json`
- Asegúrate de que el bundle JavaScript se ha generado correctamente

## Recursos adicionales

- [Documentación oficial de React Native - Integración con código nativo existente](https://reactnative.dev/docs/integration-with-existing-apps)
- [Guía de React Native para iOS](https://reactnative.dev/docs/native-components-ios)
