# 📱 Configuración para iPhone - Family Tasks Mobile

## 🚀 Pasos para conectar iPhone

### 1. **Preparación**
- ✅ Descargar **Expo Go** desde App Store
- ✅ Conectar iPhone y PC a la **misma red WiFi**
- ✅ Asegurarse que el **backend esté corriendo** en puerto 3100

### 2. **Iniciar Expo con Túnel (Recomendado para iPhone)**
```bash
cd mobile
npx expo start --tunnel --clear
```

**¿Por qué túnel?**
- Funciona mejor con redes corporativas/complejas
- No requiere configuración de firewall
- Más estable para dispositivos iOS

### 3. **Alternativas si el túnel no funciona**

**Opción A - Modo LAN:**
```bash
npx expo start --lan --clear
```

**Opción B - Puerto específico:**
```bash
npx expo start --port 8083 --clear
```

### 4. **Verificar conexión de red**

**En Windows (PowerShell):**
```bash
# Verificar tu IP local
ipconfig

# Probar conectividad
ping 192.168.248.1
```

**En iPhone:**
- Ir a Configuración > WiFi
- Verificar que esté en la misma red que tu PC
- La IP debería estar en el mismo rango (192.168.248.x)

### 5. **Configuración del Backend**

El archivo `src/utils/api.ts` ya está configurado para detectar automáticamente:
- **Web**: `http://localhost:3100`
- **iPhone**: `http://192.168.248.1:3100`

### 6. **Troubleshooting iPhone específico**

**Problema: "No se puede conectar al servidor de desarrollo"**

**Solución 1 - Verificar firewall:**
```bash
# En Windows, permitir puerto 8081 en firewall
# O temporalmente deshabilitar firewall para pruebas
```

**Solución 2 - Usar IP específica:**
```bash
# Encontrar tu IP exacta
ipconfig
# Buscar "Dirección IPv4" en tu adaptador WiFi
```

**Solución 3 - Reiniciar servicios de red:**
```bash
# En iPhone: Configuración > General > Restablecer > Restablecer configuración de red
# Luego reconectar a WiFi
```

### 7. **Verificar que todo funciona**

**Backend corriendo:**
```bash
# Desde PowerShell
Invoke-WebRequest -Uri "http://192.168.248.1:3100/api/user/validate" -Method POST
# Debería devolver error de campos requeridos (esto es normal)
```

**Expo corriendo:**
- Deberías ver el QR code en la terminal
- La URL debería ser algo como: `exp://192.168.248.1:8081` o `exp://tunnel-url`

### 8. **Pasos en iPhone**

1. **Abrir Expo Go**
2. **Escanear QR** con la cámara del iPhone (no desde Expo Go)
3. **Esperar** a que se descargue el bundle
4. **Si falla**, intentar desde dentro de Expo Go:
   - Abrir Expo Go
   - Tocar "Scan QR Code"
   - Escanear el código

### 9. **Comandos útiles**

**Reinicio completo:**
```bash
cd mobile
rm -rf node_modules/.cache
npx expo start --tunnel --clear
```

**Ver logs en tiempo real:**
```bash
# En otra terminal
npx expo logs
```

**Verificar configuración:**
```bash
npx expo doctor
```

### 10. **Si nada funciona - Alternativa**

**Usar Expo Development Build:**
```bash
npx expo run:ios
```

**O probar en simulador iOS (solo Mac):**
```bash
npx expo start
# Presionar 'i' para iOS simulator
```

## 🔍 Diagnóstico paso a paso

### Paso 1: Verificar red
- [ ] iPhone y PC en misma WiFi
- [ ] Ping funciona entre dispositivos

### Paso 2: Verificar backend
- [ ] Backend corriendo en puerto 3100
- [ ] Responde a peticiones HTTP

### Paso 3: Verificar Expo
- [ ] Expo iniciado con `--tunnel`
- [ ] QR code visible
- [ ] No errores en terminal

### Paso 4: Verificar iPhone
- [ ] Expo Go instalado
- [ ] Cámara funciona para QR
- [ ] Conexión a internet estable

## 📞 Solución rápida

Si tienes prisa, usa esta secuencia:

```bash
# Terminal 1 - Backend
cd backend
python run.py

# Terminal 2 - Mobile
cd mobile
npx expo start --tunnel --clear
```

Luego escanea el QR con la **cámara del iPhone** (no desde Expo Go).

## ⚠️ Problemas comunes

- **"Network request failed"**: Problema de conectividad, usar `--tunnel`
- **"Unable to resolve host"**: Verificar IP en `api.ts`
- **"Metro bundler crashed"**: Limpiar caché con `--clear`
- **"QR code not working"**: Probar escaneando desde cámara vs Expo Go
