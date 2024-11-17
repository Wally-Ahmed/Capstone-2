import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { backendURL } from '@/config';


export function TeamShyft() {
  // Hook to programmatically navigate to a different route
  const navigate = useNavigate();

  // State to manage loading status
  const [isLoading, setIsLoading] = useState(true);

  const [selectedGroup, setSelectedGroup] = useState(null);

  // Check if the user is authenticated
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const res = await fetch(`${backendURL}/user`, {
          method: 'GET',
          credentials: 'include', // Include cookies in the request
        });

        if (!res.ok) {
          // User isn't authenticated, redirect to '/home'
          navigate('/home');
        }
        else {
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        navigate('/home');
      }
    };

    checkAuthentication();
  }, []);

  if (isLoading) {
    return (
      <>
        <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center">
          <div className="absolute top-0 h-full w-full bg-black bg-cover bg-center" />
          <div className="absolute top-0 h-full w-full bg-[url('/img/background-3.png')] bg-cover bg-center" />
        </div>
        <div className="fixed inset-0 flex items-center justify-center mt-[8%]">
          <div className="absolute h-[80vh] w-[90%] bg-gray-900 rounded-xl shadow-lg" />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center">
        <div className="absolute top-0 h-full w-full bg-black bg-cover bg-center" />
        <div className="absolute top-0 h-full w-full bg-[url('/img/background-3.png')] bg-cover bg-center" />
      </div>
      <div className="fixed inset-0 flex items-center justify-center mt-[8%]">
        <div className="absolute h-[80vh] w-[90%] bg-gray-900 rounded-xl shadow-lg" >
          <div className="fixed inset-0 flex items-center justify-center mt-[8%]">
            {
              selectedGroup
                ? <></>
                : <></>
            }
          </div>
        </div>
      </div>
    </>
  )
}

export default TeamShyft;