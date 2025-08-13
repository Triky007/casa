#!/bin/bash

echo "🔧 Solucionando problema de localhost después del build..."

# Esperar a que el contenedor esté listo
echo "⏳ Esperando a que el frontend esté listo..."
sleep 10

# Encontrar todos los archivos JS que contengan localhost:3110
echo "🔍 Buscando archivos JS con localhost:3110..."
JS_FILES=$(docker-compose -f docker-compose.prod.yml exec frontend find /usr/share/nginx/html/assets/ -name "index-*.js" 2>/dev/null)

if [ -z "$JS_FILES" ]; then
    echo "❌ No se encontraron archivos JS"
    exit 1
fi

echo "📄 Archivos JS encontrados:"
echo "$JS_FILES"

# Procesar cada archivo JS
for JS_FILE in $JS_FILES; do
    echo ""
    echo "🔧 Procesando: $JS_FILE"
    
    # Verificar si contiene localhost:3110
    if docker-compose -f docker-compose.prod.yml exec frontend grep -q "localhost:3110" "$JS_FILE" 2>/dev/null; then
        echo "❌ Contiene localhost:3110 - Corrigiendo..."
        
        # Reemplazar localhost:3110 por cadena vacía
        docker-compose -f docker-compose.prod.yml exec frontend sed -i 's/http:\/\/localhost:3110//g' "$JS_FILE"
        
        # Verificar que se corrigió
        if docker-compose -f docker-compose.prod.yml exec frontend grep -q "localhost:3110" "$JS_FILE" 2>/dev/null; then
            echo "❌ FALLO: Aún contiene localhost:3110"
        else
            echo "✅ ÉXITO: localhost:3110 eliminado"
        fi
    else
        echo "✅ No contiene localhost:3110 - OK"
    fi
done

echo ""
echo "🎉 Proceso completado!"
echo ""
echo "🌐 IMPORTANTE - Limpiar cache del navegador:"
echo "   1. Abre https://family.triky.app"
echo "   2. Presiona Ctrl+Shift+R (fuerza recarga)"
echo "   3. O abre DevTools → Application → Storage → Clear storage"
echo "   4. Intenta login"

echo ""
echo "📊 Estado de contenedores:"
docker-compose -f docker-compose.prod.yml ps
