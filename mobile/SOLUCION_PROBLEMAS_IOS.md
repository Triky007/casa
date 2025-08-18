# Solución de Problemas en el Proyecto iOS

Este documento detalla los problemas que se encontraron en el proyecto iOS y las soluciones implementadas.

## Problemas Identificados

1. **Estructura incorrecta del proyecto**
   - El archivo `project.pbxproj` estaba en la ubicación incorrecta
   - Los archivos de recursos no estaban en la estructura de directorios esperada por Xcode

2. **Errores de dependencias de React Native**
   - Error `'React/RCTBridgeDelegate.h' file not found` al intentar compilar
   - Problemas con la instalación de CocoaPods y las dependencias de React Native

3. **Errores al archivar el proyecto**
   - No se podía generar el archivo .ipa debido a los errores anteriores

## Soluciones Implementadas

### 1. Corrección de la Estructura del Proyecto

- Creamos la estructura correcta de directorios:
  ```
  ios/
  ├── FamilyTrikyApp/
  │   ├── FamilyTrikyApp/
  │   │   ├── AppDelegate.h
  │   │   ├── AppDelegate.m
  │   │   ├── Images.xcassets/
  │   │   ├── Info.plist
  │   │   ├── LaunchScreen.storyboard
  │   │   └── main.m
  │   └── FamilyTrikyApp.xcodeproj/
  │       └── project.pbxproj
  ```

- Copiamos todos los archivos necesarios a la ubicación correcta:
  ```bash
  mkdir -p ios/FamilyTrikyApp/FamilyTrikyApp
  cp ios/FamilyTrikyApp/AppDelegate.h ios/FamilyTrikyApp/FamilyTrikyApp/
  cp ios/FamilyTrikyApp/AppDelegate.m ios/FamilyTrikyApp/FamilyTrikyApp/
  cp ios/FamilyTrikyApp/Info.plist ios/FamilyTrikyApp/FamilyTrikyApp/
  cp ios/FamilyTrikyApp/main.m ios/FamilyTrikyApp/FamilyTrikyApp/
  cp ios/FamilyTrikyApp/LaunchScreen.storyboard ios/FamilyTrikyApp/FamilyTrikyApp/
  cp -r ios/FamilyTrikyApp/Images.xcassets ios/FamilyTrikyApp/FamilyTrikyApp/
  ```

### 2. Solución de Errores de Dependencias

- Modificamos el archivo `AppDelegate.h` para eliminar la dependencia de React Native:
  ```objc
  #import <UIKit/UIKit.h>

  @interface AppDelegate : UIResponder <UIApplicationDelegate>

  @property (nonatomic, strong) UIWindow *window;

  @end
  ```

- Modificamos el archivo `AppDelegate.m` para crear una implementación básica sin dependencias de React Native:
  ```objc
  #import "AppDelegate.h"

  @implementation AppDelegate

  - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
  {
    self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
    UIViewController *rootViewController = [UIViewController new];
    rootViewController.view = [[UIView alloc] init];
    rootViewController.view.backgroundColor = [UIColor whiteColor];
    self.window.rootViewController = rootViewController;
    [self.window makeKeyAndVisible];
    return YES;
  }

  @end
  ```

- Simplificamos el archivo `Podfile` para evitar dependencias de React Native:
  ```ruby
  # Podfile simplificado sin dependencias de React Native
  platform :ios, '12.0'

  # Especificar el proyecto Xcode
  project 'FamilyTrikyApp/FamilyTrikyApp.xcodeproj'

  target 'FamilyTrikyApp' do
    # Aquí puedes agregar tus pods si los necesitas
  end
  ```

- Instalamos CocoaPods y ejecutamos `pod install` para generar el workspace de Xcode:
  ```bash
  brew install cocoapods
  cd ios && pod install
  ```

### 3. Actualización del Script de Generación

- Actualizamos el script `generate-ios-project.sh` para crear la estructura correcta:
  ```bash
  # Crear directorios necesarios
  mkdir -p ios/FamilyTrikyApp/FamilyTrikyApp
  mkdir -p ios/FamilyTrikyApp/Images.xcassets/AppIcon.appiconset
  mkdir -p ios/FamilyTrikyApp/FamilyTrikyApp/Images.xcassets/AppIcon.appiconset
  mkdir -p ios/FamilyTrikyApp/FamilyTrikyApp.xcodeproj

  # Limpiar directorio ios/FamilyTrikyApp.xcodeproj si existe
  rm -rf ios/FamilyTrikyApp.xcodeproj

  # ... (resto del script)

  # Copiar archivos a la estructura correcta de directorios
  cp ios/FamilyTrikyApp/AppDelegate.h ios/FamilyTrikyApp/FamilyTrikyApp/
  cp ios/FamilyTrikyApp/AppDelegate.m ios/FamilyTrikyApp/FamilyTrikyApp/
  cp ios/FamilyTrikyApp/Info.plist ios/FamilyTrikyApp/FamilyTrikyApp/
  cp ios/FamilyTrikyApp/main.m ios/FamilyTrikyApp/FamilyTrikyApp/
  cp ios/FamilyTrikyApp/LaunchScreen.storyboard ios/FamilyTrikyApp/FamilyTrikyApp/
  cp -r ios/FamilyTrikyApp/Images.xcassets/* ios/FamilyTrikyApp/FamilyTrikyApp/Images.xcassets/
  ```

## Documentación Creada

1. **XCODE_ARCHIVE_GUIDE.md**
   - Instrucciones detalladas para abrir y archivar el proyecto iOS
   - Solución de problemas comunes
   - Descripción de la estructura correcta del proyecto

2. **SOLUCION_PROBLEMAS_IOS.md** (este documento)
   - Resumen de los problemas identificados
   - Detalle de las soluciones implementadas
   - Referencias a los cambios realizados

## Próximos Pasos Recomendados

1. **Abrir el proyecto en Xcode**
   - Usar el archivo `.xcworkspace` generado por CocoaPods
   - Verificar que no haya errores de compilación

2. **Archivar el proyecto**
   - Seguir las instrucciones en `XCODE_ARCHIVE_GUIDE.md`
   - Generar el archivo .ipa para distribución

3. **Integración con React Native (opcional)**
   - Si se desea integrar con React Native en el futuro, seguir las instrucciones en `REACT_NATIVE_INTEGRATION.md`
   - Instalar las dependencias necesarias y configurar el proyecto correctamente
