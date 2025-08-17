# Guía para configurar Workflows de CI/CD para la app FamilyTrikyApp

Esta guía explica cómo configurar correctamente los workflows de CI/CD para la generación automática de builds de la aplicación iOS.

## Configuración de ramas en workflows

### Problema común: "The branch is not associated with the workflow"

Este error ocurre cuando intentas generar un build manual desde una rama que no está configurada en las condiciones de inicio del workflow.

### Solución: Asociar la rama "triky" al workflow

#### Opción 1: Modificar un workflow existente

1. Accede al panel de administración de tu servicio CI/CD (Xcode Cloud, App Center, etc.)
2. Selecciona el workflow que deseas modificar
3. Busca la sección "Start Conditions" o "Branch Triggers"
4. Añade la rama "triky" a la lista de ramas permitidas
5. Guarda los cambios

#### Opción 2: Crear un workflow específico para la rama

1. En el panel de CI/CD, crea un nuevo workflow
2. Nómbralo de manera descriptiva (ej: "Build Triky Branch")
3. En la configuración, especifica la rama "triky" como condición de inicio
4. Configura las demás opciones según tus necesidades
5. Guarda el nuevo workflow

## Generación manual de builds

Para generar un build manualmente desde una rama específica:

1. Asegúrate de que la rama esté asociada a algún workflow
2. Ve al panel de CI/CD
3. Selecciona el workflow adecuado
4. Haz clic en "Start Build" o "Build Now"
5. Selecciona la rama "triky" del menú desplegable
6. Confirma para iniciar el proceso de build

## Alternativa: Compilación local sin CI/CD

Si necesitas generar un archivo .ipa urgentemente y no puedes modificar la configuración de CI/CD:

1. Abre el proyecto en Xcode localmente
2. Selecciona "Any iOS Device (arm64)" como destino
3. Ve a Product > Archive
4. Cuando termine, selecciona "Distribute App"
5. Elige el método de distribución adecuado (Ad Hoc, App Store, etc.)
6. Sigue los pasos del asistente para generar el archivo .ipa

## Buenas prácticas

- Mantén una estructura de ramas consistente
- Configura workflows específicos para ramas de producción, desarrollo y features
- Documenta qué ramas están asociadas a qué workflows
- Considera usar expresiones regulares para asociar múltiples ramas similares (ej: feature/*)
