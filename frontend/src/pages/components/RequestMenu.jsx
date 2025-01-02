// RequestMenu.jsx

import React from 'react';
import ReactDOM from 'react-dom';
import { backendURL } from '@/config';
import { UserGroupIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';

/**
 * @param {Function} closeRequestMenu - Callback to close the modal.
 * @param {Object[]} requests         - Array of membership request objects that combine
 *                                      membership + user details in a single object.
 *                                      E.g., { id, user_id, username, group_id, approved }
 */
export const RequestMenu = ({
    getGroupData,
    closeRequestMenu,
    requests = []
}) => {

    // Approve membership row
    const handleApprove = async (membershipId) => {
        try {
            const res = await fetch(
                `${backendURL}/user/memberships/${membershipId}/approve-join`,
                {
                    method: 'POST',
                    credentials: 'include', // ensure cookies are included
                }
            );
            if (!res.ok) {
                alert('Failed to approve request.');
                return;
            }
            getGroupData();
        } catch (error) {
            console.error('Error approving membership:', error);
        }
    };

    // Decline membership row
    const handleDecline = async (membershipId) => {
        try {
            const res = await fetch(
                `${backendURL}/user/memberships/${membershipId}/decline-join`,
                {
                    method: 'DELETE',
                    credentials: 'include', // ensure cookies are included
                }
            );
            if (!res.ok && res.status !== 204) {
                alert('Failed to decline request.');
                return;
            }
            window.location.reload();
        } catch (error) {
            console.error('Error declining membership:', error);
        }
    };

    return ReactDOM.createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-gray-800 text-white p-8 rounded-lg shadow-lg w-[800px] max-w-[90%] h-3/4 overflow-hidden pb-40 mt-[6%]">
                {/* Close Button */}
                <div className="flex justify-end">
                    <button onClick={closeRequestMenu} aria-label="Close Request Menu">
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
                            />
                        </svg>
                    </button>
                </div>

                {/* Title */}
                <div className="flex items-center mb-4">
                    <UserGroupIcon className="h-8 w-8 text-white mr-2" />
                    <h2 className="text-2xl font-bold">Join Requests</h2>
                </div>

                {/* Scrollable List */}
                <div className="w-full h-3/4 overflow-y-auto scrollbar scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-gray-700 scrollbar-track-gray-800 pt-2">
                    {requests.length === 0 ? (
                        <p className="text-gray-400">No pending requests found.</p>
                    ) : (
                        requests.map((row) => (
                            <div
                                key={row.id}
                                className="flex justify-between items-center bg-gray-700 rounded p-3 mb-2"
                            >
                                <span className="font-semibold">
                                    {row.username ?? 'Unknown User'}
                                </span>
                                <div className="flex space-x-2">
                                    {/* Approve Button with Check Icon */}
                                    <button
                                        onClick={() => handleApprove(row.id)}
                                        className="p-2 rounded flex items-center justify-center"
                                        aria-label="Approve Request"
                                    >
                                        <CheckIcon className="h-5 w-5 text-white" />
                                    </button>
                                    {/* Decline Button with X Icon */}
                                    <button
                                        onClick={() => handleDecline(row.id)}
                                        className="p-2 rounded flex items-center justify-center"
                                        aria-label="Decline Request"
                                    >
                                        <XMarkIcon className="h-5 w-5 text-white" />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
