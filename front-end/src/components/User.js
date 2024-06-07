import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import OpenRouteService from 'openrouteservice-js';

const points = {
  '1': [-1.8459407, 38.9838399],
  '2': [-1.8541968, 38.9825685],
  '3': [-1.8565624, 38.9900803],
  '4': [-1.8765425, 38.98974],
  '5': [-1.8766712, 38.9913661],
  '6': [-1.857128, 38.9969287],
  '7': [-1.8693173, 38.9967187],
  '8': [-1.87922, 39.0007692],
  '9': [-1.8729746, 39.006395],
  '10': [-1.8649971, 39.0091525]
};

const MapComponent = () => {
  const [route, setRoute] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const origin = [-1.8459407, 38.9838399]; 
  const destination = [-1.8541968, 38.9825685]; 

  useEffect(() => {
    const fetchSimulation = async () => {
        setLoading(true);
        try {
          const response = await fetch(`http://localhost:8080/get-user/`)
      
          if (!response.ok) {
            throw new Error('Error fetching simulation data');
          }
      
          const data = await response.json();
          console.log(data);
          const marking = data.marking;
          const pointIndices = parseMarking(marking);
      
          if (pointIndices.length < 2) {
            throw new Error('Insufficient points in the route information');
          }
      
          const start_point = points[pointIndices[0]];
          const end_point = points[pointIndices[pointIndices.length - 1]];
      
          await fetchRoute(start_point, end_point);
        } catch (error) {
          setError(error.message);
        } finally {
          setLoading(false);
        }
      };

    const parseMarking = (marking) => {
      const match = marking.match(/\((\d+),(\d+),\[(.*?)\],(\d+)\)/);
      if (match) {
        return match[3].split('),(').map(item => item.replace(/\D/g, ''));
      }
      return [];
    };

    const fetchRoute = async (start_point, end_point) => {
      const Directions = new OpenRouteService.Directions({
        api_key: '5b3ce3597851110001cf624851e61e019b7845f88e089b03de0cd1b0'
      });

      try {
        const response = await Directions.calculate({
          coordinates: [start_point, end_point],
          profile: 'cycling-regular',
          format: 'geojson'
        });

        const coordinates = response.routes[0].geometry.coordinates;
        setRoute(coordinates.map(coord => [coord[1], coord[0]]));
      } catch (error) {
        setError('Error fetching route');
      }
    };

    fetchSimulation();
  }, []);

  return (
    <MapContainer center={[origin[1], origin[0]]} zoom={13} style={{ height: "100vh", width: "100%" }}>
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
      />
      {loading && <div>Loading...</div>}
      {error && <div>{error}</div>}
      {route && (
        <Polyline
          positions={route}
          color="blue"
        />
      )}
    </MapContainer>
  );
};

export default MapComponent;
