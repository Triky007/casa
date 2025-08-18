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

# Actualizar el archivo Contents.json
cat > "$ICON_DIR/Contents.json" << EOL
{
  "images" : [
    {
      "filename" : "icon-20@2x.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "20x20"
    },
    {
      "filename" : "icon-20@3x.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "20x20"
    },
    {
      "filename" : "icon-29@2x.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "29x29"
    },
    {
      "filename" : "icon-29@3x.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "29x29"
    },
    {
      "filename" : "icon-40@2x.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "40x40"
    },
    {
      "filename" : "icon-40@3x.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "40x40"
    },
    {
      "filename" : "icon-60@2x.png",
      "idiom" : "iphone",
      "scale" : "2x",
      "size" : "60x60"
    },
    {
      "filename" : "icon-60@3x.png",
      "idiom" : "iphone",
      "scale" : "3x",
      "size" : "60x60"
    },
    {
      "filename" : "icon-1024.png",
      "idiom" : "ios-marketing",
      "scale" : "1x",
      "size" : "1024x1024"
    }
  ],
  "info" : {
    "author" : "xcode",
    "version" : 1
  }
}
EOL

echo "Iconos generados correctamente en $ICON_DIR"
echo "Recuerda ejecutar 'pod install' en el directorio ios para actualizar el workspace"
