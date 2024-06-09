import React, { useEffect, useState } from 'react';
import mqtt from 'mqtt';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';
import 'chartjs-adapter-date-fns';
import axios from 'axios';
import StationSelector from './StationSelector'; // Asegúrate de ajustar la ruta de importación según la estructura de tu proyecto

const COLORS = {
  infoA3A5: 'red',
  infoA2A4: 'blue',
  infoA2A3: 'green',
  infoA1A2: 'orange',
  infoA1A6: 'purple',
  infoA3A6: 'brown',
  infoA6A10: 'pink',
  infoA6A7: 'yellow',
  infoA9A10: 'cyan',
  infoA7A9: 'magenta',
  infoA8A9: 'lime',
  infoA7A8: 'teal',
  infoA5A7: 'olive',
  infoA4A8: 'navy',
  infoA4A5: 'gray',
};

const CONNECTION_NAMES = {
  infoA3A5: '(A3) Punta del Parque - (A5) Ensanche',
  infoA2A4: '(A2) Corte Inglés - (A4) Perpetuo Socorro',
  infoA2A3: '(A2) Corte Inglés - (A3) Punta del Parque',
  infoA1A2: '(A1) Hospital General - (A2) Corte Inglés',
  infoA1A6: '(A1) Hospital General - (A6) Fuente de las ranas',
  infoA3A6: '(A3) Punta del Parque - (A6) Fuente de las ranas',
  infoA6A10: '(A6) Fuente de las ranas - (A10) Piscina Juan de Toledo',
  infoA6A7: '(A6) Fuente de las ranas - (A7) Paseo de la feria',
  infoA9A10: '(A9) Recinto Ferial - (A10) Piscina Juan de Toledo',
  infoA7A9: '(A7) Paseo de la feria - (A9) Recinto Ferial',
  infoA8A9: '(A8) Parque Fiesta del Árbol - (A9) Recinto Ferial',
  infoA7A8: '(A7) Paseo de la feria - (A8) Parque Fiesta del Árbol',
  infoA5A7: '(A5) Ensanche - (A7) Paseo de la feria',
  infoA4A8: '(A4) Perpetuo Socorro - (A8) Parque Fiesta del Árbol',
  infoA4A5: '(A4) Perpetuo Socorro - (A5) Ensanche',
};

const initialState = Object.keys(CONNECTION_NAMES).reduce((acc, key) => {
  acc[key] = Array(10).fill({ x: new Date().getTime(), y: 0 });
  return acc;
}, {});

export default function Stats() {
  const [pm10Data, setPm10Data] = useState(initialState);
  const [pm25Data, setPm25Data] = useState(initialState);
  const [humidityData, setHumidityData] = useState(initialState);
  const [windData, setWindData] = useState(initialState);
  const [selectedStations, setSelectedStations] = useState([]);

  const fetchData = async () => {
    try {
      const pm10Response = await axios.get('http://localhost:8000/get_data/pm10Data');
      setPm10Data(pm10Response.data.data);

      const pm25Response = await axios.get('http://localhost:8000/get_data/pm25Data');
      setPm25Data(pm25Response.data.data);

      const humidityResponse = await axios.get('http://localhost:8000/get_data/humidityData');
      setHumidityData(humidityResponse.data.data);

      const windResponse = await axios.get('http://localhost:8000/get_data/windData');
      setWindData(windResponse.data.data);
    } catch (error) {
      console.error("Error fetching data", error);
    }
  };

  useEffect(() => {
    fetchData();

    const client = mqtt.connect('ws://54.78.231.141:9001');

    client.on('connect', () => {
      console.log('Connected to MQTT broker.');
      client.subscribe('pm10topic');
      client.subscribe('pm25topic');
      client.subscribe('humiditytopic');
      client.subscribe('windtopic');
    });

    client.on('message', (topic, message) => {
      const parsedMessage = JSON.parse(message.toString());
      const timestamp = parsedMessage.timestamp < 1e12 ? parsedMessage.timestamp * 1000 : parsedMessage.timestamp;
      const newPoint = { x: timestamp, y: parsedMessage.value };
      const connection = parsedMessage.station;

      if (CONNECTION_NAMES[connection]) {
        switch (topic) {
          case 'pm10topic':
            updateData(setPm10Data, connection, newPoint);
            break;
          case 'pm25topic':
            updateData(setPm25Data, connection, newPoint);
            break;
          case 'humiditytopic':
            updateData(setHumidityData, connection, newPoint);
            break;
          case 'windtopic':
            updateData(setWindData, connection, newPoint);
            break;
          default:
            break;
        }
      } else {
        console.warn(`Unknown connection: ${connection}`);
      }
    });

    return () => {
      client.end();
    };
  }, []);

  const updateData = (setData, connection, newPoint) => {
    setData(prevData => {
      const updatedConnectionData = [...(prevData[connection] || []), newPoint].slice(-10);
      return { ...prevData, [connection]: updatedConnectionData };
    });
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const saveData = async () => {
    try {
      await axios.post('http://localhost:8000/save_data', { type: 'pm10Data', data: pm10Data });
      await axios.post('http://localhost:8000/save_data', { type: 'pm25Data', data: pm25Data });
      await axios.post('http://localhost:8000/save_data', { type: 'humidityData', data: humidityData });
      await axios.post('http://localhost:8000/save_data', { type: 'windData', data: windData });
    } catch (error) {
      console.error("Error saving data", error);
    }
  };

  useEffect(() => {
    window.addEventListener('beforeunload', saveData);
    return () => {
      window.removeEventListener('beforeunload', saveData);
      saveData();
    };
  }, [pm10Data, pm25Data, humidityData, windData, saveData]);

  const handleStationChange = (event) => {
    const value = event.target.value;
    if (event.target.checked) {
      setSelectedStations((prevSelected) => [...prevSelected, value]);
    } else {
      setSelectedStations((prevSelected) => prevSelected.filter((station) => station !== value));
    }
  };

  const createDataset = (connection, data) => ({
    label: CONNECTION_NAMES[connection],
    data,
    fill: false,
    borderColor: COLORS[connection],
    backgroundColor: COLORS[connection],
  });

  const createChartData = (data) => ({
    labels: [],
    datasets: selectedStations.map(connection => createDataset(connection, data[connection]))
  });

  const chartOptions = {
    responsive: true,
    scales: {
      x: {
        type: 'time',
        time: {
          unit: 'minute',
          stepSize: 1,
        },
        title: {
          display: true,
          text: 'Date of the measurement'
        }
      },
      y: {
        title: {
          display: true,
          text: 'Detected value'
        }
      }
    }
  };

  const stationOptions = Object.keys(CONNECTION_NAMES).map(station => ({
    value: station,
    label: CONNECTION_NAMES[station]
  }));

  return (
    <div className="container mx-auto">
      <StationSelector
        options={stationOptions}
        selectedOptions={selectedStations}
        onChange={handleStationChange}
      />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-2">
        <div>
          <Line data={createChartData(pm10Data)} options={{...chartOptions, plugins: { title: { display: true, text: 'PM10 Concentration' } }}} />
        </div>
        <div>
          <Line data={createChartData(pm25Data)} options={{...chartOptions, plugins: { title: { display: true, text: 'PM2.5 Concentration' } }}} />
        </div>
        <div>
          <Line data={createChartData(humidityData)} options={{...chartOptions, plugins: { title: { display: true, text: 'Humidity' } }}} />
        </div>
        <div>
          <Line data={createChartData(windData)} options={{...chartOptions, plugins: { title: { display: true, text: 'Wind Speed' } }}} />
        </div>
      </div>
    </div>
  );
}
