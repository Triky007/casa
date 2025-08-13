# 🚀 Guía de Despliegue

## Problema Solucionado: Login Bloqueado por Anti-Rastreadores

### ✅ Soluciones Implementadas:

1. **CORS Específico**: Cambió de `allow_origins=["*"]` a dominios específicos
2. **Cookies HTTPOnly Seguras**: Implementadas con `SameSite=Lax` (desarrollo) y `SameSite=None` (producción)
3. **Endpoint Amigable**: Cambió de `/validate` a `/login` para evitar bloqueos
4. **Configuración Dual**: Desarrollo (HTTP) y Producción (HTTPS) con configuraciones diferentes

## 🔧 Configuración por Entorno

### Desarrollo (Local)
- **URL API**: `http://localhost:3110`
- **Cookies**: `SameSite=Lax`, `Secure=False`
- **CORS**: Incluye `localhost` y `127.0.0.1`

### Producción (Apache + HTTPS)
- **URL API**: `` (vacía, usa rutas absolutas como `/api/user/login`)
- **Cookies**: `SameSite=None`, `Secure=True`
- **CORS**: Solo dominios HTTPS específicos
- **Apache**: `/api/` → Backend (3110), `/` → Frontend (4110)

## 📦 Despliegue

### Para Desarrollo:
```bash
docker-compose up --build -d
```

### Para Producción:
```bash
# Linux/Mac
./deploy-production.sh

# Windows
deploy-production.bat
```

## 🔍 Verificación

1. **Desarrollo**: http://localhost:4110/login
2. **Producción**: https://family.triky.app/login

### Comprobar que funciona con bloqueadores:
1. Activar bloqueador de rastreadores (uBlock Origin, etc.)
2. Hacer login con credenciales válidas
3. Verificar que no aparece `net::ERR_BLOCKED_BY_CLIENT`
4. En DevTools → Application → Cookies, debe aparecer `auth_token`

## 🛠️ Troubleshooting

### Error: `net::ERR_BLOCKED_BY_CLIENT`
- ✅ **Solucionado**: Endpoint cambiado a `/login`, CORS específico, cookies seguras

### Error: `localhost:3100` en producción
- ✅ **Solucionado**: Configuración separada para desarrollo/producción

### Error: `/api/api/user/login` (URL duplicada)
- ✅ **Solucionado**: VITE_API_URL vacía en producción, Apache proxy configurado

### Cookies no se guardan
- ✅ **Solucionado**: `withCredentials: true`, `SameSite` correcto según entorno

## 📋 Checklist Post-Despliegue

- [ ] Copiar `apache-config/family-triky-app.conf` a Apache
- [ ] Recargar Apache: `sudo systemctl reload apache2`
- [ ] Certificados SSL válidos
- [ ] Servicios Docker corriendo (`docker-compose ps`)
- [ ] Verificar proxy: `/api/` → Backend, `/` → Frontend
- [ ] Login funciona con bloqueadores activados
- [ ] Cookies se establecen correctamente
- [ ] API responde en `/api/user/login` (sin duplicación)
