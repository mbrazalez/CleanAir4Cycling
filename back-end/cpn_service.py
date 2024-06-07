import xml.etree.ElementTree as ET

def update_cpn_values(xml_file_path, fis_outputs, user_experience_level=5):
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
            if place_name in fis_outputs:
                # Actualizar los valores de acuerdo con las entradas del FIS
                new_values = f"{fis_outputs[place_name]},5,5,{user_experience_level}"
                new_text = f"val {place_name} = 1`({new_values})"
                # Actualizar el texto del elemento XML
                ml.text = new_text
                # Actualizar también el layout si es necesario
                layout_element = ml.find('layout')
                if layout_element is not None:
                    layout_element.text = new_text

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
                new_values = f"{user_experience},{destination},[({origin},\"o\")],1000"
                new_text = f"val {place_name} = 0`({new_values})"
                ml.text = new_text

            # Actualizar también el layout si es necesario
            layout_element = ml.find('layout')
            if layout_element is not None:
                layout_element.text = ml.text

    # Guardar el archivo XML modificado
    return xml_file_path

def xml_to_java_string(xml_content: str) -> str:
    # Escape backslashes and double quotes for Java string
    escaped_xml = xml_content.replace("\\", "\\\\").replace("\"", "\\\"")
    # Replace newlines with the newline escape sequence
    escaped_xml = escaped_xml.replace("\n", "\\n")
    # Add the Java string encapsulation
    java_string = f'\"{escaped_xml}\"'
    return java_string

