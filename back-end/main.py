import json
from typing import List
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from datetime import timedelta
from models import UserCreate
from database import SessionLocal
from users_management_service import get_user_by_username, create_user, authenticate_user, create_access_token, verify_token, modify_password
import paho.mqtt.client as mqtt
from mandani_fis_service import process_fis_data, fis_results
from typing import Set

app = FastAPI()

ACCESS_TOKEN_EXPIRATION = 30

origins = [
    "http://localhost:3000",
    "http://localhost:3000/home",

]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/register")
def register_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = get_user_by_username(db, username=user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    return create_user(db=db, user=user)

@app.post("/token")
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = authenticate_user(form_data.username, form_data.password, db)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRATION)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/verify-token/{token}")
async def verify_user_token(token: str,  db: Session = Depends(get_db)):
    response = verify_token(db=db, token=token)
    return response

@app.get("/get-fis-info")
async def get_fis_info():
    return fis_results

@app.get("/get-user/{username}")
async def get_user(username: str, db: Session = Depends(get_db)):
    return get_user_by_username(db, username=username)

@app.put("/update-username/{username}")
async def update_username(username: str, new_username: str, db: Session = Depends(get_db)):
    user = get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if get_user_by_username(db, new_username):
        raise HTTPException(status_code=400, detail="Username already in use")
    user.username = new_username
    db.commit()
    return {"message": "Username updated successfully"}

@app.put("/update-password/{username}")
async def update_password(username: str, new_password: str, db: Session = Depends(get_db)):
    user = get_user_by_username(db, username)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.password = modify_password(new_password)
    db.commit()
    return {"message": "Password updated successfully"}




# MQTT CONFIG
def on_connect(client, userdata, flags, rc):
    print("Connected with result code "+str(rc))
    client.subscribe("fistopic")

def on_message(client, userdata, msg):
    data = json.loads(msg.payload.decode('utf-8'))
    try:
        process_fis_data(data)
        
    except Exception as e:
        print("Error processing data:", e)

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message
client.connect("54.78.231.141", 1883, 60)
client.loop_start()


