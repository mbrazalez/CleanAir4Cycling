import json
from typing import Any, Dict, List
from fastapi import FastAPI, Depends, HTTPException, Path, WebSocket, WebSocketDisconnect, status
import httpx
import openrouteservice
from pydantic import BaseModel
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from datetime import time, timedelta
from models import UserCreate
from database import SessionLocal
from users_management_service import get_user_by_username, create_user, authenticate_user, create_access_token, verify_token, modify_password
import paho.mqtt.client as mqtt
from mandani_fis_service import process_fis_data, fis_results
from typing import Set
from cpn_service import extract_route_info, simulate_petri_net, update_cpn_values, update_origin_destination, update_specific_places
from route_service import get_open_route_service, get_area_to_avoid, extract_route_info

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
    update_cpn_values('greenITS.cpn', routes_state)
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



with open("./transitions.geojson", "r") as file:
    transitions_polygons = json.load(file)

with open("./stations.json", "r") as file:
    stations = json.load(file)

class SimulateRequest(BaseModel):
    origin: int
    destination: int
    username: str

@app.post("/simulate")
async def get_bike_route(request: SimulateRequest, db: Session = Depends(get_db)):
    print("Simulating route")
    user = get_user_by_username(db, request.username)
    user_experience = user.level
    update_specific_places('./greenITS.cpn', request.origin, request.destination, user_experience)
    update_origin_destination('./greenITS.cpn', request.origin, request.destination, user_experience)
    simulation_response = await simulate_petri_net()
    time, transitions = extract_route_info(simulation_response)
    #transitions = [(1, 'o'), (2, 'p'), (4, 'o'), (8, 'p'), (9, 'o'), (7, 'p')]
    print(transitions)
    city_polygon = get_area_to_avoid(transitions)
    origin_coords = stations.get(f"A{request.origin}")
    destination_coords = stations.get(f"A{request.destination}")

    if not origin_coords or not destination_coords:
        raise HTTPException(status_code=400, detail="Invalid station coordinates")

    route_data = get_open_route_service(origin_coords, destination_coords, city_polygon)
    return {
            "route": route_data,
            "time": 0,
            "avoid_polygon": city_polygon['coordinates']
        }

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