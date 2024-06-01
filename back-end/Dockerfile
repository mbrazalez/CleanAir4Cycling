# Utiliza una imagen base oficial de Python
FROM python:3.10-slim

# Establece el directorio de trabajo en el contenedor
WORKDIR /app

# Copia los archivos de requisitos y el código de la aplicación
COPY requirements.txt requirements.txt
COPY main.py main.py
COPY models.py models.py
COPY users_management_service.py users_management_service.py
COPY database.py database.py
COPY mandani_fis_service.py mandani_fis_service.py



# Instala las dependencias
RUN pip install --no-cache-dir -r requirements.txt

# Exponer el puerto en el que correrá la aplicación FastAPI
EXPOSE 8000

# Define el comando para ejecutar la aplicación
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
