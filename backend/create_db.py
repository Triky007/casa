#!/usr/bin/env python3
"""
Script to create the database and user for the Family Tasks application.
"""

import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT
import sys

def create_database_and_user():
    """Create database and user for the application."""
    
    # Try different connection methods
    connection_attempts = [
        {
            'host': 'localhost',
            'port': 5432,
            'user': 'postgres',
            'password': 'Masketu.123'
        },
        {
            'host': '127.0.0.1',
            'port': 5432,
            'user': 'postgres',
            'password': 'Masketu.123'
        },
        {
            'host': 'localhost',
            'port': 5433,
            'user': 'postgres',
            'password': 'Masketu.123'
        },
        # Try without specifying host (uses Unix socket on some systems)
        {
            'user': 'postgres',
            'password': 'Masketu.123'
        }
    ]
    
    conn = None
    superuser_params = None
    
    # Try different connection methods
    for i, params in enumerate(connection_attempts):
        try:
            print(f"Attempting connection {i+1}/{len(connection_attempts)}: {params}")
            conn = psycopg2.connect(**params)
            superuser_params = params
            print("✅ Successfully connected to PostgreSQL!")
            break
        except psycopg2.Error as e:
            print(f"❌ Connection attempt {i+1} failed: {e}")
            continue
    
    if conn is None:
        print("❌ All connection attempts failed!")
        print("Please check:")
        print("1. PostgreSQL is running")
        print("2. The password is correct")
        print("3. PostgreSQL is configured to accept connections")
        sys.exit(1)
    
    try:
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if user exists
        cursor.execute("SELECT 1 FROM pg_roles WHERE rolname='family_user'")
        user_exists = cursor.fetchone()

        if not user_exists:
            print("Creating user 'family_user'...")
            cursor.execute("CREATE USER family_user WITH PASSWORD 'secure_password';")
            print("✅ User 'family_user' created successfully!")
        else:
            print("ℹ️  User 'family_user' already exists.")
        
        # Check if database exists
        cursor.execute("SELECT 1 FROM pg_database WHERE datname='family_tasks'")
        db_exists = cursor.fetchone()
        
        if not db_exists:
            print("Creating database 'family_tasks'...")
            cursor.execute("CREATE DATABASE family_tasks OWNER family_user;")
            print("✅ Database 'family_tasks' created successfully!")
        else:
            print("ℹ️  Database 'family_tasks' already exists.")
        
        # Grant permissions
        print("Granting permissions...")
        cursor.execute("GRANT ALL PRIVILEGES ON DATABASE family_tasks TO \"user\";")
        
        cursor.close()
        conn.close()
        
        # Connect to the new database to set schema permissions
        db_params = superuser_params.copy()
        db_params['database'] = 'family_tasks'
        
        conn = psycopg2.connect(**db_params)
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        cursor.execute("GRANT ALL ON SCHEMA public TO family_user;")
        cursor.execute("GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO family_user;")
        cursor.execute("GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO family_user;")
        cursor.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO family_user;")
        cursor.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO family_user;")

        cursor.close()
        conn.close()

        print("✅ All permissions granted successfully!")
        print("\n🎉 Database setup completed!")
        print("You can now start the FastAPI server.")
        
    except psycopg2.Error as e:
        print(f"❌ Error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    create_database_and_user()
