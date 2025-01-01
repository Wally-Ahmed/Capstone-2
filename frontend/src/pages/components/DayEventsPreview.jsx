// DayEventsPreview.jsx

import React from 'react';
import ReactDOM from 'react-dom';

// A helper function to check if a shift overlaps the selected time window
// If you want only fully contained events, use (shift.start >= startTime && shift.end <= endTime).
// If you want partial overlap, use shift.start < endTime && shift.end > startTime.
function isShiftInWindow(shift, startTime, endTime) {
    return shift.start < endTime && shift.end > startTime;
}

export const DayEventsPreview = ({
    closeDayEventsPreview,
    startTime,
    endTime,
    events = [],
    shifts,
    setSelectedShift,
}) => {
    // 1. Filter shifts based on the time window
    const filteredShifts = events.filter((shift) =>
        isShiftInWindow(shift, startTime, endTime)
    );

    // 2. Sort shifts by their start value (ascending)
    const sortedShifts = [...filteredShifts].sort(
        (a, b) => a.start - b.start
    );

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

                {/* Heading */}
                <h2 className="text-2xl font-bold p-2">Events:</h2>

                {/* Scrollable Content Area */}
                <div className="space-y-4 h-full overflow-y-auto pb-10">
                    {sortedShifts.length === 0 && (
                        <div className="text-gray-400">No events for this time window.</div>
                    )}
                    {sortedShifts.map((shift) => (
                        <div
                            key={shift.id}
                            className="cursor-pointer p-2 border-b border-gray-700 hover:bg-gray-700 transition"
                            onClick={() => {
                                const clickedShift = shifts.find((s) => s.id === shift.id);
                                setSelectedShift(clickedShift || null);
                            }}
                        >
                            {/* Simple display; you can style or format times as you see fit */}
                            <div className="font-semibold">{shift.title}</div>
                            <div className="text-sm text-gray-300">
                                Start: {shift.start.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-300">
                                End: {shift.end.toLocaleString()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
};
