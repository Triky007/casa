# 📱 Aplicación de Tareas Familiares

Una aplicación web responsive para gestionar tareas del hogar familiares con sistema de créditos y recompensas. Optimizada para dispositivos móviles (tablets e iPhones).

## 🚀 Características

- **👨‍👩‍👧‍👦 Gestión Familiar**: Roles de administradores (padres) y usuarios (hijos)
- **📋 Tareas**: Individuales y colectivas con sistema de créditos
- **✅ Aprobación**: Los administradores aprueban tareas completadas
- **🏆 Recompensas**: Sistema de créditos canjeables por premios
- **📱 Mobile-First**: Diseño responsive optimizado para móviles
- **📊 Dashboard**: Visualización de progreso diario/semanal
- **🔐 Autenticación**: Sistema seguro de login

## 🛠️ Stack Tecnológico

### Backend
- **FastAPI** - Framework web moderno y rápido
- **SQLModel** - ORM basado en SQLAlchemy y Pydantic
- **PostgreSQL** - Base de datos relacional
- **JWT** - Autenticación con tokens
- **bcrypt** - Encriptación de contraseñas

### Frontend
- **React 18** - Biblioteca de UI
- **TypeScript** - Tipado estático
- **Vite** - Build tool y dev server
- **Tailwind CSS** - Framework CSS utility-first
- **React Router** - Navegación SPA
- **Axios** - Cliente HTTP
- **Lucide React** - Iconos

## 📁 Estructura del Proyecto

```
family-tasks/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── __init__.py
│   │   │   ├── auth.py
│   │   │   ├── tasks.py
│   │   │   ├── users.py
│   │   │   └── rewards.py
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── task.py
│   │   │   └── reward.py
│   │   ├── schemas/
│   │   │   ├── __init__.py
│   │   │   ├── user.py
│   │   │   ├── task.py
│   │   │   └── auth.py
│   │   ├── core/
│   │   │   ├── __init__.py
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   └── main.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.tsx
│   │   │   ├── TopBar.tsx
│   │   │   ├── BottomNavigation.tsx
│   │   │   ├── TaskCard.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── pages/
│   │   │   ├── Login.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Tasks.tsx
│   │   │   ├── Profile.tsx
│   │   │   └── AdminPanel.tsx
│   │   ├── contexts/
│   │   │   └── AuthContext.tsx
│   │   ├── hooks/
│   │   │   ├── useApi.ts
│   │   │   └── useTasks.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── utils/
│   │   │   └── api.ts
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── tsconfig.json
├── docker-compose.yml
├── docker-compose.dev.yml
└── README.md
```

## 🚀 Instalación y Configuración

### Prerrequisitos

- **Node.js** 18+ y npm
- **Python** 3.11+
- **Docker** y Docker Compose (opcional)
- **PostgreSQL** (si no usas Docker)

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/family-tasks.git
cd family-tasks
```

### 2. Configuración del Backend

#### Opción A: Con Docker (Recomendado)

```bash
# Copiar variables de entorno
cp backend/.env.example backend/.env

# Levantar servicios
docker-compose up -d
```

#### Opción B: Instalación Manual

```bash
cd backend

# Crear entorno virtual
python -m venv venv
source venv/bin/activate  # En Windows: venv\Scripts\activate

# Instalar dependencias
pip install -r requirements.txt

# Configurar variables de entorno
cp .env.example .env
# Editar .env con tus configuraciones

# Ejecutar migraciones
alembic upgrade head

# Crear usuario administrador inicial
python scripts/create_admin.py

# Ejecutar servidor
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 3. Configuración del Frontend

```bash
cd frontend

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Editar .env.local si es necesario

# Ejecutar en modo desarrollo
npm run dev
```

### 4. Variables de Entorno

#### Backend (.env)
```env
# Base de datos
DATABASE_URL=postgresql://user:password@localhost:5432/family_tasks

# Seguridad
SECRET_KEY=tu-clave-secreta-muy-segura
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Configuración de la app
DEBUG=True
```

#### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:8000
VITE_APP_NAME=Tareas Familiares
```

## 🗄️ Base de Datos

### Modelos Principales

#### Usuario
```sql
CREATE TABLE user (
    id SERIAL PRIMARY KEY,
    username VARCHAR UNIQUE NOT NULL,
    password_hash VARCHAR NOT NULL,
    role VARCHAR CHECK (role IN ('admin', 'user')) NOT NULL,
    credits INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Tarea
```sql
CREATE TABLE task (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL,
    task_type VARCHAR CHECK (task_type IN ('individual', 'collective')) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);
```

#### Asignación de Tarea
```sql
CREATE TABLE taskassignment (
    id SERIAL PRIMARY KEY,
    task_id INTEGER REFERENCES task(id),
    user_id INTEGER REFERENCES user(id),
    status VARCHAR CHECK (status IN ('pending', 'completed', 'approved', 'rejected')) DEFAULT 'pending',
    completed_at TIMESTAMP,
    approved_at TIMESTAMP,
    approved_by INTEGER REFERENCES user(id)
);
```

### Datos Iniciales

```bash
# Ejecutar script para crear datos de ejemplo
python backend/scripts/seed_data.py
```

## 📱 Uso de la Aplicación

### Para Administradores (Padres)

1. **Login** con credenciales de administrador
2. **Crear tareas** con descripción y créditos
3. **Aprobar/rechazar** tareas completadas por usuarios
4. **Gestionar recompensas** y premios
5. **Ver estadísticas** familiares

### Para Usuarios (Hijos)

1. **Login** con credenciales de usuario
2. **Ver tareas disponibles** (individuales y colectivas)
3. **Asignarse tareas** y marcarlas como completadas
4. **Acumular créditos** tras aprobación
5. **Canjear recompensas** con créditos ganados

### Flujo de Trabajo

```mermaid
graph TD
    A[Usuario ve tareas] --> B[Se asigna tarea]
    B --> C[Completa tarea]
    C --> D[Marca como completada]
    D --> E[Admin revisa]
    E --> F{¿Aprobada?}
    F -->|Sí| G[Usuario gana créditos]
    F -->|No| H[Tarea rechazada]
    G --> I[Usuario puede canjear recompensas]
```

## 🔧 Desarrollo

### Comandos Útiles

#### Backend
```bash
# Ejecutar tests
pytest

# Formatear código
black app/
isort app/

# Linting
flake8 app/

# Crear migración
alembic revision --autogenerate -m "descripción"

# Aplicar migraciones
alembic upgrade head
```

#### Frontend
```bash
# Ejecutar tests
npm test

# Build para producción
npm run build

# Preview build
npm run preview

# Linting
npm run lint

# Formatear código
npm run format
```

### Estructura de Componentes

```tsx
// Ejemplo de componente de tarea
interface TaskCardProps {
  task: Task
  onAssign: (taskId: number) => void
  onComplete: (taskId: number) => void
}

export const TaskCard = ({ task, onAssign, onComplete }: TaskCardProps) => {
  // Implementación del componente
}
```

## 🚀 Despliegue

### Producción con Docker

```bash
# Build y deploy
docker-compose -f docker-compose.prod.yml up -d

# Ver logs
docker-compose logs -f

# Backup de base de datos
docker-compose exec db pg_dump -U user family_tasks > backup.sql
```

### Variables de Entorno de Producción

```env
# Backend
DATABASE_URL=postgresql://user:password@db:5432/family_tasks
SECRET_KEY=clave-super-secreta-para-produccion
DEBUG=False
ALLOWED_ORIGINS=https://tu-dominio.com

# Frontend
VITE_API_URL=https://api.tu-dominio.com
```

## 📊 API Endpoints

### Autenticación
- `POST /api/auth/login` - Iniciar sesión
- `GET /api/auth/me` - Obtener usuario actual
- `POST /api/auth/logout` - Cerrar sesión

### Tareas
- `GET /api/tasks/` - Listar tareas disponibles
- `POST /api/tasks/` - Crear nueva tarea (admin)
- `POST /api/tasks/assign/{task_id}` - Asignarse una tarea
- `PATCH /api/tasks/complete/{assignment_id}` - Marcar como completada
- `PATCH /api/tasks/approve/{assignment_id}` - Aprobar tarea (admin)

### Usuarios
- `GET /api/users/me` - Perfil del usuario
- `GET /api/users/{user_id}/stats` - Estadísticas del usuario
- `PATCH /api/users/me` - Actualizar perfil

### Recompensas
- `GET /api/rewards/` - Listar recompensas disponibles
- `POST /api/rewards/redeem/{reward_id}` - Canjear recompensa

## 🔒 Seguridad

- **Autenticación JWT** con expiración de tokens
- **Encriptación bcrypt** para contraseñas
- **Validación de roles** en endpoints protegidos
- **CORS configurado** para dominios permitidos
- **Validación de entrada** con Pydantic

## 🧪 Testing

### Backend
```bash
# Ejecutar todos los tests
pytest

# Tests con cobertura
pytest --cov=app

# Tests específicos
pytest tests/test_auth.py
```

### Frontend
```bash
# Tests unitarios
npm test

# Tests e2e (si están configurados)
npm run test:e2e
```

## 📱 PWA (Progressive Web App)

Para convertir en PWA:

1. Agregar `vite-plugin-pwa` al proyecto
2. Configurar service worker
3. Agregar manifest.json
4. Implementar notificaciones push

## 🤝 Contribución

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -am 'Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 🆘 Soporte

- **Issues**: [GitHub Issues](https://github.com/tu-usuario/family-tasks/issues)
- **Documentación**: [Wiki del proyecto](https://github.com/tu-usuario/family-tasks/wiki)
- **Email**: soporte@family-tasks.com

## 🔄 Roadmap

- [ ] Notificaciones push
- [ ] Modo offline (PWA)
- [ ] Gamificación avanzada
- [ ] Integración con calendarios
- [ ] App móvil nativa
- [ ] Sistema de badges/logros
- [ ] Reportes avanzados
- [ ] API para integraciones

---

**¡Disfruta gestionando las tareas familiares de manera divertida! 🏠✨**