#!/usr/bin/env python3
"""
Script para crear la tabla task_completion_photo en la base de datos.
Este script utiliza SQLAlchemy para crear la nueva tabla.
"""

import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Cargar variables de entorno del archivo .env.local
load_dotenv('.env.local')

def create_task_completion_photo_table():
    """Crear la tabla task_completion_photo."""
    # Crear conexión a la base de datos
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL not found in environment variables")

    engine = create_engine(database_url)

    # Definir el comando SQL para crear la tabla
    sql = text("""
        CREATE TABLE IF NOT EXISTS task_completion_photo (
            id SERIAL PRIMARY KEY,
            task_assignment_id INTEGER NOT NULL REFERENCES taskassignment(id) ON DELETE CASCADE,
            filename VARCHAR NOT NULL,
            original_filename VARCHAR NOT NULL,
            file_path VARCHAR NOT NULL,
            thumbnail_path VARCHAR,
            file_size INTEGER NOT NULL,
            mime_type VARCHAR NOT NULL,
            uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Crear índice para mejorar consultas por assignment_id
        CREATE INDEX IF NOT EXISTS idx_task_completion_photo_assignment_id
        ON task_completion_photo(task_assignment_id);
    """)

    # Ejecutar el comando
    with engine.connect() as conn:
        conn.execute(sql)
        conn.commit()
        print("✅ Tabla 'task_completion_photo' creada correctamente.")

if __name__ == "__main__":
    create_task_completion_photo_table()