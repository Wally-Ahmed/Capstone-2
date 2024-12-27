import { backendURL } from '@/config';
import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';

export const DayEventsPreview = ({ closeDayEventsPreview }) => {


    return ReactDOM.createPortal(
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-100">
            <div className="bg-gray-800 text-white p-8 rounded-lg shadow-lg w-[800px] max-w-[90%] h-3/4 overflow-hidden pb-40 mt-[6%]">
                {/* Close Button */}
                <div className="flex justify-end">
                    <button onClick={closeDayEventsPreview}>
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
                </div>

                {/* Scrollable Content Area */}
                <h2 className="text-2xl font-bold p-2">Events:</h2>
                <div className="space-y-4 h-full overflow-y-auto pb-10">

                </div>
            </div>
        </div>,
        document.body
    );
};
