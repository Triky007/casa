#!/bin/bash

# Script para migrar datos desde contenedor local a servidor de producción
# Uso: ./migrate_to_production.sh

set -e  # Salir si hay algún error

# Configuración
PRODUCTION_SERVER="api.family.triky.app"
PRODUCTION_USER="root"  # Cambiar por tu usuario
LOCAL_BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 MIGRACIÓN A PRODUCCIÓN${NC}"
echo "=================================="
echo "Servidor destino: $PRODUCTION_SERVER"
echo "Timestamp: $TIMESTAMP"
echo ""

# Crear directorio de backups
mkdir -p $LOCAL_BACKUP_DIR

# Función para mostrar progreso
show_progress() {
    echo -e "${YELLOW}⏳ $1${NC}"
}

show_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

show_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 1. Identificar contenedores locales
show_progress "Identificando contenedores locales..."
echo "Contenedores disponibles:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
echo ""

read -p "🐳 Nombre del contenedor backend local: " LOCAL_BACKEND_CONTAINER
read -p "🗄️  Nombre del contenedor/servicio PostgreSQL local: " LOCAL_POSTGRES_CONTAINER

# 2. Crear backup de la base de datos
show_progress "Creando backup de la base de datos..."
BACKUP_FILE="$LOCAL_BACKUP_DIR/database_backup_$TIMESTAMP.sql"

if docker exec $LOCAL_POSTGRES_CONTAINER pg_dump -U family_user -d family_tasks_db > "$BACKUP_FILE"; then
    show_success "Backup de BD creado: $BACKUP_FILE"
else
    show_error "Error creando backup de BD"
    exit 1
fi

# 3. Crear backup de archivos subidos (uploads)
show_progress "Creando backup de archivos subidos..."
UPLOADS_BACKUP="$LOCAL_BACKUP_DIR/uploads_backup_$TIMESTAMP.tar.gz"

if docker exec $LOCAL_BACKEND_CONTAINER tar czf - -C /app uploads/ > "$UPLOADS_BACKUP"; then
    show_success "Backup de uploads creado: $UPLOADS_BACKUP"
else
    show_error "Error creando backup de uploads"
    exit 1
fi

# 4. Transferir archivos al servidor de producción
show_progress "Transfiriendo archivos al servidor de producción..."

if scp "$BACKUP_FILE" "$PRODUCTION_USER@$PRODUCTION_SERVER:/tmp/"; then
    show_success "Backup de BD transferido"
else
    show_error "Error transfiriendo backup de BD"
    exit 1
fi

if scp "$UPLOADS_BACKUP" "$PRODUCTION_USER@$PRODUCTION_SERVER:/tmp/"; then
    show_success "Backup de uploads transferido"
else
    show_error "Error transfiriendo backup de uploads"
    exit 1
fi

# 5. Ejecutar restauración en el servidor remoto
show_progress "Ejecutando restauración en servidor de producción..."

# Crear script de restauración remoto
cat > "$LOCAL_BACKUP_DIR/restore_remote.sh" << EOF
#!/bin/bash
set -e

echo "🔄 Iniciando restauración en servidor de producción..."

# Identificar contenedores en producción
echo "Contenedores disponibles en producción:"
docker ps --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"

read -p "🐳 Nombre del contenedor backend en producción: " PROD_BACKEND_CONTAINER
read -p "🗄️  Nombre del contenedor PostgreSQL en producción: " PROD_POSTGRES_CONTAINER

# Restaurar base de datos
echo "📊 Restaurando base de datos..."
docker exec -i \$PROD_POSTGRES_CONTAINER psql -U family_user -d family_tasks_db < /tmp/database_backup_$TIMESTAMP.sql

# Restaurar uploads
echo "📁 Restaurando archivos subidos..."
docker exec -i \$PROD_BACKEND_CONTAINER tar xzf /tmp/uploads_backup_$TIMESTAMP.tar.gz -C /app/

# Reiniciar contenedores para aplicar cambios
echo "🔄 Reiniciando contenedores..."
docker restart \$PROD_BACKEND_CONTAINER

echo "✅ Restauración completada!"
echo "🧹 Limpiando archivos temporales..."
rm -f /tmp/database_backup_$TIMESTAMP.sql
rm -f /tmp/uploads_backup_$TIMESTAMP.tar.gz

echo "🎉 ¡Migración completada exitosamente!"
EOF

# Transferir y ejecutar script de restauración
scp "$LOCAL_BACKUP_DIR/restore_remote.sh" "$PRODUCTION_USER@$PRODUCTION_SERVER:/tmp/"
ssh "$PRODUCTION_USER@$PRODUCTION_SERVER" "chmod +x /tmp/restore_remote.sh && /tmp/restore_remote.sh"

# 6. Limpiar archivos locales
show_progress "Limpiando archivos temporales locales..."
rm -f "$LOCAL_BACKUP_DIR/restore_remote.sh"

echo ""
echo -e "${GREEN}🎉 ¡MIGRACIÓN COMPLETADA!${NC}"
echo "=================================="
echo "✅ Base de datos migrada"
echo "✅ Archivos subidos migrados"
echo "✅ Servidor de producción actualizado"
echo ""
echo -e "${YELLOW}📝 PRÓXIMOS PASOS:${NC}"
echo "1. Verificar que la aplicación funcione en $PRODUCTION_SERVER"
echo "2. Probar login con usuarios existentes"
echo "3. Verificar que las fotos se muestren correctamente"
echo "4. Crear superusuario si es necesario"
echo ""
echo -e "${BLUE}💾 Backups guardados en: $LOCAL_BACKUP_DIR${NC}"
