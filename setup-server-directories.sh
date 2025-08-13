#!/bin/bash

# Script para configurar directorios y permisos en servidor Linux+Apache
# Para la aplicación Family Tasks

set -e  # Salir si hay algún error

echo "🚀 Configurando directorios para Family Tasks en servidor externo..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Detectar el directorio base de la aplicación
if [ -f "docker-compose.yml" ]; then
    APP_DIR=$(pwd)
    log_info "Detectado directorio de aplicación: $APP_DIR"
elif [ -f "../docker-compose.yml" ]; then
    APP_DIR=$(cd .. && pwd)
    log_info "Detectado directorio de aplicación: $APP_DIR"
else
    log_error "No se encontró docker-compose.yml. Ejecuta este script desde el directorio de la aplicación."
    exit 1
fi

# Directorios necesarios
UPLOAD_DIR="$APP_DIR/uploads"
TASK_PHOTOS_DIR="$UPLOAD_DIR/task-photos"
THUMBNAILS_DIR="$TASK_PHOTOS_DIR/thumbnails"
DATA_DIR="$APP_DIR/data"
POSTGRES_DATA_DIR="$DATA_DIR/postgres"

log_info "Creando directorios necesarios..."

# Crear directorios
directories=(
    "$UPLOAD_DIR"
    "$TASK_PHOTOS_DIR"
    "$THUMBNAILS_DIR"
    "$DATA_DIR"
    "$POSTGRES_DATA_DIR"
)

for dir in "${directories[@]}"; do
    if [ ! -d "$dir" ]; then
        mkdir -p "$dir"
        log_success "Creado directorio: $dir"
    else
        log_info "Directorio ya existe: $dir"
    fi
done

log_info "Configurando permisos..."

# Obtener el usuario que ejecuta Docker (normalmente root o el usuario actual)
DOCKER_USER=$(whoami)
log_info "Usuario actual: $DOCKER_USER"

# Configurar permisos para directorios de upload
chmod -R 755 "$UPLOAD_DIR"
chown -R "$DOCKER_USER:$DOCKER_USER" "$UPLOAD_DIR"
log_success "Permisos configurados para uploads"

# Configurar permisos para datos de PostgreSQL
chmod -R 700 "$POSTGRES_DATA_DIR"
chown -R "$DOCKER_USER:$DOCKER_USER" "$POSTGRES_DATA_DIR"
log_success "Permisos configurados para PostgreSQL"

# Crear archivo de prueba para verificar permisos de escritura
TEST_FILE="$TASK_PHOTOS_DIR/test_write.tmp"
if echo "test" > "$TEST_FILE" 2>/dev/null; then
    rm "$TEST_FILE"
    log_success "Permisos de escritura verificados"
else
    log_error "No se pueden escribir archivos en $TASK_PHOTOS_DIR"
    exit 1
fi

# Verificar espacio en disco
AVAILABLE_SPACE=$(df -h "$APP_DIR" | awk 'NR==2 {print $4}')
log_info "Espacio disponible en disco: $AVAILABLE_SPACE"

# Crear archivo .gitkeep para mantener directorios en git
for dir in "${directories[@]}"; do
    if [ ! -f "$dir/.gitkeep" ]; then
        touch "$dir/.gitkeep"
        log_success "Creado .gitkeep en $dir"
    fi
done

# Verificar que Docker esté instalado y funcionando
if command -v docker >/dev/null 2>&1; then
    log_success "Docker está instalado"
    if docker ps >/dev/null 2>&1; then
        log_success "Docker está funcionando"
    else
        log_warning "Docker está instalado pero no se puede conectar al daemon"
    fi
else
    log_error "Docker no está instalado"
fi

# Verificar que Docker Compose esté instalado
if command -v docker-compose >/dev/null 2>&1; then
    log_success "Docker Compose está instalado"
elif command -v docker compose >/dev/null 2>&1; then
    log_success "Docker Compose (plugin) está instalado"
else
    log_error "Docker Compose no está instalado"
fi

# Mostrar resumen de directorios creados
log_info "Resumen de directorios configurados:"
echo "📁 $UPLOAD_DIR"
echo "  └── 📸 task-photos/"
echo "      └── 🖼️  thumbnails/"
echo "📁 $DATA_DIR"
echo "  └── 🗄️  postgres/"

# Mostrar comandos útiles
log_info "Comandos útiles:"
echo "• Ver logs del backend: docker-compose logs backend --tail=50"
echo "• Reiniciar servicios: docker-compose restart"
echo "• Ver espacio usado: du -sh $UPLOAD_DIR"
echo "• Limpiar uploads: rm -rf $TASK_PHOTOS_DIR/* (¡cuidado!)"

# Verificar configuración de Apache si está presente
if command -v apache2 >/dev/null 2>&1 || command -v httpd >/dev/null 2>&1; then
    log_info "Apache detectado. Recuerda configurar:"
    echo "• Proxy pass para el backend (puerto 3110)"
    echo "• Servir archivos estáticos desde $UPLOAD_DIR"
    echo "• Configurar CORS si es necesario"
fi

log_success "¡Configuración completada!"
log_info "Ahora puedes ejecutar: docker-compose up -d"
