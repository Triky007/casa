# 🏠 CASA - Family Tasks Management System

Sistema de gestión de tareas familiares con gamificación y recompensas.

## 🚀 Inicio Rápido

### Desarrollo
```bash
docker-compose -f docker-compose.dev.yml up --build
```

### Producción
```bash
docker-compose -f docker-compose.prod.yml up --build -d
```

## 🔧 Scripts Útiles

### Frontend
```bash
# Build completo con auto-corrección
./build-frontend.sh

# Solo corrección de localhost
./fix-localhost.sh
```

### Mobile
```bash
cd mobile
npx expo start --tunnel
```

### Monitoreo
```bash
# Logs en tiempo real
./monitor-login.sh

# Estado de salud
./check-health.sh
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

## 🔑 Credenciales por Defecto

```bash
# Crear usuarios iniciales
docker-compose -f docker-compose.prod.yml exec backend python scripts/seed_data.py
```

**Usuarios creados:**
- **Admin**: `admin` / `admin123`
- **Usuario 1**: `maria` / `maria123`
- **Usuario 2**: `carlos` / `carlos123`

## 🌐 URLs

- **Frontend**: https://family.triky.app
- **API**: https://api.family.triky.app
- **Docs**: https://api.family.triky.app/docs

## 🆘 Problemas Comunes

### Login bloqueado por rastreadores
```bash
./fix-localhost.sh
```

### Frontend no carga
```bash
./build-frontend.sh
```

### Mobile no conecta
```bash
# Verificar IP en mobile/src/utils/api.ts
# Usar tunnel: npx expo start --tunnel
```

## 📄 Licencia

MIT License - Ver archivo LICENSE para más detalles.
