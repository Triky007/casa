#!/bin/bash

# Script de despliegue para producción
set -e

echo "🚀 Iniciando despliegue..."

# Actualizar código
git pull origin main

# Parar servicios
docker-compose down

# Construir y ejecutar
docker-compose up --build -d

# Verificar estado
sleep 10
docker-compose ps

echo "✅ Despliegue completado!"
echo "Frontend: https://family.triky.app"
echo "API: https://api.family.triky.app/docs"

# Mostrar logs recientes
docker-compose logs --tail=20
