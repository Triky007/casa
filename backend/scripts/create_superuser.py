#!/usr/bin/env python3
"""
Script para crear un superusuario en producción
Uso: python scripts/create_superuser.py
"""

import sys
import os
from pathlib import Path

# Agregar el directorio padre al path para importar la app
sys.path.append(str(Path(__file__).parent.parent))

from sqlmodel import Session, select
from app.core.database import engine
from app.models.user import User, UserRole
from app.core.security import get_password_hash
import getpass

def create_superuser():
    print("🚀 CREADOR DE SUPERUSUARIO")
    print("=" * 50)
    
    # Solicitar datos del superusuario
    username = input("👤 Nombre de usuario (superadmin): ").strip() or "superadmin"
    
    # Solicitar contraseña de forma segura
    while True:
        password = getpass.getpass("🔒 Contraseña: ")
        if len(password) < 6:
            print("❌ La contraseña debe tener al menos 6 caracteres")
            continue
        
        password_confirm = getpass.getpass("🔒 Confirmar contraseña: ")
        if password != password_confirm:
            print("❌ Las contraseñas no coinciden")
            continue
        break
    
    # Datos opcionales
    full_name = input("📝 Nombre completo (opcional): ").strip() or None
    email = input("📧 Email (opcional): ").strip() or None
    
    try:
        with Session(engine) as session:
            # Verificar si el usuario ya existe
            statement = select(User).where(User.username == username)
            existing_user = session.exec(statement).first()
            
            if existing_user:
                print(f"❌ El usuario '{username}' ya existe!")
                
                # Preguntar si quiere actualizar la contraseña
                update = input("¿Quieres actualizar la contraseña? (s/N): ").strip().lower()
                if update in ['s', 'si', 'y', 'yes']:
                    existing_user.password_hash = get_password_hash(password)
                    if full_name:
                        existing_user.full_name = full_name
                    if email:
                        existing_user.email = email
                    
                    session.add(existing_user)
                    session.commit()
                    session.refresh(existing_user)
                    
                    print(f"✅ Usuario '{username}' actualizado correctamente!")
                    print(f"🔑 ID: {existing_user.id}")
                    print(f"👑 Rol: {existing_user.role.value}")
                else:
                    print("❌ Operación cancelada")
                return
            
            # Crear nuevo superusuario
            hashed_password = get_password_hash(password)
            superuser = User(
                username=username,
                password_hash=hashed_password,
                role=UserRole.SUPERADMIN,
                full_name=full_name,
                email=email,
                is_active=True,
                credits=0,
                family_id=None  # Los superadmins no pertenecen a ninguna familia
            )
            
            session.add(superuser)
            session.commit()
            session.refresh(superuser)
            
            print("\n🎉 ¡SUPERUSUARIO CREADO EXITOSAMENTE!")
            print("=" * 50)
            print(f"👤 Usuario: {superuser.username}")
            print(f"🔑 ID: {superuser.id}")
            print(f"👑 Rol: {superuser.role.value}")
            print(f"📝 Nombre: {superuser.full_name or 'No especificado'}")
            print(f"📧 Email: {superuser.email or 'No especificado'}")
            print(f"✅ Activo: {superuser.is_active}")
            print(f"📅 Creado: {superuser.created_at}")
            
            print("\n💡 INSTRUCCIONES:")
            print("1. Usa estas credenciales para hacer login en la aplicación")
            print("2. El superadmin puede crear familias y administrar todo el sistema")
            print("3. Guarda estas credenciales en un lugar seguro")
            
    except Exception as e:
        print(f"❌ Error creando superusuario: {e}")
        import traceback
        print(f"🔍 Detalles: {traceback.format_exc()}")
        sys.exit(1)

if __name__ == "__main__":
    create_superuser()
