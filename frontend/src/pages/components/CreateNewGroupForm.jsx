import React, { useState } from 'react';
import { backendURL } from '@/config';

export const CreateNewGroupForm = ({ handleFormClose, selectGroup }) => {
    const [groupName, setGroupName] = useState('');

    const handleFormChange = (e) => {
        setGroupName(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const res = await fetch(`${backendURL}/user/groups`, {
                method: 'POST',
                credentials: 'include', // Include cookies in the request
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ name: groupName })
            });

            if (!res.ok) {
                alert('Failed to create group, please try again later.');
                return
            }

            const data = await res.json();

            selectGroup(data.group);

            handleFormClose();
        } catch (error) {
            alert(error.message);
        }
    };

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75">
            <div className="bg-gray-800 p-8 rounded shadow-lg w-96">
                <h2 className="text-2xl font-bold mb-6 text-white">Create a New Group</h2>
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Group Name:
                        </label>
                        <input
                            type="text"
                            name="group_name"
                            value={groupName}
                            onChange={handleFormChange}
                            className="w-full p-3 bg-gray-700 text-gray-100 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter group name"
                            required
                        />
                    </div>
                    <div className="flex justify-end">
                        <button
                            type="button"
                            className="px-4 py-2 bg-gray-600 text-gray-200 rounded mr-3 hover:bg-gray-500 transition"
                            onClick={handleFormClose}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition"
                        >
                            Create Group
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
