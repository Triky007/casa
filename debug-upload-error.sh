#!/bin/bash

# Script para debuggear el error 500 específico en upload de fotos
# Ejecutar en el servidor externo donde está deployada la app

echo "🔍 Debuggeando error 500 en upload de fotos..."

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

log_info "=== DEBUG ERROR 500 UPLOAD FOTOS ==="
log_info "Directorio: $APP_DIR"
echo

# 1. Capturar logs en tiempo real del error específico
log_info "1. Capturando logs del backend en tiempo real..."
echo "   Ahora intenta completar una tarea con foto desde la app móvil"
echo "   Presiona Ctrl+C cuando veas el error para continuar con el análisis"
echo

# Crear archivo temporal para logs
TEMP_LOG="/tmp/backend_error_$(date +%s).log"

# Capturar logs en background
docker-compose logs backend --tail=0 -f > "$TEMP_LOG" &
LOG_PID=$!

# Esperar input del usuario
echo "Presiona ENTER después de intentar el upload desde la app móvil..."
read -r

# Parar captura de logs
kill $LOG_PID 2>/dev/null || true
sleep 1

# 2. Analizar logs capturados
log_info "2. Analizando logs capturados..."
if [ -f "$TEMP_LOG" ] && [ -s "$TEMP_LOG" ]; then
    echo "📋 Logs capturados:"
    echo "----------------------------------------"
    cat "$TEMP_LOG"
    echo "----------------------------------------"
    
    # Buscar errores específicos
    if grep -q "complete-with-photo" "$TEMP_LOG"; then
        log_info "✅ Request de complete-with-photo detectado"
    else
        log_warning "⚠️  No se detectó request de complete-with-photo"
    fi
    
    if grep -q "500" "$TEMP_LOG"; then
        log_error "❌ Error 500 confirmado en logs"
    fi
    
    if grep -q -i "error\|exception\|traceback" "$TEMP_LOG"; then
        log_error "❌ Errores encontrados en logs:"
        grep -i "error\|exception\|traceback" "$TEMP_LOG"
    fi
    
    if grep -q -i "permission\|denied" "$TEMP_LOG"; then
        log_error "❌ Problemas de permisos detectados"
    fi
    
    if grep -q -i "no such file\|directory" "$TEMP_LOG"; then
        log_error "❌ Problemas de directorios detectados"
    fi
    
else
    log_warning "⚠️  No se capturaron logs o están vacíos"
fi

# 3. Verificar estado actual del sistema
log_info "3. Verificando estado del sistema..."

# Verificar contenedor backend
BACKEND_CONTAINER=$(docker ps | grep backend | awk '{print $1}')
if [ -n "$BACKEND_CONTAINER" ]; then
    log_success "✅ Contenedor backend: $BACKEND_CONTAINER"
    
    # Verificar que el contenedor esté saludable
    if docker exec "$BACKEND_CONTAINER" python -c "print('Python OK')" 2>/dev/null; then
        log_success "✅ Python funcionando en contenedor"
    else
        log_error "❌ Python no funciona en contenedor"
    fi
    
    # Verificar dependencias críticas
    log_info "Verificando dependencias críticas..."
    
    if docker exec "$BACKEND_CONTAINER" python -c "from PIL import Image; print('PIL OK')" 2>/dev/null; then
        log_success "✅ PIL/Pillow disponible"
    else
        log_error "❌ PIL/Pillow NO disponible"
    fi
    
    if docker exec "$BACKEND_CONTAINER" python -c "import aiofiles; print('aiofiles OK')" 2>/dev/null; then
        log_success "✅ aiofiles disponible"
    else
        log_error "❌ aiofiles NO disponible"
    fi
    
    # Verificar directorios en contenedor
    log_info "Verificando directorios en contenedor..."
    if docker exec "$BACKEND_CONTAINER" ls -la /app/uploads/ 2>/dev/null; then
        log_success "✅ Directorio /app/uploads/ accesible"
    else
        log_error "❌ Directorio /app/uploads/ NO accesible"
    fi
    
    if docker exec "$BACKEND_CONTAINER" ls -la /app/uploads/task-photos/ 2>/dev/null; then
        log_success "✅ Directorio /app/uploads/task-photos/ accesible"
    else
        log_error "❌ Directorio /app/uploads/task-photos/ NO accesible"
    fi
    
    # Probar escritura en contenedor
    log_info "Probando escritura en contenedor..."
    if docker exec "$BACKEND_CONTAINER" touch /app/uploads/task-photos/test_write.tmp 2>/dev/null; then
        docker exec "$BACKEND_CONTAINER" rm /app/uploads/task-photos/test_write.tmp 2>/dev/null
        log_success "✅ Escritura en contenedor funciona"
    else
        log_error "❌ No se puede escribir en contenedor"
        
        # Mostrar permisos detallados
        log_info "Permisos detallados en contenedor:"
        docker exec "$BACKEND_CONTAINER" ls -la /app/uploads/ 2>/dev/null || log_error "No se pueden ver permisos"
    fi
    
else
    log_error "❌ Contenedor backend no encontrado"
fi

# 4. Verificar directorios en host
log_info "4. Verificando directorios en host..."
UPLOAD_DIR="$APP_DIR/uploads"
TASK_PHOTOS_DIR="$UPLOAD_DIR/task-photos"

if [ -d "$TASK_PHOTOS_DIR" ]; then
    log_success "✅ $TASK_PHOTOS_DIR existe"
    
    # Mostrar permisos
    PERMS=$(stat -c "%a" "$TASK_PHOTOS_DIR" 2>/dev/null || echo "unknown")
    OWNER=$(stat -c "%U:%G" "$TASK_PHOTOS_DIR" 2>/dev/null || echo "unknown")
    log_info "Permisos: $PERMS ($OWNER)"
    
    # Probar escritura desde host
    if echo "test" > "$TASK_PHOTOS_DIR/host_test.tmp" 2>/dev/null; then
        rm "$TASK_PHOTOS_DIR/host_test.tmp"
        log_success "✅ Escritura desde host funciona"
    else
        log_error "❌ No se puede escribir desde host"
    fi
else
    log_error "❌ $TASK_PHOTOS_DIR NO existe"
fi

# 5. Probar endpoint directamente
log_info "5. Probando endpoint directamente..."

# Crear imagen de prueba
TEST_IMAGE="/tmp/test_image.jpg"
echo "fake image data" > "$TEST_IMAGE"

# Intentar upload directo (necesitarás un token válido)
log_info "Para probar el endpoint directamente, necesitas:"
echo "1. Un token de autenticación válido"
echo "2. Un assignment_id válido"
echo "3. Ejecutar:"
echo "   curl -X POST \\"
echo "     -H 'Authorization: Bearer YOUR_TOKEN' \\"
echo "     -F 'file=@$TEST_IMAGE' \\"
echo "     https://api.family.triky.app/api/tasks/complete-with-photo/ASSIGNMENT_ID"

# 6. Generar reporte
log_info "6. Generando reporte..."
REPORT_FILE="upload_error_report_$(date +%Y%m%d_%H%M%S).txt"

cat > "$REPORT_FILE" << EOF
=== REPORTE DE ERROR 500 UPLOAD FOTOS ===
Fecha: $(date)
Directorio: $APP_DIR

=== LOGS CAPTURADOS ===
$(cat "$TEMP_LOG" 2>/dev/null || echo "No se capturaron logs")

=== ESTADO DEL SISTEMA ===
Contenedor backend: $BACKEND_CONTAINER
Directorio uploads existe: $([ -d "$TASK_PHOTOS_DIR" ] && echo "SÍ" || echo "NO")
Permisos uploads: $(stat -c "%a %U:%G" "$TASK_PHOTOS_DIR" 2>/dev/null || echo "unknown")

=== VERIFICACIONES ===
$(docker exec "$BACKEND_CONTAINER" python -c "from PIL import Image; print('PIL: OK')" 2>/dev/null || echo "PIL: ERROR")
$(docker exec "$BACKEND_CONTAINER" python -c "import aiofiles; print('aiofiles: OK')" 2>/dev/null || echo "aiofiles: ERROR")
$(docker exec "$BACKEND_CONTAINER" ls -la /app/uploads/task-photos/ 2>/dev/null || echo "Directorio contenedor: ERROR")

=== DOCKER COMPOSE ===
$(grep -A 10 -B 5 "uploads" docker-compose.yml || echo "No se encontró configuración de uploads")
EOF

log_success "✅ Reporte generado: $REPORT_FILE"

# Limpiar archivos temporales
rm -f "$TEMP_LOG" "$TEST_IMAGE"

echo
log_info "=== PRÓXIMOS PASOS ==="
echo "1. Revisar el reporte generado: $REPORT_FILE"
echo "2. Si hay errores de permisos: ./fix-upload-permissions.sh"
echo "3. Si faltan directorios: ./setup-server-directories.sh"
echo "4. Si faltan dependencias: docker-compose build --no-cache backend"
echo "5. Reiniciar contenedores: docker-compose restart"

log_success "🎉 Debug completado!"
