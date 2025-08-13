#!/bin/bash

echo "🔍 Verificando estado de salud de los contenedores..."
echo ""

echo "📊 Estado actual:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🏥 Logs de salud del backend:"
docker-compose -f docker-compose.prod.yml logs --tail=10 backend

echo ""
echo "🏥 Logs de salud del frontend:"
docker-compose -f docker-compose.prod.yml logs --tail=10 frontend

echo ""
echo "🌐 Probando conectividad:"
echo "Backend (puerto 3110):"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3110/docs || echo "❌ No responde"

echo ""
echo "Frontend (puerto 4110):"
curl -s -o /dev/null -w "%{http_code}" http://localhost:4110/ || echo "❌ No responde"

echo ""
echo "🔧 Para reiniciar servicios:"
echo "docker-compose -f docker-compose.prod.yml restart"
