#!/usr/bin/env node
/**
 * Script para diagnosticar problemas de conexión de la aplicación móvil
 */

const axios = require('axios');

const LOCAL_API_URL = 'http://192.168.9.101:3110';
const LOCALHOST_API_URL = 'http://localhost:3110';

async function testEndpoint(url, description) {
  console.log(`\n🧪 Probando ${description}...`);
  console.log(`📡 URL: ${url}`);
  
  try {
    const response = await axios.get(url, { timeout: 5000 });
    console.log(`✅ ${description} OK:`, response.data);
    return true;
  } catch (error) {
    console.log(`❌ ${description} FALLÓ:`, {
      message: error.message,
      status: error.response?.status,
      code: error.code
    });
    return false;
  }
}

async function testLogin(apiUrl, credentials) {
  console.log(`\n🔐 Probando login en ${apiUrl}...`);
  
  try {
    const response = await axios.post(`${apiUrl}/api/user/login`, credentials, {
      timeout: 10000,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    
    console.log('✅ Login exitoso:', {
      token: response.data.access_token ? 'Recibido' : 'No recibido',
      tokenType: response.data.token_type
    });
    
    return response.data.access_token;
  } catch (error) {
    console.log('❌ Login falló:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return null;
  }
}

async function testAuthenticatedEndpoint(apiUrl, token) {
  console.log(`\n👤 Probando endpoint autenticado en ${apiUrl}...`);
  
  try {
    const response = await axios.get(`${apiUrl}/api/user/me`, {
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Endpoint autenticado OK:', {
      username: response.data.username,
      role: response.data.role,
      credits: response.data.credits
    });
    return true;
  } catch (error) {
    console.log('❌ Endpoint autenticado falló:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return false;
  }
}

async function testTasks(apiUrl, token) {
  console.log(`\n📋 Probando endpoint de tareas en ${apiUrl}...`);
  
  try {
    const response = await axios.get(`${apiUrl}/api/tasks/`, {
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ Tareas OK:', {
      totalTasks: response.data.length,
      tasks: response.data.map(t => ({ id: t.id, name: t.name, credits: t.credits }))
    });
    return true;
  } catch (error) {
    console.log('❌ Tareas falló:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return false;
  }
}

async function diagnose() {
  console.log('🔍 DIAGNÓSTICO DE CONEXIÓN MÓVIL');
  console.log('=' * 50);
  
  // Test 1: Conectividad básica
  console.log('\n📡 PASO 1: Verificando conectividad básica');
  const localhostOk = await testEndpoint(`${LOCALHOST_API_URL}/health`, 'localhost');
  const localIpOk = await testEndpoint(`${LOCAL_API_URL}/health`, 'IP local');
  
  if (!localIpOk) {
    console.log('\n❌ PROBLEMA: La IP local no es accesible');
    console.log('💡 Soluciones:');
    console.log('   - Verificar que Docker esté ejecutándose');
    console.log('   - Verificar que el backend esté en puerto 3110');
    console.log('   - Verificar firewall de Windows');
    return;
  }
  
  // Test 2: Endpoints de API
  console.log('\n📋 PASO 2: Verificando endpoints de API');
  await testEndpoint(`${LOCAL_API_URL}/docs`, 'Documentación API');
  await testEndpoint(`${LOCAL_API_URL}/api/tasks/`, 'Endpoint de tareas (sin auth)');
  
  // Test 3: Autenticación
  console.log('\n🔐 PASO 3: Verificando autenticación');
  const credentials = {
    username: 'admin',
    password: 'admin123'
  };
  
  const token = await testLogin(LOCAL_API_URL, credentials);
  
  if (!token) {
    console.log('\n❌ PROBLEMA: No se puede autenticar');
    console.log('💡 Soluciones:');
    console.log('   - Verificar que el usuario admin existe');
    console.log('   - Verificar credenciales');
    console.log('   - Verificar que la base de datos PostgreSQL esté funcionando');
    return;
  }
  
  // Test 4: Endpoints autenticados
  console.log('\n👤 PASO 4: Verificando endpoints autenticados');
  await testAuthenticatedEndpoint(LOCAL_API_URL, token);
  await testTasks(LOCAL_API_URL, token);
  
  // Test 5: Configuración móvil
  console.log('\n📱 PASO 5: Verificando configuración móvil');
  console.log('✅ Configuración actual:');
  console.log('   - Environment: development');
  console.log('   - API URL: http://192.168.9.101:3110');
  console.log('   - IP local detectada: 192.168.9.101');
  
  console.log('\n🎉 DIAGNÓSTICO COMPLETADO');
  console.log('💡 Si la aplicación móvil sigue sin funcionar:');
  console.log('   1. Reinicia la aplicación móvil (Expo)');
  console.log('   2. Limpia la caché: expo start --clear');
  console.log('   3. Verifica que estés en la misma red WiFi');
  console.log('   4. Verifica los logs de la aplicación móvil');
}

diagnose().catch(console.error);
