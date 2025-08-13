#!/bin/bash

# Script para solucionar problemas de permisos de upload
# Específicamente para el error 500 al subir fotos

set -e

echo "🔧 Solucionando problemas de permisos para uploads..."

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

# Detectar directorio de la aplicación
if [ -f "docker-compose.yml" ]; then
    APP_DIR=$(pwd)
elif [ -f "../docker-compose.yml" ]; then
    APP_DIR=$(cd .. && pwd)
else
    log_error "No se encontró docker-compose.yml"
    exit 1
fi

log_info "Directorio de aplicación: $APP_DIR"

# Directorios críticos
UPLOAD_DIR="$APP_DIR/uploads"
TASK_PHOTOS_DIR="$UPLOAD_DIR/task-photos"
THUMBNAILS_DIR="$TASK_PHOTOS_DIR/thumbnails"

# Crear directorios si no existen
log_info "Creando directorios necesarios..."
mkdir -p "$TASK_PHOTOS_DIR"
mkdir -p "$THUMBNAILS_DIR"

# Obtener información del contenedor Docker
CONTAINER_USER="root"  # Por defecto los contenedores corren como root
HOST_USER=$(whoami)

log_info "Usuario del host: $HOST_USER"
log_info "Usuario del contenedor: $CONTAINER_USER"

# Configurar permisos amplios para que Docker pueda escribir
log_info "Configurando permisos para Docker..."

# Opción 1: Permisos amplios (777) - más permisivo pero funcional
chmod -R 777 "$UPLOAD_DIR"
log_success "Permisos 777 aplicados a $UPLOAD_DIR"

# Opción 2: Cambiar propietario a root (comentado por defecto)
# chown -R root:root "$UPLOAD_DIR"
# log_success "Propietario cambiado a root"

# Verificar permisos actuales
log_info "Verificando permisos actuales:"
ls -la "$UPLOAD_DIR"
ls -la "$TASK_PHOTOS_DIR"

# Probar escritura
TEST_FILE="$TASK_PHOTOS_DIR/test_$(date +%s).tmp"
if echo "test write permissions" > "$TEST_FILE" 2>/dev/null; then
    rm "$TEST_FILE"
    log_success "✅ Permisos de escritura funcionando"
else
    log_error "❌ No se puede escribir en $TASK_PHOTOS_DIR"
    
    # Intentar solución más agresiva
    log_warning "Intentando solución más agresiva..."
    sudo chmod -R 777 "$UPLOAD_DIR" 2>/dev/null || true
    sudo chown -R "$HOST_USER:$HOST_USER" "$UPLOAD_DIR" 2>/dev/null || true
    
    # Probar de nuevo
    if echo "test write permissions" > "$TEST_FILE" 2>/dev/null; then
        rm "$TEST_FILE"
        log_success "✅ Permisos corregidos con sudo"
    else
        log_error "❌ Aún no se puede escribir. Verifica manualmente."
    fi
fi

# Verificar espacio en disco
AVAILABLE_SPACE=$(df -h "$APP_DIR" | awk 'NR==2 {print $4}')
log_info "Espacio disponible: $AVAILABLE_SPACE"

# Verificar que los contenedores puedan acceder
if docker ps | grep -q backend; then
    log_info "Probando acceso desde contenedor backend..."
    
    # Probar crear archivo desde el contenedor
    docker exec $(docker ps | grep backend | awk '{print $1}') \
        sh -c "mkdir -p /app/uploads/task-photos && touch /app/uploads/task-photos/container_test.tmp" 2>/dev/null || \
        log_warning "No se pudo crear archivo desde el contenedor"
    
    # Verificar si el archivo se creó en el host
    if [ -f "$TASK_PHOTOS_DIR/container_test.tmp" ]; then
        log_success "✅ Contenedor puede escribir archivos"
        rm "$TASK_PHOTOS_DIR/container_test.tmp"
    else
        log_error "❌ Contenedor no puede escribir archivos"
    fi
else
    log_warning "Contenedor backend no está corriendo"
fi

# Mostrar configuración recomendada para docker-compose.yml
log_info "Configuración recomendada para docker-compose.yml:"
cat << 'EOF'

  backend:
    # ... otras configuraciones ...
    volumes:
      - ./uploads:/app/uploads:rw  # :rw para read-write explícito
      - ./data:/app/data:rw
    user: "0:0"  # Ejecutar como root para evitar problemas de permisos

EOF

# Comandos útiles para debug
log_info "Comandos útiles para debug:"
echo "• Ver logs del backend: docker-compose logs backend --tail=50 -f"
echo "• Entrar al contenedor: docker exec -it \$(docker ps | grep backend | awk '{print \$1}') bash"
echo "• Verificar permisos en contenedor: docker exec \$(docker ps | grep backend | awk '{print \$1}') ls -la /app/uploads/"
echo "• Probar creación de archivo: docker exec \$(docker ps | grep backend | awk '{print \$1}') touch /app/uploads/test.tmp"

# Crear script de monitoreo
MONITOR_SCRIPT="$APP_DIR/monitor-uploads.sh"
cat > "$MONITOR_SCRIPT" << 'EOF'
#!/bin/bash
# Script para monitorear uploads en tiempo real

echo "🔍 Monitoreando uploads..."
echo "Presiona Ctrl+C para salir"

# Monitorear logs del backend
docker-compose logs backend --tail=10 -f | grep -E "(upload|photo|complete-with-photo|Error|🚨)"
EOF

chmod +x "$MONITOR_SCRIPT"
log_success "Creado script de monitoreo: $MONITOR_SCRIPT"

log_success "🎉 Configuración de permisos completada!"
log_info "Reinicia los contenedores: docker-compose restart"
log_info "Monitorea los logs: ./monitor-uploads.sh"
