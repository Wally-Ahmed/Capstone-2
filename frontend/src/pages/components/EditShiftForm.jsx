// EditShiftForm.jsx

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { backendURL } from '@/config';

export const EditShiftForm = ({
    closeEditShiftForm,
    groupId,
    selectedShift,
    employees = [],
}) => {
    // We'll keep separate states:
    // 1. "displayStart" / "displayEnd" for the <input> fields (show "YYYY-MM-DDTHH:MM"),
    // 2. The actual JS Date objects for "raw" usage (like sending the request).
    const [displayStart, setDisplayStart] = useState('');
    const [displayEnd, setDisplayEnd] = useState('');
    const [rawStartDate, setRawStartDate] = useState(null);
    const [rawEndDate, setRawEndDate] = useState(null);

    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // On mount or whenever selectedShift changes:
    useEffect(() => {
        if (selectedShift) {
            // Convert the shift times to JS Date objects
            // e.g. "2025-01-01T10:00:00Z" => new Date(...)
            const startObj = selectedShift.start_time
                ? new Date(selectedShift.start_time)
                : null;
            const endObj = selectedShift.end_time ? new Date(selectedShift.end_time) : null;

            setRawStartDate(startObj);
            setRawEndDate(endObj);

            // For display in the input, we only want YYYY-MM-DDTHH:MM
            if (startObj) {
                setDisplayStart(startObj.toISOString().slice(0, 16));
            } else {
                setDisplayStart('');
            }

            if (endObj) {
                setDisplayEnd(endObj.toISOString().slice(0, 16));
            } else {
                setDisplayEnd('');
            }

            // Find assigned employee
            const emp = employees.find((e) => e.id === selectedShift.user_id) || null;
            setSelectedEmployee(emp);
        }
    }, [selectedShift, employees]);

    // When user changes the display (typing in the datetime-local input),
    // parse it back into a JS Date object so we can keep track of it.
    const handleDisplayStartChange = (e) => {
        const value = e.target.value; // "YYYY-MM-DDTHH:MM"
        setDisplayStart(value);
        if (value) {
            setRawStartDate(new Date(value)); // new Date("2025-01-01T10:00")
        } else {
            setRawStartDate(null);
        }
    };

    const handleDisplayEndChange = (e) => {
        const value = e.target.value;
        setDisplayEnd(value);
        if (value) {
            setRawEndDate(new Date(value));
        } else {
            setRawEndDate(null);
        }
    };

    const handleSaveShift = async () => {
        if (!selectedEmployee || !rawStartDate || !rawEndDate) return;

        try {
            // For the request, we send the *full* ISO string (no .slice).
            const body = {
                shift_owner_membership_id: selectedEmployee.id,
                start_time_iso: rawStartDate.toISOString(), // full ISO
                end_time_iso: rawEndDate.toISOString(),     // full ISO
            };

            const res = await fetch(
                `${backendURL}/user/groups/${groupId}/shift/${selectedShift.id}`,
                {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(body),
                }
            );

            if (!res.ok) {
                alert('Failed to update shift');
                return;
            }
            closeEditShiftForm();
        } catch (error) {
            console.error('Error updating shift:', error);
            alert('An error occurred while updating the shift');
        }
    };

    const handleDeleteShift = async () => {
        try {
            const res = await fetch(
                `${backendURL}/user/groups/${groupId}/shift/${selectedShift.id}`,
                {
                    method: 'DELETE',
                    credentials: 'include',
                }
            );

            if (res.status !== 204) {
                alert('Failed to delete shift');
                return;
            }
            closeEditShiftForm();
        } catch (error) {
            console.error('Error deleting shift:', error);
            alert('An error occurred while deleting the shift');
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-gray-800 text-white p-8 rounded-lg shadow-lg w-[800px] max-w-[90%] h-3/4 overflow-hidden pb-40 mt-[6%] relative">
                {/* Close Button */}
                <div className="flex justify-end">
                    <button onClick={closeEditShiftForm}>
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

                <h2 className="text-xl font-bold mb-4">Shift Details</h2>

                {/* Start Date/Time */}
                <label className="block mb-1 font-semibold">Start Date/Time</label>
                <input
                    type="datetime-local"
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded mb-4"
                    value={displayStart}
                    onChange={handleDisplayStartChange}
                />

                {/* End Date/Time */}
                <label className="block mb-1 font-semibold">End Date/Time</label>
                <input
                    type="datetime-local"
                    className="w-full bg-gray-700 text-white px-3 py-2 rounded mb-4"
                    value={displayEnd}
                    onChange={handleDisplayEndChange}
                />

                {/* Select Employee */}
                <label className="block mb-1 font-semibold">Assign To</label>
                <div className="relative w-full mb-4">
                    <button
                        type="button"
                        onClick={() => setIsDropdownOpen((prev) => !prev)}
                        className="w-full bg-gray-700 text-white px-3 py-2 rounded flex items-center justify-between"
                    >
                        {selectedEmployee ? (
                            <div className="flex items-center">
                                <img
                                    src={selectedEmployee.profilePic || '/img/profile.webp'}
                                    alt={selectedEmployee.username}
                                    className="w-6 h-6 rounded-full mr-2 object-cover"
                                />
                                <span>{selectedEmployee.username}</span>
                            </div>
                        ) : (
                            <span className="text-gray-400">Select Employee</span>
                        )}
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
                                        src={emp.profilePic || '/img/profile.webp'}
                                        alt={emp.username}
                                        className="w-6 h-6 rounded-full mr-2 object-cover"
                                    />
                                    <span>{emp.username}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="absolute right-9 bottom-5 flex space-x-4">
                    <button
                        onClick={handleSaveShift}
                        disabled={!selectedEmployee || !rawStartDate || !rawEndDate}
                        className="bg-blue-600 px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Save
                    </button>

                    <button
                        onClick={handleDeleteShift}
                        className="bg-red-600 px-4 py-2 rounded"
                    >
                        Delete
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default EditShiftForm;
