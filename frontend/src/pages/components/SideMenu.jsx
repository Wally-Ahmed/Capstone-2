// components/SideMenu.jsx
import React from 'react';
import { ChevronLeftIcon, UserGroupIcon } from '@heroicons/react/24/solid';

export function SideMenu({ viewMode, setViewMode, showMenu, setShowMenu }) {
    const calanderViewOptions = ['D', 'W', 'M'];
    const personViewOptions = ['I', 'G'];

    const handleCalanderViewChange = (value) => {
        if (value === 'W') {
            setViewMode({ ...viewMode, calanderView: value, personView: 'I' });
        } else {
            setViewMode({ ...viewMode, calanderView: value });
        }
    };

    const handlePersonViewChange = (value) => {
        setViewMode({ ...viewMode, personView: value });
    };

    // Determine if 'I' button in personViewOptions should be disabled
    const isIDisabled = viewMode.personView === 'I' && viewMode.calanderView === 'W';

    return (
        <div className="flex flex-col h-full bg-gray-900 p-1">
            {/* First Part - Square with Button */}
            <button
                className="w-full aspect-square flex items-center justify-center mt-2"
                onClick={() => setShowMenu(!showMenu)}
            >
                {showMenu ? (
                    <ChevronLeftIcon className="h-10 w-10 text-white" />
                ) : (
                    <UserGroupIcon className="h-10 w-10 text-white" />
                )}
            </button>

            {/* Second Part - Remaining Area */}
            <div className="flex-1 flex pt-2">
                {/* First Subsection - CalanderView Buttons */}
                <div className="w-1/2 flex flex-col gap-2">
                    {calanderViewOptions.map((option) => (
                        <button
                            key={option}
                            className={`flex-1 text-sm ${viewMode.calanderView === option
                                ? 'bg-gray-600'
                                : 'bg-gray-800 hover:bg-gray-700'
                                } text-white rounded-md transition-colors duration-200`}
                            onClick={() => handleCalanderViewChange(option)}
                        >
                            {option}
                        </button>
                    ))}
                </div>

                {/* Second Subsection - PersonView Buttons */}
                <div className="w-1/2 flex flex-col gap-2 ml-1">
                    {personViewOptions.map((option) => {
                        const disabled = option === 'G' && isIDisabled;
                        return (
                            <button
                                key={option}
                                className={`flex-1 text-sm ${viewMode.personView === option
                                    ? 'bg-gray-600'
                                    : 'bg-gray-800 hover:bg-gray-700'
                                    } text-white rounded-md transition-colors duration-200 ${disabled ? 'opacity-50 cursor-not-allowed hover:bg-gray-800' : ''
                                    }`}
                                onClick={() => handlePersonViewChange(option)}
                                disabled={disabled}
                            >
                                {option}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
