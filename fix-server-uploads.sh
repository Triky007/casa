#!/bin/bash

# Script maestro para solucionar problemas de upload en servidor externo
# Ejecuta todos los pasos necesarios automáticamente

set -e

echo "🚀 Solucionando problemas de upload en servidor externo..."
echo "Este script ejecutará todos los pasos necesarios automáticamente."
echo

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
    log_error "No se encontró docker-compose.yml. Ejecuta este script desde el directorio de la aplicación."
    exit 1
fi

log_info "Directorio de aplicación: $(pwd)"

# Paso 1: Hacer scripts ejecutables
log_info "Paso 1: Configurando permisos de scripts..."
chmod +x setup-server-directories.sh 2>/dev/null || log_warning "setup-server-directories.sh no encontrado"
chmod +x fix-upload-permissions.sh 2>/dev/null || log_warning "fix-upload-permissions.sh no encontrado"
chmod +x diagnose-upload-issues.sh 2>/dev/null || log_warning "diagnose-upload-issues.sh no encontrado"
log_success "Scripts configurados"

# Paso 2: Configurar directorios
log_info "Paso 2: Configurando directorios..."
if [ -f "setup-server-directories.sh" ]; then
    ./setup-server-directories.sh
else
    # Configuración manual si el script no existe
    log_warning "Configurando directorios manualmente..."
    mkdir -p uploads/task-photos/thumbnails
    mkdir -p data/postgres
    chmod -R 777 uploads/
    log_success "Directorios configurados manualmente"
fi

# Paso 3: Corregir permisos
log_info "Paso 3: Corrigiendo permisos..."
if [ -f "fix-upload-permissions.sh" ]; then
    ./fix-upload-permissions.sh
else
    # Corrección manual si el script no existe
    log_warning "Corrigiendo permisos manualmente..."
    chmod -R 777 uploads/
    chown -R $(whoami):$(whoami) uploads/ 2>/dev/null || true
    log_success "Permisos corregidos manualmente"
fi

# Paso 4: Verificar estructura
log_info "Paso 4: Verificando estructura de directorios..."
if [ -d "uploads/task-photos/thumbnails" ]; then
    log_success "✅ Estructura de directorios correcta"
else
    log_error "❌ Estructura de directorios incorrecta"
    exit 1
fi

# Paso 5: Probar escritura
log_info "Paso 5: Probando permisos de escritura..."
TEST_FILE="uploads/task-photos/test_$(date +%s).tmp"
if echo "test" > "$TEST_FILE" 2>/dev/null; then
    rm "$TEST_FILE"
    log_success "✅ Permisos de escritura funcionando"
else
    log_error "❌ No se puede escribir en uploads/task-photos/"
    
    # Intentar solución más agresiva
    log_warning "Intentando solución más agresiva..."
    sudo chmod -R 777 uploads/ 2>/dev/null || log_warning "No se pudo usar sudo"
    
    # Probar de nuevo
    if echo "test" > "$TEST_FILE" 2>/dev/null; then
        rm "$TEST_FILE"
        log_success "✅ Permisos corregidos con sudo"
    else
        log_error "❌ Aún no se puede escribir. Verifica manualmente los permisos."
    fi
fi

# Paso 6: Verificar Docker
log_info "Paso 6: Verificando Docker..."
if command -v docker >/dev/null 2>&1; then
    log_success "✅ Docker instalado"
    if docker ps >/dev/null 2>&1; then
        log_success "✅ Docker funcionando"
    else
        log_error "❌ Docker no responde"
        exit 1
    fi
else
    log_error "❌ Docker no instalado"
    exit 1
fi

# Paso 7: Verificar contenedores
log_info "Paso 7: Verificando contenedores..."
if docker-compose ps | grep -q backend; then
    log_success "✅ Contenedor backend encontrado"
else
    log_warning "⚠️  Contenedor backend no está corriendo"
    log_info "Iniciando contenedores..."
    docker-compose up -d
    sleep 5
fi

# Paso 8: Reiniciar contenedores para aplicar cambios
log_info "Paso 8: Reiniciando contenedores..."
docker-compose restart
log_success "✅ Contenedores reiniciados"

# Paso 9: Esperar a que el backend esté listo
log_info "Paso 9: Esperando a que el backend esté listo..."
for i in {1..30}; do
    if curl -s http://localhost:3110/health >/dev/null 2>&1; then
        log_success "✅ Backend está respondiendo"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "❌ Backend no responde después de 30 segundos"
        exit 1
    fi
    sleep 1
done

# Paso 10: Probar desde contenedor
log_info "Paso 10: Probando escritura desde contenedor..."
BACKEND_CONTAINER=$(docker ps | grep backend | awk '{print $1}')
if [ -n "$BACKEND_CONTAINER" ]; then
    if docker exec "$BACKEND_CONTAINER" touch /app/uploads/task-photos/container_test.tmp 2>/dev/null; then
        docker exec "$BACKEND_CONTAINER" rm /app/uploads/task-photos/container_test.tmp 2>/dev/null
        log_success "✅ Contenedor puede escribir archivos"
    else
        log_error "❌ Contenedor no puede escribir archivos"
        
        # Mostrar información de debug
        log_info "Información de debug:"
        docker exec "$BACKEND_CONTAINER" ls -la /app/uploads/ 2>/dev/null || log_error "No se puede acceder a /app/uploads"
        docker exec "$BACKEND_CONTAINER" whoami 2>/dev/null || log_error "No se puede obtener usuario del contenedor"
    fi
else
    log_error "❌ No se encontró contenedor backend"
fi

# Paso 11: Diagnóstico final
log_info "Paso 11: Ejecutando diagnóstico final..."
if [ -f "diagnose-upload-issues.sh" ]; then
    ./diagnose-upload-issues.sh
else
    log_warning "Script de diagnóstico no encontrado, verificando manualmente..."
    ls -la uploads/task-photos/
    df -h .
fi

# Resumen final
echo
log_info "=== RESUMEN FINAL ==="
log_success "🎉 Configuración completada!"
echo
log_info "Próximos pasos:"
echo "1. Probar la aplicación móvil completando una tarea con foto"
echo "2. Monitorear logs: docker-compose logs backend -f"
echo "3. Si hay errores, revisar: SERVIDOR-EXTERNO-SETUP.md"
echo
log_info "Comandos útiles:"
echo "• Ver logs: docker-compose logs backend --tail=50"
echo "• Reiniciar: docker-compose restart"
echo "• Diagnóstico: ./diagnose-upload-issues.sh"
echo "• Monitoreo: ./monitor-uploads.sh"

log_success "¡Listo para probar uploads de fotos!"

# Paso extra: Ofrecer debug en tiempo real
echo
log_info "¿Quieres debuggear el error en tiempo real? (y/n)"
read -r DEBUG_CHOICE

if [ "$DEBUG_CHOICE" = "y" ] || [ "$DEBUG_CHOICE" = "Y" ]; then
    log_info "Ejecutando debug en tiempo real..."
    if [ -f "debug-upload-error.sh" ]; then
        chmod +x debug-upload-error.sh
        ./debug-upload-error.sh
    else
        log_warning "Script de debug no encontrado"
    fi
fi
