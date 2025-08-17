#!/usr/bin/env python3
"""
Script para crear el primer superadmin del sistema multifamilias.
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlmodel import Session, select, SQLModel

# Agregar el directorio del backend al path
sys.path.append('/app')

def get_database_url():
    """Obtener la URL de la base de datos."""
    return "postgresql://postgres:Masketu.123@db:5432/family_tasks"

def create_superadmin():
    """Crear el primer superadmin del sistema."""
    from app.models.user import User, UserRole
    from app.models.family import Family
    from app.core.security import get_password_hash
    
    database_url = get_database_url()
    engine = create_engine(database_url)
    
    # Crear las tablas si no existen
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        # Verificar si ya existe un superadmin
        existing_superadmin = session.exec(
            select(User).where(User.role == UserRole.SUPERADMIN)
        ).first()
        
        if existing_superadmin:
            print(f"⚠️  Ya existe un superadmin: {existing_superadmin.username}")
            response = input("¿Crear otro superadmin? (y/N): ")
            if response.lower() != 'y':
                return
        
        print("🔧 CREANDO SUPERADMIN INICIAL")
        print("=" * 40)
        
        # Solicitar datos
        username = input("Username del superadmin: ").strip()
        if not username:
            print("❌ Username no puede estar vacío")
            return
        
        # Verificar que el username no exista
        existing_user = session.exec(
            select(User).where(User.username == username)
        ).first()
        
        if existing_user:
            print(f"❌ El usuario '{username}' ya existe")
            return
        
        password = input("Password del superadmin: ").strip()
        if not password:
            print("❌ Password no puede estar vacío")
            return
        
        full_name = input("Nombre completo (opcional): ").strip() or None
        email = input("Email (opcional): ").strip() or None
        
        # Crear superadmin
        hashed_password = get_password_hash(password)
        superadmin = User(
            username=username,
            password_hash=hashed_password,
            role=UserRole.SUPERADMIN,
            full_name=full_name,
            email=email,
            credits=0,
            family_id=None  # Los superadmins no pertenecen a ninguna familia
        )
        
        session.add(superadmin)
        session.commit()
        session.refresh(superadmin)
        
        print("\n✅ SUPERADMIN CREADO EXITOSAMENTE")
        print(f"   ID: {superadmin.id}")
        print(f"   Username: {superadmin.username}")
        print(f"   Role: {superadmin.role.value}")
        print(f"   Full Name: {superadmin.full_name or 'No especificado'}")
        print(f"   Email: {superadmin.email or 'No especificado'}")
        
        print("\n🎯 PRÓXIMOS PASOS:")
        print("1. Usar este superadmin para acceder al sistema")
        print("2. Crear familias desde la interfaz de administración")
        print("3. Crear administradores para cada familia")

def main():
    """Función principal."""
    try:
        create_superadmin()
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
