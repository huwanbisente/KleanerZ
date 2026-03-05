from sqlalchemy import Boolean, Column, Integer, String, Float, Enum
from sqlalchemy.orm import relationship
from database import Base
import enum

class UserRole(str, enum.Enum):
    GUEST = "guest"
    CLIENT = "client"
    CLEANER = "cleaner"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default=UserRole.GUEST)
    is_active = Column(Boolean, default=True)
    wallet_balance = Column(Float, default=0.0)
    
    # Profile Fields
    full_name = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    skills = Column(String, nullable=True) # Comma separated: "Deep Clean,Vacuum"
    equipment = Column(String, nullable=True)
    languages = Column(String, nullable=True)
    rating = Column(Float, default=0.0)
    reviews_count = Column(Integer, default=0)

