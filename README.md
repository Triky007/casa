# 🏠 CASA - Family Tasks Management System

Sistema de gestión de tareas familiares con gamificación y recompensas.

## 🚀 Inicio Rápido

### 🐳 Con Docker (Recomendado)

#### Desarrollo
```bash
# Desarrollo con hot reload
docker-compose -f docker-compose.dev.yml up --build

# URLs disponibles:
# Frontend: http://localhost:4110
# Backend: http://localhost:3110
# Base de datos: localhost:5432
```

#### Producción
```bash
# Producción optimizada
docker-compose -f docker-compose.prod.yml up --build -d

# URLs disponibles:
# Frontend: http://localhost:4110
# Backend: http://localhost:3110
# Base de datos: localhost:5432
```

### 💻 Desarrollo Local (Sin Docker)

#### Prerrequisitos
- Node.js 18+ y npm
- Python 3.11+ y pip
- PostgreSQL 14+

#### 1. Configurar Base de Datos
```bash
# Configuración automática
./setup-database.sh

# O manual (ver sección "Base de Datos PostgreSQL")
```

#### 2. Backend (FastAPI)
```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # macOS/Linux
# venv\Scripts\activate   # Windows

# Instalar dependencias
pip install -r requirements.txt

# Crear datos iniciales (opcional)
python seed_data.py

# Arrancar servidor de desarrollo
python run.py

# Backend disponible en: http://localhost:3110
# API Docs: http://localhost:3110/docs
```

#### 3. Frontend (React + Vite)
```bash
cd frontend

# Instalar dependencias
npm install

# Configurar API URL para desarrollo local
echo "VITE_API_URL=http://localhost:3110" > .env.local

# Arrancar servidor de desarrollo
npm run dev

# Frontend disponible en: http://localhost:4110
```

#### 4. Verificar Funcionamiento
```bash
# Verificar backend
curl http://localhost:3110/health

# Verificar familias disponibles
curl http://localhost:3110/api/families/public

# Abrir frontend
open http://localhost:4110  # macOS
# xdg-open http://localhost:4110  # Linux
```

### 🏭 Producción Local (Sin Docker)

#### Backend
```bash
cd backend
source venv/bin/activate

# Variables de entorno para producción
export DATABASE_URL="postgresql://family_user:secure_password@localhost:5432/family_tasks"
export SECRET_KEY="tu-clave-secreta-super-segura"
export DEBUG="false"

# Arrancar con Gunicorn (recomendado para producción)
pip install gunicorn
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:3110

# O con uvicorn
uvicorn app.main:app --host 0.0.0.0 --port 3110 --workers 4
```

#### Frontend
```bash
cd frontend

# Configurar API URL para producción
echo "VITE_API_URL=https://api.family.triky.app" > .env.production
# O para backend local: echo "VITE_API_URL=http://localhost:3110" > .env.production

# Build para producción
npm run build

# Servir con servidor estático
npm run preview
# O con nginx, Apache, etc. sirviendo la carpeta dist/

# Frontend disponible en: http://localhost:4110
```

## 🏗️ Configuración de Producción

### 🌐 Variables de Entorno

#### Backend (.env o variables del sistema)
```bash
# Base de datos
DATABASE_URL=postgresql://family_user:secure_password@localhost:5432/family_tasks

# Seguridad
SECRET_KEY=tu-clave-secreta-super-segura-cambiar-en-produccion
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS - Dominios permitidos
ALLOWED_ORIGINS=https://family.triky.app,https://api.family.triky.app

# Aplicación
DEBUG=false
```

#### Frontend (.env.production)
```bash
# URL de la API
VITE_API_URL=https://api.family.triky.app
# O para backend local: VITE_API_URL=http://localhost:3110
```

### 🐳 Docker en Producción

#### Usando Docker Compose
```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/casa.git
cd casa

# Configurar variables de entorno
cp .env.production.example .env.production
# Editar .env.production con tus valores

# Arrancar en producción
docker-compose -f docker-compose.prod.yml up -d

# Verificar estado
docker-compose -f docker-compose.prod.yml ps

# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Parar servicios
docker-compose -f docker-compose.prod.yml down
```

#### Comandos Útiles Docker
```bash
# Reconstruir solo el backend
docker-compose -f docker-compose.prod.yml up -d --build backend

# Reconstruir solo el frontend
docker-compose -f docker-compose.prod.yml up -d --build frontend

# Ejecutar comandos en contenedor
docker-compose -f docker-compose.prod.yml exec backend python seed_data.py

# Backup de base de datos
docker-compose -f docker-compose.prod.yml exec db pg_dump -U postgres family_tasks > backup.sql

# Restaurar backup
docker-compose -f docker-compose.prod.yml exec -T db psql -U postgres family_tasks < backup.sql
```

### 🔧 Scripts Útiles

#### Frontend
```bash
# Build completo con auto-corrección
./build-frontend.sh

# Solo corrección de localhost
./fix-localhost.sh
```

#### Mobile
```bash
cd mobile
npx expo start --tunnel
```

#### Monitoreo
```bash
# Logs en tiempo real
./monitor-login.sh

# Estado de salud
./check-health.sh

# Verificar servicios
curl http://localhost:3110/health
curl http://localhost:4110
```

### 🔒 Configuración de Seguridad

#### Generar Clave Secreta Segura
```bash
# Python
python -c "import secrets; print(secrets.token_urlsafe(32))"

# OpenSSL
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

#### Configurar HTTPS (Nginx)
```nginx
server {
    listen 443 ssl;
    server_name family.triky.app;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;

    location / {
        proxy_pass http://localhost:4110;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://localhost:3110/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📚 Documentación Completa

Ver [README-DEPLOYMENT.md](./README-DEPLOYMENT.md) para:
- 🏗️ Guía completa de despliegue
- 🔧 Configuración detallada
- 🐛 Troubleshooting
- 📱 Setup de aplicación móvil
- 🔐 Configuración de seguridad

## 🏗️ Arquitectura

- **Backend**: FastAPI + PostgreSQL
- **Frontend**: React + Vite + Tailwind CSS
- **Mobile**: React Native + Expo
- **Proxy**: Apache con SSL
- **Contenedores**: Docker + Docker Compose

## 🎮 Funcionalidades

- ✅ Sistema de autenticación JWT
- ✅ Gestión de tareas con gamificación
- ✅ Sistema de créditos y recompensas
- ✅ Panel de administración
- ✅ Aplicación móvil nativa
- ✅ Aprobación de tareas completadas
- ✅ Dashboard con estadísticas

## 🗄️ Base de Datos PostgreSQL

### Configuración de Base de Datos

**Credenciales de PostgreSQL:**
- **Host**: `localhost` (desarrollo) / `db` (Docker)
- **Puerto**: `5432`
- **Base de Datos**: `family_tasks`
- **Usuario**: `family_user`
- **Contraseña**: `secure_password`
- **URL de Conexión**: `postgresql://family_user:secure_password@localhost:5432/family_tasks`

### Configuración Inicial (Desarrollo Local)

#### 1. Instalar PostgreSQL
```bash
# macOS con Homebrew
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt-get install postgresql postgresql-contrib

# Windows
# Descargar desde https://www.postgresql.org/download/windows/
```

#### 2. Crear Base de Datos y Usuario
```bash
# Conectar como usuario del sistema
psql -U $(whoami) -h localhost -d postgres

# Crear usuario y base de datos
CREATE USER family_user WITH PASSWORD 'secure_password';
CREATE DATABASE family_tasks OWNER family_user;

# Otorgar permisos
GRANT ALL ON SCHEMA public TO family_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO family_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO family_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO family_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO family_user;
```

#### 3. Verificar Conexión
```bash
psql -U family_user -h localhost -d family_tasks -c "SELECT current_user, current_database();"
```

### Estructura de Tablas

El sistema crea automáticamente las siguientes tablas:

#### Tabla `user`
- **id**: SERIAL PRIMARY KEY
- **username**: VARCHAR UNIQUE NOT NULL
- **password_hash**: VARCHAR NOT NULL
- **role**: ENUM('SUPERADMIN', 'ADMIN', 'USER') NOT NULL
- **credits**: INTEGER NOT NULL DEFAULT 0
- **is_active**: BOOLEAN NOT NULL DEFAULT TRUE
- **created_at**: TIMESTAMP NOT NULL
- **family_id**: INTEGER (FK a family.id)
- **full_name**: VARCHAR
- **email**: VARCHAR

#### Tabla `family`
- **id**: SERIAL PRIMARY KEY
- **name**: VARCHAR UNIQUE NOT NULL
- **description**: VARCHAR
- **is_active**: BOOLEAN NOT NULL DEFAULT TRUE
- **created_at**: TIMESTAMP NOT NULL
- **created_by**: INTEGER (FK a user.id)
- **max_members**: INTEGER NOT NULL DEFAULT 10
- **timezone**: VARCHAR NOT NULL DEFAULT 'UTC'

#### Tabla `task`
- **id**: SERIAL PRIMARY KEY
- **name**: VARCHAR NOT NULL
- **description**: VARCHAR
- **credits**: INTEGER NOT NULL
- **task_type**: ENUM('INDIVIDUAL', 'COLLECTIVE') NOT NULL
- **periodicity**: ENUM('DAILY', 'WEEKLY', 'SPECIAL') NOT NULL
- **family_id**: INTEGER (FK a family.id)
- **is_active**: BOOLEAN NOT NULL DEFAULT TRUE
- **created_at**: TIMESTAMP NOT NULL

#### Tabla `taskassignment`
- **id**: SERIAL PRIMARY KEY
- **task_id**: INTEGER NOT NULL (FK a task.id)
- **user_id**: INTEGER NOT NULL (FK a user.id)
- **status**: ENUM('PENDING', 'COMPLETED', 'APPROVED', 'REJECTED') NOT NULL
- **scheduled_date**: DATE NOT NULL
- **completed_at**: TIMESTAMP
- **approved_at**: TIMESTAMP
- **approved_by**: INTEGER (FK a user.id)
- **created_at**: TIMESTAMP NOT NULL

#### Tabla `reward`
- **id**: SERIAL PRIMARY KEY
- **name**: VARCHAR NOT NULL
- **description**: VARCHAR
- **cost**: INTEGER NOT NULL
- **family_id**: INTEGER (FK a family.id)
- **is_active**: BOOLEAN NOT NULL DEFAULT TRUE
- **created_at**: TIMESTAMP NOT NULL

#### Tabla `rewardredemption`
- **id**: SERIAL PRIMARY KEY
- **reward_id**: INTEGER NOT NULL (FK a reward.id)
- **user_id**: INTEGER NOT NULL (FK a user.id)
- **redeemed_at**: TIMESTAMP NOT NULL

#### Tabla `taskcompletionphoto`
- **id**: SERIAL PRIMARY KEY
- **task_assignment_id**: INTEGER NOT NULL (FK a taskassignment.id)
- **filename**: VARCHAR NOT NULL
- **original_filename**: VARCHAR NOT NULL
- **file_path**: VARCHAR NOT NULL
- **thumbnail_path**: VARCHAR
- **file_size**: INTEGER NOT NULL
- **mime_type**: VARCHAR NOT NULL
- **uploaded_at**: TIMESTAMP NOT NULL

### Datos Iniciales

#### Crear Superadmin y Familias de Ejemplo
```bash
cd backend
source venv/bin/activate

# Crear superadmin y familias
python -c "
from datetime import datetime
from app.core.database import engine
from sqlmodel import Session
from app.models.user import User, UserRole
from app.models.family import Family
from app.core.security import get_password_hash

with Session(engine) as session:
    # Crear superadmin
    superadmin = User(
        username='superadmin',
        password_hash=get_password_hash('super123'),
        role=UserRole.SUPERADMIN,
        credits=0,
        is_active=True,
        created_at=datetime.utcnow(),
        full_name='Super Administrador',
        email='admin@family.triky.app'
    )
    session.add(superadmin)
    session.commit()
    session.refresh(superadmin)

    # Crear familias de ejemplo
    families_data = [
        {'name': 'Familia García', 'description': 'La familia García - Casa principal', 'max_members': 6, 'timezone': 'America/Mexico_City'},
        {'name': 'Familia López', 'description': 'Los López - Departamento', 'max_members': 4, 'timezone': 'America/Mexico_City'},
        {'name': 'Familia Martínez', 'description': 'Casa de los Martínez', 'max_members': 5, 'timezone': 'America/Mexico_City'}
    ]

    for family_data in families_data:
        family = Family(
            **family_data,
            is_active=True,
            created_at=datetime.utcnow(),
            created_by=superadmin.id
        )
        session.add(family)

    session.commit()
    print('✅ Superadmin y familias creadas')
"
```

#### Crear Usuarios de Ejemplo
```bash
# Crear usuarios para cada familia
python -c "
from datetime import datetime
from app.core.database import engine
from sqlmodel import Session
from app.models.user import User, UserRole
from app.core.security import get_password_hash

with Session(engine) as session:
    users_data = [
        # Familia García (ID: 1)
        {'username': 'admin_garcia', 'password': 'admin123', 'role': UserRole.ADMIN, 'family_id': 1, 'full_name': 'Admin García'},
        {'username': 'juan_garcia', 'password': 'user123', 'role': UserRole.USER, 'family_id': 1, 'full_name': 'Juan García'},
        {'username': 'maria_garcia', 'password': 'user123', 'role': UserRole.USER, 'family_id': 1, 'full_name': 'María García'},

        # Familia López (ID: 2)
        {'username': 'admin_lopez', 'password': 'admin123', 'role': UserRole.ADMIN, 'family_id': 2, 'full_name': 'Admin López'},
        {'username': 'carlos_lopez', 'password': 'user123', 'role': UserRole.USER, 'family_id': 2, 'full_name': 'Carlos López'},

        # Familia Martínez (ID: 3)
        {'username': 'admin_martinez', 'password': 'admin123', 'role': UserRole.ADMIN, 'family_id': 3, 'full_name': 'Admin Martínez'},
        {'username': 'ana_martinez', 'password': 'user123', 'role': UserRole.USER, 'family_id': 3, 'full_name': 'Ana Martínez'},
    ]

    for user_data in users_data:
        user = User(
            username=user_data['username'],
            password_hash=get_password_hash(user_data['password']),
            role=user_data['role'],
            family_id=user_data['family_id'],
            full_name=user_data['full_name'],
            email=f\"{user_data['username']}@example.com\",
            credits=100,
            is_active=True,
            created_at=datetime.utcnow()
        )
        session.add(user)

    session.commit()
    print('✅ Usuarios de ejemplo creados')
"
```

## 🔑 Credenciales por Defecto

**Superadmin (acceso a todas las familias):**
- Usuario: `superadmin`
- Contraseña: `super123`

**Familia García:**
- Admin: `admin_garcia` / `admin123`
- Usuario: `juan_garcia` / `user123`
- Usuario: `maria_garcia` / `user123`

**Familia López:**
- Admin: `admin_lopez` / `admin123`
- Usuario: `carlos_lopez` / `user123`

**Familia Martínez:**
- Admin: `admin_martinez` / `admin123`
- Usuario: `ana_martinez` / `user123`

## 🌐 URLs

- **Frontend**: https://family.triky.app
- **API**: https://api.family.triky.app
- **Docs**: https://api.family.triky.app/docs

### Comandos Útiles de Base de Datos

#### Verificar Estado de PostgreSQL
```bash
# macOS con Homebrew
brew services list | grep postgresql

# Iniciar PostgreSQL
brew services start postgresql@14

# Detener PostgreSQL
brew services stop postgresql@14
```

#### Conectar a la Base de Datos
```bash
# Conectar como family_user
psql -U family_user -h localhost -d family_tasks

# Conectar como usuario del sistema
psql -U $(whoami) -h localhost -d postgres
```

#### Comandos SQL Útiles
```sql
-- Ver todas las familias
SELECT id, name, description, is_active FROM family;

-- Ver todos los usuarios
SELECT id, username, role, family_id, full_name FROM "user";

-- Ver usuarios por familia
SELECT u.username, u.role, u.full_name, f.name as family_name
FROM "user" u
LEFT JOIN family f ON u.family_id = f.id
ORDER BY f.name, u.role;

-- Ver tareas por familia
SELECT t.name, t.credits, t.task_type, f.name as family_name
FROM task t
JOIN family f ON t.family_id = f.id;

-- Resetear créditos de un usuario
UPDATE "user" SET credits = 100 WHERE username = 'juan_garcia';

-- Desactivar una familia
UPDATE family SET is_active = false WHERE name = 'Familia Test';
```

#### Backup y Restore
```bash
# Crear backup
pg_dump -U family_user -h localhost family_tasks > backup_family_tasks.sql

# Restaurar backup
psql -U family_user -h localhost family_tasks < backup_family_tasks.sql

# Backup con compresión
pg_dump -U family_user -h localhost -Fc family_tasks > backup_family_tasks.dump

# Restaurar backup comprimido
pg_restore -U family_user -h localhost -d family_tasks backup_family_tasks.dump
```

## 🆘 Problemas Comunes

### 🐳 Docker

#### Contenedores no inician
```bash
# Verificar Docker está ejecutándose
docker --version
docker-compose --version

# Ver logs detallados
docker-compose -f docker-compose.prod.yml logs

# Reconstruir desde cero
docker-compose -f docker-compose.prod.yml down -v
docker-compose -f docker-compose.prod.yml up --build
```

#### Error de puertos ocupados
```bash
# Verificar qué está usando el puerto
lsof -i :3110  # Backend
lsof -i :4110  # Frontend
lsof -i :5432  # PostgreSQL

# Matar proceso que usa el puerto
kill -9 <PID>

# O cambiar puertos en docker-compose.yml
```

#### Problemas de permisos en Docker
```bash
# Reconstruir con permisos correctos
docker-compose -f docker-compose.prod.yml build --no-cache

# Verificar usuario en contenedor
docker-compose -f docker-compose.prod.yml exec backend whoami
```

#### Base de datos en Docker no persiste
```bash
# Verificar volúmenes
docker volume ls

# Crear backup antes de eliminar
docker-compose -f docker-compose.prod.yml exec db pg_dump -U postgres family_tasks > backup.sql

# Recrear volumen
docker-compose -f docker-compose.prod.yml down -v
docker volume create casa_postgres_data
docker-compose -f docker-compose.prod.yml up -d
```

### 💻 Base de Datos Local

#### PostgreSQL no inicia
```bash
# macOS - Verificar y reiniciar
brew services restart postgresql@14

# Verificar logs
tail -f /opt/homebrew/var/log/postgresql@14.log
```

#### Error de conexión "role does not exist"
```bash
# Crear el usuario manualmente
psql -U $(whoami) -h localhost -d postgres -c "CREATE USER family_user WITH PASSWORD 'secure_password';"
```

#### Error "database does not exist"
```bash
# Crear la base de datos manualmente
psql -U $(whoami) -h localhost -d postgres -c "CREATE DATABASE family_tasks OWNER family_user;"
```

#### No aparece el desplegable de familias en login
```bash
# Verificar que existan familias
curl http://localhost:3110/api/families/public

# Si está vacío, crear familias de ejemplo (ver sección "Datos Iniciales")
```

#### Tablas no existen
```bash
# Las tablas se crean automáticamente al iniciar el backend
cd backend
source venv/bin/activate
python run.py

# O crear manualmente
python -c "from app.core.database import create_db_and_tables; create_db_and_tables()"
```

### Frontend y Backend

#### Login bloqueado por rastreadores
```bash
./fix-localhost.sh
```

#### Frontend no carga
```bash
./build-frontend.sh
```

#### Backend no conecta a la base de datos
```bash
# Verificar variables de entorno
echo $DATABASE_URL

# Verificar conexión manual
psql -U family_user -h localhost -d family_tasks -c "SELECT 1;"
```

#### CORS errors en desarrollo
```bash
# Verificar que el frontend use la URL correcta
cat frontend/.env.local

# Debe contener: VITE_API_URL=http://localhost:3110
```

### Mobile

#### Mobile no conecta
```bash
# Verificar IP en mobile/src/utils/api.ts
# Usar tunnel: npx expo start --tunnel
```

#### Error de red en dispositivo físico
```bash
# Obtener IP local
ifconfig | grep "inet " | grep -v 127.0.0.1

# Actualizar API_URL en mobile/src/utils/api.ts con tu IP local
# Ejemplo: http://192.168.1.100:3110
```

## � Scripts de Configuración Rápida

### Configuración Automática de Base de Datos
```bash
# Ejecutar script de configuración automática
./setup-database.sh
```

Este script:
- ✅ Verifica e instala PostgreSQL (macOS con Homebrew)
- ✅ Crea la base de datos y usuario
- ✅ Configura permisos
- ✅ Verifica la conexión
- ✅ Crea las tablas automáticamente

### Crear Datos Iniciales
```bash
# Navegar al backend y activar entorno virtual
cd backend
source venv/bin/activate

# Ejecutar script de datos iniciales
python seed_data.py
```

Este script crea:
- 🔑 Superadmin y usuarios de ejemplo
- 🏠 3 familias de ejemplo
- 📋 Tareas diarias, semanales y especiales
- 🎁 Recompensas para cada familia

### Configuración Completa (Un Solo Comando)
```bash
# Configurar base de datos + crear datos iniciales
./setup-database.sh && cd backend && source venv/bin/activate && python seed_data.py && cd ..
```

## �📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.
