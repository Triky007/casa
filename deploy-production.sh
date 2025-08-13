#!/bin/bash

# Script para desplegar en producción
echo "🚀 Desplegando en producción..."

# Parar servicios actuales
echo "⏹️  Parando servicios actuales..."
docker-compose down

# Construir imágenes para producción
echo "🔨 Construyendo imágenes para producción..."
docker-compose -f docker-compose.prod.yml build --no-cache

# Iniciar servicios de producción
echo "▶️  Iniciando servicios de producción..."
docker-compose -f docker-compose.prod.yml up -d

# Esperar a que los servicios estén listos
echo "⏳ Esperando a que los servicios estén listos..."
sleep 10

# Verificar estado de los servicios
echo "✅ Estado de los servicios:"
docker-compose -f docker-compose.prod.yml ps

# Verificar salud de los servicios
echo ""
echo "🏥 Verificando salud de los servicios..."
sleep 5
./check-health.sh

echo ""
echo "🔍 Para ver las llamadas de login en tiempo real, ejecuta:"
echo "   docker-compose -f docker-compose.prod.yml logs -f backend | grep -E '(POST|login|validate|Response)'"
echo ""
echo "📋 Ejemplo de llamada de login exitosa:"
echo "   POST /api/user/login - Origin: https://family.triky.app"
echo "   Response: 200"

echo "🎉 Despliegue completado!"
echo "📝 Próximos pasos:"
echo "   1. Copiar apache-config/family-triky-app.conf a Apache"
echo "   2. Recargar Apache: sudo systemctl reload apache2"
echo "   3. Verificar certificados SSL"
echo "   4. Probar login en https://family.triky.app"
echo ""
echo "⚠️  IMPORTANTE: La configuración de Apache ha cambiado!"
echo "   Ahora /api/ va al backend y todo lo demás al frontend."
