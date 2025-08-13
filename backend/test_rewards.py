#!/usr/bin/env python3
"""
Script para probar la funcionalidad de recompensas.
"""

import requests
import json

BASE_URL = "http://localhost:3110"

def test_rewards_functionality():
    """Probar que los endpoints de recompensas funcionen correctamente"""
    
    print("🧪 Probando funcionalidad de recompensas...")
    
    try:
        # Test 1: Verificar que el endpoint esté disponible
        print("\n1. Verificando que la API esté disponible...")
        response = requests.get(f"{BASE_URL}/docs")
        if response.status_code == 200:
            print("✅ API está funcionando")
        else:
            print(f"❌ API no responde: {response.status_code}")
            return
        
        # Test 2: Verificar endpoints de recompensas en OpenAPI
        print("\n2. Verificando endpoints de recompensas...")
        response = requests.get(f"{BASE_URL}/openapi.json")
        if response.status_code == 200:
            openapi_spec = response.json()
            paths = openapi_spec.get('paths', {})
            
            reward_endpoints = [path for path in paths.keys() if '/api/rewards' in path]
            print(f"📋 Endpoints de recompensas encontrados: {len(reward_endpoints)}")
            
            for endpoint in reward_endpoints:
                methods = list(paths[endpoint].keys())
                print(f"   {endpoint}: {methods}")
                
            # Verificar endpoints específicos
            required_endpoints = [
                '/api/rewards/',
                '/api/rewards/admin/all',
                '/api/rewards/{reward_id}'
            ]
            
            for endpoint in required_endpoints:
                if endpoint in paths:
                    print(f"✅ {endpoint} está registrado")
                else:
                    print(f"❌ {endpoint} NO está registrado")
        
        # Test 3: Verificar que se puedan obtener recompensas (sin auth)
        print("\n3. Verificando acceso a recompensas públicas...")
        response = requests.get(f"{BASE_URL}/api/rewards/")
        print(f"   Status: {response.status_code}")
        if response.status_code == 401:
            print("   ℹ️  Requiere autenticación (esperado)")
        elif response.status_code == 200:
            rewards = response.json()
            print(f"   ✅ {len(rewards)} recompensas encontradas")
        else:
            print(f"   ❌ Error inesperado: {response.status_code}")
        
        print("\n✅ Tests completados.")
        print("\n💡 Para probar completamente:")
        print("   1. Ve al frontend web: http://localhost:4110/admin")
        print("   2. Ve a la pestaña 'Recompensas'")
        print("   3. Prueba crear, editar y eliminar recompensas")
        
    except Exception as e:
        print(f"❌ Error durante las pruebas: {e}")

if __name__ == "__main__":
    test_rewards_functionality()
