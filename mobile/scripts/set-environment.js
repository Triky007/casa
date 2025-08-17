#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const environment = args[0];

if (!environment || !['development', 'production'].includes(environment)) {
  console.error('❌ Uso: node set-environment.js [development|production]');
  process.exit(1);
}

const configPath = path.join(__dirname, '../src/config/environment.ts');

try {
  let content = fs.readFileSync(configPath, 'utf8');
  
  // Buscar y reemplazar la línea del entorno
  const regex = /return '[^']+'; \/\/ Por defecto, usar development/;
  const replacement = `return '${environment}'; // Por defecto, usar development`;
  
  content = content.replace(regex, replacement);
  
  fs.writeFileSync(configPath, content, 'utf8');
  
  console.log(`✅ Entorno cambiado a: ${environment}`);
  console.log(`🌐 API URL será: ${environment === 'production' ? 'https://api.family.triky.app' : 'http://192.168.9.101:3110'}`);
  
} catch (error) {
  console.error('❌ Error al cambiar entorno:', error.message);
  process.exit(1);
}
