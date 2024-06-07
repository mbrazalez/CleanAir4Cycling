import json
from typing import Any, Dict, List
from fastapi import FastAPI, Depends, HTTPException, WebSocket, WebSocketDisconnect, status
import httpx
from pydantic import BaseModel
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
from cpn_service import update_cpn_values, update_origin_destination, xml_to_java_string

app = FastAPI()

origins = [
    "http://localhost:3000",
    "http://localhost:3000/*",
    "http://localhost:3000/home/",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Permitir sólo este origen
    allow_credentials=True,
    allow_methods=["*"],  # Permitir todos los métodos (GET, POST, etc.)
    allow_headers=["*"],  # Permitir todos los headers
)
ACCESS_TOKEN_EXPIRATION = 30

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

class UpdateRequest(BaseModel):
    states: Dict[str, str]  

routes_state = {
    "infoA3A5": 2, "infoA2A4": 2, 
    "infoA2A3": 2, "infoA1A2": 2, 
    "infoA1A6": 2, "infoA3A6": 2, 
    "infoA6A10": 2, "infoA6A7": 2, 
    "infoA9A10": 2, "infoA7A9": 2,
    "infoA8A9": 2, "infoA7A8": 2, 
    "infoA5A7": 2, "infoA4A8": 2, "infoA4A5": 2
}

@app.post("/update-station-states")
async def update_station_states(request: UpdateRequest):
    for station_id, state in request.states.items():
        if station_id in routes_state:
            if state == "Open":
                routes_state[station_id] = 2
            elif state == "Precaution":
                routes_state[station_id] = 1
            elif state == "Close":
                routes_state[station_id] = 0
    update_cpn_values('greenITS.cpn', routes_state, 5)
    return {"message": "States updated successfully"}


data_storage = {
    "pm10Data": {},
    "pm25Data": {},
    "humidityData": {},
    "windData": {}
}

class DataModel(BaseModel):
    type: str
    data: Dict[str, Any]

@app.post("/save_data")
async def save_data(data: DataModel):
    data_storage[data.type] = data.data
    return {"status": "success"}

@app.get("/get_data/{data_type}")
async def get_data(data_type: str):
    if data_type in data_storage:
        return {"data": data_storage[data_type]}
    else:
        raise HTTPException(status_code=404, detail="Data not found")
    
@app.post("/simulation")
async def simulation():
    print("atenchionaaaaa")
    cpn_updated = update_origin_destination('greenITS.cpn', 1, 7, 6)
    with open(cpn_updated, 'r', encoding='utf-8') as file:
        cpn_xml_content = file.read()

    print("voy a chache")
    payload = {
        "complex_verify": "false",
        "need_sim_restart": "true",
        "xml": xml_to_java_string(cpn_xml_content)
    }

    headers = {
        "X-SessionId": "CPN_IDE_SESSION_1714397722200"
    }
    
    print(xml_to_java_string(cpn_xml_content))
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post("http://localhost:8080/api/v2/cpn/init", json=payload, headers=headers)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Error in request to simulator")

            payload = {
                "options": {
                    "fair_be": "false",
                    "global_fairness": "false",
                }
            }
            response = await client.post("http://localhost:8080/api/v2/cpn/sim/init", json=payload, headers=headers)
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Error in request to simulator")

            payload = {
                "addStep": 5000,
                "untilStep": 0,
                "untilTime": 0,
                "addTime": 0,
                "amount": 5000
            }
            print("seguimos chache")

            response = await client.post("http://localhost:8080/api/v2/cpn/sim/step_fast_forward", json=payload, headers=headers)

            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Error in request to simulator")
            print("tocando chache")

            response_data = response.json()
            id_to_find = "ID1497673622"
            tokens_and_mark = response_data.get("tokensAndMark", [])
            route_info = next((item for item in tokens_and_mark if item["id"] == id_to_find), None)

            if not route_info:
                raise HTTPException(status_code=404, detail=f"ID {id_to_find} not found in the response")

            marking = route_info.get("marking", "")
        except Exception as e:
            raise HTTPException(status_code=500, detail=str(e))
        
    return {"message": marking }
    
    

# MQTT CONFIG
def on_connect(client, userdata, flags, rc):
    print("Connected with result code "+str(rc))
    client.subscribe("fistopic")

def on_message(client, userdata, msg):
    data = json.loads(msg.payload.decode('utf-8'))
    try:
        msg = process_fis_data(data)
        client.publish("fisoutput", json.dumps(msg))
    except Exception as e:
        print("Error processing data:", e)

client = mqtt.Client()
client.on_connect = on_connect
client.on_message = on_message
client.connect("54.78.231.141", 1883, 60)
client.loop_start()


