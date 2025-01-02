// components/GroupSidebar.jsx

import React, { useState } from 'react';
import { ArrowUturnLeftIcon, UserGroupIcon } from '@heroicons/react/24/solid';
import { MdSettings, MdPersonAdd } from 'react-icons/md';
import { RequestMenu } from './RequestMenu';
import { SettingsMenu } from './SettingsMenu';

export function GroupSidebar({
    selectedGroup,
    onReturn,
    employees,
    role,
    membershipRequests,
    selectedEmployee,
    getGroupData,
    // **Accept the callback from props** 
    onSelectEmployee,
}) {
    const [showRequestMenu, setShowRequestMenu] = useState(false);
    const [showSettingsMenu, setShowSettingsMenu] = useState(false);


    const myEmployees = employees.filter(member =>
        !membershipRequests.some(request => request.user_id === member.id))



    // alert(JSON.stringify(membershipRequests))
    return (
        <div className="flex flex-col h-full">
            <div className="flex flex-row p-4 bg-gray-900 flex-shrink-0">
                <div className="flex items-center">
                    <UserGroupIcon className="h-10 w-10 text-white" />
                </div>
                <div className="flex flex-col flex-1 ml-4">
                    <div className="flex flex-col h-full gap-1 justify-between items-end">
                        <div className="h-4 flex items-center space-x-2">
                            <button className="relative" onClick={() => { setShowSettingsMenu(true) }}>
                                <MdSettings className="h-4 w-5 mr-2 transform rotate-90 text-gray-600 hover:text-white transition-colors duration-200" />
                            </button>
                            {(role === 'owner' || role === 'admin') && (
                                <button className="relative" onClick={() => { setShowRequestMenu(true) }}>
                                    <MdPersonAdd className="h-4 w-5 mr-2 text-gray-600 hover:text-white transition-colors duration-200" />
                                    {membershipRequests.length > 0 && (
                                        <span className="absolute top-0 right-[6px] block h-2 w-2 rounded-full ring-0 ring-none bg-red-500" />
                                    )}
                                </button>
                            )}
                            <button className="relative" onClick={onReturn}>
                                <ArrowUturnLeftIcon className="h-4 w-5 text-gray-600 hover:text-white transition-colors duration-200" />
                            </button>
                        </div>
                        <div className="flex-1 flex items-end">
                            <h2 className="text-lg text-white font-semibold">
                                {selectedGroup.name}
                            </h2>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-gray-800 p-4 scrollbar scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-gray-800 scrollbar-track-gray-900">
                {myEmployees.map((employee) => {
                    const isSelected = selectedEmployee && selectedEmployee.id === employee.id;

                    return (
                        <div
                            key={employee.id}
                            // When the user clicks, call the parent's callback
                            onClick={() => onSelectEmployee(employee)}
                            className={`flex flex-col items-center mb-4 rounded-md pl-3 pr-3 ${isSelected ? 'bg-gray-700' : ''
                                } cursor-pointer`}
                        >
                            <img
                                src="/img/profile.webp"
                                alt={employee.username}
                                className="w-full m-2 rounded-full object-cover"
                            />
                            <p className="mt-2 text-white text-sm">{employee.username}</p>
                        </div>
                    );
                })}

                {showRequestMenu && <RequestMenu closeRequestMenu={() => { setShowRequestMenu(false) }} requests={membershipRequests} getGroupData={getGroupData} />}
                {showSettingsMenu && <SettingsMenu closeSettingsMenu={() => { setShowSettingsMenu(false) }} />}
            </div>
        </div>
    );
}

export default GroupSidebar;
