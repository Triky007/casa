#!/usr/bin/env python3
"""
Script de prueba para verificar que los endpoints de fotos funcionen correctamente.
"""

import requests
import json

BASE_URL = "http://localhost:3110"

def test_endpoints():
    """Probar que los endpoints estén disponibles"""

    # Test 1: Verificar que la API esté funcionando
    try:
        response = requests.get(f"{BASE_URL}/docs")
        print(f"✅ API Documentation: {response.status_code}")
    except Exception as e:
        print(f"❌ API Documentation: {e}")
        return

    # Test 2: Verificar que los endpoints de fotos estén registrados
    try:
        response = requests.get(f"{BASE_URL}/openapi.json")
        if response.status_code == 200:
            openapi_spec = response.json()
            paths = openapi_spec.get('paths', {})

            photo_endpoints = [
                '/api/photos/upload/{assignment_id}',
                '/api/photos/assignment/{assignment_id}',
                '/api/photos/{photo_id}',
                '/api/tasks/complete-with-photo/{assignment_id}'
            ]

            for endpoint in photo_endpoints:
                if endpoint in paths:
                    print(f"✅ Endpoint registrado: {endpoint}")
                else:
                    print(f"❌ Endpoint NO registrado: {endpoint}")
        else:
            print(f"❌ No se pudo obtener OpenAPI spec: {response.status_code}")
    except Exception as e:
        print(f"❌ Error verificando endpoints: {e}")

    # Test 3: Verificar que el directorio de uploads exista
    try:
        response = requests.get(f"{BASE_URL}/uploads/")
        print(f"✅ Directorio uploads accesible: {response.status_code}")
    except Exception as e:
        print(f"❌ Directorio uploads: {e}")

if __name__ == "__main__":
    print("🧪 Probando endpoints de fotos...")
    test_endpoints()
    print("✅ Pruebas completadas")