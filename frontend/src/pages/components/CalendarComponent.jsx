// components/CalendarComponent.jsx

import React, { useState } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarOverrides.css';  // <-- Import your overrides globally

// date-fns helpers
import { add, sub, isSameDay, startOfWeek, endOfWeek, format } from 'date-fns';
import { DayEventsPreview } from './DayEventsPreview';
import GroupDayRBC from './GroupDayRBC';
import { NewShiftForm } from './NewShiftForm';
import EditShiftForm from './EditShiftForm';

const localizer = momentLocalizer(moment);

export function CalendarComponent({
    viewMode,      // e.g. { calanderView: 'W', personView: 'I' }
    setViewMode,
    shifts = [],
    members = [],
    userRole = '',
    groupId = ''
}) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showDayPreview, setShowDayPreview] = useState(null);
    const [showNewShiftForm, setShowNewShiftForm] = useState(false);

    // The currently selected shift (for editing, etc.)
    const [selectedShift, setSelectedShift] = useState(null);

    const rbcViewMap = {
        D: Views.DAY,
        W: Views.WEEK,
        M: Views.MONTH,
    };
    const rbcView = rbcViewMap[viewMode.calanderView] || Views.WEEK;

    // When an event is clicked, find that shift object & store in selectedShift
    const onSelectEvent = (event) => {
        const clickedShift = shifts.find((s) => s.id === event.id);
        setSelectedShift(clickedShift || null);
    };

    const onSelectSlot = (slotInfo) => {
        if (viewMode.calanderView !== 'M') return;
        if (slotInfo.slots && slotInfo.slots.length === 1) {
            alert(`Clicked single day: ${slotInfo.start.toDateString()}`);
            setViewMode({ ...viewMode, calanderView: 'D' });
            setCurrentDate(slotInfo.start);
        } else {
            alert(
                `Selected date cell(s): From ${slotInfo.start.toDateString()} ` +
                `to ${slotInfo.end.toDateString()}`
            );
            setShowDayPreview({ startTime: slotInfo.start, endTime: slotInfo.end });
        }
    };

    const onShowMore = (events, date) => {
        alert(`Clicked "+${events.length} more" on date: ${date.toDateString()}`);
        setViewMode({ ...viewMode, calanderView: 'D' });
        setCurrentDate(date);
    };

    // Build RBC event objects from shifts
    const myEvents = shifts.map((shift) => {
        const shiftOwner = members.find((m) => m.id === shift.user_id);
        const ownerName = shiftOwner ? shiftOwner.username : 'Shift';
        return {
            id: shift.id,
            title: ownerName,
            start: new Date(shift.start_time),
            end: new Date(shift.end_time),
            resourceId: shift.user_id,
        };
    });

    // Build RBC resources from members
    const resources = members.map((emp) => ({
        resourceId: emp.id,
        resourceTitle: emp.username,
    }));

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

    const dayPropGetter = (date) => {
        const isBlocked = myEvents.some((event) => isSameDay(event.start, date));
        if (viewMode.personView !== 'I' || viewMode.calanderView !== 'M') {
            return {};
        }
        return isBlocked
            ? { className: ' xedOffDay cursor-pointer z-10' }
            : { className: 'cursor-pointer' };
    };

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
            <div className="relative">
                <div className="flex items-center justify-center p-2 bg-gray-700 text-white space-x-4">
                    <button onClick={handlePrev} className="px-2 py-1 bg-gray-500 rounded">
                        Prev
                    </button>

                    <span>{getCalendarHeader()}</span>

                    <button onClick={handleNext} className="px-2 py-1 bg-gray-500 rounded">
                        Next
                    </button>
                </div>

                {(userRole === 'owner' || userRole === 'admin') && (
                    <button
                        onClick={() => setShowNewShiftForm(true)}
                        className="absolute right-10 top-2 w-8 h-8 flex items-center justify-center bg-gray-500 text-white rounded"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="white"
                            strokeWidth={2}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14m7-7H5" />
                        </svg>
                    </button>
                )}
            </div>

            {/* The Big Calendar itself */}
            <div className="flex flex-col w-full h-full overflow-y-auto scrollbar scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar-thumb-gray-700 scrollbar-track-gray-800 pt-5 pb-[1px]">
                <div className="flex-1 flex">
                    {(viewMode.calanderView === 'D' && viewMode.personView === 'G') ? (
                        <GroupDayRBC
                            localizer={localizer}
                            view={rbcView}
                            date={currentDate}
                            onNavigate={() => { }}
                            toolbar={false}
                            style={{ flex: 1 }}
                            events={!(viewMode.calanderView === 'M' && viewMode.personView === 'I') ? myEvents : []}
                            startAccessor="start"
                            endAccessor="end"
                            selectable={viewMode.calanderView === 'M'}
                            resources={resources}
                            onSelectEvent={onSelectEvent}
                            onSelectSlot={onSelectSlot}
                            onShowMore={onShowMore}
                            dayPropGetter={dayPropGetter}
                        />
                    ) : (
                        <Calendar
                            localizer={localizer}
                            view={rbcView}
                            date={currentDate}
                            onNavigate={() => { }}
                            toolbar={false}
                            style={{ flex: 1 }}
                            events={!(viewMode.calanderView === 'M' && viewMode.personView === 'I') ? myEvents : []}
                            startAccessor="start"
                            endAccessor="end"
                            selectable={viewMode.calanderView === 'M'}
                            // resources={resources}
                            onSelectEvent={onSelectEvent}
                            onSelectSlot={onSelectSlot}
                            onShowMore={onShowMore}
                            dayPropGetter={dayPropGetter}
                        />
                    )}
                </div>
            </div>

            {showDayPreview && (
                <DayEventsPreview
                    closeDayEventsPreview={() => setShowDayPreview(false)}
                    startTime={showDayPreview.startTime}
                    endTime={showDayPreview.endTime}
                    events={myEvents}
                    shifts={shifts}
                    setSelectedShift={setSelectedShift}
                />
            )}

            {showNewShiftForm && (
                <NewShiftForm
                    closeNewShiftForm={() => setShowNewShiftForm(false)}
                    employees={members}
                    groupId={groupId}
                />
            )}

            {selectedShift && (
                <EditShiftForm
                    selectedShift={selectedShift}
                    employees={members}
                    closeEditShiftForm={() => setSelectedShift(null)}
                    groupId={groupId}
                />
            )}
        </div>
    );
}

export default CalendarComponent;
