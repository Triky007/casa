#!/usr/bin/env node
/**
 * Script para probar la conectividad con el servidor externo
 */

const axios = require('axios');

const API_URL = 'http://192.168.9.101:3110';

async function testConnection() {
  console.log('🧪 Probando conectividad con servidor local...');
  console.log(`📡 URL: ${API_URL}`);
  
  try {
    // Test 1: Health check
    console.log('\n1. Probando health check...');
    const healthResponse = await axios.get(`${API_URL}/health`, {
      timeout: 30000
    });
    console.log('✅ Health check OK:', healthResponse.data);
    
    // Test 2: API docs
    console.log('\n2. Probando documentación API...');
    const docsResponse = await axios.get(`${API_URL}/docs`, {
      timeout: 30000
    });
    console.log('✅ Docs OK - Status:', docsResponse.status);
    
    // Test 3: OpenAPI spec
    console.log('\n3. Probando OpenAPI spec...');
    const openApiResponse = await axios.get(`${API_URL}/openapi.json`, {
      timeout: 30000
    });
    console.log('✅ OpenAPI OK - Endpoints encontrados:', Object.keys(openApiResponse.data.paths).length);
    
    // Test 4: Login endpoint (sin credenciales, solo para verificar que responde)
    console.log('\n4. Probando endpoint de login...');
    try {
      await axios.post(`${API_URL}/api/user/login`, {}, {
        timeout: 30000
      });
    } catch (error) {
      if (error.response?.status === 422) {
        console.log('✅ Login endpoint OK (error 422 esperado sin credenciales)');
      } else {
        throw error;
      }
    }
    
    console.log('\n🎉 Todos los tests pasaron. El servidor está funcionando correctamente.');
    console.log('\n💡 La aplicación móvil debería poder conectarse ahora.');
    
  } catch (error) {
    console.error('\n❌ Error de conectividad:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      timeout: error.code === 'ECONNABORTED'
    });
    
    if (error.code === 'ECONNABORTED') {
      console.log('\n🔍 Sugerencias para timeout:');
      console.log('   - Verificar conexión a internet');
      console.log('   - El servidor puede estar sobrecargado');
      console.log('   - Intentar aumentar el timeout en la app móvil');
    }
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.log('\n🔍 Sugerencias para error de conexión:');
      console.log('   - Verificar que el dominio esté configurado correctamente');
      console.log('   - Verificar que el servidor esté ejecutándose');
      console.log('   - Verificar configuración de DNS');
    }
  }
}

testConnection();
