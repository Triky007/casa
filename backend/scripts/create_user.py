#!/usr/bin/env python3
"""
Script to create a new user for the Family Tasks application.
"""

import sys
import os
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CURRENT_DIR)
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)

from sqlmodel import Session, select
from app.core.database import engine
from app.models.user import User, UserRole
from app.core.security import get_password_hash


def create_user():
    """Create a new user."""
    
    # Get user credentials
    username = input("Enter username: ").strip()
    if not username:
        print("Username cannot be empty!")
        return
    
    password = input("Enter password: ").strip()
    if not password:
        print("Password cannot be empty!")
        return
    
    role_input = input("Enter role (admin/user) [user]: ").strip().lower()
    role = UserRole.ADMIN if role_input == 'admin' else UserRole.USER
    
    credits_input = input("Enter initial credits [0]: ").strip()
    credits = int(credits_input) if credits_input.isdigit() else 0
    
    with Session(engine) as session:
        # Check if user already exists
        statement = select(User).where(User.username == username)
        existing_user = session.exec(statement).first()
        
        if existing_user:
            print(f"User '{username}' already exists!")
            return
        
        # Create user
        hashed_password = get_password_hash(password)
        new_user = User(
            username=username,
            password_hash=hashed_password,
            role=role,
            credits=credits
        )
        
        session.add(new_user)
        session.commit()
        session.refresh(new_user)
        
        print(f"User '{username}' created successfully!")
        print(f"Role: {role.value}")
        print(f"Credits: {credits}")
        print(f"User ID: {new_user.id}")


if __name__ == "__main__":
    create_user()
