import React, { useState } from 'react';
import { CreateNewGroupForm } from './CreateNewGroupForm';

export const SelectGroup = ({ myGroups, availableGroups, onSelectGroup }) => {

    const [showNewGroupForm, setShowNewGroupForm] = useState(false);

    return (
        <div className="w-full h-full overflow-y-auto scrollbar scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-gray-700 scrollbar-track-gray-800 pt-5 pb-[1px]">
            {/* First Horizontal Scroll Section */}
            <h2 className="text-xl text-white font-bold px-4">Your Groups</h2>
            <div className="overflow-x-auto w-full py-4 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-gray-700 scrollbar-track-gray-800">
                <div className="flex space-x-4 px-4">
                    {myGroups.map((group) => (
                        <div
                            key={group.id}
                            className="flex-none text-center cursor-pointer"
                            onClick={() => onSelectGroup(group)}
                        >
                            <img
                                src={'/img/profile.webp'}
                                alt={group.name}
                                className="w-48 h-48 mx-auto rounded-full object-cover"
                            />
                            <h3 className="mt-2 text-white font-semibold">{group.name}</h3>
                        </div>
                    ))}

                    {/* Plus Card for Create Group */}
                    <div
                        className="flex-none text-center cursor-pointer pr-[20px]"
                        onClick={() => { setShowNewGroupForm(true) }}
                    >
                        <div className="w-48 h-48 mx-auto rounded-full bg-gray-700 flex items-center justify-center">

                            <svg
                                className="w-16 h-16 text-white"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                            </svg>
                        </div>
                        <h3 className="mt-2 text-white font-semibold">Create Group</h3>
                    </div>
                </div>
            </div>

            {/* Second Horizontal Scroll Section */}
            <h2 className="text-xl text-white font-bold px-4 mt-4">Available Groups</h2>
            <div className="overflow-x-auto w-full py-4 scrollbar-thin scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-gray-700 scrollbar-track-gray-800">
                <div className="flex space-x-4 px-4">
                    {availableGroups.map((group) => (
                        <div
                            key={group.id}
                            className="flex-none text-center cursor-pointer"
                            onClick={() => onSelectGroup(group)}
                        >
                            <img
                                src={'/img/profile.webp'}
                                alt={group.name}
                                className="w-48 h-48 mx-auto rounded-full object-cover"
                            />
                            <h3 className="mt-2 text-white font-semibold">{group.name}</h3>
                        </div>
                    ))}
                    {/* <div className='pr-[5px]' /> */}

                    {/* Plus Card for Join Group */}
                    <div
                        className="flex-none text-center cursor-pointer pr-[20px]"
                        onClick={() => { }}
                    >
                        <div className="w-48 h-48 mx-auto rounded-full bg-gray-700 flex items-center justify-center">

                            <svg
                                className="w-16 h-16 text-white"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                            </svg>
                        </div>
                        <h3 className="mt-2 text-white font-semibold">Join Group</h3>
                    </div>
                </div>
            </div>
            {showNewGroupForm && <CreateNewGroupForm handleFormClose={() => { setShowNewGroupForm(false) }} selectGroup={onSelectGroup} />}
        </div>
    );
};
