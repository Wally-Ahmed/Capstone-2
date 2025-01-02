import { backendURL } from '@/config';
import React, { useState } from 'react';
import ReactDOM from 'react-dom';

export const NewShiftForm = ({ closeNewShiftForm, groupId, getGroupData, employees = [] }) => {
    // Form state
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [startDateTime, setStartDateTime] = useState('');
    const [endDateTime, setEndDateTime] = useState('');

    // Control the open/close of the dropdown
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    const handleSendShift = async () => {
        // Basic guard
        if (!selectedEmployee || !startDateTime || !endDateTime) return;

        try {
            // If your backend expects the raw "YYYY-MM-DDTHH:MM" format from <input type="datetime-local">,
            // you can send them directly:
            const body = {
                shift_owner_membership_id: selectedEmployee.id,
                start_time_iso: startDateTime, // e.g. "2024-12-31T14:30"
                end_time_iso: endDateTime,     // e.g. "2024-12-31T16:00"
            };

            const res = await fetch(
                `${backendURL}/user/groups/${groupId}/shift`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(body),
                }
            );

            if (!res.ok) {
                // Could handle the error more gracefully (show a toast, etc.)
                alert('Failed to create shift');
                return;
            }

            getGroupData()

            closeNewShiftForm();
        } catch (error) {
            console.error('Error creating shift:', error);
            alert('An error occurred while creating the shift');
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-gray-800 text-white p-8 rounded-lg shadow-lg w-[800px] max-w-[90%] h-3/4 overflow-hidden pb-40 mt-[6%] relative">
                {/* Close Button */}
                <div className="flex justify-end">
                    <button onClick={closeNewShiftForm}>
                        <svg
                            className="w-7 h-7 text-white"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            ></path>
                        </svg>
                    </button>
                </div>

                <h2 className="text-xl font-bold mb-4">Create New Shift</h2>

                {/* START DATETIME */}
                <label className="block mb-1 font-semibold">Start Date/Time</label>
                <input
                    type="datetime-local"
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded mb-4"
                    value={startDateTime}
                    onChange={(e) => setStartDateTime(e.target.value)}
                />

                {/* END DATETIME */}
                <label className="block mb-1 font-semibold">End Date/Time</label>
                <input
                    type="datetime-local"
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded mb-4"
                    value={endDateTime}
                    onChange={(e) => setEndDateTime(e.target.value)}
                />

                {/* SELECT EMPLOYEE */}
                <label className="block mb-1 font-semibold">Assign To</label>
                <div className="relative w-full mb-4">
                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full bg-gray-700 text-white px-3 py-2 rounded flex items-center justify-between"
                    >
                        {/* If there is a selected employee, show their profile + name */}
                        {selectedEmployee ? (
                            <div className="flex items-center">
                                <img
                                    src={'/img/profile.webp'}
                                    alt={selectedEmployee.username}
                                    className="w-6 h-6 rounded-full mr-2 object-cover"
                                />
                                <span>{selectedEmployee.username}</span>
                            </div>
                        ) : (
                            <span className="text-gray-400">Select Employee</span>
                        )}

                        {/* Caret / Arrow */}
                        <svg
                            className="w-4 h-4 ml-2"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 9l-7 7-7-7"
                            />
                        </svg>
                    </button>

                    {/* Dropdown List */}
                    {isDropdownOpen && (
                        <div className="absolute top-[105%] left-0 w-full bg-gray-700 border border-gray-600 rounded mt-1 z-10">
                            {employees.length === 0 && (
                                <div className="p-2 text-sm text-gray-300">
                                    No employees found
                                </div>
                            )}
                            {employees.map((emp) => (
                                <div
                                    key={emp.id}
                                    onClick={() => {
                                        setSelectedEmployee(emp);
                                        setIsDropdownOpen(false);
                                    }}
                                    className="flex items-center cursor-pointer p-2 hover:bg-gray-600"
                                >
                                    <img
                                        src={'/img/profile.webp'}
                                        alt={emp.username}
                                        className="w-6 h-6 rounded-full mr-2 object-cover"
                                    />
                                    <span>{emp.username}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* SEND BUTTON */}
                <div className='absolute right-9 bottom-5'>
                    <button
                        onClick={handleSendShift}
                        disabled={!selectedEmployee || !startDateTime || !endDateTime}
                        className="bg-blue-600 px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};
