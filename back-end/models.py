from sqlalchemy import Column, Integer, String
from database import engine
from database import Base
from pydantic import BaseModel 


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    password = Column(String)
    role = Column(String, index=True)
    level = Column(Integer, nullable=True, index=True)

User.metadata.create_all(bind=engine)

class UserCreate(BaseModel):
    username: str
    password: str
    role: str
    level: int | None
