# 📊 Esquema de Base de Datos - Family Tasks

## 🗄️ Información General

- **Motor de Base de Datos**: PostgreSQL 15
- **Nombre de la Base de Datos**: `family_tasks`
- **Usuario**: `postgres`
- **Puerto**: `5432`
- **Esquema**: `public`
- **ORM**: SQLModel (basado en SQLAlchemy + Pydantic)

---

## 📋 Tablas del Sistema

### 1. 👥 **user** - Usuarios del Sistema

Almacena información de todos los usuarios (administradores y usuarios regulares).

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `INTEGER` | `PRIMARY KEY`, `AUTO INCREMENT` | Identificador único del usuario |
| `username` | `CHARACTER VARYING` | `UNIQUE`, `NOT NULL` | Nombre de usuario único |
| `password_hash` | `CHARACTER VARYING` | `NOT NULL` | Hash de la contraseña (bcrypt) |
| `role` | `USERROLE` | `NOT NULL` | Rol del usuario (enum: `ADMIN`, `USER`) |
| `credits` | `INTEGER` | `NOT NULL` | Créditos acumulados por el usuario |
| `is_active` | `BOOLEAN` | `NOT NULL` | Estado activo/inactivo del usuario |
| `created_at` | `TIMESTAMP WITHOUT TIME ZONE` | `NOT NULL` | Fecha y hora de creación |

**Índices:**
- `user_pkey` PRIMARY KEY, btree (id)
- `ix_user_username` UNIQUE, btree (username)

**Tipos Enum:**
- `USERROLE`: `ADMIN`, `USER`

**Referenciado por:**
- `rewardredemption.user_id`
- `taskassignment.user_id`
- `taskassignment.approved_by`

**Modelo SQLModel:** `User`

---

### 2. 📋 **task** - Definiciones de Tareas

Define las tareas disponibles en el sistema con sus características.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `INTEGER` | `PRIMARY KEY`, `AUTO INCREMENT` | Identificador único de la tarea |
| `name` | `CHARACTER VARYING` | `NOT NULL` | Nombre descriptivo de la tarea |
| `description` | `CHARACTER VARYING` | `NULL` | Descripción detallada de la tarea |
| `credits` | `INTEGER` | `NOT NULL` | Créditos que otorga completar la tarea |
| `task_type` | `TASKTYPE` | `NOT NULL` | Tipo de tarea (enum) |
| `periodicity` | `TASKPERIODICITY` | `NOT NULL` | Periodicidad (enum) |
| `is_active` | `BOOLEAN` | `NOT NULL` | Estado activo/inactivo de la tarea |
| `created_at` | `TIMESTAMP WITHOUT TIME ZONE` | `NOT NULL` | Fecha y hora de creación |

**Índices:**
- `task_pkey` PRIMARY KEY, btree (id)

**Tipos Enum:**
- `TASKTYPE`: `INDIVIDUAL` (tarea personal), `COLLECTIVE` (tarea grupal)
- `TASKPERIODICITY`: `DAILY` (diaria), `WEEKLY` (semanal), `SPECIAL` (especial/única)

**Referenciado por:**
- `taskassignment.task_id`

**Modelo SQLModel:** `Task`

---

### 3. 📝 **taskassignment** - Asignaciones de Tareas

Registra las asignaciones de tareas específicas a usuarios con fechas y estados.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `INTEGER` | `PRIMARY KEY`, `AUTO INCREMENT` | Identificador único de la asignación |
| `task_id` | `INTEGER` | `NOT NULL`, `FOREIGN KEY` | Referencia a la tarea (`task.id`) |
| `user_id` | `INTEGER` | `NOT NULL`, `FOREIGN KEY` | Referencia al usuario (`user.id`) |
| `status` | `TASKSTATUS` | `NOT NULL` | Estado de la asignación (enum) |
| `scheduled_date` | `DATE` | `NOT NULL` | Fecha programada para la tarea |
| `completed_at` | `TIMESTAMP WITHOUT TIME ZONE` | `NULL` | Fecha y hora de completado |
| `approved_at` | `TIMESTAMP WITHOUT TIME ZONE` | `NULL` | Fecha y hora de aprobación |
| `approved_by` | `INTEGER` | `NULL`, `FOREIGN KEY` | Usuario que aprobó (`user.id`) |
| `created_at` | `TIMESTAMP WITHOUT TIME ZONE` | `NOT NULL` | Fecha y hora de creación |

**Índices:**
- `taskassignment_pkey` PRIMARY KEY, btree (id)
- `ix_taskassignment_scheduled_date` btree (scheduled_date)

**Tipos Enum:**
- `TASKSTATUS`: `PENDING`, `COMPLETED`, `APPROVED`, `REJECTED`

**Claves Foráneas:**
- `taskassignment_approved_by_fkey` FOREIGN KEY (approved_by) REFERENCES "user"(id)
- `taskassignment_task_id_fkey` FOREIGN KEY (task_id) REFERENCES task(id)
- `taskassignment_user_id_fkey` FOREIGN KEY (user_id) REFERENCES "user"(id)

**Referenciado por:**
- `taskcompletionphoto.task_assignment_id`

**Modelo SQLModel:** `TaskAssignment`

---

### 4. 🎁 **reward** - Recompensas Disponibles

Define las recompensas que los usuarios pueden canjear con sus créditos.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `INTEGER` | `PRIMARY KEY`, `AUTO INCREMENT` | Identificador único de la recompensa |
| `name` | `CHARACTER VARYING` | `NOT NULL` | Nombre de la recompensa |
| `description` | `CHARACTER VARYING` | `NULL` | Descripción detallada de la recompensa |
| `cost` | `INTEGER` | `NOT NULL` | Costo en créditos para canjear |
| `is_active` | `BOOLEAN` | `NOT NULL` | Estado activo/inactivo de la recompensa |
| `created_at` | `TIMESTAMP WITHOUT TIME ZONE` | `NOT NULL` | Fecha y hora de creación |

**Índices:**
- `reward_pkey` PRIMARY KEY, btree (id)

**Referenciado por:**
- `rewardredemption.reward_id`

**Modelo SQLModel:** `Reward`

---

### 5. 🏆 **rewardredemption** - Canjes de Recompensas

Registra los canjes de recompensas realizados por los usuarios.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `INTEGER` | `PRIMARY KEY`, `AUTO INCREMENT` | Identificador único del canje |
| `reward_id` | `INTEGER` | `NOT NULL`, `FOREIGN KEY` | Referencia a la recompensa (`reward.id`) |
| `user_id` | `INTEGER` | `NOT NULL`, `FOREIGN KEY` | Referencia al usuario (`user.id`) |
| `redeemed_at` | `TIMESTAMP WITHOUT TIME ZONE` | `NOT NULL` | Fecha y hora del canje |

**Índices:**
- `rewardredemption_pkey` PRIMARY KEY, btree (id)

**Claves Foráneas:**
- `rewardredemption_reward_id_fkey` FOREIGN KEY (reward_id) REFERENCES reward(id)
- `rewardredemption_user_id_fkey` FOREIGN KEY (user_id) REFERENCES "user"(id)

**Modelo SQLModel:** `RewardRedemption`

---

### 6. 📸 **taskcompletionphoto** - Fotos de Tareas Completadas

Almacena las fotos subidas como evidencia de tareas completadas.

| Campo | Tipo | Restricciones | Descripción |
|-------|------|---------------|-------------|
| `id` | `INTEGER` | `PRIMARY KEY`, `AUTO INCREMENT` | Identificador único de la foto |
| `task_assignment_id` | `INTEGER` | `NOT NULL`, `FOREIGN KEY` | Referencia a la asignación (`taskassignment.id`) |
| `filename` | `CHARACTER VARYING` | `NOT NULL` | Nombre del archivo en el sistema |
| `original_filename` | `CHARACTER VARYING` | `NOT NULL` | Nombre original del archivo subido |
| `file_path` | `CHARACTER VARYING` | `NOT NULL` | Ruta web relativa del archivo |
| `thumbnail_path` | `CHARACTER VARYING` | `NULL` | Ruta web del thumbnail (miniatura) |
| `file_size` | `INTEGER` | `NOT NULL` | Tamaño del archivo en bytes |
| `mime_type` | `CHARACTER VARYING` | `NOT NULL` | Tipo MIME del archivo |
| `uploaded_at` | `TIMESTAMP WITHOUT TIME ZONE` | `NOT NULL` | Fecha y hora de subida |

**Índices:**
- `taskcompletionphoto_pkey` PRIMARY KEY, btree (id)

**Claves Foráneas:**
- `taskcompletionphoto_task_assignment_id_fkey` FOREIGN KEY (task_assignment_id) REFERENCES taskassignment(id)

**Modelo SQLModel:** `TaskCompletionPhoto`

> **Nota**: Esta tabla usa el nombre `taskcompletionphoto` (sin guiones bajos) porque SQLModel usa por defecto el nombre de la clase, aunque el modelo tiene configurado `table_name = "task_completion_photo"` en su Config.

---

## 🏷️ Tipos de Datos Personalizados (ENUMs)

El sistema utiliza tipos enum de PostgreSQL para garantizar la integridad de los datos:

### **userrole**
- `ADMIN`: Usuario administrador con permisos completos
- `USER`: Usuario regular del sistema

### **tasktype**
- `INDIVIDUAL`: Tarea asignada a un usuario específico
- `COLLECTIVE`: Tarea que puede ser realizada por cualquier usuario

### **taskperiodicity**
- `DAILY`: Tarea que se repite diariamente
- `WEEKLY`: Tarea que se repite semanalmente
- `SPECIAL`: Tarea especial o única (no recurrente)

### **taskstatus**
- `PENDING`: Tarea asignada pero no completada
- `COMPLETED`: Tarea marcada como completada por el usuario
- `APPROVED`: Tarea aprobada por un administrador
- `REJECTED`: Tarea rechazada por un administrador

---

## 🔢 Secuencias (AUTO INCREMENT)

Cada tabla tiene su secuencia para generar IDs únicos:

- `user_id_seq` → `user.id`
- `task_id_seq` → `task.id`
- `taskassignment_id_seq` → `taskassignment.id`
- `reward_id_seq` → `reward.id`
- `rewardredemption_id_seq` → `rewardredemption.id`
- `taskcompletionphoto_id_seq` → `taskcompletionphoto.id`

---

## 🔗 Diagrama de Relaciones

```
user (1) ←→ (N) taskassignment (N) ←→ (1) task
 ↑                    ↓
 │               task_completion_photo
 │
 └─→ (N) rewardredemption (N) ←→ (1) reward
```

### Relaciones Detalladas:

1. **user → taskassignment**: Un usuario puede tener múltiples asignaciones
2. **task → taskassignment**: Una tarea puede tener múltiples asignaciones
3. **taskassignment → task_completion_photo**: Una asignación puede tener múltiples fotos
4. **user → rewardredemption**: Un usuario puede tener múltiples canjes
5. **reward → rewardredemption**: Una recompensa puede ser canjeada múltiples veces
6. **user → taskassignment (approved_by)**: Un usuario admin puede aprobar múltiples asignaciones

---

## 📊 Estado Actual de la Base de Datos

### Estadísticas de Tablas:
```sql
-- Consulta para ver el estado actual
SELECT
    schemaname,
    tablename,
    n_tup_ins as "Inserts",
    n_tup_upd as "Updates",
    n_tup_del as "Deletes",
    n_live_tup as "Live Rows"
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

### Tamaño de las Tablas:
```sql
-- Consulta para ver el tamaño de cada tabla
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as "Size"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

---

## 📊 Datos de Ejemplo

### Usuarios Iniciales:
- **admin** (ADMIN) - 0 créditos
- **maria** (USER) - 50 créditos  
- **carlos** (USER) - 30 créditos

### Tareas Iniciales:
- **Lavar los platos** - 10 créditos, Individual, Diaria
- **Sacar la basura** - 5 créditos, Individual, Semanal
- **Limpiar la sala** - 15 créditos, Colectiva, Semanal
- **Ordenar el cuarto** - 8 créditos, Individual, Diaria

### Recompensas Iniciales:
- **Helado especial** - 20 créditos
- **Película en familia** - 30 créditos
- **Salida al parque** - 40 créditos
- **Dinero extra** - 50 créditos
- **Día libre de tareas** - 80 créditos

---

## 🛠️ Comandos Útiles

### Conexión a la Base de Datos:
```bash
docker-compose exec db psql -U postgres -d family_tasks
```

### Consultas Básicas:
```sql
-- Ver todas las tablas
\dt

-- Ver estructura de una tabla
\d user

-- Contar registros por tabla
SELECT 'user' as tabla, count(*) FROM "user"
UNION ALL SELECT 'task', count(*) FROM task
UNION ALL SELECT 'reward', count(*) FROM reward;

-- Ver asignaciones con detalles
SELECT 
    ta.id,
    u.username,
    t.name as task_name,
    ta.status,
    ta.scheduled_date
FROM taskassignment ta
JOIN "user" u ON ta.user_id = u.id
JOIN task t ON ta.task_id = t.id;
```

---

## 🔧 Mantenimiento

### Backup:
```bash
docker-compose exec db pg_dump -U postgres family_tasks > backup.sql
```

### Restore:
```bash
docker-compose exec -T db psql -U postgres family_tasks < backup.sql
```

### Recrear desde cero:
```bash
docker-compose exec backend python recreate_clean_database.py
```

---

## ⚡ Optimización y Rendimiento

### Índices Importantes:
- `ix_user_username`: Optimiza búsquedas por nombre de usuario (login)
- `ix_taskassignment_scheduled_date`: Optimiza consultas por fecha de tareas
- Todas las claves primarias tienen índices automáticos

### Consultas Optimizadas Recomendadas:

```sql
-- Obtener tareas pendientes de un usuario para una fecha específica
SELECT t.name, ta.scheduled_date, ta.status
FROM taskassignment ta
JOIN task t ON ta.task_id = t.id
WHERE ta.user_id = $1 AND ta.scheduled_date = $2 AND ta.status = 'PENDING';

-- Obtener estadísticas de un usuario
SELECT
    u.username,
    u.credits,
    COUNT(CASE WHEN ta.status = 'APPROVED' THEN 1 END) as completed_tasks,
    COUNT(CASE WHEN ta.status = 'PENDING' THEN 1 END) as pending_tasks
FROM "user" u
LEFT JOIN taskassignment ta ON u.id = ta.user_id
WHERE u.id = $1
GROUP BY u.id, u.username, u.credits;

-- Obtener recompensas disponibles para un usuario
SELECT r.*
FROM reward r
WHERE r.is_active = true AND r.cost <= $1
ORDER BY r.cost ASC;
```

### Consideraciones de Rendimiento:
- Las consultas por `scheduled_date` están optimizadas con índice
- Las búsquedas por `username` son rápidas gracias al índice único
- Las relaciones usan claves foráneas para mantener integridad referencial
- Los tipos enum reducen el espacio de almacenamiento vs VARCHAR

---

## 🔒 Seguridad

### Características de Seguridad Implementadas:
- **Contraseñas hasheadas**: Uso de bcrypt para almacenar contraseñas
- **Claves foráneas**: Integridad referencial garantizada
- **Tipos enum**: Previenen valores inválidos en campos críticos
- **Campos NOT NULL**: Previenen datos incompletos en campos críticos

### Recomendaciones Adicionales:
- Implementar Row Level Security (RLS) para multi-tenancy si es necesario
- Considerar auditoría de cambios en tablas críticas
- Implementar backup automático regular
- Monitorear consultas lentas con `pg_stat_statements`
