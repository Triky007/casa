#!/usr/bin/env python3
"""
Script to create an initial admin user for the Family Tasks application.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlmodel import Session, select
from app.core.database import engine
from app.models.user import User, UserRole
from app.core.security import get_password_hash


def create_admin_user():
    """Create an initial admin user."""
    
    # Get admin credentials
    username = input("Enter admin username: ").strip()
    if not username:
        print("Username cannot be empty!")
        return
    
    password = input("Enter admin password: ").strip()
    if not password:
        print("Password cannot be empty!")
        return
    
    with Session(engine) as session:
        # Check if user already exists
        statement = select(User).where(User.username == username)
        existing_user = session.exec(statement).first()
        
        if existing_user:
            print(f"User '{username}' already exists!")
            return
        
        # Create admin user
        hashed_password = get_password_hash(password)
        admin_user = User(
            username=username,
            password_hash=hashed_password,
            role=UserRole.ADMIN,
            credits=0
        )
        
        session.add(admin_user)
        session.commit()
        session.refresh(admin_user)
        
        print(f"Admin user '{username}' created successfully!")
        print(f"User ID: {admin_user.id}")


if __name__ == "__main__":
    create_admin_user()
