#!/bin/bash

echo "🔧 Solucionando problemas de producción..."

# Parar servicios
echo "⏹️  Parando servicios..."
docker-compose -f docker-compose.prod.yml down

# Limpiar contenedores e imágenes antiguas
echo "🧹 Limpiando contenedores antiguos..."
docker system prune -f

# Reconstruir con configuración corregida
echo "🔨 Reconstruyendo con configuración corregida..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Iniciar servicios
echo "▶️  Iniciando servicios..."
docker-compose -f docker-compose.prod.yml up -d

# Esperar y verificar
echo "⏳ Esperando 15 segundos para que los servicios se inicialicen..."
sleep 15

echo "📊 Estado de los servicios:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🌐 Probando conectividad:"
echo -n "Backend: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:3110/docs && echo " ✅" || echo " ❌"

echo -n "Frontend: "
curl -s -o /dev/null -w "%{http_code}" http://localhost:4110/ && echo " ✅" || echo " ❌"

echo ""
echo "🔍 Para monitorear logs:"
echo "   ./monitor-login.sh"
echo ""
echo "🏥 Para verificar salud:"
echo "   ./check-health.sh"
