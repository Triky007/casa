#!/usr/bin/env python3
"""
Script para recrear la base de datos con el sistema multifamilias.
"""

import os
import sys
from sqlalchemy import create_engine, text
from sqlmodel import SQLModel, Session

# Agregar el directorio del backend al path
sys.path.append('/app')

def get_database_urls():
    """Obtener las URLs de conexión a PostgreSQL."""
    postgres_url = "postgresql://postgres:Masketu.123@db:5432/postgres"
    database_url = "postgresql://postgres:Masketu.123@db:5432/family_tasks"
    return postgres_url, database_url

def drop_and_create_database():
    """Eliminar y recrear la base de datos family_tasks."""
    postgres_url, database_url = get_database_urls()
    
    print("🗑️  ELIMINANDO Y RECREANDO BASE DE DATOS...")
    print("=" * 60)
    
    engine = create_engine(postgres_url, isolation_level="AUTOCOMMIT")
    
    with engine.connect() as conn:
        # Terminar conexiones activas
        print("📡 Terminando conexiones activas...")
        conn.execute(text("""
            SELECT pg_terminate_backend(pid)
            FROM pg_stat_activity
            WHERE datname = 'family_tasks' AND pid <> pg_backend_pid()
        """))
        
        # Eliminar y crear la base de datos
        print("🗑️  Eliminando base de datos 'family_tasks'...")
        conn.execute(text("DROP DATABASE IF EXISTS family_tasks"))
        
        print("🆕 Creando base de datos 'family_tasks'...")
        conn.execute(text("CREATE DATABASE family_tasks OWNER postgres"))
        
    print("✅ Base de datos recreada exitosamente")

def create_tables_and_data():
    """Crear las tablas y datos iniciales."""
    _, database_url = get_database_urls()
    
    print("\n🏗️  CREANDO TABLAS Y DATOS...")
    print("=" * 60)
    
    try:
        # Importar todos los modelos
        from app.models.user import User, UserRole
        from app.models.family import Family
        from app.models.task import Task, TaskAssignment, TaskType, TaskStatus, TaskPeriodicity
        from app.models.reward import Reward, RewardRedemption
        from app.models.task_completion_photo import TaskCompletionPhoto
        from app.core.security import get_password_hash
        
        print("✅ Modelos importados correctamente")
        
        # Crear engine
        engine = create_engine(database_url)
        
        # Crear todas las tablas
        SQLModel.metadata.create_all(engine)
        print("✅ Tablas creadas desde modelos SQLModel")
        
        # Crear datos iniciales
        with Session(engine) as session:
            # 1. Crear superadmin
            superadmin = User(
                username="superadmin",
                password_hash=get_password_hash("super123"),
                role=UserRole.SUPERADMIN,
                full_name="Super Administrador",
                email="superadmin@family.app",
                credits=0,
                family_id=None
            )
            session.add(superadmin)
            session.commit()
            session.refresh(superadmin)
            print("✅ Superadmin creado")
            
            # 2. Crear familia de ejemplo
            family1 = Family(
                name="Familia García",
                description="Familia de ejemplo para pruebas",
                max_members=8,
                timezone="America/Mexico_City",
                created_by=superadmin.id
            )
            session.add(family1)
            session.commit()
            session.refresh(family1)
            print("✅ Familia de ejemplo creada")
            
            # 3. Crear admin de familia
            admin_user = User(
                username="admin",
                password_hash=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                family_id=family1.id,
                full_name="Administrador García",
                email="admin@garcia.com",
                credits=0
            )
            session.add(admin_user)
            
            # 4. Crear usuarios de familia
            user1 = User(
                username="maria",
                password_hash=get_password_hash("maria123"),
                role=UserRole.USER,
                family_id=family1.id,
                full_name="María García",
                email="maria@garcia.com",
                credits=50
            )
            
            user2 = User(
                username="carlos",
                password_hash=get_password_hash("carlos123"),
                role=UserRole.USER,
                family_id=family1.id,
                full_name="Carlos García",
                email="carlos@garcia.com",
                credits=30
            )
            
            session.add_all([user1, user2])
            session.commit()
            print("✅ Usuarios de familia creados")
            
            # 5. Crear tareas de ejemplo
            tasks = [
                Task(
                    name="Lavar los platos",
                    description="Lavar todos los platos después de la cena",
                    credits=10,
                    task_type=TaskType.INDIVIDUAL,
                    periodicity=TaskPeriodicity.DAILY
                ),
                Task(
                    name="Sacar la basura",
                    description="Sacar la basura a la calle",
                    credits=5,
                    task_type=TaskType.INDIVIDUAL,
                    periodicity=TaskPeriodicity.WEEKLY
                ),
                Task(
                    name="Limpiar la sala",
                    description="Aspirar y limpiar la sala familiar",
                    credits=15,
                    task_type=TaskType.COLLECTIVE,
                    periodicity=TaskPeriodicity.WEEKLY
                ),
                Task(
                    name="Ordenar el cuarto",
                    description="Mantener el cuarto ordenado y limpio",
                    credits=8,
                    task_type=TaskType.INDIVIDUAL,
                    periodicity=TaskPeriodicity.DAILY
                )
            ]
            
            session.add_all(tasks)
            session.commit()
            print("✅ Tareas creadas")
            
            # 6. Crear recompensas de ejemplo
            rewards = [
                Reward(
                    name="Helado especial",
                    description="Un helado de tu sabor favorito",
                    cost=20
                ),
                Reward(
                    name="Película en familia",
                    description="Elegir la película para ver en familia",
                    cost=30
                ),
                Reward(
                    name="Salida al parque",
                    description="Una tarde en el parque con amigos",
                    cost=40
                ),
                Reward(
                    name="Dinero extra",
                    description="$10 pesos de mesada extra",
                    cost=50
                ),
                Reward(
                    name="Día libre de tareas",
                    description="Un día completo sin tareas asignadas",
                    cost=80
                )
            ]
            
            session.add_all(rewards)
            session.commit()
            print("✅ Recompensas creadas")
            
            # Mostrar resumen
            print(f"\n📊 RESUMEN DE DATOS CREADOS:")
            print(f"  👑 Superadmin: 1")
            print(f"  🏠 Familias: 1")
            print(f"  👥 Usuarios: 3 (1 admin + 2 usuarios)")
            print(f"  📋 Tareas: {len(tasks)}")
            print(f"  🎁 Recompensas: {len(rewards)}")
            
        return engine
        
    except Exception as e:
        print(f"❌ Error creando tablas y datos: {e}")
        raise

def main():
    """Función principal."""
    print("🔄 RECREACIÓN DE BASE DE DATOS MULTIFAMILIAS")
    print("=" * 60)
    print("⚠️  ADVERTENCIA: Este script eliminará TODOS los datos existentes")
    print("⚠️  y recreará la base de datos desde cero.")
    print()
    
    response = input("¿Continuar con la recreación? (escriba 'SI' para confirmar): ")
    if response != 'SI':
        print("❌ Operación cancelada por el usuario.")
        return
    
    try:
        # Paso 1: Eliminar y recrear la base de datos
        drop_and_create_database()
        
        # Paso 2: Crear tablas y datos
        engine = create_tables_and_data()
        
        print("\n🎉 RECREACIÓN COMPLETADA EXITOSAMENTE")
        print("=" * 60)
        print("✅ Base de datos recreada con sistema multifamilias")
        print("✅ Datos iniciales poblados")
        print("\n🔑 CREDENCIALES DE ACCESO:")
        print("  👑 Superadmin: superadmin / super123")
        print("  👤 Admin Familia: admin / admin123")
        print("  👤 Usuario: maria / maria123")
        print("  👤 Usuario: carlos / carlos123")
        print("\n🚀 El sistema multifamilias está listo para usar!")
        
    except Exception as e:
        print(f"❌ Error durante la recreación: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
