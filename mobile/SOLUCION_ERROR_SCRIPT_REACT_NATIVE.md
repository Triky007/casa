# Solución al Error del Script React Native

## Problema

Al intentar archivar el proyecto iOS, se produce el siguiente error:

```
/Users/juan/Library/Developer/Xcode/DerivedData/FamilyTrikyApp-ahdazndejfirnngjviertgercwtg/Build/Intermediates.noindex/ArchiveIntermediates/FamilyTrikyApp/IntermediateBuildFilesPath/FamilyTrikyApp.build/Release-iphoneos/FamilyTrikyApp.build/Script-00DD1BFF1BD5951E006B06BC.sh: line 5: ../node_modules/react-native/scripts/react-native-xcode.sh: No such file or directory
Command PhaseScriptExecution failed with a nonzero exit code
```

Este error ocurre porque el proyecto Xcode todavía tiene una fase de compilación (Build Phase) que intenta ejecutar el script `react-native-xcode.sh`, pero ya hemos eliminado las dependencias de React Native del proyecto.

## Solución

Hemos modificado el archivo `project.pbxproj` para cambiar la fase de script que ejecuta `react-native-xcode.sh` por un script simple que no hace nada:

```objc
/* Begin PBXShellScriptBuildPhase section */
    00DD1BFF1BD5951E006B06BC /* Bundle React Native code and images */ = {
        isa = PBXShellScriptBuildPhase;
        buildActionMask = 2147483647;
        files = (
        );
        inputPaths = (
        );
        name = "Bundle React Native code and images";
        outputPaths = (
        );
        runOnlyForDeploymentPostprocessing = 0;
        shellPath = /bin/sh;
        shellScript = "echo \"Skipping React Native bundling\"\n";
    };
```

El script original intentaba ejecutar:

```bash
set -e

export NODE_BINARY=node
../node_modules/react-native/scripts/react-native-xcode.sh
```

Lo hemos reemplazado por un simple mensaje que indica que se está omitiendo el proceso de bundling de React Native:

```bash
echo "Skipping React Native bundling"
```

## Pasos para aplicar la solución

1. Modificar el archivo `project.pbxproj` como se muestra arriba
2. Ejecutar `pod install` para actualizar el workspace de Xcode
3. Abrir el proyecto usando el archivo `.xcworkspace`
4. Archivar el proyecto (Product > Archive)

## Notas importantes

- Esta solución es parte del proceso de eliminar las dependencias de React Native del proyecto iOS
- Si en el futuro deseas volver a integrar React Native, deberás restaurar este script y seguir las instrucciones en `REACT_NATIVE_INTEGRATION.md`
- Recuerda siempre abrir el proyecto usando el archivo `.xcworkspace` generado por CocoaPods, no el archivo `.xcodeproj`
