#!/usr/bin/env python3
"""
Script para probar URLs de imágenes
"""

import requests
import json

API_URL = 'http://localhost:3110'

def login_admin():
    """Login como admin"""
    try:
        response = requests.post(f'{API_URL}/api/user/login-with-family', 
                               json={'username': 'admin', 'password': 'admin123', 'family_id': 1})
        
        if response.status_code == 200:
            return response.json()['access_token']
        else:
            print(f"❌ Error en login: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Error en login: {e}")
        return None

def get_assignments_with_photos(token):
    """Obtener asignaciones con fotos"""
    try:
        headers = {'Authorization': f'Bearer {token}'}
        response = requests.get(f'{API_URL}/api/tasks/assignments/all', headers=headers)
        
        if response.status_code == 200:
            assignments = response.json()
            assignments_with_photos = [a for a in assignments if a.get('photos') and len(a['photos']) > 0]
            return assignments_with_photos
        else:
            print(f"❌ Error obteniendo asignaciones: {response.text}")
            return []
    except Exception as e:
        print(f"❌ Error obteniendo asignaciones: {e}")
        return []

def test_image_url(url):
    """Probar si una URL de imagen es accesible"""
    try:
        response = requests.get(url, timeout=5)
        if response.status_code == 200:
            return True, f"OK - Content-Type: {response.headers.get('content-type', 'unknown')}"
        else:
            return False, f"HTTP {response.status_code}"
    except Exception as e:
        return False, str(e)

def main():
    print("🧪 PROBANDO URLs DE IMÁGENES")
    print("=" * 60)
    
    # 1. Login como admin
    print("\n1️⃣ Login como admin...")
    token = login_admin()
    if not token:
        return
    print("✅ Login exitoso")
    
    # 2. Obtener asignaciones con fotos
    print("\n2️⃣ Obteniendo asignaciones con fotos...")
    assignments = get_assignments_with_photos(token)
    print(f"📊 Asignaciones con fotos: {len(assignments)}")
    
    if not assignments:
        print("❌ No hay asignaciones con fotos para probar")
        return
    
    # 3. Probar URLs de imágenes
    print("\n3️⃣ Probando URLs de imágenes...")
    
    for assignment in assignments[:3]:  # Solo las primeras 3
        print(f"\n📋 Asignación {assignment['id']} - {assignment.get('task_name', 'Sin nombre')}")
        
        for photo in assignment['photos']:
            print(f"\n📸 Foto {photo['id']}:")
            print(f"   Archivo original: {photo['original_filename']}")
            print(f"   Ruta en BD: {photo['file_path']}")
            print(f"   Thumbnail en BD: {photo.get('thumbnail_path', 'No thumbnail')}")
            
            # Probar imagen principal
            main_url = f"{API_URL}{photo['file_path']}"
            print(f"   🔗 URL principal: {main_url}")
            success, message = test_image_url(main_url)
            print(f"   {'✅' if success else '❌'} Resultado: {message}")
            
            # Probar thumbnail si existe
            if photo.get('thumbnail_path'):
                thumb_url = f"{API_URL}{photo['thumbnail_path']}"
                print(f"   🔗 URL thumbnail: {thumb_url}")
                success, message = test_image_url(thumb_url)
                print(f"   {'✅' if success else '❌'} Resultado: {message}")
    
    print("\n🎉 PRUEBA COMPLETADA")
    print("\n💡 INSTRUCCIONES:")
    print("1. Si las URLs fallan, verifica que el directorio uploads/ existe en el contenedor")
    print("2. Si las URLs funcionan, el problema está en el frontend")
    print("3. Puedes probar las URLs directamente en el navegador")

if __name__ == "__main__":
    main()
