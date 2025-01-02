// SearchGroup.jsx

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { backendURL } from '@/config';
import { UserGroupIcon } from '@heroicons/react/24/solid';

export const SearchGroup = ({ closeSearchGroup }) => {
    const [searchTerm, setSearchTerm] = useState("");
    const [groups, setGroups] = useState([]);

    // Fetch groups whose names contain searchTerm
    const fetchGroups = async (name) => {
        try {
            const resp = await fetch(`${backendURL}/groups/search?name=${encodeURIComponent(name)}`, {
                credentials: 'include',
            });
            if (!resp.ok) {
                console.error("Failed to fetch groups");
                return;
            }
            const data = await resp.json(); // { groups: [...] }
            setGroups(data.groups || []);
        } catch (err) {
            console.error("Error fetching groups:", err);
        }
    };

    // Call fetchGroups when searchTerm changes (debounced)
    useEffect(() => {
        if (!searchTerm.trim()) {
            setGroups([]);
            return;
        }
        const timeoutId = setTimeout(() => {
            fetchGroups(searchTerm);
        }, 300); // 300ms debounce
        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    // Join a group => POST /user/groups/<group_id>/membership/request-join
    const handleJoinGroup = async (groupId, idx) => {
        try {
            const resp = await fetch(`${backendURL}/user/groups/${groupId}/membership/request-join`, {
                method: 'POST',
                credentials: 'include',
            });
            if (!resp.ok) {
                console.error("Join request failed");
                return;
            }
            // On success => set membership_status = "pending"
            setGroups((prev) => {
                const newArr = [...prev];
                newArr[idx] = { ...newArr[idx], membership_status: "pending" };
                return newArr;
            });
        } catch (err) {
            console.error("Error sending join request:", err);
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[9999]">
            <div className="bg-gray-800 text-white p-8 rounded-lg shadow-lg w-[800px] max-w-[90%] h-3/4 overflow-hidden pb-40 mt-[6%]">
                {/* Close Button */}
                <div className="flex justify-end">
                    <button onClick={closeSearchGroup}>
                        <svg
                            className="w-7 h-7 text-white"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            ></path>
                        </svg>
                    </button>
                </div>

                <h2 className="text-2xl font-bold p-2">Search Groups:</h2>

                {/* Search Bar */}
                <div className="w-full mb-4">
                    <input
                        type="text"
                        placeholder="Search groups..."
                        className="w-full p-2 text-black rounded"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Scrollable Groups List */}
                <div className="w-full h-3/4 overflow-y-auto scrollbar scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-gray-700 scrollbar-track-gray-800 pt-5">
                    {groups.map((group, idx) => (
                        <div
                            key={group.id}
                            className="flex items-center justify-between mb-4 bg-gray-700 p-3 rounded"
                        >
                            {/* Group Icon + Name */}
                            <div className="flex items-center gap-3">
                                <div className="relative w-12 h-12">
                                    {/* Black circle behind */}
                                    <div className="absolute inset-0 bg-black rounded-full z-0" />
                                    {/* UserGroupIcon in front */}
                                    <div className="relative z-10 flex items-center justify-center h-full w-full">
                                        <UserGroupIcon className="h-8 w-8" />
                                    </div>
                                </div>
                                <span className="font-semibold">{group.name}</span>
                            </div>

                            {/* Membership Status / Join Button */}
                            <div>
                                {group.membership_status === "approved" && (
                                    <span className="text-green-400">Approved</span>
                                )}
                                {group.membership_status === "pending" && (
                                    <span className="text-yellow-400">Pending</span>
                                )}
                                {group.membership_status == null && (
                                    <button
                                        onClick={() => handleJoinGroup(group.id, idx)}
                                        className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700"
                                    >
                                        Join
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
};
