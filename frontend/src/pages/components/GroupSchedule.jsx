// components/GroupSchedule.jsx
import React, { useState, useEffect } from 'react';
import { SideMenu } from './SideMenu';
import { GroupSidebar } from './GroupSidebar';
import { CalendarComponent } from './CalendarComponent';
import { backendURL } from '@/config';

export function GroupSchedule({ selectedGroup, handleSelectGroup, user }) {
    const [viewMode, setViewMode] = useState({
        personView: 'I', // 'I' (Individual) or 'G' (Group)
        calanderView: 'W', // 'D' (Day), 'W' (Week), 'M' (Month)
    });
    const [showMenu, setShowMenu] = useState(true);
    const [groupData, setGroupData] = useState(null);

    // Initialize the selected employee to the user
    const [selectedEmployee, setSelectedEmployee] = useState(user);

    useEffect(() => {
        setSelectedEmployee(user);
    }, [user]);

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
        return <div>Loading...</div>;
    }

    // If personView === 'I', filter out shifts that don't belong to selectedEmployee
    const effectiveShifts =
        viewMode.personView === 'I'
            ? groupData.shifts.filter((shift) => shift.user_id === selectedEmployee?.id)
            : groupData.shifts;

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

            {/* Optional group sidebar */}
            {showMenu && (
                <div className="w-[15%] bg-gray-900">
                    <GroupSidebar
                        selectedGroup={selectedGroup}
                        onReturn={() => handleSelectGroup(null)}
                        employees={groupData.members}
                        selectedEmployee={selectedEmployee}
                        onSelectEmployee={(emp) => setSelectedEmployee(emp)}
                        role={groupData.role}
                        membershipRequests={groupData.membership_requests}
                    />
                </div>
            )}

            {/* Main content: a single CalendarComponent */}
            <div className="w-[80%] flex-1 bg-gray-700 flex">
                <CalendarComponent
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    shifts={effectiveShifts}
                    members={groupData.members}
                    userRole={groupData.role}
                    groupId={groupData.id}
                />
            </div>
        </div>
    );
}

export default GroupSchedule;
