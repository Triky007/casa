// Script de prueba para verificar la integración de fotos en el frontend
const API_BASE = 'http://localhost:3110';

async function testPhotoIntegration() {
  console.log('🧪 Probando integración de fotos en frontend...');

  try {
    // Test 1: Verificar que el endpoint de assignments devuelva fotos
    const response = await fetch(`${API_BASE}/api/tasks/assignments/all`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const assignments = await response.json();
    console.log(`✅ Obtenidas ${assignments.length} asignaciones`);

    // Buscar asignaciones con fotos
    const assignmentsWithPhotos = assignments.filter(a => a.photos && a.photos.length > 0);
    console.log(`📸 Asignaciones con fotos: ${assignmentsWithPhotos.length}`);

    if (assignmentsWithPhotos.length > 0) {
      const firstWithPhotos = assignmentsWithPhotos[0];
      console.log(`📋 Ejemplo - Tarea: ${firstWithPhotos.task?.name || 'Sin nombre'}`);
      console.log(`👤 Usuario: ${firstWithPhotos.user?.username || 'Sin usuario'}`);
      console.log(`📸 Fotos: ${firstWithPhotos.photos.length}`);

      // Mostrar detalles de las fotos
      firstWithPhotos.photos.forEach((photo, index) => {
        console.log(`  📷 Foto ${index + 1}:`);
        console.log(`    - ID: ${photo.id}`);
        console.log(`    - Archivo: ${photo.filename}`);
        console.log(`    - URL: ${API_BASE}${photo.file_path}`);
        console.log(`    - Thumbnail: ${photo.thumbnail_path ? API_BASE + photo.thumbnail_path : 'No disponible'}`);
        console.log(`    - Tamaño: ${(photo.file_size / 1024).toFixed(1)} KB`);
      });
    } else {
      console.log('ℹ️  No hay asignaciones con fotos para mostrar');
    }

    console.log('✅ Integración de fotos verificada correctamente');

  } catch (error) {
    console.error('❌ Error en la integración:', error.message);
  }
}

// Ejecutar si se llama directamente
if (typeof window === 'undefined') {
  // Node.js environment
  const fetch = require('node-fetch');
  testPhotoIntegration();
} else {
  // Browser environment
  window.testPhotoIntegration = testPhotoIntegration;
}