import json
import ast
import httpx
from fastapi import FastAPI, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from pathlib import Path
from shapely.geometry import shape, Polygon, mapping
import geopandas as gpd
import folium
from openrouteservice import client


ORS_API_KEY = '5b3ce3597851110001cf624851e61e019b7845f88e089b03de0cd1b0'
ors = client.Client(key=ORS_API_KEY)

# Cargar el archivo transitions.geojson una vez
with open('./transitions.geojson', 'r') as f:
    transitions_data = json.load(f)

def read_stations():
    stations_path = Path("./stations.json")
    with stations_path.open() as f:
        stations = json.load(f)
    return stations

def extract_route_info(json_response):
    id_to_find = "ID1497673622"
    tokens_and_mark = json_response.get("tokensAndMark", [])
    route_info = next((item for item in tokens_and_mark if item["id"] == id_to_find), None)
    if not route_info:
        return None, []
    
    marking = route_info.get("marking", "")
    if marking == "1`(5,7,[],10000)":
        return "no_route", []

    marking_data = ast.literal_eval(marking.split("`")[1])
    transitions = marking_data[2]
    time = marking_data[3]

    return time, transitions

def get_area_to_avoid(transitions):
    city_polygon = None
    for feature in transitions_data['features']:
        if 'properties' in feature and 'id' in feature['properties']:
            if feature['properties']['id'] == 'city_polygon':
                city_polygon = shape(feature['geometry'])
                break
    if city_polygon is None:
        raise ValueError("Polígono de la ciudad no encontrado")

    ruta = [str(t[0]) for t in transitions]
    transiciones = [f"infoA{ruta[i]}A{ruta[i+1]}" for i in range(len(ruta)-1)]
    transiciones += [f"infoA{ruta[i+1]}A{ruta[i]}" for i in range(len(ruta)-1)]
    
    zonas = []
    for feature in transitions_data['features']:
        if feature['geometry']['type'] == 'Polygon':
            if 'properties' in feature and 'id' in feature['properties']:
                tr = feature['properties']['id']
                if tr in transiciones:
                    zonas.append(shape(feature['geometry']))

    for zona in zonas:
        city_polygon = city_polygon.difference(zona)

    city_polygon = json.loads(json.dumps(city_polygon.__geo_interface__))
    return city_polygon


def get_open_route_service(start, end, avoid_polygon):
   route_request = {
         "coordinates": [start, end],
         "preference": "shortest",
         "profile": "cycling-regular",
         "format": "geojson",
         "instructions": "false",
         "options": {
              "avoid_polygons": {
                     "type": "Polygon",
                     "coordinates": avoid_polygon['coordinates'],
              }
         }
    }
   
   response = ors.directions(**route_request)
   return response

