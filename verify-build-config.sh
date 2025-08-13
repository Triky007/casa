#!/bin/bash

echo "🔍 Verificando configuración de build..."

echo ""
echo "📁 Archivos de configuración:"
echo "==================================="

echo ""
echo "📄 .env (desarrollo):"
cat frontend/.env

echo ""
echo "📄 .env.production:"
cat frontend/.env.production

echo ""
echo "📄 docker-compose.prod.yml (variables de entorno):"
grep -A 5 "environment:" docker-compose.prod.yml

echo ""
echo "📄 Dockerfile (variables ENV):"
grep -A 2 -B 2 "ENV" frontend/Dockerfile

echo ""
echo "🔨 Para reconstruir con configuración correcta:"
echo "   ./fix-frontend-config.sh"

echo ""
echo "🌐 Para verificar en el navegador:"
echo "   1. Ejecuta: ./fix-frontend-config.sh"
echo "   2. Abre: https://family.triky.app"
echo "   3. DevTools → Network → Intenta login"
echo "   4. Debe mostrar: /api/user/login (NO localhost:3110)"
