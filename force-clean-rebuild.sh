#!/bin/bash

echo "🧹 Limpieza completa y reconstrucción forzada..."

# Parar todos los servicios
echo "⏹️  Parando todos los servicios..."
docker-compose -f docker-compose.prod.yml down

# Eliminar todas las imágenes relacionadas
echo "🗑️  Eliminando imágenes..."
docker rmi casa-1-frontend casa-1-backend 2>/dev/null || true
docker rmi casa-frontend casa-backend 2>/dev/null || true

# Limpiar cache de Docker
echo "🧹 Limpiando cache de Docker..."
docker system prune -f
docker builder prune -f

# Mostrar la configuración que se va a usar
echo ""
echo "📋 Configuración que se aplicará:"
echo "   VITE_API_URL: '' (vacía)"
echo "   NODE_ENV: production"
echo ""

# Verificar archivos de configuración
echo "📄 Verificando .env.production:"
cat frontend/.env.production

echo ""
echo "📄 Verificando Dockerfile ENV:"
grep -A 1 -B 1 "VITE_API_URL" frontend/Dockerfile

# Reconstruir completamente desde cero
echo ""
echo "🔨 Reconstruyendo completamente desde cero..."
docker-compose -f docker-compose.prod.yml build --no-cache --pull

# Iniciar servicios
echo "▶️  Iniciando servicios..."
docker-compose -f docker-compose.prod.yml up -d

# Esperar más tiempo para que se inicialicen
echo "⏳ Esperando 20 segundos para inicialización completa..."
sleep 20

# Verificar estado
echo "📊 Estado final:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🔍 Verificando configuración en el contenedor:"
docker-compose -f docker-compose.prod.yml exec frontend grep -r "localhost" /usr/share/nginx/html/ 2>/dev/null && echo "❌ Aún contiene localhost" || echo "✅ No contiene localhost"

echo ""
echo "🌐 Ahora prueba en el navegador:"
echo "   1. Abre: https://family.triky.app"
echo "   2. Ctrl+F5 para limpiar cache del navegador"
echo "   3. DevTools → Network → Clear"
echo "   4. Intenta login"
echo "   5. Debe mostrar: /api/user/login (SIN localhost)"
