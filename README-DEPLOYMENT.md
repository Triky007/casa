# 🚀 Family Tasks - Guía de Despliegue

## 📋 Arquitectura

- **Backend**: FastAPI + PostgreSQL
- **Frontend**: React + Vite
- **Mobile**: React Native + Expo
- **Proxy**: Apache con SSL
- **Contenedores**: Docker + Docker Compose

## 🗄️ Base de Datos

**PostgreSQL 15** para todos los entornos:
- **Desarrollo**: PostgreSQL en Docker
- **Producción**: PostgreSQL en Docker
- **Credenciales**: `family_user` / `secure_password_change_this`

## 🛠️ Configuración de Desarrollo

```bash
# Clonar repositorio
git clone <repo-url>
cd family-tasks

# Ejecutar desarrollo
docker-compose -f docker-compose.dev.yml up --build

# URLs:
# Backend: http://localhost:3100/docs
# Frontend: http://localhost:5173
# PostgreSQL: localhost:5432
```

## 🌐 Despliegue en Producción

### 1. Preparar servidor

```bash
# Instalar Docker
sudo apt update
sudo apt install docker.io docker-compose-v2

# Habilitar Docker
sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker $USER
```

### 2. Configurar aplicación

```bash
# Subir código al servidor
git clone <repo-url> /var/www/family-tasks
cd /var/www/family-tasks

# Ejecutar script de configuración
chmod +x setup-production.sh
./setup-production.sh

# Editar variables de entorno
nano .env
```

### 3. Configurar Apache

```bash
# Configuración temporal (sin SSL)
sudo cp apache-config/family-triky-app-temp.conf /etc/apache2/sites-available/
sudo a2enmod proxy proxy_http proxy_wstunnel headers rewrite ssl
sudo a2ensite family-triky-app-temp.conf
sudo systemctl reload apache2

# Obtener certificados SSL
sudo apt install certbot python3-certbot-apache
sudo certbot certonly --webroot -w /var/www/html -d family.triky.app
sudo certbot certonly --webroot -w /var/www/html -d api.family.triky.app

# Configuración final con SSL
sudo a2dissite family-triky-app-temp.conf
sudo cp apache-config/family-triky-app.conf /etc/apache2/sites-available/
sudo a2ensite family-triky-app.conf
sudo systemctl reload apache2
```

### 4. Crear usuario admin

```bash
docker-compose exec backend python scripts/create_admin.py
```

## 📊 Monitoreo

```bash
# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f

# Logs de Apache
sudo tail -f /var/log/apache2/family.triky.app_error.log
sudo tail -f /var/log/apache2/api.family.triky.app_error.log
```

## 🔄 Actualizaciones

```bash
# Actualizar código
git pull origin main

# Reconstruir y reiniciar
docker-compose up --build -d

# Verificar
docker-compose ps
```

## 🔧 Build del Frontend

### Scripts Automatizados

**Build completo con auto-corrección:**
```bash
chmod +x build-frontend.sh
./build-frontend.sh
```

**Solo corrección de localhost (rápida):**
```bash
chmod +x fix-localhost.sh
./fix-localhost.sh
```

### Problema Conocido: localhost:3110

Durante el build del frontend, Vite puede incluir `http://localhost:3110` en el código JavaScript compilado, lo que causa errores `net::ERR_BLOCKED_BY_CLIENT` con bloqueadores de rastreadores.

**Solución Automática:**
Los scripts anteriores corrigen automáticamente este problema reemplazando `http://localhost:3110` por cadenas vacías, permitiendo que la aplicación use rutas relativas.

**Verificación:**
```bash
# Verificar si hay archivos con localhost:3110
docker-compose -f docker-compose.prod.yml exec frontend find /usr/share/nginx/html/assets/ -name "index-*.js" -exec grep -l "localhost:3110" {} \;

# Si devuelve archivos, ejecutar corrección:
./fix-localhost.sh
```

**Después de cualquier corrección:**
- Limpia el cache del navegador: `Ctrl+Shift+R`
- Verifica que las peticiones usen rutas relativas: `/api/user/login`

## 🔐 Seguridad

- ✅ PostgreSQL con credenciales seguras
- ✅ JWT para autenticación
- ✅ HTTPS con Let's Encrypt
- ✅ CORS configurado
- ✅ Headers de seguridad
- ✅ Contenedores sin privilegios root

## 📱 Aplicación Móvil

```bash
cd mobile
npm install

# Desarrollo con tunnel (recomendado)
npx expo start --tunnel

# O desarrollo con LAN
npx expo start --lan

# O desarrollo con IP específica
npx expo start --host 192.168.9.101
```

**Configuración de API:**
- **Desarrollo**: `http://192.168.9.101:3110` (configurado en `mobile/src/utils/api.ts`)
- **Producción**: `https://api.family.triky.app`

**Escanear QR** con la app Expo Go para probar en dispositivo móvil.

## 🆘 Troubleshooting

### Base de datos no conecta
```bash
docker-compose logs db
docker-compose exec db psql -U family_user -d family_tasks
```

### Frontend no carga
```bash
docker-compose logs frontend
curl http://localhost:4100
```

### API no responde
```bash
docker-compose logs backend
curl http://localhost:3100/docs
```
