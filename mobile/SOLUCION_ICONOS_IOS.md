# Solución a los Errores de Iconos en iOS

## Problemas Encontrados

Al intentar validar la aplicación iOS, se encontraron los siguientes errores:

1. **Falta de icono de 120x120 pixels**:
   ```
   Missing required icon file. The bundle does not contain an app icon for iPhone / iPod Touch of exactly '120x120' pixels, in .png format for iOS versions >= 10.0.
   ```

2. **Falta de valor CFBundleIconName en Info.plist**:
   ```
   Missing Info.plist value. A value for the Info.plist key 'CFBundleIconName' is missing in the bundle 'com.triky.familyapp'.
   ```

## Solución Implementada

### 1. Generación de Iconos

Se creó un script `generate-ios-icons.sh` que utiliza ImageMagick para generar automáticamente todos los tamaños de iconos necesarios para iOS a partir del icono principal:

```bash
#!/bin/bash

# Script para generar iconos iOS a partir del icono principal

# Verificar que ImageMagick está instalado
if ! command -v convert &> /dev/null; then
    echo "Error: ImageMagick no está instalado. Por favor instálalo con 'brew install imagemagick'"
    exit 1
fi

# Directorio de origen y destino
SOURCE_ICON="./assets/icon.png"
ICON_DIR="./ios/FamilyTrikyApp/FamilyTrikyApp/Images.xcassets/AppIcon.appiconset"

# Crear directorio si no existe
mkdir -p "$ICON_DIR"

# Generar iconos para iPhone
echo "Generando iconos para iPhone..."
convert "$SOURCE_ICON" -resize 40x40 "$ICON_DIR/icon-20@2x.png"
convert "$SOURCE_ICON" -resize 60x60 "$ICON_DIR/icon-20@3x.png"
convert "$SOURCE_ICON" -resize 58x58 "$ICON_DIR/icon-29@2x.png"
convert "$SOURCE_ICON" -resize 87x87 "$ICON_DIR/icon-29@3x.png"
convert "$SOURCE_ICON" -resize 80x80 "$ICON_DIR/icon-40@2x.png"
convert "$SOURCE_ICON" -resize 120x120 "$ICON_DIR/icon-40@3x.png"
convert "$SOURCE_ICON" -resize 120x120 "$ICON_DIR/icon-60@2x.png"
convert "$SOURCE_ICON" -resize 180x180 "$ICON_DIR/icon-60@3x.png"

# Generar icono para App Store
convert "$SOURCE_ICON" -resize 1024x1024 "$ICON_DIR/icon-1024.png"
```

El script genera los siguientes iconos:
- icon-20@2x.png (40x40)
- icon-20@3x.png (60x60)
- icon-29@2x.png (58x58)
- icon-29@3x.png (87x87)
- icon-40@2x.png (80x80)
- icon-40@3x.png (120x120)
- icon-60@2x.png (120x120) - Este es el icono de 120x120 que faltaba
- icon-60@3x.png (180x180)
- icon-1024.png (1024x1024)

### 2. Actualización del archivo Contents.json

El script también actualiza el archivo `Contents.json` en el directorio `AppIcon.appiconset` para referenciar correctamente los archivos de iconos:

```json
{
  "images" : [
    {
      "filename" : "icon-20@2x.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "20x20"
    },
    ...
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
```

### 3. Configuración de CFBundleIconName en Info.plist

Se agregó la clave `CFBundleIconName` al archivo `Info.plist`:

```xml
<key>CFBundleIconName</key>
<string>AppIcon</string>
```

## Pasos para Aplicar la Solución

1. Instalar ImageMagick si no está instalado:
   ```bash
   brew install imagemagick
   ```

2. Ejecutar el script para generar los iconos:
   ```bash
   ./generate-ios-icons.sh
   ```

3. Ejecutar `pod install` en el directorio `ios` para actualizar el workspace:
   ```bash
   cd ios && pod install
   ```

4. Abrir el proyecto usando el archivo `.xcworkspace` y verificar que los iconos estén correctamente configurados.

## Notas Importantes

- El nombre del conjunto de iconos en Assets.xcassets debe ser `AppIcon` para que coincida con el valor de `CFBundleIconName` en Info.plist.
- Todos los tamaños de iconos requeridos deben estar presentes y correctamente referenciados en el archivo `Contents.json`.
- Si se cambia el icono principal, simplemente ejecuta el script nuevamente para regenerar todos los tamaños.
