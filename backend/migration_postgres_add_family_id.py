#!/usr/bin/env python3
"""
Migración para agregar family_id a las tablas Task y Reward en PostgreSQL
"""

import psycopg2
import os
from urllib.parse import urlparse

def get_db_connection():
    """Obtener conexión a la base de datos PostgreSQL"""
    # URL de conexión desde variables de entorno o default
    database_url = os.getenv('DATABASE_URL', 'postgresql://postgres:Masketu.123@localhost:5432/family_tasks')
    
    try:
        # Parsear la URL de la base de datos
        parsed = urlparse(database_url)
        
        conn = psycopg2.connect(
            host=parsed.hostname,
            port=parsed.port or 5432,
            database=parsed.path[1:],  # Remover el '/' inicial
            user=parsed.username,
            password=parsed.password
        )
        return conn
    except Exception as e:
        print(f"❌ Error conectando a la base de datos: {e}")
        return None

def run_migration():
    """Ejecutar la migración para agregar family_id a Task y Reward"""
    
    print("🔄 Iniciando migración: Agregar family_id a Task y Reward en PostgreSQL")
    
    conn = get_db_connection()
    if not conn:
        return
    
    try:
        cursor = conn.cursor()
        
        # Verificar si las columnas ya existen
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'task' AND column_name = 'family_id'
        """)
        task_has_family_id = cursor.fetchone() is not None
        
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'reward' AND column_name = 'family_id'
        """)
        reward_has_family_id = cursor.fetchone() is not None
        
        # Agregar family_id a la tabla Task si no existe
        if not task_has_family_id:
            print("📋 Agregando family_id a la tabla Task...")
            cursor.execute("""
                ALTER TABLE task 
                ADD COLUMN family_id INTEGER 
                REFERENCES family(id)
            """)
            
            # Crear índice para family_id en task
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS ix_task_family_id 
                ON task(family_id)
            """)
            
            print("✅ family_id agregado a Task")
        else:
            print("ℹ️  family_id ya existe en Task")
        
        # Agregar family_id a la tabla Reward si no existe
        if not reward_has_family_id:
            print("🎁 Agregando family_id a la tabla Reward...")
            cursor.execute("""
                ALTER TABLE reward 
                ADD COLUMN family_id INTEGER 
                REFERENCES family(id)
            """)
            
            # Crear índice para family_id en reward
            cursor.execute("""
                CREATE INDEX IF NOT EXISTS ix_reward_family_id 
                ON reward(family_id)
            """)
            
            print("✅ family_id agregado a Reward")
        else:
            print("ℹ️  family_id ya existe en Reward")
        
        # Asignar family_id a tareas y recompensas existentes
        print("🔄 Asignando family_id a datos existentes...")
        
        # Obtener la primera familia disponible
        cursor.execute("SELECT id FROM family ORDER BY id LIMIT 1")
        first_family = cursor.fetchone()
        
        if first_family:
            family_id = first_family[0]
            
            # Actualizar tareas sin family_id
            cursor.execute("""
                UPDATE task 
                SET family_id = %s 
                WHERE family_id IS NULL
            """, (family_id,))
            
            tasks_updated = cursor.rowcount
            if tasks_updated > 0:
                print(f"✅ {tasks_updated} tareas asignadas a familia {family_id}")
            
            # Actualizar recompensas sin family_id
            cursor.execute("""
                UPDATE reward 
                SET family_id = %s 
                WHERE family_id IS NULL
            """, (family_id,))
            
            rewards_updated = cursor.rowcount
            if rewards_updated > 0:
                print(f"✅ {rewards_updated} recompensas asignadas a familia {family_id}")
        else:
            print("⚠️  No se encontraron familias. Las tareas y recompensas quedarán sin asignar.")
        
        # Confirmar cambios
        conn.commit()
        print("🎉 Migración completada exitosamente")
        
        # Mostrar estadísticas
        cursor.execute("SELECT COUNT(*) FROM task WHERE family_id IS NOT NULL")
        tasks_with_family = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM reward WHERE family_id IS NOT NULL")
        rewards_with_family = cursor.fetchone()[0]
        
        print(f"📊 Estadísticas:")
        print(f"   - Tareas con familia: {tasks_with_family}")
        print(f"   - Recompensas con familia: {rewards_with_family}")
        
    except psycopg2.Error as e:
        print(f"❌ Error en la migración: {e}")
        conn.rollback()
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        conn.rollback()
    finally:
        cursor.close()
        conn.close()

if __name__ == "__main__":
    run_migration()
