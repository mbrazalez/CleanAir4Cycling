from sqlalchemy.orm import Session
from models import User
from passlib.context import CryptContext
from models import UserCreate
from datetime import timedelta, datetime
from fastapi.security import OAuth2PasswordBearer
from jose import jwt
from fastapi import Depends, HTTPException

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "green_routes"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
# get user from db
def get_user_by_username(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()  

# create user
def create_user(db: Session, user: UserCreate):
    hashed_password = pwd_context.hash(user.password)
    db_user = User(username=user.username, password=hashed_password, role=user.role, level=user.level)
    db.add(db_user)
    db.commit()
    return "complete"

# auth user
def authenticate_user(username:str, password: str, db: Session):
    user = get_user_by_username(db, username)
    if not user or not pwd_context.verify(password, user.password):
        return False
    return user

# create jwt token
def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# verify token
def verify_token(db: Session , token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(status_code=403, detail="Token is invalid or expired")
        else:
            user = get_user_by_username(db, username)
            payload = {'user': user, 'payload': payload}
        return payload
    
    except jwt.JWTError:
        raise HTTPException(status_code=403, detail="Token is invalid or expired")
    
def modify_password(new_password: str):
    return pwd_context.hash(new_password)