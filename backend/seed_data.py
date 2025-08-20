#!/usr/bin/env python3
"""
🌱 Script para crear datos iniciales en la base de datos
Family Tasks Management System
"""

import sys
from datetime import datetime, timedelta
from sqlmodel import Session, select
from app.core.database import engine
from app.models.user import User, UserRole
from app.models.family import Family
from app.models.task import Task, TaskType, TaskPeriodicity
from app.models.reward import Reward
from app.core.security import get_password_hash

def create_superadmin():
    """Crear superadmin del sistema"""
    print("🔑 Creando superadmin...")
    
    with Session(engine) as session:
        # Verificar si ya existe
        existing = session.exec(select(User).where(User.username == 'superadmin')).first()
        if existing:
            print("   ℹ️  Superadmin ya existe")
            return existing
        
        superadmin = User(
            username='superadmin',
            password_hash=get_password_hash('super123'),
            role=UserRole.SUPERADMIN,
            credits=0,
            is_active=True,
            created_at=datetime.utcnow(),
            full_name='Super Administrador',
            email='admin@family.triky.app'
        )
        
        session.add(superadmin)
        session.commit()
        session.refresh(superadmin)
        
        print(f"   ✅ Superadmin creado: {superadmin.username}")
        return superadmin

def create_families(superadmin_id):
    """Crear familias de ejemplo"""
    print("🏠 Creando familias de ejemplo...")
    
    families_data = [
        {
            'name': 'Familia García',
            'description': 'La familia García - Casa principal',
            'max_members': 6,
            'timezone': 'America/Mexico_City'
        },
        {
            'name': 'Familia López',
            'description': 'Los López - Departamento',
            'max_members': 4,
            'timezone': 'America/Mexico_City'
        },
        {
            'name': 'Familia Martínez',
            'description': 'Casa de los Martínez',
            'max_members': 5,
            'timezone': 'America/Mexico_City'
        }
    ]
    
    created_families = []
    
    with Session(engine) as session:
        for family_data in families_data:
            # Verificar si ya existe
            existing = session.exec(select(Family).where(Family.name == family_data['name'])).first()
            if existing:
                print(f"   ℹ️  Familia '{family_data['name']}' ya existe")
                created_families.append(existing)
                continue
            
            family = Family(
                **family_data,
                is_active=True,
                created_at=datetime.utcnow(),
                created_by=superadmin_id
            )
            
            session.add(family)
            session.commit()
            session.refresh(family)
            
            print(f"   ✅ Familia creada: {family.name}")
            created_families.append(family)
    
    return created_families

def create_users(families):
    """Crear usuarios de ejemplo para cada familia"""
    print("👥 Creando usuarios de ejemplo...")
    
    users_data = [
        # Familia García
        {'username': 'admin_garcia', 'password': 'admin123', 'role': UserRole.ADMIN, 'family_id': families[0].id, 'full_name': 'Admin García'},
        {'username': 'juan_garcia', 'password': 'user123', 'role': UserRole.USER, 'family_id': families[0].id, 'full_name': 'Juan García'},
        {'username': 'maria_garcia', 'password': 'user123', 'role': UserRole.USER, 'family_id': families[0].id, 'full_name': 'María García'},
        
        # Familia López
        {'username': 'admin_lopez', 'password': 'admin123', 'role': UserRole.ADMIN, 'family_id': families[1].id, 'full_name': 'Admin López'},
        {'username': 'carlos_lopez', 'password': 'user123', 'role': UserRole.USER, 'family_id': families[1].id, 'full_name': 'Carlos López'},
        
        # Familia Martínez
        {'username': 'admin_martinez', 'password': 'admin123', 'role': UserRole.ADMIN, 'family_id': families[2].id, 'full_name': 'Admin Martínez'},
        {'username': 'ana_martinez', 'password': 'user123', 'role': UserRole.USER, 'family_id': families[2].id, 'full_name': 'Ana Martínez'},
    ]
    
    created_users = []
    
    with Session(engine) as session:
        for user_data in users_data:
            # Verificar si ya existe
            existing = session.exec(select(User).where(User.username == user_data['username'])).first()
            if existing:
                print(f"   ℹ️  Usuario '{user_data['username']}' ya existe")
                created_users.append(existing)
                continue
            
            user = User(
                username=user_data['username'],
                password_hash=get_password_hash(user_data['password']),
                role=user_data['role'],
                family_id=user_data['family_id'],
                full_name=user_data['full_name'],
                email=f"{user_data['username']}@example.com",
                credits=100,  # Créditos iniciales
                is_active=True,
                created_at=datetime.utcnow()
            )
            
            session.add(user)
            session.commit()
            session.refresh(user)
            
            print(f"   ✅ Usuario creado: {user.username} ({user.role.value})")
            created_users.append(user)
    
    return created_users

def create_tasks(families):
    """Crear tareas de ejemplo para cada familia"""
    print("📋 Creando tareas de ejemplo...")
    
    tasks_data = [
        # Tareas diarias
        {'name': 'Lavar platos', 'description': 'Lavar y secar todos los platos después de las comidas', 'credits': 10, 'task_type': TaskType.INDIVIDUAL, 'periodicity': TaskPeriodicity.DAILY},
        {'name': 'Sacar la basura', 'description': 'Sacar la basura y poner bolsa nueva', 'credits': 5, 'task_type': TaskType.INDIVIDUAL, 'periodicity': TaskPeriodicity.DAILY},
        {'name': 'Hacer las camas', 'description': 'Hacer todas las camas de la casa', 'credits': 8, 'task_type': TaskType.INDIVIDUAL, 'periodicity': TaskPeriodicity.DAILY},
        
        # Tareas semanales
        {'name': 'Aspirar la casa', 'description': 'Aspirar todas las habitaciones y sala', 'credits': 20, 'task_type': TaskType.INDIVIDUAL, 'periodicity': TaskPeriodicity.WEEKLY},
        {'name': 'Limpiar baños', 'description': 'Limpiar y desinfectar todos los baños', 'credits': 25, 'task_type': TaskType.INDIVIDUAL, 'periodicity': TaskPeriodicity.WEEKLY},
        {'name': 'Lavar ropa', 'description': 'Lavar, secar y doblar la ropa', 'credits': 15, 'task_type': TaskType.INDIVIDUAL, 'periodicity': TaskPeriodicity.WEEKLY},
        
        # Tareas especiales
        {'name': 'Limpiar ventanas', 'description': 'Limpiar todas las ventanas de la casa', 'credits': 30, 'task_type': TaskType.INDIVIDUAL, 'periodicity': TaskPeriodicity.SPECIAL},
        {'name': 'Organizar garage', 'description': 'Organizar y limpiar el garage', 'credits': 40, 'task_type': TaskType.COLLECTIVE, 'periodicity': TaskPeriodicity.SPECIAL},
    ]
    
    with Session(engine) as session:
        for family in families:
            print(f"   📝 Creando tareas para {family.name}...")
            
            for task_data in tasks_data:
                # Verificar si ya existe
                existing = session.exec(
                    select(Task).where(
                        Task.name == task_data['name'],
                        Task.family_id == family.id
                    )
                ).first()
                
                if existing:
                    continue
                
                task = Task(
                    **task_data,
                    family_id=family.id,
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                
                session.add(task)
            
            session.commit()
            print(f"   ✅ Tareas creadas para {family.name}")

def create_rewards(families):
    """Crear recompensas de ejemplo para cada familia"""
    print("🎁 Creando recompensas de ejemplo...")
    
    rewards_data = [
        {'name': 'Hora extra de TV', 'description': 'Una hora adicional de televisión', 'cost': 20},
        {'name': 'Elegir película familiar', 'description': 'Elegir la película para la noche familiar', 'cost': 30},
        {'name': 'Salida al parque', 'description': 'Salida especial al parque favorito', 'cost': 50},
        {'name': 'Comida favorita', 'description': 'Elegir la comida para la cena', 'cost': 40},
        {'name': 'Dinero de bolsillo', 'description': '$50 pesos de dinero extra', 'cost': 100},
        {'name': 'Día sin tareas', 'description': 'Un día libre de todas las tareas', 'cost': 80},
    ]
    
    with Session(engine) as session:
        for family in families:
            print(f"   🎁 Creando recompensas para {family.name}...")
            
            for reward_data in rewards_data:
                # Verificar si ya existe
                existing = session.exec(
                    select(Reward).where(
                        Reward.name == reward_data['name'],
                        Reward.family_id == family.id
                    )
                ).first()
                
                if existing:
                    continue
                
                reward = Reward(
                    **reward_data,
                    family_id=family.id,
                    is_active=True,
                    created_at=datetime.utcnow()
                )
                
                session.add(reward)
            
            session.commit()
            print(f"   ✅ Recompensas creadas para {family.name}")

def main():
    """Función principal"""
    print("🌱 CASA - Family Tasks Management System")
    print("🗄️ Creando datos iniciales...")
    print("=" * 50)
    
    try:
        # Crear superadmin
        superadmin = create_superadmin()
        
        # Crear familias
        families = create_families(superadmin.id)
        
        # Crear usuarios
        users = create_users(families)
        
        # Crear tareas
        create_tasks(families)
        
        # Crear recompensas
        create_rewards(families)
        
        print("\n" + "=" * 50)
        print("🎉 ¡Datos iniciales creados exitosamente!")
        print("\n📋 Credenciales creadas:")
        print("   🔑 Superadmin: superadmin / super123")
        print("   👨‍💼 Admin García: admin_garcia / admin123")
        print("   👤 Juan García: juan_garcia / user123")
        print("   👤 María García: maria_garcia / user123")
        print("   👨‍💼 Admin López: admin_lopez / admin123")
        print("   👤 Carlos López: carlos_lopez / user123")
        print("   👨‍💼 Admin Martínez: admin_martinez / admin123")
        print("   👤 Ana Martínez: ana_martinez / user123")
        print("\n🏠 Familias creadas:")
        for family in families:
            print(f"   • {family.name} - {family.description}")
        print("\n📋 Tareas y 🎁 recompensas creadas para cada familia")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
