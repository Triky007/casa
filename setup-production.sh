#!/bin/bash

# Script de configuración para producción con PostgreSQL
set -e

echo "🚀 Configurando Family Tasks para producción con PostgreSQL..."

# 1. Crear red Docker
echo "📡 Creando red Docker..."
docker network create family-tasks-network 2>/dev/null || echo "Red ya existe"

# 2. Configurar variables de entorno
echo "⚙️  Configurando variables de entorno..."
if [ ! -f .env ]; then
    cp .env.production .env
    echo "✅ Archivo .env creado desde .env.production"
    echo "⚠️  IMPORTANTE: Edita .env y cambia las contraseñas por defecto"
else
    echo "ℹ️  Archivo .env ya existe"
fi

# 3. Construir y ejecutar servicios
echo "🏗️  Construyendo y ejecutando servicios..."
docker-compose up --build -d

# 4. Esperar a que la base de datos esté lista
echo "⏳ Esperando a que PostgreSQL esté listo..."
sleep 15

# 5. Verificar estado
echo "🔍 Verificando estado de los servicios..."
docker-compose ps

echo ""
echo "✅ ¡Configuración completada!"
echo ""
echo "🌐 URLs disponibles:"
echo "   Frontend: https://family.triky.app"
echo "   API: https://api.family.triky.app/docs"
echo ""
echo "📋 Próximos pasos:"
echo "   1. Configura Apache con los archivos en apache-config/"
echo "   2. Obtén certificados SSL con certbot"
echo "   3. Crea un usuario admin: docker-compose exec backend python scripts/create_admin.py"
echo ""
echo "📊 Comandos útiles:"
echo "   Ver logs: docker-compose logs -f"
echo "   Reiniciar: docker-compose restart"
echo "   Parar: docker-compose down"
