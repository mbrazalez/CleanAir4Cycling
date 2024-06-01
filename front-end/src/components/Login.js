import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import route from "../assets/images/backgroundv2.png";

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    
    const validateForm = () => {
        if (!username || !password) {
            setError('All fields are required');
            return false;
        }
        setError('');
        return true;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!validateForm()) return;
        setLoading(true);

        const formDetails = new URLSearchParams();
        formDetails.append('username', username);
        formDetails.append('password', password);

        try {
            const response = await fetch('http://localhost:8000/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formDetails,
            });
    
            if (response.ok) {
                const data = await response.json();
                localStorage.setItem('token', data.access_token);
                navigate('/home');
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

    return (
        <div style={{ minHeight: '93.7vh' }} className="bg-[url('/src/assets/images/carrilbici.jpg')] bg-cover bg-no-repeat bg-center flex items-center justify-center">
            <div className="max-w-2xl mx-auto bg-white w-full rounded-md flex flex-row items-center">
                <form onSubmit={handleSubmit} className="max-w-2xl mx-auto bg-white w-full rounded-md flex flex-col items-center py-5">
                <div className="mb-5 flex items-center justify-center">
                        <h2 className="text-4xl font-bold text-green-900 dark:text-green-700 text-center">Welcome again!</h2>
                    </div>
                    <div className="w-2/3">
                        <div className="mb-5 mt-20">
                            <label htmlFor="username" className="block mb-2 text-sm font-medium text-green-900 dark:text-white">Email:</label>
                            <input id="username" value={username} type="email" className="shadow-sm bg-green-50 border border-green-300 text-green-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5 dark:bg-green-700 dark:border-green-600 dark:placeholder-green-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500" placeholder="name@domain.com" required onChange={(e) => setUsername(e.target.value)} />
                        </div>
                    
                        <div className="mb-5">
                            <label htmlFor="password" className="block mb-2 text-sm font-medium text-green-900 dark:text-white">Password:</label>
                            <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="shadow-sm bg-green-50 border border-green-300 text-green-900 text-sm rounded-lg focus:ring-green-500 focus:border-green-500 block w-full p-2.5 dark:bg-green-700 dark:border-green-600 dark:placeholder-green-400 dark:text-white dark:focus:ring-green-500 dark:focus:border-green-500" required />
                        </div>
                    </div>

                    <button disabled={loading} type="submit" className="flex items-center text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800 mb-10">
                        {loading ? 'Loading...' : 'Login'}
                    </button>
                    {error && 
                        <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50 dark:bg-gray-800 dark:text-red-400" role="alert">
                            <span className="font-medium">Error! {error}</span>
                        </div>
                    }
                </form>
                <img src={route} alt='img' width={"100%"} height={"100%"} className='mr-0'></img>
            </div>
        </div>
    );
}
