import React, { useEffect, useState } from 'react';
import mqtt from 'mqtt';
import Modal from './Modal'; // Asegúrate de ajustar la ruta de importación según la estructura de tu proyecto

export default function Expert() {
    const [checkBoxes, setCheckBoxes] = useState([]);
    const [selectStates, setSelectStates] = useState({});
    const [errorMsg, setErrorMsg] = useState(false);
    const [modalMessage, setModalMessage] = useState('');
    const [showModal, setShowModal] = useState(false);

    const [tableData, setTableData] = useState([
        { stationId: 'infoA3A5', name: '(A3) Punta del Parque - (A5) Ensanche', lastValue: 0 },
        { stationId: 'infoA2A4', name: '(A2) Corte Inglés - (A4) Perpetuo Socorro', lastValue: 0 },
        { stationId: 'infoA2A3', name: '(A2) Corte Inglés - (A3) Punta del Parque', lastValue: 0 },
        { stationId: 'infoA1A2', name: '(A1) Hospital General - (A2) Corte Inglés', lastValue: 0 },
        { stationId: 'infoA1A6', name: '(A1) Hospital General - (A6) Fuente de las ranas', lastValue: 0 },
        { stationId: 'infoA3A6', name: '(A3) Punta del Parque - (A6) Fuente de las ranas', lastValue: 0 },
        { stationId: 'infoA6A10', name: '(A6) Fuente de las ranas - (A10) Piscina Juan de Toledo', lastValue: 0 },
        { stationId: 'infoA6A7', name: '(A6) Fuente de las ranas - (A7) Paseo de la feria', lastValue: 0 },
        { stationId: 'infoA9A10', name: '(A9) Recinto Ferial - (A10) Piscina Juan de Toledo', lastValue: 0 },
        { stationId: 'infoA7A9', name: '(A7) Paseo de la feria - (A9) Recinto Ferial', lastValue: 0 },
        { stationId: 'infoA8A9', name: '(A8) Parque Fiesta del Árbol - (A9) Recinto Ferial', lastValue: 0 },
        { stationId: 'infoA7A8', name: '(A7) Paseo de la feria - (A8) Parque Fiesta del Árbol', lastValue: 0 },
        { stationId: 'infoA5A7', name: '(A5) Ensanche - (A7) Paseo de la feria', lastValue: 0 },
        { stationId: 'infoA4A8', name: '(A4) Perpetuo Socorro - (A8) Parque Fiesta del Árbol', lastValue: 0 },
        { stationId: 'infoA4A5', name: '(A4) Perpetuo Socorro - (A5) Ensanche', lastValue: 0 },
    ]);
    
    const loadInitialData = async () => {
        try {
        const response = await fetch("http://localhost:8000/get-fis-info");
        const data = await response.json();
        const updatedData = tableData.map(item => ({
            ...item,
            lastValue: data[item.stationId]
        }));
        setTableData(updatedData);
        } catch (error) {
        console.error('Failed to fetch initial station data:', error);
        }
    };

    useEffect(() => {
        loadInitialData();
        const client = mqtt.connect('ws://54.78.231.141:9001');

        client.on("connect", () => {
        console.log("Connected to MQTT broker.");
        client.subscribe("fisoutput");
        });

        client.on("message", (topic, msg) => {
        const data = JSON.parse(msg.toString());
        setTableData(currentData =>
            currentData.map(item => ({
            ...item,
            lastValue: item.stationId in data ? data[item.stationId] : item.lastValue
            }))
        );
        });

        return () => {
        client.end();
        };
    }, []);

    const handleChange = (stationId, value) => {
        const newColor = value === 'Open' ? 'bg-green-200' :
                        value === 'Precaution' ? 'bg-yellow-200' :
                        value === 'Close' ? 'bg-red-200' : 'bg-white';
        setSelectStates(prevStates => ({
        ...prevStates,
        [stationId]: {
            color: newColor,
            value
        }
        }));
    };

    const handleCheckbox = (e) => {
        if (e.target.checked) {
        setCheckBoxes([...checkBoxes, e.target.id]);
        } else {
        setCheckBoxes(checkBoxes.filter((item) => item !== e.target.id));
        }
    };

    const applyActions = async () => {
        const validStates = ['Open', 'Precaution', 'Close'];
        let updatedData = {};
        checkBoxes.forEach(station => {
        if (selectStates[station] && validStates.includes(selectStates[station].value)) {
            updatedData[station] = selectStates[station].value;
        }
        });

        if (checkBoxes.length === 0 || Object.getOwnPropertyNames(updatedData).length === 0) {
        setErrorMsg(true);
        } else {
        setErrorMsg(false);
        try {
            const response = await fetch('http://localhost:8000/update-station-states', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },

            body: JSON.stringify({ states: updatedData })
        });

            if (!response.ok) {
            throw new Error('Network response was not ok');
            }
            setModalMessage('Update successful!');
            setShowModal(true);
        } catch (error) {
            setModalMessage('Error updating station states.');
            setShowModal(true);
        }
        }
    };

    return (
        <div>
            {showModal && <Modal title="Update Status" message={modalMessage} onClose={() => setShowModal(false)} />}
            <div className="relative shadow-md sm:rounded-lg mt-4 mr-5 ml-5">
                <div className="p-4 h-[75vh] overflow-y-auto mb-5">
                    <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-200 dark:bg-gray-700 dark:text-white">
                            <tr>
                                <th scope="col" className="px-6 py-3">Station ID</th>
                                <th scope="col" className="px-6 py-3 text-center">Name</th>
                                <th scope="col" className="px-6 py-3 text-center">Last FIS Output</th>
                                <th scope="col" className="px-6 py-3 text-center">Action</th>
                                <th scope="col" className="px-6 py-3 text-center">Apply actions in station</th>
                            </tr>
                        </thead>
                        <tbody>
                        {tableData.map((item, index) => (
                            <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-gray-200'}`}>
                            <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                {item.stationId}
                            </th>
                            <td className="px-6 py-4 text-center">{item.name}</td>
                            <td className="px-6 py-4 text-center">{item.lastValue}</td>
                            <td className="px-6 py-4 text-center">
                                <select
                                value={selectStates[item.stationId]?.value || ''}
                                className={`border border-gray-300 rounded px-3 py-1.5 text-gray-600 ${selectStates[item.stationId]?.color || 'bg-white'}`}
                                onChange={(e) => handleChange(item.stationId, e.target.value)}
                                >
                                <option value="">-Select the node state-</option>
                                <option value="Open">Open</option>
                                <option value="Precaution">Precaution</option>
                                <option value="Close">Close</option>
                                </select>
                            </td>
                            <td className="px-6 py-4 text-center">
                                <input id={item.stationId} onChange={handleCheckbox} type="checkbox" className='h-4 w-4' />
                            </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
                {errorMsg && 
                <div className="p-4 mb-4 text-sm text-yellow-800 rounded-lg bg-yellow-50 dark:bg-gray-800 dark:text-yellow-300 mt-2 mr-5 ml-5" role="alert">
                    <span className="font-medium">Warning alert!</span> Choose at least one action to apply and try submitting again.
                </div>
                }
            </div>
            <button onClick={applyActions} type="button" className="flex ml-[50%] mt-5 text-green-700 hover:text-white border border-green-700 hover:bg-green-800 focus:ring-2 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-green-500 dark:text-green-500 dark:hover:text-white dark:hover:bg-green-600 dark:focus:ring-green-800">
                Apply actions
            </button>
        </div>
    );
}
