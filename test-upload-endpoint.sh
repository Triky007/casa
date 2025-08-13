#!/bin/bash

# Script para probar el endpoint de upload directamente
# Útil para debuggear el error 500 sin usar la app móvil

echo "🧪 Probando endpoint de upload directamente..."

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

# Configuración
API_URL="https://api.family.triky.app"
LOCAL_URL="http://localhost:3110"

# Función para crear imagen de prueba
create_test_image() {
    local filename="$1"
    
    # Crear una imagen PNG simple de 1x1 pixel
    echo -n -e '\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\tpHYs\x00\x00\x0b\x13\x00\x00\x0b\x13\x01\x00\x9a\x9c\x18\x00\x00\x00\nIDATx\x9cc\xf8\x00\x00\x00\x01\x00\x01\x00\x00\x00\x00IEND\xaeB`\x82' > "$filename"
}

# Función para probar login y obtener token
test_login() {
    local url="$1"
    local username="$2"
    local password="$3"
    
    log_info "Probando login en $url..."
    
    local response=$(curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "{\"username\":\"$username\",\"password\":\"$password\"}" \
        "$url/api/user/login" 2>/dev/null)
    
    if [ $? -eq 0 ] && echo "$response" | grep -q "access_token"; then
        echo "$response" | grep -o '"access_token":"[^"]*"' | cut -d'"' -f4
    else
        echo ""
    fi
}

# Función para obtener assignments
get_assignments() {
    local url="$1"
    local token="$2"
    
    log_info "Obteniendo assignments..."
    
    curl -s -X GET \
        -H "Authorization: Bearer $token" \
        "$url/api/tasks/assignments" 2>/dev/null
}

# Función para probar upload
test_upload() {
    local url="$1"
    local token="$2"
    local assignment_id="$3"
    local image_file="$4"
    
    log_info "Probando upload a assignment $assignment_id..."
    
    local response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST \
        -H "Authorization: Bearer $token" \
        -F "file=@$image_file" \
        "$url/api/tasks/complete-with-photo/$assignment_id" 2>/dev/null)
    
    local body=$(echo "$response" | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
    local status=$(echo "$response" | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')
    
    echo "Status: $status"
    echo "Response: $body"
    
    return $status
}

# Script principal
log_info "=== TEST UPLOAD ENDPOINT ==="

# Crear imagen de prueba
TEST_IMAGE="/tmp/test_upload_$(date +%s).png"
create_test_image "$TEST_IMAGE"
log_success "✅ Imagen de prueba creada: $TEST_IMAGE"

# Solicitar credenciales
echo
log_info "Ingresa las credenciales para probar:"
read -p "Username: " USERNAME
read -s -p "Password: " PASSWORD
echo

if [ -z "$USERNAME" ] || [ -z "$PASSWORD" ]; then
    log_error "❌ Username y password son requeridos"
    exit 1
fi

# Probar login en servidor externo
log_info "1. Probando login en servidor externo..."
TOKEN=$(test_login "$API_URL" "$USERNAME" "$PASSWORD")

if [ -n "$TOKEN" ]; then
    log_success "✅ Login exitoso en servidor externo"
    log_info "Token: ${TOKEN:0:20}..."
    
    # Obtener assignments
    log_info "2. Obteniendo assignments..."
    ASSIGNMENTS=$(get_assignments "$API_URL" "$TOKEN")
    
    if echo "$ASSIGNMENTS" | grep -q "id"; then
        log_success "✅ Assignments obtenidos"
        
        # Extraer primer assignment ID
        ASSIGNMENT_ID=$(echo "$ASSIGNMENTS" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)
        
        if [ -n "$ASSIGNMENT_ID" ]; then
            log_info "Usando assignment ID: $ASSIGNMENT_ID"
            
            # Probar upload
            log_info "3. Probando upload..."
            echo "----------------------------------------"
            test_upload "$API_URL" "$TOKEN" "$ASSIGNMENT_ID" "$TEST_IMAGE"
            UPLOAD_STATUS=$?
            echo "----------------------------------------"
            
            if [ $UPLOAD_STATUS -eq 200 ]; then
                log_success "✅ Upload exitoso!"
            elif [ $UPLOAD_STATUS -eq 500 ]; then
                log_error "❌ Error 500 confirmado"
                log_info "El problema está en el servidor backend"
            else
                log_warning "⚠️  Status inesperado: $UPLOAD_STATUS"
            fi
        else
            log_error "❌ No se pudo extraer assignment ID"
            echo "Assignments response: $ASSIGNMENTS"
        fi
    else
        log_error "❌ No se pudieron obtener assignments"
        echo "Response: $ASSIGNMENTS"
    fi
else
    log_error "❌ Login falló en servidor externo"
    
    # Probar en local como fallback
    log_info "Probando login en servidor local..."
    LOCAL_TOKEN=$(test_login "$LOCAL_URL" "$USERNAME" "$PASSWORD")
    
    if [ -n "$LOCAL_TOKEN" ]; then
        log_success "✅ Login exitoso en servidor local"
        log_info "El problema parece ser específico del servidor externo"
    else
        log_error "❌ Login también falló en servidor local"
        log_error "Verifica las credenciales"
    fi
fi

# Probar health check
log_info "4. Probando health check..."
HEALTH_EXTERNAL=$(curl -s "$API_URL/health" 2>/dev/null)
HEALTH_LOCAL=$(curl -s "$LOCAL_URL/health" 2>/dev/null)

echo "Health externo: $HEALTH_EXTERNAL"
echo "Health local: $HEALTH_LOCAL"

# Limpiar
rm -f "$TEST_IMAGE"

echo
log_info "=== CONCLUSIONES ==="

if [ -n "$TOKEN" ] && [ $UPLOAD_STATUS -eq 500 ]; then
    log_error "🚨 PROBLEMA CONFIRMADO:"
    echo "• Login funciona ✅"
    echo "• Assignments se obtienen ✅"
    echo "• Upload falla con 500 ❌"
    echo
    log_info "💡 PRÓXIMOS PASOS:"
    echo "1. Ejecutar: ./debug-upload-error.sh"
    echo "2. Revisar logs del backend: docker-compose logs backend --tail=50"
    echo "3. Verificar permisos: ./fix-upload-permissions.sh"
    echo "4. Verificar directorios: ls -la uploads/task-photos/"
elif [ -z "$TOKEN" ]; then
    log_error "🚨 PROBLEMA DE AUTENTICACIÓN:"
    echo "• No se pudo obtener token"
    echo "• Verifica credenciales"
    echo "• Verifica que el usuario exista"
else
    log_success "🎉 TODO FUNCIONA:"
    echo "• Login ✅"
    echo "• Upload ✅"
    echo "• El problema puede ser específico de la app móvil"
fi

log_success "🎉 Test completado!"
