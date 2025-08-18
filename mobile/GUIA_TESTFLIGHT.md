# Guía para Publicar en TestFlight

Esta guía te mostrará paso a paso cómo publicar tu aplicación iOS en TestFlight para pruebas beta.

## Requisitos previos

- Una cuenta de Apple Developer activa (suscripción anual de $99 USD)
- Un archivo IPA generado desde Xcode (ver `XCODE_IPA_GUIDE.md`)
- Acceso a App Store Connect

## Paso 1: Configurar App Store Connect

1. Inicia sesión en [App Store Connect](https://appstoreconnect.apple.com) con tu Apple ID de desarrollador
2. Ve a la sección "Apps"
3. Haz clic en el botón "+" en la esquina superior izquierda para crear una nueva aplicación
4. Completa la información requerida:
   - Plataforma: iOS
   - Nombre: "Family Triky App"
   - Bundle ID: selecciona "com.triky.familyapp" del menú desplegable
   - SKU: un identificador único para uso interno (ej. "familytrikyapp2025")
   - Acceso de usuario: Acceso completo (recomendado)
5. Haz clic en "Crear"

## Paso 2: Configurar la información de la aplicación

1. En la página de tu aplicación, completa la información básica:
   - Información de la aplicación
   - Información de precios y disponibilidad
   - Preparar para envío

2. En la sección "Preparar para envío", completa:
   - Capturas de pantalla (al menos una por tipo de dispositivo)
   - Descripción de la aplicación
   - Palabras clave
   - URL de soporte
   - Información de contacto

3. No es necesario completar toda esta información para usar TestFlight, pero será requerida cuando quieras publicar en la App Store.

## Paso 3: Subir tu aplicación a TestFlight

### Método 1: Subir directamente desde Xcode

1. Abre tu proyecto en Xcode usando el archivo `.xcworkspace`
2. Asegúrate de que la versión y el número de compilación estén correctamente configurados
3. Selecciona "Any iOS Device (arm64)" como destino
4. Ve a Product > Archive
5. Cuando se complete el archivado, se abrirá el Organizador de Xcode
6. Selecciona el archivo y haz clic en "Distribute App"
7. Selecciona "App Store Connect" y luego "Upload"
8. Sigue los pasos del asistente, manteniendo las opciones predeterminadas
9. Espera a que se complete la subida y el procesamiento

### Método 2: Subir usando Transporter

Si ya tienes un archivo IPA generado:

1. Descarga [Transporter](https://apps.apple.com/us/app/transporter/id1450874784) desde la Mac App Store
2. Abre Transporter e inicia sesión con tu Apple ID de desarrollador
3. Haz clic en el botón "+" y selecciona tu archivo IPA
4. Haz clic en "Subir" y espera a que se complete el proceso

## Paso 4: Configurar TestFlight

1. Una vez que tu aplicación se haya subido correctamente, ve a App Store Connect
2. Selecciona tu aplicación y ve a la pestaña "TestFlight"
3. Espera a que Apple complete la revisión beta (puede tardar de unas horas a un día)
4. Una vez aprobada, verás un estado "Listo para probar"

### Configurar grupos de probadores internos

Los probadores internos son miembros de tu equipo de desarrollo:

1. En la sección "Probadores internos", haz clic en "Agregar probadores"
2. Ingresa las direcciones de correo electrónico asociadas con los Apple ID de tus probadores
3. Estos probadores recibirán un correo electrónico con instrucciones para instalar TestFlight y tu aplicación

### Configurar grupos de probadores externos

Los probadores externos pueden ser cualquier persona:

1. En la sección "Grupos de probadores externos", haz clic en "Crear grupo"
2. Dale un nombre al grupo (ej. "Beta Testers")
3. Haz clic en "Agregar probadores" e ingresa sus direcciones de correo electrónico
4. Estos probadores recibirán un correo electrónico con instrucciones una vez que Apple apruebe tu versión beta

## Paso 5: Gestionar la versión beta

1. En la sección TestFlight, puedes:
   - Ver quién ha instalado tu aplicación
   - Ver comentarios y reportes de errores
   - Agregar o eliminar probadores
   - Establecer una fecha de caducidad para la versión beta

2. Para cada compilación, puedes:
   - Agregar notas de la versión para informar a los probadores sobre las características o cambios
   - Habilitar o deshabilitar la recopilación de comentarios
   - Establecer requisitos de dispositivo (versión de iOS mínima, etc.)

## Solución de problemas comunes

### La aplicación está "En proceso" por mucho tiempo

- Espera al menos 1 hora
- Verifica que no haya problemas de validación en App Store Connect
- Asegúrate de que el Bundle ID coincida con el registrado en tu cuenta de desarrollador

### Rechazo de la revisión beta

Razones comunes:
- Problemas con los iconos o capturas de pantalla
- Problemas de privacidad o permisos
- Crashes o problemas de rendimiento

Solución:
1. Lee el correo electrónico de rechazo para entender el problema
2. Corrige los problemas mencionados
3. Sube una nueva versión

### Los probadores no reciben invitaciones

- Verifica que las direcciones de correo electrónico sean correctas
- Pide a los probadores que verifiquen su carpeta de spam
- Reenvía las invitaciones desde App Store Connect

## Notas importantes

- Las compilaciones de TestFlight caducan después de 90 días
- Puedes tener hasta 10,000 probadores externos
- Los probadores externos requieren revisión de Apple, los internos no
- Cada vez que subas una nueva versión, deberás volver a invitar a los probadores
- TestFlight está disponible en la App Store para iOS y iPadOS

## Enlaces útiles

- [Documentación oficial de TestFlight](https://developer.apple.com/testflight/)
- [Guía de App Store Connect](https://developer.apple.com/app-store-connect/)
