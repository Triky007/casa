# Guía para Archivar el Proyecto iOS en Xcode

Esta guía te ayudará a abrir y archivar correctamente el proyecto iOS de FamilyTrikyApp después de las modificaciones realizadas para solucionar los problemas de estructura y dependencias.

## Pasos para abrir el proyecto

1. Abre Xcode
2. Selecciona "Open a project or file"
3. Navega hasta la carpeta `ios` en tu proyecto mobile
4. **IMPORTANTE**: Selecciona el archivo `FamilyTrikyApp.xcworkspace` (no el archivo .xcodeproj)
5. El proyecto debería abrirse correctamente en Xcode

## Pasos para archivar el proyecto

1. En Xcode, selecciona "Any iOS Device (arm64)" como destino de compilación en la barra de herramientas superior
2. Ve a Product > Archive
3. Espera a que se complete el proceso de archivado
4. Se abrirá el Organizador de Xcode con el archivo generado
5. Selecciona "Distribute App" para generar el archivo .ipa

## Solución de problemas comunes

### Error de archivo no encontrado

Si encuentras errores de archivos no encontrados (como `'React/RCTBridgeDelegate.h' file not found`):

1. Verifica que estás abriendo el archivo `.xcworkspace` y no el `.xcodeproj`
2. Asegúrate de que todos los archivos necesarios estén en la ubicación correcta:
   - `AppDelegate.h`
   - `AppDelegate.m`
   - `Info.plist`
   - `LaunchScreen.storyboard`
   - `Images.xcassets`
   - `main.m`

### Errores de compilación

Si encuentras errores de compilación:

1. Limpia el proyecto (Product > Clean Build Folder)
2. Cierra Xcode y vuelve a abrirlo
3. Verifica que el esquema seleccionado sea "FamilyTrikyApp"

### Error al archivar

Si encuentras problemas al archivar:

1. Asegúrate de haber seleccionado "Any iOS Device (arm64)" como destino
2. Verifica que todos los certificados y perfiles de aprovisionamiento estén configurados correctamente
3. Revisa los ajustes de firma (Signing & Capabilities) en la configuración del proyecto

### Error del script React Native

Si encuentras el error `../node_modules/react-native/scripts/react-native-xcode.sh: No such file or directory`:

1. Este error ocurre porque el proyecto todavía tiene una fase de compilación que intenta ejecutar un script de React Native
2. La solución es modificar el archivo `project.pbxproj` para cambiar el script por uno que simplemente muestre un mensaje
3. Busca la sección `/* Begin PBXShellScriptBuildPhase section */` y modifica el script para que contenga:
   ```bash
   echo "Skipping React Native bundling"
   ```
4. Ejecuta `pod install` después de hacer este cambio
5. Para más detalles, consulta el archivo `SOLUCION_ERROR_SCRIPT_REACT_NATIVE.md`

### Errores de iconos

Si encuentras errores relacionados con los iconos de la aplicación:

1. **Falta de icono de 120x120 pixels**:
   - Ejecuta el script `generate-ios-icons.sh` para generar todos los tamaños de iconos necesarios
   - Este script utiliza ImageMagick para crear los iconos a partir del icono principal en `assets/icon.png`

2. **Falta de valor CFBundleIconName en Info.plist**:
   - Asegúrate de que el archivo `Info.plist` contenga la clave `CFBundleIconName` con el valor `AppIcon`
   - Verifica que el nombre del conjunto de iconos en Assets.xcassets sea `AppIcon`

3. Para más detalles sobre la solución de problemas con iconos, consulta el archivo `SOLUCION_ICONOS_IOS.md`

## Estructura del proyecto

La estructura correcta del proyecto es:

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
├── FamilyTrikyApp.xcworkspace/
│   └── contents.xcworkspacedata
└── Podfile
```

Asegúrate de que esta estructura se mantenga para evitar problemas de compilación.
