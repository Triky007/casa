#!/bin/bash

# 🗄️ Script de Configuración de Base de Datos PostgreSQL
# Para el sistema Family Tasks Management

set -e

echo "🏠 CASA - Family Tasks Management System"
echo "🗄️ Configuración de Base de Datos PostgreSQL"
echo "================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables de configuración
DB_NAME="family_tasks"
DB_USER="family_user"
DB_PASSWORD="secure_password"
DB_HOST="localhost"
DB_PORT="5432"

echo -e "${BLUE}📋 Configuración:${NC}"
echo "   Base de datos: $DB_NAME"
echo "   Usuario: $DB_USER"
echo "   Host: $DB_HOST"
echo "   Puerto: $DB_PORT"
echo ""

# Función para verificar si PostgreSQL está instalado
check_postgresql() {
    if command -v psql &> /dev/null; then
        echo -e "${GREEN}✅ PostgreSQL está instalado${NC}"
        return 0
    else
        echo -e "${RED}❌ PostgreSQL no está instalado${NC}"
        return 1
    fi
}

# Función para verificar si PostgreSQL está ejecutándose
check_postgresql_running() {
    if pg_isready -h $DB_HOST -p $DB_PORT &> /dev/null; then
        echo -e "${GREEN}✅ PostgreSQL está ejecutándose${NC}"
        return 0
    else
        echo -e "${RED}❌ PostgreSQL no está ejecutándose${NC}"
        return 1
    fi
}

# Función para instalar PostgreSQL en macOS
install_postgresql_macos() {
    echo -e "${YELLOW}📦 Instalando PostgreSQL con Homebrew...${NC}"
    if command -v brew &> /dev/null; then
        brew install postgresql@14
        brew services start postgresql@14
        echo -e "${GREEN}✅ PostgreSQL instalado y iniciado${NC}"
    else
        echo -e "${RED}❌ Homebrew no está instalado. Por favor instala PostgreSQL manualmente.${NC}"
        exit 1
    fi
}

# Función para crear usuario y base de datos
create_database() {
    echo -e "${BLUE}🔧 Creando usuario y base de datos...${NC}"
    
    # Obtener el usuario actual del sistema
    SYSTEM_USER=$(whoami)
    
    # Crear usuario
    echo "Creando usuario $DB_USER..."
    psql -U $SYSTEM_USER -h $DB_HOST -d postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" 2>/dev/null || echo "Usuario ya existe"
    
    # Crear base de datos
    echo "Creando base de datos $DB_NAME..."
    psql -U $SYSTEM_USER -h $DB_HOST -d postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" 2>/dev/null || echo "Base de datos ya existe"
    
    # Otorgar permisos
    echo "Otorgando permisos..."
    psql -U $SYSTEM_USER -h $DB_HOST -d $DB_NAME -c "
        GRANT ALL ON SCHEMA public TO $DB_USER;
        GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO $DB_USER;
        GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO $DB_USER;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
        ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
    " 2>/dev/null
    
    echo -e "${GREEN}✅ Usuario y base de datos creados${NC}"
}

# Función para verificar conexión
test_connection() {
    echo -e "${BLUE}🔍 Verificando conexión...${NC}"
    if psql -U $DB_USER -h $DB_HOST -d $DB_NAME -c "SELECT current_user, current_database();" &> /dev/null; then
        echo -e "${GREEN}✅ Conexión exitosa${NC}"
        return 0
    else
        echo -e "${RED}❌ Error de conexión${NC}"
        return 1
    fi
}

# Función para crear tablas (usando el backend)
create_tables() {
    echo -e "${BLUE}📊 Creando tablas...${NC}"
    
    if [ -d "backend" ]; then
        cd backend
        
        # Verificar si existe el entorno virtual
        if [ -d "venv" ]; then
            echo "Activando entorno virtual..."
            source venv/bin/activate
            
            # Crear tablas
            echo "Creando tablas de la base de datos..."
            python -c "from app.core.database import create_db_and_tables; create_db_and_tables()" 2>/dev/null || echo "Tablas ya existen o error al crear"
            
            echo -e "${GREEN}✅ Tablas creadas${NC}"
        else
            echo -e "${YELLOW}⚠️  Entorno virtual no encontrado. Las tablas se crearán automáticamente al iniciar el backend.${NC}"
        fi
        
        cd ..
    else
        echo -e "${YELLOW}⚠️  Directorio backend no encontrado. Las tablas se crearán automáticamente al iniciar el backend.${NC}"
    fi
}

# Función principal
main() {
    echo -e "${BLUE}🚀 Iniciando configuración...${NC}"
    echo ""
    
    # Verificar PostgreSQL
    if ! check_postgresql; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            install_postgresql_macos
        else
            echo -e "${RED}❌ Por favor instala PostgreSQL manualmente para tu sistema operativo${NC}"
            echo "Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
            echo "CentOS/RHEL: sudo yum install postgresql postgresql-server"
            echo "Windows: https://www.postgresql.org/download/windows/"
            exit 1
        fi
    fi
    
    # Verificar si está ejecutándose
    if ! check_postgresql_running; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            echo -e "${YELLOW}🔄 Iniciando PostgreSQL...${NC}"
            brew services start postgresql@14
            sleep 2
            if ! check_postgresql_running; then
                echo -e "${RED}❌ No se pudo iniciar PostgreSQL${NC}"
                exit 1
            fi
        else
            echo -e "${RED}❌ PostgreSQL no está ejecutándose. Por favor inícialo manualmente.${NC}"
            exit 1
        fi
    fi
    
    # Crear base de datos y usuario
    create_database
    
    # Verificar conexión
    if ! test_connection; then
        echo -e "${RED}❌ No se pudo conectar a la base de datos${NC}"
        exit 1
    fi
    
    # Crear tablas
    create_tables
    
    echo ""
    echo -e "${GREEN}🎉 ¡Configuración completada exitosamente!${NC}"
    echo ""
    echo -e "${BLUE}📋 Información de conexión:${NC}"
    echo "   URL: postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"
    echo "   Host: $DB_HOST"
    echo "   Puerto: $DB_PORT"
    echo "   Base de datos: $DB_NAME"
    echo "   Usuario: $DB_USER"
    echo "   Contraseña: $DB_PASSWORD"
    echo ""
    echo -e "${YELLOW}📝 Próximos pasos:${NC}"
    echo "   1. Ejecutar el backend: cd backend && source venv/bin/activate && python run.py"
    echo "   2. Crear datos iniciales: ver README.md sección 'Datos Iniciales'"
    echo "   3. Ejecutar el frontend: cd frontend && npm run dev"
    echo ""
}

# Ejecutar función principal
main "$@"
