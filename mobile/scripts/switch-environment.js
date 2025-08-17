#!/usr/bin/env node

/**
 * Script para cambiar entre entornos de desarrollo y producción
 * Uso: node scripts/switch-environment.js [development|production]
 */

const fs = require('fs');
const path = require('path');

const environmentFile = path.join(__dirname, '../src/config/environment.ts');

function switchEnvironment(targetEnv) {
  if (!['development', 'production'].includes(targetEnv)) {
    console.error('❌ Entorno inválido. Usa: development o production');
    process.exit(1);
  }

  try {
    let content = fs.readFileSync(environmentFile, 'utf8');
    
    // Reemplazar la línea del entorno actual
    const currentEnvRegex = /export const CURRENT_ENVIRONMENT = '[^']+'/;
    const newEnvLine = `export const CURRENT_ENVIRONMENT = '${targetEnv}'`;
    
    content = content.replace(currentEnvRegex, newEnvLine);
    
    fs.writeFileSync(environmentFile, content, 'utf8');
    
    console.log(`✅ Entorno cambiado a: ${targetEnv}`);
    console.log(`📱 Reinicia la aplicación móvil para aplicar los cambios`);
    
    if (targetEnv === 'production') {
      console.log(`⚠️  IMPORTANTE: Asegúrate de que la URL de producción esté configurada correctamente`);
      console.log(`🔧 Edita mobile/src/config/environment.ts y cambia 'tu-servidor-apache.com' por tu URL real`);
    }
    
  } catch (error) {
    console.error('❌ Error al cambiar entorno:', error.message);
    process.exit(1);
  }
}

// Obtener el entorno del argumento de línea de comandos
const targetEnv = process.argv[2];

if (!targetEnv) {
  console.log('📱 Script para cambiar entorno de la aplicación móvil');
  console.log('');
  console.log('Uso:');
  console.log('  node scripts/switch-environment.js development');
  console.log('  node scripts/switch-environment.js production');
  console.log('');
  process.exit(0);
}

switchEnvironment(targetEnv);
