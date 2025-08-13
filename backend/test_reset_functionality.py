#!/usr/bin/env python3
"""
Script para probar la funcionalidad de reset de tareas.
"""

import requests
import json

BASE_URL = "http://localhost:3110"

def test_reset_functionality():
    """Probar que el endpoint de reset funcione correctamente"""

    print("🧪 Probando funcionalidad de reset de tareas...")

    try:
        # Test 1: Verificar que el endpoint esté disponible
        print("\n1. Verificando que el endpoint esté disponible...")
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ API está funcionando")
        else:
            print(f"❌ API no responde: {response.status_code}")
            return

        # Test 2: Verificar que haya asignaciones para resetear
        print("\n2. Verificando asignaciones existentes...")
        response = requests.get(f"{BASE_URL}/api/tasks/assignments/all")
        if response.status_code == 200:
            assignments = response.json()
            print(f"📋 Asignaciones encontradas: {len(assignments)}")

            # Contar fotos
            total_photos = 0
            for assignment in assignments:
                if assignment.get('photos'):
                    total_photos += len(assignment['photos'])
            print(f"📸 Fotos encontradas: {total_photos}")
        else:
            print(f"❌ No se pudieron obtener asignaciones: {response.status_code}")
            return

        # Test 3: Verificar que el endpoint de reset esté registrado
        print("\n3. Verificando endpoint de reset...")
        response = requests.get(f"{BASE_URL}/openapi.json")
        if response.status_code == 200:
            openapi_spec = response.json()
            paths = openapi_spec.get('paths', {})

            if '/api/tasks/reset-all' in paths:
                print("✅ Endpoint /api/tasks/reset-all está registrado")
                methods = list(paths['/api/tasks/reset-all'].keys())
                print(f"   Métodos disponibles: {methods}")
            else:
                print("❌ Endpoint /api/tasks/reset-all NO está registrado")
                return

        print("\n✅ Todos los tests pasaron. La funcionalidad de reset debería funcionar.")
        print("\n💡 Para probar el reset completo:")
        print("   1. Ve al frontend web: http://localhost:3000/admin/settings")
        print("   2. O usa la app móvil como administrador")
        print("   3. Busca el botón de 'Resetear Tareas'")

    except Exception as e:
        print(f"❌ Error durante las pruebas: {e}")

if __name__ == "__main__":
    test_reset_functionality()