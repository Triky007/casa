# Troubleshooting - Family Tasks Mobile

## 🔧 Problemas Comunes y Soluciones

### 1. **La aplicación web solo muestra texto sin estilos**

**Causa**: Problemas con el bundler o dependencias web faltantes.

**Solución**:
```bash
# Limpiar caché y reinstalar dependencias
cd mobile
rm -rf node_modules
npm install
npx expo start --clear
```

### 2. **iOS no conecta al backend**

**Causa**: iOS usa localhost en lugar de la IP local.

**Solución**: La configuración ya está arreglada en `src/utils/api.ts` para detectar automáticamente el entorno.

### 3. **Error de conexión en dispositivo móvil**

**Verificar**:
1. Que el backend esté corriendo: `http://192.168.248.1:3100`
2. Que tu dispositivo esté en la misma red WiFi
3. Que no haya firewall bloqueando el puerto 3100

**Solución alternativa**:
```typescript
// En src/utils/api.ts, cambiar por tu IP local:
return 'http://TU_IP_LOCAL:3100';
```

### 4. **Aplicación no carga o pantalla en blanco**

**Pasos de diagnóstico**:

1. **Verificar que Expo esté corriendo**:
   ```bash
   cd mobile
   npx expo start --clear
   ```

2. **Probar con aplicación simple**:
   - Renombrar `App.tsx` a `App.backup.tsx`
   - Renombrar `App.test.tsx` a `App.tsx`
   - Si funciona, el problema está en la aplicación principal

3. **Verificar dependencias**:
   ```bash
   npm install
   npx expo install --fix
   ```

### 5. **Errores de TypeScript**

**Verificar**:
```bash
npx tsc --noEmit
```

**Si hay errores**, revisar:
- Importaciones de componentes
- Tipos de navegación
- Configuración de TypeScript

### 6. **Iconos no aparecen**

**Solución**:
```bash
npx expo install @expo/vector-icons
```

### 7. **Backend no responde**

**Verificar que el backend esté corriendo**:
```bash
# En la carpeta principal del proyecto
cd backend
python run.py
```

**Probar conexión**:
```bash
# En Windows PowerShell
Invoke-WebRequest -Uri "http://localhost:3100/api/user/validate" -Method POST
```

## 🚀 Comandos Útiles

### Reiniciar completamente
```bash
cd mobile
rm -rf node_modules
npm install
npx expo start --clear
```

### Probar en diferentes plataformas
```bash
npx expo start
# Luego presionar:
# w - para web
# a - para Android
# i - para iOS
```

### Ver logs detallados
```bash
npx expo start --dev-client
```

### Verificar configuración
```bash
npx expo doctor
```

## 📱 Configuración de Red

### Para desarrollo local:
- **Web**: `http://localhost:3100`
- **Móvil**: `http://192.168.248.1:3100` (o tu IP local)

### Encontrar tu IP local:
```bash
# Windows
ipconfig

# Buscar "Dirección IPv4" en tu adaptador de red WiFi
```

## 🔍 Debug Avanzado

### 1. Habilitar debug remoto
- Abrir la aplicación en el dispositivo
- Agitar el dispositivo o presionar Cmd+D (iOS) / Cmd+M (Android)
- Seleccionar "Debug Remote JS"

### 2. Ver logs en tiempo real
```bash
npx expo start
# En otra terminal:
npx expo logs
```

### 3. Inspeccionar red
- Abrir Chrome DevTools
- Ir a Network tab
- Verificar que las peticiones al backend se estén haciendo correctamente

## ⚡ Solución Rápida

Si nada funciona, usar la aplicación de prueba:

1. **Renombrar archivos**:
   ```bash
   cd mobile
   mv App.tsx App.backup.tsx
   mv App.test.tsx App.tsx
   ```

2. **Reiniciar Expo**:
   ```bash
   npx expo start --clear
   ```

3. **Si funciona**, el problema está en la aplicación principal. Revisar:
   - AuthContext
   - Navegación
   - Importaciones de componentes

## 📞 Contacto

Si los problemas persisten, revisar:
1. Logs de la consola del navegador
2. Logs de Expo en la terminal
3. Logs del backend
4. Configuración de red y firewall
