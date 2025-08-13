#!/bin/bash

echo "🔍 Monitoreando llamadas de login en tiempo real..."
echo "📝 Presiona Ctrl+C para salir"
echo ""
echo "🎯 Buscando:"
echo "   - POST /api/user/login"
echo "   - Respuestas 200 (éxito) o 401 (error)"
echo "   - Origen de las peticiones"
echo ""
echo "----------------------------------------"

# Monitorear logs del backend filtrando por login
docker-compose -f docker-compose.prod.yml logs -f backend | grep --line-buffered -E "(POST.*login|Response: [0-9]{3}|Origin:|INFO:app.main)"
