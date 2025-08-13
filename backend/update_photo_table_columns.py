#!/usr/bin/env python3
"""
Script para actualizar la tabla task_completion_photo agregando las nuevas columnas.
"""

import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Cargar variables de entorno del archivo .env.local
load_dotenv('.env.local')

def update_photo_table_columns():
    """Agregar nuevas columnas a la tabla task_completion_photo."""
    # Crear conexión a la base de datos
    database_url = os.getenv('DATABASE_URL')
    if not database_url:
        raise ValueError("DATABASE_URL not found in environment variables")

    engine = create_engine(database_url)

    # Definir el comando SQL para agregar las nuevas columnas
    sql = text("""
        -- Agregar nuevas columnas si no existen
        ALTER TABLE task_completion_photo
        ADD COLUMN IF NOT EXISTS full_file_path VARCHAR;

        ALTER TABLE task_completion_photo
        ADD COLUMN IF NOT EXISTS thumbnail_full_path VARCHAR;

        -- Actualizar registros existentes (si los hay) para convertir rutas del sistema a rutas web
        UPDATE task_completion_photo
        SET full_file_path = file_path
        WHERE full_file_path IS NULL AND file_path NOT LIKE '/uploads/%';

        UPDATE task_completion_photo
        SET file_path = '/uploads/task-photos/' || filename
        WHERE file_path NOT LIKE '/uploads/%';

        UPDATE task_completion_photo
        SET thumbnail_full_path = thumbnail_path
        WHERE thumbnail_full_path IS NULL AND thumbnail_path IS NOT NULL AND thumbnail_path NOT LIKE '/uploads/%';

        UPDATE task_completion_photo
        SET thumbnail_path = '/uploads/task-photos/thumbnails/thumb_' || filename
        WHERE thumbnail_path IS NOT NULL AND thumbnail_path NOT LIKE '/uploads/%';
    """)

    # Ejecutar el comando
    with engine.connect() as conn:
        conn.execute(sql)
        conn.commit()
        print("✅ Columnas agregadas y datos migrados correctamente.")

if __name__ == "__main__":
    update_photo_table_columns()