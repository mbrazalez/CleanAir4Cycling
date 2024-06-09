import React, { useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Polyline, Polygon, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const locations = [
    { id: 1, name: '[A1] Hospital General', coordinates: [-1.8422481301835774, 38.98488964156488] },
    { id: 2, name: '[A2] Corte Inglés', coordinates: [-1.8536659845478312, 38.98330350072894] },
    { id: 3, name: '[A3] Punta del Parque', coordinates: [-1.8565606069410023, 38.990004480165794] },
    { id: 4, name: '[A4] Perpetuo Socorro', coordinates: [-1.8701271969283653, 38.990006199543956] },
    { id: 5, name: '[A5] Ensanche', coordinates: [-1.8664735791973328, 38.99142593406776] },
    { id: 6, name: '[A6] Fuente de las Ranas', coordinates: [-1.852146382133526, 38.99702857853143] },
    { id: 7, name: '[A7] Paseo de la Feria', coordinates: [-1.863801341462704, 38.99664316744648] },
    { id: 8, name: '[A8] Parque Fiesta del Árbol', coordinates: [-1.8770959345963831, 39.000682546435144] },
    { id: 9, name: '[A9] Recinto Ferial', coordinates: [-1.8734405843852358, 39.010250687009915] },
    { id: 10, name: '[A10] Piscina Juan de Toledo', coordinates: [-1.859224661153604, 39.00493209582416] }
];

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const Modal = ({ title, message, onClose, isLoading }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-opacity-50 bg-black">
      <div className="relative p-4 w-full max-w-2xl max-h-full">
        <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
          <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {title}
            </h3>
            <button 
              type="button" 
              className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white" 
              onClick={onClose}
            >
              <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
              </svg>
              <span className="sr-only">Close modal</span>
            </button>
          </div>
          <div className="p-4 md:p-5 space-y-4">
            {isLoading ? (
              <div className="flex justify-center items-center">
                <svg aria-hidden="true" className="w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor"/>
                    <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill"/>
                </svg>
                <span className="sr-only">Loading...</span>
              </div>
            ) : (
              <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                {message}
              </p>
            )}
          </div>
          {!isLoading && (
            <div className="flex items-center p-4 md:p-5 border-t border-gray-200 rounded-b dark:border-gray-600">
              <button 
                type="button" 
                className="text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800" 
                onClick={onClose}
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const MapComponent = () => {
    const [username, setUsername] = useState(localStorage.getItem('username'));
    const [originId, setOriginId] = useState('');
    const [destinationId, setDestinationId] = useState('');
    const [route, setRoute] = useState(null);
    const [avoidPolygon, setAvoidPolygon] = useState(null);
    const [originCoords, setOriginCoords] = useState(null);
    const [destinationCoords, setDestinationCoords] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSelectOrigin = (event) => {
        const selectedOrigin = locations.find(location => location.id.toString() === event.target.value);
        setOriginId(event.target.value);
        setOriginCoords(selectedOrigin ? selectedOrigin.coordinates : null);
    };

    const handleSelectDestination = (event) => {
        const selectedDestination = locations.find(location => location.id.toString() === event.target.value);
        setDestinationId(event.target.value);
        setDestinationCoords(selectedDestination ? selectedDestination.coordinates : null);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!username || !originId || !destinationId) {
            alert('All fields are required');
            return;
        }

        setIsModalOpen(true);
        setIsLoading(true);
        setModalMessage('');

        try {
            const response = await axios.post('http://localhost:8000/simulate', {
                username: username,
                origin: originId,
                destination: destinationId,
            });
            const responseRoute = response.data.route;

            if (responseRoute.metadata.query.coordinates[0] && responseRoute.metadata.query.coordinates[1]) {
                setRoute(responseRoute);
                
                if (responseRoute.metadata.query.options.avoid_polygons.coordinates.length === 1){
                  setAvoidPolygon(responseRoute.metadata.query.options.avoid_polygons.coordinates);
                } else {
                  const outerPolygon = responseRoute.metadata.query.options.avoid_polygons.coordinates[1].map(coord => [coord[1], coord[0]]);
                  const innerPolygon = responseRoute.metadata.query.options.avoid_polygons.coordinates[0].map(coord => [coord[1], coord[0]]);

                  const polygonArea = { type: "Polygon", coordinates: [outerPolygon, innerPolygon] };

                  console.log("Polygon Area:", polygonArea);
                  
                  setAvoidPolygon(polygonArea);
                }

                setOriginCoords(responseRoute.metadata.query.coordinates[0]);
                setDestinationCoords(responseRoute.metadata.query.coordinates[1]);
                setIsModalOpen(false);

              } else {
                console.error("Invalid coordinates in response:", responseRoute.metadata.query.coordinates);
                setModalMessage('Invalid coordinates received from the API.');
            }
        } catch (error) {
            console.error("Error fetching the route:", error);
            setModalMessage('Error fetching the route. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredDestinations = locations.filter(location => location.id.toString() !== originId);
    const filteredOrigins = locations.filter(location => location.id.toString() !== destinationId);

    return (
        <div style={{ display: 'flex', minHeight: '90.7vh'}}>
            <div style={{ flex: 1, padding: '20px', backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '8px', margin: '10px' }}>
              {!isModalOpen && 
                <form onSubmit={handleSubmit} className="max-w-2xl mx-auto w-full flex flex-col items-center py-5">
                    <div className="mb-5 flex items-center justify-center">
                        <h2 className="text-4xl font-bold text-green-900 dark:text-green-700">Compute your route</h2>
                    </div>
                    <div className="w-2/3">
                        <div className="mb-5">
                            <label htmlFor="username" className="block mb-2 text-sm font-medium text-green-900 dark:text-white">Email:</label>
                            <input id="username" disabled value={username} type="email" className="shadow-sm bg-green-50 border border-green-300 text-green-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5 dark:bg-green-700 dark:border-green-600 dark:placeholder-green-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500" placeholder="name@domain.com" required onChange={(e) => setUsername(e.target.value)} />
                        </div>
                        <div className="mb-5">
                            <label htmlFor="origin" className="block mb-2 text-sm font-medium text-green-900 dark:text-white">Origin:</label>
                            <select id="origin" value={originId} onChange={handleSelectOrigin} className="shadow-sm bg-green-50 border border-green-300 text-green-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5 dark:bg-green-700 dark:border-green-600 dark:placeholder-green-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500">
                                <option value="" disabled>Select origin</option>
                                {filteredOrigins.map(location => (
                                    <option key={location.id} value={location.id}>{location.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-5">
                            <label htmlFor="destination" className="block mb-2 text-sm font-medium text-green-900 dark:text-white">Destination:</label>
                            <select id="destination" value={destinationId} onChange={handleSelectDestination} className="shadow-sm bg-green-50 border border-green-300 text-green-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5 dark:bg-green-700 dark:border-green-600 dark:placeholder-green-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500">
                                <option value="" disabled>Select destination</option>
                                {filteredDestinations.map(location => (
                                    <option key={location.id} value={location.id}>{location.name}</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" className="ml-[35%] text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
                            Get Route!
                        </button>
                    </div>
                </form>
              }
            </div>
            <div style={{ flex: 3, padding: '20px', marginTop: '3%' }}>
              { !isModalOpen && 
              <MapContainer center={[38.98488964156488, -1.8422481301835774]} zoom={14.4} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {route && (
                  <>
                      <Polyline positions={route.features[0].geometry.coordinates.map(coord => [coord[1], coord[0]])} />
                      {avoidPolygon && avoidPolygon.coordinates.length > 0 && (
                        <Polygon
                          positions={avoidPolygon.coordinates}
                          color="red"
                        />
                      )}
                  </>
              )}
              {locations.map(location => (
                  <Marker key={location.id} position={[location.coordinates[1], location.coordinates[0]]}>
                      <Popup>
                          {location.name}
                      </Popup>
                  </Marker>
              ))}
          </MapContainer>
              }
                
            </div>
            {isModalOpen && (
                <Modal 
                    title="Calculating your green route!!" 
                    message={modalMessage} 
                    onClose={() => setIsModalOpen(false)}
                    isLoading={isLoading}
                />
            )}
        </div>
    );
};

export default MapComponent;
