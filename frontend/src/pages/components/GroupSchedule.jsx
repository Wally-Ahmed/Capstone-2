// components/GroupSchedule.jsx

import React, { useState, useEffect } from 'react';
import { SideMenu } from './SideMenu';
import { GroupSidebar } from './GroupSidebar';
import { CalendarComponent } from './CalendarComponent';
import { backendURL } from '@/config';

export function GroupSchedule({ selectedGroup, handleSelectGroup }) {
    const [viewMode, setViewMode] = useState({
        personView: 'I',    // 'I' (Individual) or 'G' (Group)
        calanderView: 'W',  // 'D' (Day), 'W' (Week), 'M' (Month)
    });
    const [showMenu, setShowMenu] = useState(true);
    const [groupData, setGroupData] = useState(null);

    // Fetch group info from the backend
    const getGroupData = async () => {
        const res = await fetch(`${backendURL}/user/groups/${selectedGroup.id}`, {
            method: 'GET',
            credentials: 'include',
        });

        if (!res.ok) {
            window.location.reload();
            return;
        }

        const data = await res.json();
        setGroupData(data);
    };

    useEffect(() => {
        getGroupData();
        const intervalId = setInterval(getGroupData, 30000);
        return () => clearInterval(intervalId);
    }, []);

    if (!groupData) {
        // Could display a loading spinner or fallback UI
        return <div>Loading...</div>;
    }

    return (
        <div className="flex h-full w-full">
            {/* Left side menu (small) */}
            <div className="w-[5%] bg-gray-800">
                <SideMenu
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    showMenu={showMenu}
                    setShowMenu={setShowMenu}
                />
            </div>

            {/* Optional group sidebar (shows members, requests, etc.) */}
            {showMenu && (
                <div className="w-[15%] bg-gray-900">
                    <GroupSidebar
                        selectedGroup={selectedGroup}
                        onReturn={() => handleSelectGroup(null)}
                        employees={groupData.members}
                        role={groupData.role}
                        membershipRequests={groupData.membership_requests}
                    />
                </div>
            )}

            {/* Main content: a single CalendarComponent */}
            <div className="flex-1 bg-gray-700 flex">
                <CalendarComponent
                    // We pass down the "viewMode" object so the child can see:
                    //   viewMode.calanderView => 'D' | 'W' | 'M'
                    //   viewMode.personView   => 'I' | 'G'
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    shifts={groupData.shifts}
                    members={groupData.members}
                />
            </div>
        </div>
    );
}

export default GroupSchedule;
