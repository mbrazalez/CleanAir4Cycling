import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import bici from "../assets/images/iconv2.png";

export default function Welcome() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [level, setLevel] = useState(0);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    
    const validateForm = () => {
        if (!username || !password || !role || (role === "User" && !level)) {
            setError('All fields are required');
            return false;
        }
        setError('');
        return true;
    };

    const handleRouting = async (event) => {
        event.preventDefault();
        navigate('/signin');
    }


    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        const formDetails = {
            username: username,
            password: password,
            role: role,
            level: level
        };

        try {
            const response = await fetch('http://localhost:8000/register', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(formDetails),
            });
    
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.access_token);
                navigate('/signin');
            } else {
                const errorData = await response.json();
                setError(errorData.detail || 'Authentication failed!'); 
            }
        } catch (error) {
            setError('An error occurred. Please try again later.'); 
        } finally {
            setLoading(false);
        }
    };

    const toggleDropdown = () => {
        setDropdownOpen(!dropdownOpen);
    };

    const handleSelectLevel = (selectedLevel) => {
        setLevel(selectedLevel);
        setDropdownOpen(false);
    };

    return (
        <div style={{ minHeight: '93.7vh' }} className="bg-[url('/src/assets/images/background.jpg')] bg-cover bg-no-repeat bg-center flex items-center justify-center">
            <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white w-full rounded-md flex flex-col items-center py-5">
                <div className="mb-5 flex items-center justify-center">
                    <h2 className="text-4xl font-bold text-green-900 dark:text-green-700">Start computing your routes!</h2>
                    <img src={bici} alt="logo" className="w-20 h-20 ml-5" />
                </div>
                <div className="w-2/3">
                    <div className="mb-5">
                        <label htmlFor="username" className="block mb-2 text-sm font-medium text-green-900 dark:text-white">Email:</label>
                        <input id="username" value={username} type="email" className="shadow-sm bg-green-50 border border-green-300 text-green-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5 dark:bg-green-700 dark:border-green-600 dark:placeholder-green-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500" placeholder="name@domain.com" required onChange={(e) => setUsername(e.target.value)} />
                    </div>
                    <div className="flex items-center mb-5 justify-center">
                        <input id="default-radio-1" type="radio" value="User" name="default-radio" checked={role === 'User'} onChange={(e) => setRole(e.target.value)} className="w-4 h-4 text-green-600 bg-green-100 border-green-300 focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-green-800 dark:bg-green-700 dark:border-green-600" />
                        <label htmlFor="default-radio-1" className="ml-2 text-sm font-medium text-green-900 dark:text-green-300 mr-5">User</label>
                        <input id="default-radio-2" type="radio" value="Expert" name="default-radio" checked={role === 'Expert'} onChange={(e) => setRole(e.target.value)} className="w-4 h-4 text-green-600 bg-green-100 border-green-300 focus:ring-green-500 dark:focus:ring-green-600 dark:ring-offset-green-800 dark:bg-green-700 dark:border-green-600" />
                        <label htmlFor="default-radio-2" className="ml-2 text-sm font-medium text-green-900 dark:text-green-300">Expert</label>
                    </div>
                    {role === 'User' && (
                        <div className='flex flex-row mb-5'> 
                            <div id="userLevel" className="shadow-sm bg-green-50 border border-green-300 text-green-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5 dark:bg-green-700 dark:border-green-600 dark:placeholder-green-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500">
                            <button type="button" onClick={toggleDropdown} className="mr-3 text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-xl text-sm px-2 py-1 text-center inline-flex items-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M3 4.5h14.25M3 9h9.75M3 13.5h9.75m4.5-4.5v12m0 0-3.75-3.75M17.25 21 21 17.25" />
                                </svg>
                            </button>
                            <span>
                                {level == 0 ? "Seleccione nivel de usuario" : `Nivel de usuario: ${level}`}
                            </span>
                            </div>
                            {dropdownOpen && (
                            <div className="absolute z-10 mt-12 bg-white divide-y divide-gray-100 rounded shadow w-44 dark:bg-gray-700">
                                <ul className="py-1 text-sm text-gray-700 dark:text-gray-200" aria-labelledby="dropdownButton">
                                {Array.from({ length: 10 }, (_, i) => (
                                    <li key={i} onClick={() => handleSelectLevel(i + 1)} className="block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 dark:hover:text-white cursor-pointer">
                                    Level {i + 1}
                                    </li>
                                ))}
                                </ul>
                            </div>
                            )}
                        </div>
                    )}
                    <div className="mb-5">
                        <label htmlFor="password" className="block mb-2 text-sm font-medium text-green-900 dark:text-white">Password:</label>
                        <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="shadow-sm bg-green-50 border border-green-300 text-green-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5 dark:bg-green-700 dark:border-green-600 dark:placeholder-green-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500" required />
                    </div>
                </div>

                <h5  className="text-xl text-green-800 font-bold dark:text-white mb-5"><a href='#' onClick={handleRouting}>I'm already signed</a></h5>
                <button disabled={loading} type="submit" className="flex items-center text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 mb-10">
                    {loading ? 'Loading...' : 'Register new account'}
                </button>
                {error && 
                    <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
                        <span className="font-medium">Error! {error}</span>
                    </div>
                }
            </form>
        </div>
    );
}
