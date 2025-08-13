#!/bin/bash

echo "🔧 Solucionando archivo .env y reconstruyendo..."

# Hacer backup del .env original
echo "💾 Haciendo backup de .env..."
cp frontend/.env frontend/.env.backup

# Sobrescribir .env con configuración de producción
echo "📝 Sobrescribiendo .env con configuración de producción..."
cat > frontend/.env << EOF
# Production configuration - overriding for build
VITE_API_URL=
EOF

echo "📄 Nuevo contenido de .env:"
cat frontend/.env

# Parar frontend
echo "⏹️  Parando frontend..."
docker-compose -f docker-compose.prod.yml stop frontend

# Eliminar imagen
echo "🗑️  Eliminando imagen del frontend..."
docker rmi casa-1-frontend casa-frontend 2>/dev/null || true

# Reconstruir
echo "🔨 Reconstruyendo frontend..."
docker-compose -f docker-compose.prod.yml build --no-cache frontend

# Restaurar .env original
echo "🔄 Restaurando .env original..."
mv frontend/.env.backup frontend/.env

# Iniciar frontend
echo "▶️  Iniciando frontend..."
docker-compose -f docker-compose.prod.yml up -d frontend

# Esperar
echo "⏳ Esperando 15 segundos..."
sleep 15

# Verificar
echo "📊 Estado:"
docker-compose -f docker-compose.prod.yml ps frontend

echo ""
echo "🔍 Verificando si contiene localhost:"
docker-compose -f docker-compose.prod.yml exec frontend find /usr/share/nginx/html/ -name "*.js" -exec grep -l "localhost:3110" {} \; 2>/dev/null && echo "❌ Aún contiene localhost:3110" || echo "✅ No contiene localhost:3110"

echo ""
echo "🌐 Prueba ahora en el navegador:"
echo "   https://family.triky.app"
echo "   (Ctrl+F5 para limpiar cache)"
