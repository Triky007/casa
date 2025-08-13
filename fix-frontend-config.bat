@echo off
echo 🔨 Solucionando configuración del frontend...

REM Parar solo el frontend
echo ⏹️  Parando frontend...
docker-compose -f docker-compose.prod.yml stop frontend

REM Eliminar imagen del frontend
echo 🗑️  Eliminando imagen anterior del frontend...
docker rmi casa-1-frontend 2>nul

REM Mostrar configuración que se va a usar
echo 📋 Configuración de producción:
echo    VITE_API_URL: '' (vacía - usará rutas relativas)
echo    NODE_ENV: production

REM Reconstruir solo el frontend sin cache
echo 🔨 Reconstruyendo frontend...
docker-compose -f docker-compose.prod.yml build --no-cache frontend

REM Iniciar frontend
echo ▶️  Iniciando frontend...
docker-compose -f docker-compose.prod.yml up -d frontend

REM Esperar y verificar
echo ⏳ Esperando 10 segundos...
timeout /t 10 /nobreak > nul

echo 📊 Estado del frontend:
docker-compose -f docker-compose.prod.yml ps frontend

echo.
echo 🌐 Probando frontend:
curl -s -o nul -w "%%{http_code}" http://localhost:4110/ 2>nul && echo ✅ Frontend responde || echo ❌ Frontend no responde

echo.
echo 🔍 Para verificar la configuración en el navegador:
echo    1. Abre https://family.triky.app
echo    2. Abre DevTools → Network
echo    3. Intenta hacer login
echo    4. La URL debe ser: /api/user/login (sin localhost)

echo.
echo 📝 Si sigue usando localhost:3110, ejecuta:
echo    docker-compose -f docker-compose.prod.yml logs frontend

pause
