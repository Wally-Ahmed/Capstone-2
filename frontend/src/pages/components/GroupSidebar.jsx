// components/GroupSidebar.jsx
import React from 'react';
import { ArrowUturnLeftIcon, UserGroupIcon, UserPlusIcon } from '@heroicons/react/24/solid';
import { MdSettings, MdPersonAdd } from 'react-icons/md';

export function GroupSidebar({ selectedGroup, onReturn, employees, role, membershipRequests }) {
    return (
        <div className="flex flex-col h-full">
            {/* First Section */}
            <div className="flex flex-row p-4 bg-gray-900 flex-shrink-0">
                {/* Left Side: Group Icon */}
                <div className="flex items-center">
                    <UserGroupIcon className="h-10 w-10 text-white" />
                </div>
                {/* Right Side */}
                <div className="flex flex-col flex-1 ml-4">
                    <div className="flex flex-col h-full gap-1 justify-between items-end">
                        {/* Top: Return Button */}
                        <div className='h-4'>
                            <button className='relative' onClick={() => { }}                        >
                                <MdSettings className="h-4 w-5 mr-2 transform rotate-90 text-gray-600 hover:text-white transition-colors duration-200" />
                            </button>
                            {(role == 'owner' || role == 'admin') && <button className='relative' onClick={() => { }}                        >
                                <MdPersonAdd className="h-4 w-5 mr-2 text-gray-600 hover:text-white transition-colors duration-200" />
                                {(membershipRequests.length > 0) && <span className="absolute top-0 right-[6px] block h-2 w-2 rounded-full ring-0 ring-none bg-red-500" />}
                            </button>}
                            <button className='relative' onClick={onReturn}                        >
                                <ArrowUturnLeftIcon className="h-4 w-5 text-gray-600 hover:text-white transition-colors duration-200" />
                            </button>
                        </div>
                        {/* Bottom: Group Name */}
                        <div className="flex-1 flex items-end">
                            <h2 className="text-lg text-white font-semibold">{selectedGroup.name}</h2>
                        </div>
                    </div>
                </div>
            </div>

            {/* Second Section */}
            <div className="flex-1 overflow-y-auto bg-gray-800 p-4 scrollbar scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-gray-800 scrollbar-track-gray-900">
                {employees.map((employee) => (
                    <div key={employee.id} className="flex flex-col items-center mb-4">
                        <img
                            src={'/img/profile.webp'}
                            alt={employee.username}
                            className="w-full m-2 rounded-full object-cover"
                        />
                        <p className="mt-2 text-white text-sm">{employee.username}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default GroupSidebar;
