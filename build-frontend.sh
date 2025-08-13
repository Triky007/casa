#!/bin/bash

echo "🚀 Build completo del frontend con auto-corrección..."

# Reconstruir el frontend
echo "🔨 Reconstruyendo frontend..."
docker-compose -f docker-compose.prod.yml build frontend --no-cache

# Reiniciar el contenedor
echo "▶️  Reiniciando contenedor..."
docker-compose -f docker-compose.prod.yml up -d frontend

# Esperar a que se inicie
echo "⏳ Esperando inicialización..."
sleep 15

# Auto-corregir localhost:3110
echo "🔧 Auto-corrección de localhost..."
docker-compose -f docker-compose.prod.yml exec frontend find /usr/share/nginx/html/assets/ -name "index-*.js" -exec sed -i 's/http:\/\/localhost:3110//g' {} \;

# Verificar resultado
echo "🔍 Verificando corrección..."
LOCALHOST_FILES=$(docker-compose -f docker-compose.prod.yml exec frontend find /usr/share/nginx/html/assets/ -name "index-*.js" -exec grep -l "localhost:3110" {} \; 2>/dev/null)

if [ -z "$LOCALHOST_FILES" ]; then
    echo "✅ ÉXITO: Frontend construido sin localhost:3110"
    echo ""
    echo "🌐 Listo para usar:"
    echo "   - https://family.triky.app"
    echo "   - Recuerda limpiar cache del navegador (Ctrl+Shift+R)"
else
    echo "❌ ADVERTENCIA: Algunos archivos aún contienen localhost:3110:"
    echo "$LOCALHOST_FILES"
fi

echo ""
echo "📊 Estado final de contenedores:"
docker-compose -f docker-compose.prod.yml ps
