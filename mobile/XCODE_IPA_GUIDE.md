# Guía para generar un archivo .ipa usando Xcode directamente

Esta guía te mostrará cómo crear un archivo .ipa para tu aplicación iOS utilizando Xcode directamente, sin depender de herramientas como EAS Build de Expo.

## Requisitos previos

- macOS con Xcode 14.0 o superior instalado
- Una cuenta de Apple Developer (de pago) para distribución en App Store o TestFlight
- O una cuenta Apple ID gratuita para desarrollo y pruebas en dispositivos propios

## Paso 1: Crear un nuevo proyecto en Xcode

1. Abre Xcode
2. Selecciona "Create a new Xcode project"
3. Elige "iOS" > "App"
4. Configura el proyecto:
   - **Product Name**: FamilyTrikyApp
   - **Team**: Selecciona tu equipo de desarrollo de Apple
   - **Organization Identifier**: com.triky
   - **Bundle Identifier**: com.triky.familyapp
   - **Interface**: SwiftUI o Storyboard (según prefieras)
   - **Language**: Swift
   - **Asegúrate** de que "Use Core Data" y "Include Tests" estén desmarcados
5. Haz clic en "Next" y elige una ubicación para guardar el proyecto
6. Selecciona "Create"

## Paso 2: Configurar el proyecto

### Configurar la información de la aplicación

1. Selecciona el proyecto en el navegador de proyectos (panel izquierdo)
2. Selecciona el target "FamilyTrikyApp"
3. Ve a la pestaña "General"
4. Configura:
   - **Display Name**: Family Triky App
   - **Version**: 1.0.0
   - **Build**: 1
   - **Deployment Info**: iOS 14.0 o superior
   - **Device Orientation**: Portrait
   - **Status Bar Style**: Default

### Configurar la firma (Signing)

1. Ve a la pestaña "Signing & Capabilities"
2. Marca la opción "Automatically manage signing"
3. Selecciona tu equipo de desarrollo
4. Si aparece algún error, haz clic en "Fix Issue"

## Paso 3: Añadir recursos a tu aplicación

### Iconos de la aplicación

1. Utiliza el script `generate-ios-icons.sh` para generar automáticamente todos los tamaños de iconos necesarios:
   ```bash
   ./generate-ios-icons.sh
   ```
   Este script utiliza ImageMagick para crear los iconos a partir del icono principal en `assets/icon.png`.

2. Asegúrate de que el archivo `Info.plist` contenga la clave `CFBundleIconName` con el valor `AppIcon`:
   ```xml
   <key>CFBundleIconName</key>
   <string>AppIcon</string>
   ```

3. Verifica que el archivo `Contents.json` en `Images.xcassets/AppIcon.appiconset/` referencie correctamente todos los archivos de iconos generados.

### Pantalla de inicio (Launch Screen)

1. En el navegador de proyectos, busca "LaunchScreen.storyboard"
2. Personaliza la pantalla de inicio según tus necesidades

## Paso 4: Generar el archivo .ipa

### Método 1: Archivar y exportar (para TestFlight o App Store)

1. Selecciona el dispositivo de destino como "Any iOS Device (arm64)" en la barra de herramientas superior
2. Ve a Product > Archive en el menú
3. Espera a que se complete el proceso de archivado
4. Se abrirá el Organizador de Xcode con tu archivo
5. Selecciona "Distribute App"
6. Elige "App Store Connect" para subir a TestFlight/App Store
7. Sigue los pasos del asistente
8. Al final, selecciona "Export" y elige una ubicación para guardar el archivo .ipa

### Método 2: Exportar para desarrollo (Ad Hoc o Development)

1. Selecciona el dispositivo de destino como "Any iOS Device (arm64)"
2. Ve a Product > Archive en el menú
3. Espera a que se complete el proceso de archivado
4. Se abrirá el Organizador de Xcode con tu archivo
5. Selecciona "Distribute App"
6. Elige "Ad Hoc" para distribución a dispositivos registrados
7. Sigue los pasos del asistente
8. Al final, selecciona "Export" y elige una ubicación para guardar el archivo .ipa

## Paso 5: Distribuir tu aplicación

### Opción 1: TestFlight (para pruebas beta)

1. Sube tu archivo .ipa a App Store Connect usando Xcode
2. Inicia sesión en [App Store Connect](https://appstoreconnect.apple.com)
3. Ve a "Apps" > Tu aplicación > "TestFlight"
4. Añade probadores internos o externos
5. Espera a que Apple revise tu aplicación (solo para probadores externos)
6. Los probadores recibirán un correo electrónico con instrucciones para instalar la aplicación

### Opción 2: Distribución Ad Hoc (para dispositivos específicos)

1. Asegúrate de que los UDID de los dispositivos estén registrados en tu cuenta de Apple Developer
2. Crea un perfil de aprovisionamiento Ad Hoc que incluya estos dispositivos
3. Usa este perfil para exportar tu archivo .ipa
4. Distribuye el archivo .ipa a tus usuarios mediante:
   - Correo electrónico
   - Servicios como Diawi o TestFlight
   - Instalación directa mediante Apple Configurator

## Solución de problemas comunes

### Error 'React/RCTBridgeDelegate.h' file not found

- Este error ocurre porque el proyecto intenta usar componentes de React Native, pero las dependencias no están correctamente instaladas
- Solución: Modificar `AppDelegate.h` y `AppDelegate.m` para eliminar las referencias a React Native
- Para más detalles, consulta el archivo `SOLUCION_ERROR_RCT_BRIDGE_DELEGATE.md`

### Error del script React Native durante el archivado

- Error: `../node_modules/react-native/scripts/react-native-xcode.sh: No such file or directory`
- Solución: Modificar el archivo `project.pbxproj` para cambiar el script por uno simple
- Para más detalles, consulta el archivo `SOLUCION_ERROR_SCRIPT_REACT_NATIVE.md`

### Errores de validación de iconos

- Error: `Missing required icon file. The bundle does not contain an app icon for iPhone / iPod Touch of exactly '120x120' pixels`
- Error: `Missing Info.plist value. A value for the Info.plist key 'CFBundleIconName' is missing`
- Solución: Ejecutar el script `generate-ios-icons.sh` y agregar la clave `CFBundleIconName` al Info.plist
- Para más detalles, consulta el archivo `SOLUCION_ICONOS_IOS.md`

### Error de certificado

- Asegúrate de tener un certificado de desarrollo válido en tu cuenta de Apple Developer
- Ve a Xcode > Preferences > Accounts > Manage Certificates para crear uno nuevo

### Error de perfil de aprovisionamiento

- Verifica que el Bundle Identifier sea único
- Asegúrate de que los dispositivos estén registrados en tu cuenta de Apple Developer
- Intenta eliminar y volver a crear los perfiles de aprovisionamiento

### Errores de compilación generales

- Verifica que no haya errores en el código
- Limpia el proyecto (Product > Clean Build Folder)
- Reinicia Xcode

### Error "The branch is not associated with the workflow"

- Este error ocurre cuando intentas generar un build manual desde una rama que no está configurada en el workflow de CI/CD
- Consulta el archivo `CI_CD_WORKFLOW_GUIDE.md` para instrucciones detalladas sobre cómo asociar ramas a workflows

## Recursos adicionales

- [Documentación oficial de Xcode](https://developer.apple.com/documentation/xcode)
- [Guía de distribución de apps de Apple](https://developer.apple.com/distribute/)
- [TestFlight Beta Testing](https://developer.apple.com/testflight/)
