# 🌐 Configuración con ngrok (Alternativa)

Si el firewall sigue bloqueando, puedes usar ngrok:

## 1. Instalar ngrok
- Ir a https://ngrok.com/
- Crear cuenta gratuita
- Descargar ngrok para Windows

## 2. Configurar ngrok
```bash
# Autenticar (usar tu token de ngrok)
ngrok authtoken TU_TOKEN_AQUI

# Crear túnel al backend
ngrok http 3100
```

## 3. Actualizar la configuración
En `mobile/src/utils/api.ts`, cambiar:
```typescript
return 'https://tu-url-de-ngrok.ngrok.io';
```

## 4. Ventajas de ngrok
- ✅ Funciona con cualquier firewall
- ✅ HTTPS automático
- ✅ URL pública temporal
- ✅ No requiere configuración de red
