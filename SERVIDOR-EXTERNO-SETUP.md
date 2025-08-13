# 🌐 Configuración para Servidor Externo (Linux + Apache)

## 🚨 **Problema Actual**
La aplicación móvil está recibiendo **Error 500** al intentar completar tareas con fotos:
```
ERROR  🚨 API Error: {"baseURL": "https://api.family.triky.app", "message": "Request failed with status code 500", "status": 500, "url": "/api/tasks/complete-with-photo/9"}
```

## 🔧 **Solución Paso a Paso**

### **1. Ejecutar Scripts de Configuración**

```bash
# En el servidor externo, navegar al directorio de la aplicación
cd /var/www/casa  # o donde esté tu aplicación

# Hacer ejecutables los scripts
chmod +x setup-server-directories.sh
chmod +x fix-upload-permissions.sh
chmod +x diagnose-upload-issues.sh

# 1. Configurar directorios y permisos básicos
./setup-server-directories.sh

# 2. Solucionar problemas específicos de permisos
./fix-upload-permissions.sh

# 3. Diagnosticar si aún hay problemas
./diagnose-upload-issues.sh
```

### **2. Verificar Estructura de Directorios**

Después de ejecutar los scripts, deberías tener:
```
/var/www/casa/
├── uploads/
│   └── task-photos/
│       └── thumbnails/
├── data/
│   └── postgres/
└── docker-compose.yml
```

### **3. Verificar Permisos**

```bash
# Verificar permisos de directorios
ls -la uploads/
ls -la uploads/task-photos/

# Deberías ver algo como:
# drwxrwxrwx 3 root root 4096 Aug 13 19:00 task-photos
```

### **4. Reiniciar Contenedores**

```bash
# Reiniciar para aplicar cambios
docker-compose restart

# O reiniciar completamente
docker-compose down
docker-compose up -d
```

### **5. Monitorear Logs**

```bash
# Ver logs en tiempo real
docker-compose logs backend --tail=50 -f

# Buscar errores específicos
docker-compose logs backend | grep -E "(Error|🚨|Exception)"
```

## 🔍 **Diagnóstico de Problemas**

### **Problema: Directorios no existen**
```bash
# Síntoma: Error "No such file or directory"
# Solución:
./setup-server-directories.sh
```

### **Problema: Permisos insuficientes**
```bash
# Síntoma: Error "Permission denied"
# Solución:
./fix-upload-permissions.sh

# O manualmente:
chmod -R 777 uploads/
chown -R root:root uploads/
```

### **Problema: Contenedor no puede escribir**
```bash
# Verificar montaje de volúmenes en docker-compose.yml:
volumes:
  - ./uploads:/app/uploads:rw
  - ./data:/app/data:rw

# Verificar usuario del contenedor:
user: "0:0"  # Ejecutar como root
```

### **Problema: Dependencias faltantes**
```bash
# Entrar al contenedor y verificar:
docker exec -it $(docker ps | grep backend | awk '{print $1}') bash

# Dentro del contenedor:
python -c "from PIL import Image; print('PIL OK')"
python -c "import aiofiles; print('aiofiles OK')"
```

## 🧪 **Probar la Funcionalidad**

### **1. Probar desde el contenedor**
```bash
# Entrar al contenedor backend
docker exec -it $(docker ps | grep backend | awk '{print $1}') bash

# Dentro del contenedor, probar crear archivo
touch /app/uploads/task-photos/test.jpg
ls -la /app/uploads/task-photos/
```

### **2. Probar endpoint directamente**
```bash
# Crear archivo de prueba
echo "fake image data" > test.jpg

# Probar upload (reemplaza 1 con un assignment_id válido)
curl -X POST \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@test.jpg" \
  http://localhost:3110/api/tasks/complete-with-photo/1
```

### **3. Probar desde la app móvil**
1. Abrir la app móvil
2. Intentar completar una tarea con foto
3. Monitorear logs: `docker-compose logs backend -f`

## 📋 **Checklist de Verificación**

- [ ] ✅ Directorios creados (`uploads/task-photos/thumbnails/`)
- [ ] ✅ Permisos configurados (777 o equivalente)
- [ ] ✅ Contenedores reiniciados
- [ ] ✅ Volúmenes montados correctamente
- [ ] ✅ Dependencias Python disponibles (PIL, aiofiles)
- [ ] ✅ Espacio en disco suficiente
- [ ] ✅ Backend responde en puerto 3110
- [ ] ✅ Logs no muestran errores

## 🚀 **Comandos Útiles**

```bash
# Ver estado de contenedores
docker-compose ps

# Ver logs específicos del backend
docker-compose logs backend --tail=100

# Entrar al contenedor para debug
docker exec -it $(docker ps | grep backend | awk '{print $1}') bash

# Verificar espacio en disco
df -h

# Ver archivos subidos
ls -la uploads/task-photos/

# Limpiar uploads (¡CUIDADO!)
rm -rf uploads/task-photos/*

# Reiniciar solo el backend
docker-compose restart backend
```

## 🔄 **Si Nada Funciona**

### **Opción Nuclear: Recrear Todo**
```bash
# Parar contenedores
docker-compose down

# Limpiar volúmenes
docker volume prune -f

# Recrear directorios
rm -rf uploads/ data/
./setup-server-directories.sh

# Reconstruir y reiniciar
docker-compose up --build -d
```

### **Verificar Configuración de Apache**
Si usas Apache como proxy:
```apache
# Asegúrate de que el proxy esté configurado correctamente
ProxyPass /api/ http://localhost:3110/api/
ProxyPassReverse /api/ http://localhost:3110/api/

# Para archivos estáticos
Alias /uploads /var/www/casa/uploads
<Directory "/var/www/casa/uploads">
    AllowOverride None
    Require all granted
</Directory>
```

## 📞 **Obtener Ayuda**

Si sigues teniendo problemas:

1. **Ejecutar diagnóstico completo**:
   ```bash
   ./diagnose-upload-issues.sh > diagnostic_report.txt
   ```

2. **Capturar logs detallados**:
   ```bash
   docker-compose logs backend --tail=200 > backend_logs.txt
   ```

3. **Verificar configuración**:
   ```bash
   cat docker-compose.yml
   ls -la uploads/
   ```

¡Con estos scripts y pasos deberías poder solucionar el problema de upload de fotos en el servidor externo!
