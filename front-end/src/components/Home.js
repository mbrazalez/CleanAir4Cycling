import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Expert from './Expert';
import User from './User';

export default function Home() {
  const navigate = useNavigate();
  const [role, setRole] = useState('User');

  useEffect(() => {
    const verifyToken = async () => {
      const token = localStorage.getItem('token');
      try {
        const response = await fetch(`http://localhost:8000/verify-token/${token}`);
        if (!response.ok) {
          throw new Error('Token verification failed');
        }
        const userData = await response.json();
        setRole(userData.user.role);
        localStorage.setItem('role', userData.user.role);
      } catch (error) {
        console.error(error);
        navigate('/');
      }
    };

    verifyToken();
  }, [navigate]);

  return (
    <div>
      {role === 'User' ? (
        <User></User>
      ) : (
        <div className="max-height-[90%]">
          <Expert />
        </div>
      )}
    </div>
  );
}
