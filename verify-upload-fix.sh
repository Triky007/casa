#!/bin/bash

# Script para verificar que la corrección de uploads funcione
# Ejecutar después de hacer git pull y docker-compose up -d

echo "🔍 Verificando corrección de uploads..."

# Colores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
log_success() { echo -e "${GREEN}✅ $1${NC}"; }
log_warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }
log_error() { echo -e "${RED}❌ $1${NC}"; }

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    log_error "No se encontró docker-compose.yml"
    exit 1
fi

log_info "=== VERIFICACIÓN POST-CORRECCIÓN ==="
echo

# 1. Verificar configuración de docker-compose.yml
log_info "1. Verificando configuración de docker-compose.yml..."
if grep -q "./uploads:/app/uploads" docker-compose.yml; then
    log_success "✅ Volumen de uploads configurado correctamente"
else
    log_error "❌ Volumen de uploads NO configurado"
    echo "   Ejecuta: git pull"
    exit 1
fi

# 2. Verificar que los contenedores estén corriendo
log_info "2. Verificando contenedores..."
if docker-compose ps | grep -q "backend.*Up"; then
    log_success "✅ Contenedor backend corriendo"
    BACKEND_CONTAINER=$(docker ps | grep backend | awk '{print $1}')
    log_info "   Container ID: $BACKEND_CONTAINER"
else
    log_warning "⚠️  Contenedor backend no está corriendo"
    log_info "   Ejecutando: docker-compose up -d"
    docker-compose up -d
    sleep 10
    BACKEND_CONTAINER=$(docker ps | grep backend | awk '{print $1}')
fi

# 3. Verificar montaje de volúmenes
log_info "3. Verificando montaje de volúmenes..."
if [ -n "$BACKEND_CONTAINER" ]; then
    if docker exec "$BACKEND_CONTAINER" ls -la /app/uploads/ >/dev/null 2>&1; then
        log_success "✅ Directorio /app/uploads/ accesible desde contenedor"
        
        # Mostrar contenido
        log_info "   Contenido de /app/uploads/:"
        docker exec "$BACKEND_CONTAINER" ls -la /app/uploads/
        
        if docker exec "$BACKEND_CONTAINER" ls -la /app/uploads/task-photos/ >/dev/null 2>&1; then
            log_success "✅ Directorio /app/uploads/task-photos/ accesible"
        else
            log_error "❌ Directorio /app/uploads/task-photos/ NO accesible"
        fi
    else
        log_error "❌ Directorio /app/uploads/ NO accesible desde contenedor"
    fi
else
    log_error "❌ No se encontró contenedor backend"
fi

# 4. Probar escritura desde contenedor
log_info "4. Probando escritura desde contenedor..."
if [ -n "$BACKEND_CONTAINER" ]; then
    TEST_FILE="container_write_test_$(date +%s).tmp"
    if docker exec "$BACKEND_CONTAINER" touch "/app/uploads/task-photos/$TEST_FILE" 2>/dev/null; then
        log_success "✅ Escritura desde contenedor funciona"
        
        # Verificar que el archivo aparezca en el host
        if [ -f "uploads/task-photos/$TEST_FILE" ]; then
            log_success "✅ Archivo visible desde host (volumen montado correctamente)"
            rm -f "uploads/task-photos/$TEST_FILE"
        else
            log_warning "⚠️  Archivo no visible desde host"
        fi
        
        # Limpiar archivo del contenedor
        docker exec "$BACKEND_CONTAINER" rm -f "/app/uploads/task-photos/$TEST_FILE" 2>/dev/null
    else
        log_error "❌ No se puede escribir desde contenedor"
        
        # Mostrar información de debug
        log_info "   Debug info:"
        docker exec "$BACKEND_CONTAINER" whoami 2>/dev/null || log_error "   No se puede obtener usuario"
        docker exec "$BACKEND_CONTAINER" ls -la /app/uploads/ 2>/dev/null || log_error "   No se puede listar /app/uploads/"
    fi
fi

# 5. Verificar dependencias Python
log_info "5. Verificando dependencias Python..."
if [ -n "$BACKEND_CONTAINER" ]; then
    if docker exec "$BACKEND_CONTAINER" python -c "from PIL import Image; print('PIL OK')" 2>/dev/null; then
        log_success "✅ PIL/Pillow disponible"
    else
        log_error "❌ PIL/Pillow NO disponible"
        log_info "   Ejecuta: docker-compose build --no-cache backend"
    fi
    
    if docker exec "$BACKEND_CONTAINER" python -c "import aiofiles; print('aiofiles OK')" 2>/dev/null; then
        log_success "✅ aiofiles disponible"
    else
        log_error "❌ aiofiles NO disponible"
        log_info "   Ejecuta: docker-compose build --no-cache backend"
    fi
fi

# 6. Probar endpoint de salud
log_info "6. Probando endpoint de salud..."
if curl -s http://localhost:3110/health | grep -q "healthy"; then
    log_success "✅ Backend responde correctamente"
else
    log_warning "⚠️  Backend no responde o no está saludable"
    log_info "   Verifica logs: docker-compose logs backend --tail=20"
fi

# 7. Mostrar logs recientes
log_info "7. Logs recientes del backend..."
echo "----------------------------------------"
docker-compose logs backend --tail=10
echo "----------------------------------------"

# Resumen final
echo
log_info "=== RESUMEN ==="

# Contar problemas
PROBLEMS=0

if ! grep -q "./uploads:/app/uploads" docker-compose.yml; then
    ((PROBLEMS++))
fi

if [ -z "$BACKEND_CONTAINER" ]; then
    ((PROBLEMS++))
fi

if [ -n "$BACKEND_CONTAINER" ] && ! docker exec "$BACKEND_CONTAINER" ls /app/uploads/ >/dev/null 2>&1; then
    ((PROBLEMS++))
fi

if [ -n "$BACKEND_CONTAINER" ] && ! docker exec "$BACKEND_CONTAINER" touch /app/uploads/test.tmp 2>/dev/null; then
    ((PROBLEMS++))
fi

if [ $PROBLEMS -eq 0 ]; then
    log_success "🎉 ¡TODO FUNCIONA CORRECTAMENTE!"
    echo
    log_info "✅ Volumen configurado"
    log_info "✅ Contenedor corriendo"
    log_info "✅ Directorios accesibles"
    log_info "✅ Escritura funciona"
    echo
    log_success "🚀 Ahora puedes probar el upload de fotos desde la app móvil"
    echo
    log_info "Para monitorear en tiempo real:"
    echo "   docker-compose logs backend -f"
else
    log_warning "⚠️  Se encontraron $PROBLEMS problema(s)"
    echo
    log_info "Pasos para solucionar:"
    echo "1. Asegúrate de haber hecho: git pull"
    echo "2. Reinicia contenedores: docker-compose down && docker-compose up -d"
    echo "3. Si persisten problemas: docker-compose build --no-cache backend"
    echo "4. Para debug detallado: ./debug-upload-error.sh"
fi

echo
log_info "Comandos útiles:"
echo "• Ver logs: docker-compose logs backend --tail=50 -f"
echo "• Reiniciar: docker-compose restart backend"
echo "• Reconstruir: docker-compose build --no-cache backend"
echo "• Debug: ./debug-upload-error.sh"
