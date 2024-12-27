// components/CalendarComponent.jsx

import React, { useState } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarOverrides.css';  // <-- Import your overrides globally

// date-fns helpers
import { add, sub, isSameDay, startOfWeek, endOfWeek, format } from 'date-fns';
import { DayEventsPreview } from './DayEventsPreview';

// Convert moment to RBC localizer
const localizer = momentLocalizer(moment);

export function CalendarComponent({
    viewMode,      // e.g. { calanderView: 'W', personView: 'I' }
    setViewMode,
    shifts = [],
    members = [],
}) {
    // We'll keep track of the calendar's current date here
    const [currentDate, setCurrentDate] = useState(new Date());

    // Example "show day preview" modal
    const [showDayPreview, setShowDayPreview] = useState(false);

    // Map your custom calanderView to RBC's Views
    const rbcViewMap = {
        D: Views.DAY,
        W: Views.WEEK,
        M: Views.MONTH,
    };
    const rbcView = rbcViewMap[viewMode.calanderView] || Views.WEEK;

    // Hardcoded events for development (these are your example events)
    const myEvents = [
        {
            id: 1,
            title: 'Morning Standup',
            start: new Date(2024, 11, 20, 9, 0),
            end: new Date(2024, 11, 20, 9, 30),
            allDay: false,
            resourceId: 'john',
        },
        {
            id: 2,
            title: 'Project Meeting',
            start: new Date(2024, 11, 20, 10, 0),
            end: new Date(2024, 11, 20, 11, 0),
            allDay: false,
            resourceId: 'john',
        },
        {
            id: 3,
            title: 'Lunch Break',
            start: new Date(2024, 11, 20, 12, 0),
            end: new Date(2024, 11, 20, 13, 0),
            allDay: false,
            resourceId: 'john',
        },
        {
            id: 4,
            title: 'Client Presentation',
            start: new Date(2024, 11, 20, 15, 0),
            end: new Date(2024, 11, 20, 16, 30),
            allDay: false,
            resourceId: 'john',
        },
    ];

    const resources = [
        { resourceId: 'john', resourceTitle: 'John' },
        { resourceId: 'jane', resourceTitle: 'Jane' },
        { resourceId: 'alex', resourceTitle: 'Alex' },
    ]

    // For demonstration, we combine your "myEvents" with the "shifts" from props
    // OR you can just keep them separate.

    // Handlers for Next/Prev navigation, adding or subtracting days/weeks/months
    const handleNext = () => {
        if (viewMode.calanderView === 'D') {
            setCurrentDate(add(currentDate, { days: 1 }));
        } else if (viewMode.calanderView === 'W') {
            setCurrentDate(add(currentDate, { weeks: 1 }));
        } else if (viewMode.calanderView === 'M') {
            setCurrentDate(add(currentDate, { months: 1 }));
        }
    };

    const handlePrev = () => {
        if (viewMode.calanderView === 'D') {
            setCurrentDate(sub(currentDate, { days: 1 }));
        } else if (viewMode.calanderView === 'W') {
            setCurrentDate(sub(currentDate, { weeks: 1 }));
        } else if (viewMode.calanderView === 'M') {
            setCurrentDate(sub(currentDate, { months: 1 }));
        }
    };

    // Example: highlight days that have "myEvents" in Month view if personView === 'I'
    const dayPropGetter = (date) => {
        const isBlocked = myEvents.some((event) => isSameDay(event.start, date));
        if (viewMode.personView !== 'I' || viewMode.calanderView !== 'M') {
            return {};
        }
        return isBlocked
            ? { className: 'xedOffDay cursor-pointer' }
            : { className: 'cursor-pointer' };
    };

    // Show a dynamic header for Month/Week/Day
    const getCalendarHeader = () => {
        if (viewMode.calanderView === 'M') {
            return `${currentDate.toLocaleString('default', { month: 'long' })} ${currentDate.getFullYear()}`;
        } else if (viewMode.calanderView === 'W') {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 });
            const end = endOfWeek(currentDate, { weekStartsOn: 1 });
            return `${format(start, 'MMM d')} - ${format(end, 'MMM d yyyy')}`;
        } else if (viewMode.calanderView === 'D') {
            return format(currentDate, 'EEEE, MMM d, yyyy');
        }
        return '';
    };

    return (
        <div className="flex flex-col w-full h-full">
            {/* Custom toolbar (Prev, Header, Next) */}
            <div className="flex items-center justify-center p-2 bg-gray-700 text-white space-x-4">
                <button onClick={handlePrev} className="px-2 py-1 bg-gray-500 rounded">
                    Prev
                </button>

                <span>{getCalendarHeader()}</span>

                <button onClick={handleNext} className="px-2 py-1 bg-gray-500 rounded">
                    Next
                </button>
            </div>

            {/* The Big Calendar itself */}
            <div className="flex-1 flex">
                <Calendar
                    localizer={localizer}
                    view={rbcView}
                    date={currentDate}
                    // We do our own next/prev, so onNavigate can be empty or no-op
                    onNavigate={() => { }}
                    toolbar={false}
                    style={{ flex: 1 }}
                    events={!(viewMode.calanderView === 'M' && viewMode.personView === 'I') ? myEvents : []}
                    startAccessor="start"
                    endAccessor="end"
                    selectable={viewMode.calanderView === 'M'}
                    // resources={resources}

                    // Hardcoded dev alerts
                    onSelectEvent={(event) =>
                        alert(`Selected event: ${event.title}`)
                    }
                    onSelectSlot={(slotInfo) => {
                        if (viewMode.calanderView !== 'M') { return }
                        alert(
                            `Selected date cell: ` +
                            `${slotInfo.start.toDateString()} - ` +
                            `${slotInfo.end.toDateString()}`
                        );
                        setShowDayPreview(true);
                    }}
                    onShowMore={(events, date) => {
                        alert(`Clicked "+${events.length} more" on date: ${date.toDateString()}`);
                        // Switch to Day view for that date
                        setViewMode({ ...viewMode, calanderView: 'D' });
                        setCurrentDate(date);
                    }}

                    dayPropGetter={dayPropGetter}
                />
            </div>

            {/* If you have a "DayEventsPreview" modal */}
            {showDayPreview && (
                <DayEventsPreview
                    closeDayEventsPreview={() => setShowDayPreview(false)}
                />
            )}
        </div>
    );
}

export default CalendarComponent;
