import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();
  const [role, setRole] = useState('User');
  const [tableData, setTableData] = useState([
    { stationId: 'A1', name: 'Avenida de la Mancha', lastValue: 0 },
    { stationId: 'A2', name: 'Carretera de Valencia',  lastValue: 0 },
    { stationId: 'A3', name: 'Paseo Simón Abril', lastValue: 0 },
    { stationId: 'A4', name: 'Perpetuo Socorro',  lastValue: 0 },
    { stationId: 'A5', name: 'Ensanche', lastValue: 0 },
    { stationId: 'A6', name: 'Fuente de las ranas', lastValue: 0 },
    { stationId: 'A7', name: 'Paseo de la feria', lastValue: 0 },
    { stationId: 'A8', name: 'Parque Fiesta del Árbol', lastValue: 0 },
    { stationId: 'A9', name: 'Juzgados', lastValue: 0 },
    { stationId: 'A10', name: 'Piscina Juan de Toledo', lastValue: 0 }
  ]);

  const [selectStates, setSelectStates] = useState({});

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetch('http://localhost:8000/get-fis-info')
        .then(response => response.json())
        .then(data => {
          const updatedTableData = tableData.map(item => ({
            ...item,
            lastValue: data[item.stationId] || item.lastValue  // Update lastValue if the key exists in response
          }));
          setTableData(updatedTableData);
        })
        .catch(error => console.error('Failed to fetch FIS data:', error));
    }, 1000);  // Fetches every second

    return () => clearInterval(intervalId);  // Clear interval on component unmount
  }, [tableData]); 

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      console.log(token);
      try {
        const response = await fetch(`http://localhost:8000/verify-token/${token}`);
        if (!response.ok) {
          throw new Error('Token verification failed');
        }
        const userData = await response.json();
        console.log(userData);
        if (response.ok) {
          setRole(userData.user.role);
        }
      } catch (error) {
        console.error(error);
        localStorage.removeItem('token');
        navigate('/');
      }
    };

    verifyToken();
  }, [navigate]);

  const handleChange = (stationId, value) => {
    const newColor = 
                     value === 'Open' ? 'bg-green-200' :
                     value === 'Precaution' ? 'bg-yellow-200' :
                     value === 'Close' ? 'bg-red-200' : 'bg-white';
    setSelectStates(prevStates => ({
      ...prevStates,
      [stationId]: {
        color: newColor,
        value: value
      }
    }));
  };

  return (
    <div className=''>
      {role === 'User' ? (
        <span>Soy usuario</span>
      ) : (
        <div className="relative overflow-x-auto shadow-md sm:rounded-lg mt-5 mr-5 ml-5">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-white">
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
                <tr key={index} className={`bg-white ${index % 2 ? 'bg-gray-50' : ''}`}>
                  <th scope="row" className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {item.stationId}
                  </th>
                  <td className="px-6 py-4 text-center">{item.name}</td>
                  <td className="px-6 py-4 text-center">{item.lastValue}</td>
                  <td className="px-6 py-4 text-center">
                    <select
                      value={selectStates[item.stationId]?.value || 'Open '}
                      className={`border border-gray-300 rounded px-3 py-1.5 text-gray-600 ${selectStates[item.stationId]?.color || 'bg-white'}`}
                      onChange={(e) => handleChange(item.stationId, e.target.value)}>
                      <option value="" className='bg-white'>-Select the node state-</option>
                      <option value="Open" className='bg-white'>Open</option>
                      <option value="Precaution" className='bg-white'>Precaution</option>
                      <option value="Close" className='bg-white'>Close</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <input type="checkbox" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <button type="button" class="flex ml-[50%] mt-5 text-green-700 hover:text-white border border-green-700 hover:bg-green-800 focus:ring-2 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2 dark:border-green-500 dark:text-green-500 dark:hover:text-white dark:hover:bg-green-600 dark:focus:ring-green-800">
        Apply actions
      </button>
    </div>
  );
}