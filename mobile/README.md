# Family Tasks Mobile App

Aplicación móvil React Native para el sistema de gestión de tareas familiares.

## 🚀 Características

- **Autenticación segura** con tokens JWT
- **Dashboard interactivo** con estadísticas en tiempo real
- **Gestión de tareas** con estados y aprobaciones
- **Sistema de recompensas** con créditos
- **Panel de administración** completo
- **Navegación nativa** optimizada para móvil
- **Diseño responsive** adaptado a diferentes pantallas

## 📱 Pantallas

### Usuario Regular
- **Login**: Autenticación con usuario y contraseña
- **Dashboard**: Estadísticas personales y tareas recientes
- **Tareas**: Lista de tareas asignadas con opción de completar
- **Recompensas**: Catálogo de recompensas y historial de canjes
- **Perfil**: Información personal y configuración

### Administrador
- **Dashboard Admin**: Estadísticas generales del sistema
- **Gestión de Usuarios**: Activar/desactivar usuarios
- **Gestión de Tareas**: Administrar tareas del sistema
- **Gestión de Recompensas**: Administrar catálogo de recompensas
- **Aprobaciones**: Aprobar o rechazar tareas completadas

## 🛠️ Tecnologías

- **React Native** con Expo
- **TypeScript** para tipado estático
- **React Navigation** para navegación
- **Axios** para llamadas API
- **Expo Secure Store** para almacenamiento seguro
- **React Native Vector Icons** para iconografía

## 📦 Instalación

1. **Clonar el repositorio**
   ```bash
   cd mobile
   ```

2. **Instalar dependencias**
   ```bash
   npm install
   ```

3. **Configurar la URL del backend**
   Edita `src/utils/api.ts` y cambia la URL del API:
   ```typescript
   const API_URL = 'http://tu-backend-url.com';
   ```

4. **Ejecutar la aplicación**
   ```bash
   # Para desarrollo
   npm start

   # Para Android
   npm run android

   # Para iOS
   npm run ios

   # Para web
   npm run web
   ```

## 🏗️ Estructura del Proyecto

```
mobile/
├── src/
│   ├── components/          # Componentes reutilizables
│   ├── contexts/           # Contextos de React (Auth, etc.)
│   ├── navigation/         # Configuración de navegación
│   ├── screens/           # Pantallas de la aplicación
│   │   ├── admin/         # Pantallas de administración
│   │   └── ...            # Pantallas de usuario
│   ├── styles/            # Estilos globales y tema
│   ├── types/             # Definiciones de TypeScript
│   └── utils/             # Utilidades (API, helpers)
├── assets/                # Recursos estáticos
├── App.tsx               # Componente principal
└── package.json          # Dependencias y scripts
```

## 🔧 Configuración

### Variables de Entorno

La aplicación utiliza las siguientes configuraciones:

- **API_URL**: URL del backend (configurar en `src/utils/api.ts`)

### Autenticación

La aplicación utiliza:
- **JWT tokens** para autenticación
- **Expo Secure Store** para almacenamiento seguro de tokens
- **Interceptores de Axios** para manejo automático de tokens

## 📱 Compatibilidad

- **iOS**: 11.0+
- **Android**: API 21+ (Android 5.0+)
- **Web**: Navegadores modernos

## 🎨 Diseño

La aplicación utiliza un sistema de diseño consistente con:
- **Colores**: Paleta de colores definida en `src/styles/colors.ts`
- **Tipografía**: Sistema tipográfico en `src/styles/typography.ts`
- **Espaciado**: Sistema de espaciado en `src/styles/spacing.ts`
- **Componentes**: Estilos comunes en `src/styles/index.ts`

## 🔄 Sincronización con Backend

La aplicación se conecta al mismo backend que la versión web:
- **Mismas APIs**: Utiliza los mismos endpoints REST
- **Misma autenticación**: Compatible con el sistema de usuarios existente
- **Tiempo real**: Datos actualizados mediante pull-to-refresh

## 🚀 Despliegue

### Desarrollo
```bash
npm start
```

### Producción
1. **Build para Android**:
   ```bash
   expo build:android
   ```

2. **Build para iOS**:
   ```bash
   expo build:ios
   ```

3. **Publicar en Expo**:
   ```bash
   expo publish
   ```

## 📝 Notas de Desarrollo

- La aplicación está configurada para funcionar con el backend existente
- Los tipos TypeScript son compatibles con la API del backend
- La navegación está optimizada para la experiencia móvil
- Los estilos están adaptados para diferentes tamaños de pantalla

## 🤝 Contribución

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request
