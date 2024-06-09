import ast
import xml.etree.ElementTree as ET
import re

from fastapi import HTTPException
import httpx

def update_cpn_values(xml_file_path, fis_inputs):
    # Cargar y parsear el archivo XML
    tree = ET.parse(xml_file_path)
    root = tree.getroot()

    # Recorrer todos los elementos 'ml' que contienen información sobre los lugares
    for ml in root.findall(".//ml[@id]"):
        # Obtener el texto del elemento que generalmente contiene la información de los valores
        text = ml.text.strip()
        if text.startswith("val"):
            # Extraer el nombre del lugar y los valores actuales
            place_name = text.split()[1]
            # Verificar si este lugar necesita ser actualizado según el diccionario de entrada
            if place_name in fis_inputs:
                # Actualizar los valores de acuerdo con las entradas del FIS
                new_values = f"{fis_inputs[place_name]},5,5,0"
                new_text = f"val {place_name} = 1`({new_values})"
                # Actualizar el texto del elemento XML
                ml.text = new_text
                # Actualizar también el layout si es necesario
                layout_element = ml.find('layout')
                if layout_element is not None:
                    layout_element.text = new_text

    # Guardar el archivo XML modificado
    tree.write(xml_file_path)

def update_specific_places(xml_file_path, origin, destination, user_experience):
    # Cargar y parsear el archivo XML
    tree = ET.parse(xml_file_path)
    root = tree.getroot()

    # Construir los nombres de los lugares basados en origen y destino
    origin_place_name = f"A{origin}info"
    destination_place_name = f"A{destination}info"

    # Patrón para identificar las etiquetas que tienen el formato AXinfo
    pattern = re.compile(r'^A\d+info$')

    # Recorrer todos los elementos 'ml' que contienen información sobre los lugares
    for ml in root.findall(".//ml"):
        # Obtener el texto del elemento que generalmente contiene la información de los valores
        text = ml.text.strip()
        if text.startswith("val"):
            # Extraer el nombre del lugar y verificar si coincide con el patrón
            place_name = text.split()[1]
            if pattern.match(place_name):
                # Actualizar todos los lugares con los mismos valores
                new_values = f"{user_experience},{destination},[({origin},\"o\")],0"
                if place_name == origin_place_name:
                    new_text = f"val {place_name} = 100`({new_values})"
                elif place_name == destination_place_name:
                    new_text = f"val {place_name} = 0`({user_experience},{destination},[({origin},\"o\")],100)"
                else:
                    new_text = f"val {place_name} = 0`({new_values})"
                ml.text = new_text

                # Actualizar también el layout si es necesario
                layout_element = ml.find('layout')
                if layout_element is not None:
                    layout_element.text = new_text

    # Guardar el archivo XML modificado
    tree.write(xml_file_path)

    # Guardar el archivo XML modificado
    tree.write(xml_file_path)

def update_origin_destination(xml_file_path, origin, destination, user_experience):
    # Cargar y parsear el archivo XML
    tree = ET.parse(xml_file_path)
    root = tree.getroot()

    # Construir los nombres de los lugares basados en origen y destino
    origin_place_name = f"A{origin}info"
    destination_place_name = f"A{destination}info"

    # Recorrer todos los elementos 'ml' que contienen información sobre los lugares
    for ml in root.findall(".//ml"):
        # Obtener el texto del elemento que generalmente contiene la información de los valores
        text = ml.text.strip()
        if text.startswith("val"):
            # Extraer el nombre del lugar y los valores actuales
            place_name = text.split()[1]
            # Verificar si este lugar es el origen o el destino
            if place_name == origin_place_name:
                # Actualizar el initial marking para el origen
                new_values = f"{user_experience},{destination},[({origin},\"o\")],0"
                new_text = f"val {place_name} = 100`({new_values})"
                ml.text = new_text
            elif place_name == destination_place_name:
                # Actualizar el initial marking para el destino
                new_values = f"{user_experience},{destination},[({origin},\"o\")],100"
                new_text = f"val {place_name} = 0`({new_values})"
                ml.text = new_text
            else:
                new_text = None

            # Actualizar también el layout si es necesario
            if new_text:
                layout_element = ml.find('layout')
                if layout_element is not None:
                    layout_element.text = new_text

    # Guardar el archivo XML modificado
    tree.write(xml_file_path)


async def simulate_petri_net():
    with open("./greenITS.cpn", "r", encoding='utf-8') as file:
        cpn_xml_content = file.read()

    timestamp = '1619116800000'
    payload_init = {"complex_verify": "false", "need_sim_restart": "true", "xml": cpn_xml_content}
    headers = {"X-SessionId": timestamp}
    timeout = httpx.Timeout(60.0, read=60.0)

    async with httpx.AsyncClient(timeout=timeout) as client:
        try:
            response = await client.post("http://localhost:8080/api/v2/cpn/init", json=payload_init, headers=headers)
            payload_sim_init = {"options": {"fair_be": "false", "global_fairness": "false"}}
            response = await client.post("http://localhost:8080/api/v2/cpn/sim/init", json=payload_sim_init, headers=headers)
            payload_step_forward = {"addStep": 5000, "untilStep": 0, "untilTime": 0, "addTime": 0, "amount": 5000}
            response = await client.post("http://localhost:8080/api/v2/cpn/sim/step_fast_forward", json=payload_step_forward, headers=headers)
            response_data = response.json()
            id_to_find = "ID1497673622"
            tokens_and_mark = response_data.get("tokensAndMark", [])
            route_info = next((item for item in tokens_and_mark if item["id"] == id_to_find), None)
            if not route_info:
                raise HTTPException(status_code=404, detail="Route info not found in the simulation response")
            print
            return response_data
        except httpx.RequestError as exc:
            raise HTTPException(status_code=500, detail=f"An error occurred while requesting {exc.request.url!r}.")

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


