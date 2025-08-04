#!/usr/bin/env python3
"""
Script to seed the database with sample data for the Family Tasks application.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session
from app.core.database import engine
from app.models.user import User, UserRole
from app.models.task import Task, TaskType
from app.models.reward import Reward
from app.core.security import get_password_hash


def seed_database():
    """Seed the database with sample data."""
    
    with Session(engine) as session:
        # Create sample users
        admin_user = User(
            username="admin",
            password_hash=get_password_hash("admin123"),
            role=UserRole.ADMIN,
            credits=0
        )
        
        child1 = User(
            username="maria",
            password_hash=get_password_hash("maria123"),
            role=UserRole.USER,
            credits=50
        )
        
        child2 = User(
            username="carlos",
            password_hash=get_password_hash("carlos123"),
            role=UserRole.USER,
            credits=30
        )
        
        session.add_all([admin_user, child1, child2])
        session.commit()
        
        # Create sample tasks
        tasks = [
            Task(
                name="Lavar los platos",
                description="Lavar y secar todos los platos después de la cena",
                credits=10,
                task_type=TaskType.INDIVIDUAL
            ),
            Task(
                name="Sacar la basura",
                description="Sacar las bolsas de basura y colocar bolsas nuevas",
                credits=5,
                task_type=TaskType.INDIVIDUAL
            ),
            Task(
                name="Aspirar la sala",
                description="Aspirar toda la sala y acomodar los cojines",
                credits=15,
                task_type=TaskType.INDIVIDUAL
            ),
            Task(
                name="Limpiar el jardín",
                description="Recoger hojas y regar las plantas del jardín",
                credits=20,
                task_type=TaskType.COLLECTIVE
            ),
            Task(
                name="Organizar el garaje",
                description="Ordenar herramientas y limpiar el garaje familiar",
                credits=25,
                task_type=TaskType.COLLECTIVE
            ),
            Task(
                name="Hacer la cama",
                description="Tender la cama y ordenar el cuarto",
                credits=5,
                task_type=TaskType.INDIVIDUAL
            ),
            Task(
                name="Limpiar el baño",
                description="Limpiar espejo, lavabo, inodoro y piso del baño",
                credits=15,
                task_type=TaskType.INDIVIDUAL
            ),
            Task(
                name="Preparar la mesa",
                description="Poner platos, cubiertos y servilletas para la cena",
                credits=5,
                task_type=TaskType.INDIVIDUAL
            )
        ]
        
        session.add_all(tasks)
        session.commit()
        
        # Create sample rewards
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
                name="Noche de pizza",
                description="Pedir pizza para toda la familia",
                cost=60
            ),
            Reward(
                name="Juego nuevo",
                description="Un juego o juguete nuevo (hasta $200)",
                cost=100
            ),
            Reward(
                name="Día libre de tareas",
                description="Un día completo sin tareas asignadas",
                cost=80
            ),
            Reward(
                name="Salida especial",
                description="Una salida especial a elegir",
                cost=120
            )
        ]
        
        session.add_all(rewards)
        session.commit()
        
        print("✅ Database seeded successfully!")
        print(f"Created {len([admin_user, child1, child2])} users")
        print(f"Created {len(tasks)} tasks")
        print(f"Created {len(rewards)} rewards")
        print("\nSample login credentials:")
        print("Admin: admin / admin123")
        print("User 1: maria / maria123")
        print("User 2: carlos / carlos123")


if __name__ == "__main__":
    seed_database()
