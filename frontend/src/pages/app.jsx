// TeamShyft.jsx

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { backendURL } from '@/config';
import { SelectGroup } from './components/SelectGroup';
import { GroupSchedule } from './components/GroupSchedule';
import { Helmet } from "react-helmet";

export function TeamShyft() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const [isLoading, setIsLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [allGroups, setAllGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [availableGroups, setAvailableGroups] = useState([]);
  const [user, setUser] = useState(null);

  // Fetch user authentication and group data
  const checkAuthentication = async () => {
    try {
      // 1) Fetch user info
      const userRes = await fetch(`${backendURL}/user`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!userRes.ok) {
        // Not logged in or session invalid
        navigate('/home');
        return;
      }

      const userData = await userRes.json();
      setUser(userData.user);

      // 2) Fetch group data
      const groupsRes = await fetch(`${backendURL}/user/groups`, {
        method: 'GET',
        credentials: 'include',
      });

      if (!groupsRes.ok) {
        console.error('Failed to fetch groups');
        setIsLoading(false);
        return;
      }

      const groupsData = await groupsRes.json();
      setAllGroups(groupsData.all_groups);
      setMyGroups(groupsData.my_groups);
      setAvailableGroups(groupsData.available_groups);

      setIsLoading(false);
    } catch (error) {
      console.error('Error:', error);
      navigate('/home');
    }
  };

  useEffect(() => {
    checkAuthentication();
  }, [navigate]);

  // Check for groupId in query params and set selectedGroup if it exists
  useEffect(() => {
    const groupId = searchParams.get('groupId');

    if (groupId && allGroups.length > 0) {
      const group = allGroups.find((g) => String(g.id) === groupId);
      if (group) {
        setSelectedGroup(group);
      }
    }
  }, [allGroups, searchParams]);

  // Update query params when selectedGroup changes
  useEffect(() => {
    if (selectedGroup) {
      searchParams.set('groupId', selectedGroup.id);
      setSearchParams(searchParams);
    }
  }, [selectedGroup, searchParams, setSearchParams]);

  const handleSelectGroup = (group) => {
    setSelectedGroup(group);
    if (!group) {
      searchParams.delete('groupId');
      setSearchParams(searchParams);
    }
  };

  if (isLoading) {
    // Simple loading screen
    return (
      <>
        <Helmet>
          <meta name="viewport" content={`width=1920, initial-scale=1.0`} />
        </Helmet>
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
      <Helmet>
        <meta name="viewport" content={`width=1920, initial-scale=1.0`} />
      </Helmet>
      {/* Background */}
      <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center">
        <div className="absolute top-0 h-full w-full bg-black bg-cover bg-center" />
        <div className="absolute top-0 h-full w-full bg-[url('/img/background-3.png')] bg-cover bg-center" />
      </div>

      {/* Main Content */}
      <div className="fixed inset-0 flex items-center justify-center mt-[8%]">
        <div className="absolute h-[80vh] w-[90%] bg-gray-900 rounded-xl shadow-lg overflow-hidden">
          <div className="flex h-full w-full">
            {selectedGroup && user ? (
              <GroupSchedule
                selectedGroup={selectedGroup}
                handleSelectGroup={handleSelectGroup}
                user={user}
              />
            ) : (
              <SelectGroup
                myGroups={myGroups}
                availableGroups={availableGroups}
                onSelectGroup={handleSelectGroup}
                refreshPage={checkAuthentication}  // Called in CreateNewGroupForm
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default TeamShyft;
