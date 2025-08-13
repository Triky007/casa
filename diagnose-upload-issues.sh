#!/bin/bash

# Script de diagnóstico para problemas de upload de fotos
# Identifica la causa específica del error 500

echo "🔍 Diagnosticando problemas de upload de fotos..."

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

# Detectar directorio
if [ -f "docker-compose.yml" ]; then
    APP_DIR=$(pwd)
elif [ -f "../docker-compose.yml" ]; then
    APP_DIR=$(cd .. && pwd)
else
    log_error "No se encontró docker-compose.yml"
    exit 1
fi

log_info "=== DIAGNÓSTICO DE UPLOAD DE FOTOS ==="
log_info "Directorio: $APP_DIR"
echo

# 1. Verificar estructura de directorios
log_info "1. Verificando estructura de directorios..."
UPLOAD_DIR="$APP_DIR/uploads"
TASK_PHOTOS_DIR="$UPLOAD_DIR/task-photos"
THUMBNAILS_DIR="$TASK_PHOTOS_DIR/thumbnails"

if [ -d "$UPLOAD_DIR" ]; then
    log_success "✅ $UPLOAD_DIR existe"
else
    log_error "❌ $UPLOAD_DIR NO existe"
fi

if [ -d "$TASK_PHOTOS_DIR" ]; then
    log_success "✅ $TASK_PHOTOS_DIR existe"
else
    log_error "❌ $TASK_PHOTOS_DIR NO existe"
fi

if [ -d "$THUMBNAILS_DIR" ]; then
    log_success "✅ $THUMBNAILS_DIR existe"
else
    log_error "❌ $THUMBNAILS_DIR NO existe"
fi

# 2. Verificar permisos
log_info "2. Verificando permisos..."
if [ -d "$UPLOAD_DIR" ]; then
    UPLOAD_PERMS=$(stat -c "%a" "$UPLOAD_DIR" 2>/dev/null || echo "unknown")
    UPLOAD_OWNER=$(stat -c "%U:%G" "$UPLOAD_DIR" 2>/dev/null || echo "unknown")
    log_info "Permisos de uploads: $UPLOAD_PERMS ($UPLOAD_OWNER)"
    
    if [ "$UPLOAD_PERMS" -ge "755" ]; then
        log_success "✅ Permisos suficientes"
    else
        log_warning "⚠️  Permisos insuficientes: $UPLOAD_PERMS"
    fi
fi

# 3. Probar escritura
log_info "3. Probando escritura..."
TEST_FILE="$TASK_PHOTOS_DIR/diagnostic_test_$(date +%s).tmp"
if echo "test" > "$TEST_FILE" 2>/dev/null; then
    rm "$TEST_FILE"
    log_success "✅ Escritura desde host funciona"
else
    log_error "❌ No se puede escribir desde host"
fi

# 4. Verificar contenedores
log_info "4. Verificando contenedores..."
if docker ps | grep -q backend; then
    BACKEND_CONTAINER=$(docker ps | grep backend | awk '{print $1}')
    log_success "✅ Contenedor backend corriendo: $BACKEND_CONTAINER"
    
    # Verificar montaje de volúmenes
    log_info "Verificando volúmenes montados..."
    docker exec "$BACKEND_CONTAINER" ls -la /app/uploads/ 2>/dev/null || log_error "❌ No se puede acceder a /app/uploads en contenedor"
    
    # Probar escritura desde contenedor
    if docker exec "$BACKEND_CONTAINER" touch /app/uploads/container_test.tmp 2>/dev/null; then
        docker exec "$BACKEND_CONTAINER" rm /app/uploads/container_test.tmp 2>/dev/null
        log_success "✅ Escritura desde contenedor funciona"
    else
        log_error "❌ No se puede escribir desde contenedor"
    fi
    
    # Verificar usuario del contenedor
    CONTAINER_USER=$(docker exec "$BACKEND_CONTAINER" whoami 2>/dev/null || echo "unknown")
    log_info "Usuario del contenedor: $CONTAINER_USER"
    
else
    log_error "❌ Contenedor backend no está corriendo"
fi

# 5. Verificar dependencias Python
log_info "5. Verificando dependencias Python..."
if docker ps | grep -q backend; then
    # Verificar PIL/Pillow
    if docker exec "$BACKEND_CONTAINER" python -c "from PIL import Image; print('PIL OK')" 2>/dev/null; then
        log_success "✅ PIL/Pillow disponible"
    else
        log_error "❌ PIL/Pillow no disponible"
    fi
    
    # Verificar aiofiles
    if docker exec "$BACKEND_CONTAINER" python -c "import aiofiles; print('aiofiles OK')" 2>/dev/null; then
        log_success "✅ aiofiles disponible"
    else
        log_error "❌ aiofiles no disponible"
    fi
fi

# 6. Verificar logs recientes
log_info "6. Verificando logs recientes..."
if docker ps | grep -q backend; then
    log_info "Últimos errores en logs:"
    docker logs "$BACKEND_CONTAINER" --tail=20 2>&1 | grep -E "(Error|error|🚨|Exception|Traceback)" || log_info "No se encontraron errores recientes"
fi

# 7. Verificar espacio en disco
log_info "7. Verificando espacio en disco..."
AVAILABLE_SPACE=$(df -h "$APP_DIR" | awk 'NR==2 {print $4}')
AVAILABLE_BYTES=$(df "$APP_DIR" | awk 'NR==2 {print $4}')
log_info "Espacio disponible: $AVAILABLE_SPACE"

if [ "$AVAILABLE_BYTES" -lt 1048576 ]; then  # Menos de 1GB
    log_warning "⚠️  Poco espacio en disco disponible"
else
    log_success "✅ Espacio en disco suficiente"
fi

# 8. Verificar configuración de docker-compose
log_info "8. Verificando configuración de docker-compose..."
if grep -q "uploads.*uploads" docker-compose.yml; then
    log_success "✅ Volumen de uploads configurado"
else
    log_warning "⚠️  Volumen de uploads no encontrado en docker-compose.yml"
fi

# 9. Probar endpoint directamente
log_info "9. Probando conectividad del endpoint..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3110/health | grep -q "200"; then
    log_success "✅ Backend responde en puerto 3110"
else
    log_warning "⚠️  Backend no responde en puerto 3110"
fi

# Resumen y recomendaciones
echo
log_info "=== RESUMEN Y RECOMENDACIONES ==="

if [ ! -d "$TASK_PHOTOS_DIR" ]; then
    log_error "🔧 ACCIÓN REQUERIDA: Crear directorios"
    echo "   Ejecuta: ./setup-server-directories.sh"
fi

if [ ! -w "$TASK_PHOTOS_DIR" ] 2>/dev/null; then
    log_error "🔧 ACCIÓN REQUERIDA: Corregir permisos"
    echo "   Ejecuta: ./fix-upload-permissions.sh"
fi

if ! docker ps | grep -q backend; then
    log_error "🔧 ACCIÓN REQUERIDA: Iniciar contenedores"
    echo "   Ejecuta: docker-compose up -d"
fi

log_info "Para monitorear en tiempo real:"
echo "   docker-compose logs backend --tail=50 -f"

log_info "Para probar upload manualmente:"
echo "   curl -X POST -F 'file=@test.jpg' http://localhost:3110/api/tasks/complete-with-photo/1"

echo
log_success "🎉 Diagnóstico completado!"
