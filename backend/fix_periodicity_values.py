"""
Script para corregir los valores de la columna 'periodicity' en la tabla 'task'.
Convierte los valores de minúsculas a mayúsculas para que coincidan con el enum TaskPeriodicity.
"""

from sqlalchemy import create_engine, text
from app.core.config import settings

def fix_periodicity_values():
    """Corrige los valores de la columna 'periodicity' en la tabla 'task'."""
    # Crear conexión a la base de datos
    engine = create_engine(settings.database_url)
    
    # Definir los comandos SQL para actualizar los valores
    sql_commands = [
        text("UPDATE task SET periodicity = 'DAILY' WHERE periodicity = 'daily';"),
        text("UPDATE task SET periodicity = 'WEEKLY' WHERE periodicity = 'weekly';"),
        text("UPDATE task SET periodicity = 'SPECIAL' WHERE periodicity = 'special';"),
        # Asegurarse de que la columna tiene el tipo correcto
        text("ALTER TABLE task ALTER COLUMN periodicity TYPE VARCHAR(10);")
    ]
    
    # Ejecutar los comandos
    with engine.connect() as conn:
        for sql in sql_commands:
            conn.execute(sql)
        conn.commit()
        print("Valores de la columna 'periodicity' corregidos correctamente.")

if __name__ == "__main__":
    fix_periodicity_values()
