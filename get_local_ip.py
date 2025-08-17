#!/usr/bin/env python3
"""
Script para obtener la IP local de la máquina para desarrollo móvil
"""

import socket
import subprocess
import platform

def get_local_ip():
    """Obtener la IP local de la máquina"""
    try:
        # Método 1: Conectar a un servidor externo para obtener la IP local
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        pass
    
    try:
        # Método 2: Obtener hostname y resolver IP
        hostname = socket.gethostname()
        ip = socket.gethostbyname(hostname)
        if ip != "127.0.0.1":
            return ip
    except Exception:
        pass
    
    return None

def get_network_interfaces():
    """Obtener todas las interfaces de red"""
    interfaces = []
    
    try:
        if platform.system() == "Windows":
            # Windows: usar ipconfig
            result = subprocess.run(['ipconfig'], capture_output=True, text=True)
            lines = result.stdout.split('\n')
            
            current_adapter = None
            for line in lines:
                line = line.strip()
                if 'adapter' in line.lower() and ':' in line:
                    current_adapter = line
                elif 'IPv4' in line and '192.168.' in line:
                    ip = line.split(':')[-1].strip()
                    interfaces.append({
                        'adapter': current_adapter,
                        'ip': ip
                    })
        else:
            # Linux/Mac: usar ifconfig o ip
            try:
                result = subprocess.run(['ifconfig'], capture_output=True, text=True)
                # Parsear salida de ifconfig
                # Implementación simplificada
                pass
            except FileNotFoundError:
                result = subprocess.run(['ip', 'addr'], capture_output=True, text=True)
                # Parsear salida de ip addr
                pass
    except Exception as e:
        print(f"Error obteniendo interfaces: {e}")
    
    return interfaces

def main():
    print("🔍 OBTENIENDO IP LOCAL PARA DESARROLLO MÓVIL")
    print("=" * 50)
    
    # Método principal
    local_ip = get_local_ip()
    if local_ip:
        print(f"✅ IP Local detectada: {local_ip}")
        print(f"🔗 URL para móvil: http://{local_ip}:3110")
    else:
        print("❌ No se pudo detectar IP automáticamente")
    
    # Interfaces de red
    print(f"\n📡 Interfaces de red disponibles:")
    interfaces = get_network_interfaces()
    
    if interfaces:
        for i, interface in enumerate(interfaces, 1):
            print(f"   {i}. {interface['adapter']}")
            print(f"      IP: {interface['ip']}")
            print(f"      URL: http://{interface['ip']}:3110")
    else:
        print("   No se pudieron obtener interfaces automáticamente")
    
    print(f"\n💡 INSTRUCCIONES:")
    print(f"1. Copia una de las URLs de arriba")
    print(f"2. Edita mobile/src/config/environment.ts")
    print(f"3. Reemplaza la IP en getDevelopmentApiUrl()")
    print(f"4. Reinicia la aplicación móvil")
    
    print(f"\n🧪 PROBAR CONEXIÓN:")
    if local_ip:
        print(f"   curl http://{local_ip}:3110/health")
        print(f"   curl http://{local_ip}:3110/api/families/public")

if __name__ == "__main__":
    main()
