import { backendURL } from '@/config';
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

export const ProfileTab = ({ showProfileTab, closeProfileTab, user, notifications, getNotifications }) => {

    useEffect(() => {
        const readNotifications = async () => {
            try {
                const res = await fetch(`${backendURL}/user/notifications/read-all`, {
                    method: 'POST',
                    credentials: 'include', // Include cookies in the request
                });

                if (res.ok) {
                    getNotifications();
                }
                else {
                    closeProfileTab();
                }
            } catch (error) {
                closeProfileTab();
            }
        };
        if (showProfileTab) {
            readNotifications();
            const intervalId = setInterval(readNotifications, 10000);
            return () => clearInterval(intervalId); // Cleanup on unmount
        }

    }, []);

    return ReactDOM.createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-100">
            <div className="bg-gray-800 text-white p-8 rounded-lg shadow-lg w-[800px] max-w-[90%] h-3/4 overflow-hidden pb-40 mt-[6%]">
                {/* Close Button */}
                <div className="flex justify-end">
                    <button onClick={closeProfileTab}>
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

                {/* User Profile Section */}
                <div className="flex items-start gap-4 m-4">
                    <img
                        src={user?.profileImage || '/img/profile.webp'} // Replace with actual image path
                        alt="Profile"
                        className="w-32 h-32 rounded-full"
                    />
                    <h2 className="text-2xl font-bold p-2">{user?.username || 'Username'}</h2>
                </div>

                {/* Scrollable Content Area */}
                <h2 className="text-2xl font-bold p-2">Notifications:</h2>
                <div className="space-y-4 h-full overflow-y-auto pb-10">
                    {notifications && notifications.length > 0 ? (
                        notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 rounded-lg ${notification.read ? 'bg-gray-700' : 'bg-gray-600'
                                    }`}
                            >
                                <p>{notification.message}</p>
                                <p className="text-sm text-gray-400">
                                    {new Date(notification.iat).toLocaleString()}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p>No notifications to display.</p>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};
