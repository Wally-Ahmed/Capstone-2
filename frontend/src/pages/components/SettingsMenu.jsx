// SettingsMenu.jsx

import React from 'react';
import ReactDOM from 'react-dom';
import { UserGroupIcon, InformationCircleIcon } from '@heroicons/react/24/solid';

export const SettingsMenu = ({ closeSettingsMenu }) => {

    return ReactDOM.createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-gray-800 text-white p-8 rounded-lg shadow-lg w-[600px] max-w-[90%] h-auto overflow-hidden mt-[6%]">
                {/* Close Button */}
                <div className="flex justify-end">
                    <button onClick={closeSettingsMenu} aria-label="Close Settings Menu">
                        <svg
                            className="w-6 h-6 text-white hover:text-gray-400 transition"
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
                <div className="flex items-center mb-6">
                    <h2 className="text-2xl font-bold">Settings</h2>
                </div>

                {/* Settings Content */}
                <div className="space-y-6">
                    {/* Discoverable Setting */}
                    <div className="flex items-center justify-between bg-gray-700 p-4 rounded">
                        <div className="flex items-center">
                            <InformationCircleIcon className="h-6 w-6 text-yellow-400 mr-3" />
                            <div>
                                <h3 className="text-lg font-semibold">Discoverable</h3>
                            </div>
                        </div>
                        <span className="text-sm text-gray-400 italic">Coming Soon</span>
                    </div>
                </div>

                {/* Optional: Footer or Additional Settings */}
                {/* 
                <div className="mt-8">
                    <button
                        onClick={closeSettingsMenu}
                        className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded transition"
                    >
                        Close
                    </button>
                </div>
                */}
            </div>
        </div>,
        document.body
    );
};
