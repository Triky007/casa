#!/bin/bash

echo "🔧 Reconstruyendo frontend con nuevos puertos..."

# Parar servicios
echo "Parando servicios..."
docker-compose down

# Limpiar cache de Docker
echo "Limpiando cache de Docker..."
docker system prune -f

# Eliminar imágenes específicas
echo "Eliminando imágenes anteriores..."
docker rmi casa-frontend casa-backend 2>/dev/null || true

# Reconstruir sin cache
echo "Reconstruyendo todo sin cache..."
docker-compose build --no-cache

# Iniciar servicios
echo "Iniciando servicios..."
docker-compose up -d

# Esperar un momento
echo "Esperando que los servicios inicien..."
sleep 20

# Verificar estado
echo "Estado de los servicios:"
docker-compose ps

# Verificar variables de entorno
echo "Variables de entorno del frontend:"
docker-compose exec frontend env | grep VITE || echo "No VITE vars found"

# Probar conectividad
echo "Probando conectividad..."
echo "Backend (3110):"
curl -s http://localhost:3110/docs > /dev/null && echo "✅ Backend OK" || echo "❌ Backend FAIL"

echo "Frontend (4110):"
curl -s http://localhost:4110 > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend FAIL"

echo "🎉 Reconstrucción completada!"
echo "💡 Si sigue fallando:"
echo "   1. Abre modo incógnito en el navegador"
echo "   2. Desactiva extensiones (AdBlock, etc.)"
echo "   3. Presiona Ctrl+Shift+R para recargar sin cache"
