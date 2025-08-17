#!/usr/bin/env python3
"""
Migración para agregar family_id a las tablas Task y Reward
"""

import sqlite3
import os
from pathlib import Path

def run_migration():
    """Ejecutar la migración para agregar family_id a Task y Reward"""
    
    # Ruta de la base de datos
    db_path = Path(__file__).parent / "app.db"
    
    if not db_path.exists():
        print("❌ Base de datos no encontrada. Ejecuta la aplicación primero para crearla.")
        return
    
    print("🔄 Iniciando migración: Agregar family_id a Task y Reward")
    
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Verificar si las columnas ya existen
        cursor.execute("PRAGMA table_info(task)")
        task_columns = [column[1] for column in cursor.fetchall()]
        
        cursor.execute("PRAGMA table_info(reward)")
        reward_columns = [column[1] for column in cursor.fetchall()]
        
        # Agregar family_id a la tabla Task si no existe
        if 'family_id' not in task_columns:
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
        if 'family_id' not in reward_columns:
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
                SET family_id = ? 
                WHERE family_id IS NULL
            """, (family_id,))
            
            tasks_updated = cursor.rowcount
            if tasks_updated > 0:
                print(f"✅ {tasks_updated} tareas asignadas a familia {family_id}")
            
            # Actualizar recompensas sin family_id
            cursor.execute("""
                UPDATE reward 
                SET family_id = ? 
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
        
    except sqlite3.Error as e:
        print(f"❌ Error en la migración: {e}")
        conn.rollback()
    except Exception as e:
        print(f"❌ Error inesperado: {e}")
        conn.rollback()
    finally:
        conn.close()

if __name__ == "__main__":
    run_migration()
