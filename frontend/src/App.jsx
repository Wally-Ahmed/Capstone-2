import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { Navbar } from "@/widgets/layout";
import routes from "@/routes";
import { Home, Profile, SignIn, SignUp, Contact, TeamShyft } from "@/pages";
import React, { useState, useEffect } from 'react';
import { backendURL } from '@/config';


function App() {
  const { pathname } = useLocation();

  // State to manage authorized status
  const [user, setUser] = useState(null);
  const [isAuthorized, setIsAuthorize] = useState(null);

  // Check if the user is already authenticated
  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const res = await fetch(`${backendURL}/user`, {
          method: 'GET',
          credentials: 'include', // Include cookies in the request
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
          setIsAuthorize(true);
        } else {
          setIsAuthorize(false);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        setIsAuthorize(false);
      }
    };

    checkAuthentication();
  }, []);

  return (
    <>
      <Helmet>
        <meta name="viewport" content={`width=1920, initial-scale=1.0`} />
      </Helmet>
      {!(pathname == '/login' || pathname == '/sign-up') && (
        <div className="container absolute left-2/4 z-10 mx-auto -translate-x-2/4 p-4">
          <Navbar routes={routes} user={user} authorized={isAuthorized} />
        </div>
      )
      }
      <Routes>
        <Route path="/app" element={<TeamShyft />} />
        <Route path="/home" element={<Home />} />
        <Route path="/blog" element={<Profile />} />
        <Route path="/support" element={<Contact />} />
        <Route path="/login" element={<SignIn />} />
        <Route path="/sign-up" element={<SignUp />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </>
  );
}

export default App;
