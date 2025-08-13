#!/bin/bash

echo "🔧 Corrección rápida de localhost:3110..."

# Corregir todos los archivos JS
docker-compose -f docker-compose.prod.yml exec frontend find /usr/share/nginx/html/assets/ -name "index-*.js" -exec sed -i 's/http:\/\/localhost:3110//g' {} \;

# Verificar resultado
LOCALHOST_FILES=$(docker-compose -f docker-compose.prod.yml exec frontend find /usr/share/nginx/html/assets/ -name "index-*.js" -exec grep -l "localhost:3110" {} \; 2>/dev/null)

if [ -z "$LOCALHOST_FILES" ]; then
    echo "✅ ÉXITO: localhost:3110 eliminado de todos los archivos JS"
    echo ""
    echo "🌐 Ahora puedes usar https://family.triky.app"
    echo "   Recuerda limpiar cache del navegador (Ctrl+Shift+R)"
else
    echo "❌ ADVERTENCIA: Algunos archivos aún contienen localhost:3110:"
    echo "$LOCALHOST_FILES"
fi
