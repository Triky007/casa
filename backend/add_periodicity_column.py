"""
Script para añadir la columna 'periodicity' a la tabla 'task' en la base de datos.
Este script utiliza SQLAlchemy para modificar la estructura de la tabla.
"""

from sqlalchemy import create_engine, text
from app.core.config import settings

def add_periodicity_column():
    """Añade la columna 'periodicity' a la tabla 'task'."""
    # Crear conexión a la base de datos
    engine = create_engine(settings.database_url)
    
    # Definir el comando SQL para añadir la columna
    sql = text("ALTER TABLE task ADD COLUMN IF NOT EXISTS periodicity VARCHAR(10) DEFAULT 'daily' NOT NULL;")
    
    # Ejecutar el comando
    with engine.connect() as conn:
        conn.execute(sql)
        conn.commit()
        print("Columna 'periodicity' añadida correctamente a la tabla 'task'.")

if __name__ == "__main__":
    add_periodicity_column()
