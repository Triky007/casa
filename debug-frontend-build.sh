#!/bin/bash

echo "🔍 Depurando configuración del frontend..."

echo ""
echo "📊 Estado actual de contenedores:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🔍 Verificando variables de entorno en el contenedor:"
docker-compose -f docker-compose.prod.yml exec frontend env | grep VITE || echo "No hay variables VITE"

echo ""
echo "📄 Verificando archivos de configuración en el contenedor:"
echo "Contenido de /usr/share/nginx/html (primeros archivos):"
docker-compose -f docker-compose.prod.yml exec frontend ls -la /usr/share/nginx/html/ | head -10

echo ""
echo "🔍 Buscando referencias a localhost en el build:"
docker-compose -f docker-compose.prod.yml exec frontend grep -r "localhost:3110" /usr/share/nginx/html/ 2>/dev/null || echo "✅ No se encontró localhost:3110 en el build"

echo ""
echo "🔍 Verificando el archivo JavaScript principal:"
docker-compose -f docker-compose.prod.yml exec frontend find /usr/share/nginx/html/ -name "index-*.js" -exec grep -l "localhost\|3110" {} \; 2>/dev/null || echo "✅ No se encontró localhost en JS"

echo ""
echo "📋 Logs recientes del frontend:"
docker-compose -f docker-compose.prod.yml logs --tail=10 frontend

echo ""
echo "🔧 Si aún aparece localhost:3110, necesitamos:"
echo "   1. Verificar que el build use las variables correctas"
echo "   2. Limpiar completamente el cache de Docker"
echo "   3. Reconstruir desde cero"
