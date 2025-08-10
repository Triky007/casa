#!/usr/bin/env python3
"""
Add scheduled_date (DATE) column to task assignment table if it doesn't exist.
"""
import os
import sys
from sqlalchemy import create_engine, text
from sqlalchemy.engine import Engine

CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from app.core.config import settings

def add_column():
    engine: Engine = create_engine(settings.database_url)
    dialect = engine.dialect.name
    with engine.connect() as conn:
        if dialect == 'sqlite':
            # Check if column exists
            exists = conn.execute(text("PRAGMA table_info('taskassignment')")).fetchall()
            has_col = any(row[1] == 'scheduled_date' for row in exists)
            if not has_col:
                conn.execute(text("ALTER TABLE taskassignment ADD COLUMN scheduled_date DATE"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_taskassignment_scheduled_date ON taskassignment(scheduled_date)"))
                conn.execute(text("UPDATE taskassignment SET scheduled_date = date('now') WHERE scheduled_date IS NULL"))
                conn.commit()
                print("scheduled_date added (sqlite)")
            else:
                print("scheduled_date already present (sqlite)")
        else:
            # Assume PostgreSQL-compatible
            count = conn.execute(text("""
                SELECT COUNT(*) FROM information_schema.columns
                WHERE table_name='taskassignment' AND column_name='scheduled_date'
            """)).scalar() or 0
            if int(count) == 0:
                conn.execute(text("ALTER TABLE taskassignment ADD COLUMN scheduled_date DATE"))
                conn.execute(text("CREATE INDEX IF NOT EXISTS idx_taskassignment_scheduled_date ON taskassignment(scheduled_date)"))
                conn.execute(text("UPDATE taskassignment SET scheduled_date = CURRENT_DATE WHERE scheduled_date IS NULL"))
                conn.commit()
                print("scheduled_date added (postgres)")
            else:
                print("scheduled_date already present (postgres)")

if __name__ == "__main__":
    add_column()

