import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import icon from '../assets/images/icon.png';
import user from '../assets/images/user.png';

export default function Navbar() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const location = useLocation();
    const navigate = useNavigate();
    const token = localStorage.getItem('token');


    const canShowSignUp = () => {
        return location.pathname === '/signin';
    };

    const canShowLogin = () => {
        return location.pathname === '/';
    };

    const canShowUserInfo = () => {
       return (location.pathname === '/home' || location.pathname === '/stats') && token !== null;
    };

    const handleRouting = async (event) => {
        event.preventDefault();
        if(location.pathname === '/signin')
            navigate('/');
        else
            navigate('/signin')
    }

    const handleLogout = () => {
        setIsDropdownOpen(false)
        localStorage.removeItem('token'); 
        localStorage.removeItem('role');
        navigate('/signin'); 
    };

    const handleProfile = () => {
        setIsDropdownOpen(false)
        navigate('/profile'); 
    };

    const showStats = () => {
        setIsDropdownOpen(false)
        if(location.pathname === '/home')
            navigate('/stats');
        else
            navigate('/home');
    };

    return (
        <nav className="bg-green-800">
            <div className="px-2 sm:px-6 lg:px-8">
                <div className="relative flex h-16 items-center">
                    <div className="flex-1 flex items-center justify-center sm:items-stretch sm:justify-start">
                        <div className="flex-shrink-0 flex items-center">
                            <img className="h-10" src={icon} alt='Icon' width={"100%"}/>
                            <span className="self-center text-2xl font-semibold whitespace-nowrap text-white dark:text-white ml-2">CleanAir4Cycling</span>
                        </div>
                        {canShowSignUp() && (
                            <div className="hidden sm:ml-6 sm:flex space-x-4">
                                <a href="#" onClick={handleRouting} className="hover:bg-green-700 hover:text-white bg-green-900 text-white px-3 py-2 rounded-md text-sm font-medium" aria-current="page">Create account</a>
                            </div>
                        )}
                          {canShowLogin() && (
                            <div className="hidden sm:ml-6 sm:flex space-x-4">
                                <a href="#" onClick={handleRouting} className="hover:bg-green-700 hover:text-white bg-green-900 text-white px-3 py-2 rounded-md text-sm font-medium" aria-current="page">Login</a>
                            </div>
                        )}
                        { (localStorage.getItem('role') == 'Expert' && canShowUserInfo()) &&(
                            <div className="hidden sm:ml-6 sm:flex space-x-4">
                                <a href="#" onClick={showStats} className="hover:bg-green-700 hover:text-white bg-green-900 text-white px-3 py-2 rounded-md text-sm font-medium" aria-current="page">{location.pathname === "/home" ? "Stats" : "Evaluation" }</a>
                            </div>
                        )}
                        
                    </div>
                    {canShowUserInfo() && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:static sm:inset-auto sm:ml-6 sm:pr-0">
                            <div className="ml-3 relative">
                                <button type="button"
                                        className="bg-gray-800 p-1 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-green focus:ring-offset-2 focus:ring-offset-gray-800"
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
                                    <span className="sr-only">Open user menu</span>
                                    <img className="h-8 w-8 rounded-full" src={user} alt="User" />
                                </button>
                                {isDropdownOpen && (
                                    <div className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none"
                                        role="menu"
                                        aria-orientation="vertical"
                                        aria-labelledby="user-menu-button">
                                        <a onClick={handleProfile} href="#" className="block px-4 py-2 text-sm text-gray-700" role="menuitem">Check Profile</a>
                                        <button onClick={handleLogout} className="block px-4 py-2 text-sm text-gray-700" role="menuitem">Sign out</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}
