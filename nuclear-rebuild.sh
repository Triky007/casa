#!/bin/bash

echo "💥 RECONSTRUCCIÓN NUCLEAR - Eliminando TODO y empezando desde cero..."

# Parar TODOS los servicios
echo "⏹️  Parando TODOS los servicios..."
docker-compose -f docker-compose.prod.yml down -v

# Eliminar TODAS las imágenes relacionadas
echo "🗑️  Eliminando TODAS las imágenes..."
docker rmi $(docker images | grep casa | awk '{print $3}') 2>/dev/null || true
docker rmi casa-1-frontend casa-1-backend casa-frontend casa-backend 2>/dev/null || true

# Limpiar TODO el cache de Docker
echo "🧹 LIMPIEZA TOTAL de Docker..."
docker system prune -a -f
docker builder prune -a -f
docker volume prune -f

# Backup y modificar .env PERMANENTEMENTE
echo "📝 Modificando .env para producción..."
cp frontend/.env frontend/.env.dev-backup
echo "# Production build - API URL empty for relative paths" > frontend/.env
echo "VITE_API_URL=" >> frontend/.env

echo "📄 Nuevo .env:"
cat frontend/.env

# Verificar que no hay cache de node_modules
echo "🧹 Limpiando node_modules..."
rm -rf frontend/node_modules/.cache 2>/dev/null || true

# Reconstruir COMPLETAMENTE desde cero
echo "🔨 RECONSTRUCCIÓN COMPLETA desde cero..."
docker-compose -f docker-compose.prod.yml build --no-cache --pull --force-rm

# Iniciar servicios
echo "▶️  Iniciando servicios..."
docker-compose -f docker-compose.prod.yml up -d

# Esperar más tiempo
echo "⏳ Esperando 30 segundos para inicialización completa..."
sleep 30

# Verificar que el nuevo build NO contiene localhost
echo "🔍 Verificando el nuevo build..."
NEW_JS=$(docker-compose -f docker-compose.prod.yml exec frontend find /usr/share/nginx/html/assets/ -name "index-*.js" | head -1)
echo "Archivo JS: $NEW_JS"

if docker-compose -f docker-compose.prod.yml exec frontend grep -q "localhost:3110" $NEW_JS 2>/dev/null; then
    echo "❌ FALLO: Aún contiene localhost:3110"
    echo "Contenido problemático:"
    docker-compose -f docker-compose.prod.yml exec frontend grep -o "localhost:3110" $NEW_JS
else
    echo "✅ ÉXITO: No contiene localhost:3110"
fi

# Restaurar .env de desarrollo
echo "🔄 Restaurando .env de desarrollo..."
mv frontend/.env.dev-backup frontend/.env

echo ""
echo "📊 Estado final:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🌐 IMPORTANTE - Limpiar cache del navegador:"
echo "   1. Abre https://family.triky.app"
echo "   2. Presiona Ctrl+Shift+R (o Cmd+Shift+R en Mac)"
echo "   3. O abre DevTools → Network → Disable cache"
echo "   4. Intenta login"
echo "   5. Debe mostrar: /api/user/login (SIN localhost)"

echo ""
echo "🔍 Para verificar el nuevo archivo JS:"
echo "   docker-compose -f docker-compose.prod.yml exec frontend ls -la /usr/share/nginx/html/assets/"
