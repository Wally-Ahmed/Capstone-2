// components/CalendarComponent.jsx

import React, { useState } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './CalendarOverrides.css';

// date-fns helpers
import {
    add,
    sub,
    isSameDay,
    startOfWeek,
    endOfWeek,
    format,
    subDays,
} from 'date-fns';

import { DayEventsPreview } from './DayEventsPreview';
import GroupDayRBC from './GroupDayRBC';
import { NewShiftForm } from './NewShiftForm';
import EditShiftForm from './EditShiftForm';

// Material Tailwind UI
import { IconButton } from '@material-tailwind/react';

// Heroicons (24/outline version)
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';

const localizer = momentLocalizer(moment);

export function CalendarComponent({
    viewMode, // e.g. { calanderView: 'W', personView: 'I' }
    setViewMode,
    shifts = [],
    members = [],
    membershipRequests = [],
    userRole = '',
    groupId = '',
    getGroupData = () => { },
}) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [showDayPreview, setShowDayPreview] = useState(null);
    const [showNewShiftForm, setShowNewShiftForm] = useState(false);
    const [selectedShift, setSelectedShift] = useState(null);

    const rbcViewMap = {
        D: Views.DAY,
        W: Views.WEEK,
        M: Views.MONTH,
    };
    const rbcView = rbcViewMap[viewMode.calanderView] || Views.WEEK;

    // Convert DB shifts -> RBC events
    const myEvents = shifts.map((shift) => {
        const shiftOwner = members.find((m) => m.id === shift.user_id);
        const ownerName = shiftOwner ? shiftOwner.username : 'Shift';
        return {
            ...shift,
            id: shift.id,
            title: ownerName,
            start: new Date(shift.start_time),
            end: new Date(shift.end_time),
            resourceId: shift.user_id,
        };
    });

    const myResources = members.map((m) => ({
        resourceId: m.id,
        resourceTitle: m.username,
    }));


    // RBC handlers
    const onSelectEvent = (event) => {
        const clickedShift = shifts.find((s) => s.id === event.id);
        setSelectedShift(clickedShift || null);
    };

    const onSelectSlot = (slotInfo) => {
        if (viewMode.calanderView !== 'M') return;
        if (slotInfo.slots?.length === 1) {
            // Single day in Month => go to Day
            setViewMode({ ...viewMode, calanderView: 'D' });
            setCurrentDate(slotInfo.start);
        } else {
            // Multi-day => open preview
            setShowDayPreview({ startTime: slotInfo.start, endTime: slotInfo.end });
        }
    };

    const onShowMore = (events, date) => {
        setViewMode({ ...viewMode, calanderView: 'D' });
        setCurrentDate(date);
    };

    // Prev/Next handlers
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

    // Highlight days in Month if in Individual view
    const dayPropGetter = (date) => {
        if (viewMode.personView === 'I' && viewMode.calanderView === 'M') {
            const hasEvent = myEvents.some((evt) => isSameDay(evt.start, date));
            return {
                className: hasEvent ? 'xedOffDay cursor-pointer z-10' : 'cursor-pointer',
            };
        }
        return {};
    };

    // Format header text
    const getCalendarHeader = () => {
        if (viewMode.calanderView === 'M') {
            return `${currentDate.toLocaleString('default', {
                month: 'long',
            })} ${currentDate.getFullYear()}`;
        } else if (viewMode.calanderView === 'W') {
            const start = startOfWeek(currentDate, { weekStartsOn: 1 });
            // Subtract 1 day from normal endOfWeek
            const rawEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
            const end = subDays(rawEnd, 1);
            return `${format(start, 'MMM d')} - ${format(end, 'MMM d yyyy')}`;
        } else if (viewMode.calanderView === 'D') {
            return format(currentDate, 'EEEE, MMM d, yyyy');
        }
        return '';
    };

    return (
        <div className="flex flex-col w-full h-full">
            {/* Toolbar (Prev, Title, Next) */}
            <div className="relative">
                <div className="flex items-center justify-center p-2 bg-gray-700 text-white space-x-4">
                    {/* Prev Button - Chevron */}
                    <IconButton
                        variant="text"
                        color="blue-gray"
                        onClick={handlePrev}
                        className="text-gray-400 hover:text-white"
                    >
                        <ChevronLeftIcon className="h-6 w-6" />
                    </IconButton>

                    <span className="font-semibold text-lg">{getCalendarHeader()}</span>

                    {/* Next Button - Chevron */}
                    <IconButton
                        variant="text"
                        color="blue-gray"
                        onClick={handleNext}
                        className="text-gray-400 hover:text-white"
                    >
                        <ChevronRightIcon className="h-6 w-6" />
                    </IconButton>
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
                    {viewMode.calanderView === 'D' && viewMode.personView === 'G' ? (
                        <GroupDayRBC
                            localizer={localizer}
                            view={rbcView}
                            date={currentDate}
                            onNavigate={() => { }}
                            toolbar={false}
                            style={{ flex: 1 }}
                            events={
                                !(viewMode.calanderView === 'M' && viewMode.personView === 'I')
                                    ? myEvents
                                    : []
                            }
                            startAccessor="start"
                            endAccessor="end"
                            selectable={viewMode.calanderView === 'M'}
                            resources={myResources}
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
                            events={
                                !(viewMode.calanderView === 'M' && viewMode.personView === 'I')
                                    ? myEvents
                                    : []
                            }
                            startAccessor="start"
                            endAccessor="end"
                            drilldownView="day"
                            onDrillDown={(date) => {
                                setViewMode({ ...viewMode, calanderView: 'D' });
                                setCurrentDate(date);
                            }}
                            onSelectEvent={onSelectEvent}
                            onSelectSlot={onSelectSlot}
                            onShowMore={onShowMore}
                            dayPropGetter={dayPropGetter}
                            selectable={viewMode.calanderView === 'M'}
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
                    setSelectedShift={setSelectedShift}
                />
            )}

            {showNewShiftForm && (
                <NewShiftForm
                    closeNewShiftForm={() => setShowNewShiftForm(false)}
                    employees={members}
                    groupId={groupId}
                    getGroupData={getGroupData}
                />
            )}

            {selectedShift && (
                <EditShiftForm
                    selectedShift={selectedShift}
                    employees={members}
                    closeEditShiftForm={() => setSelectedShift(null)}
                    groupId={groupId}
                    getGroupData={getGroupData}
                    isAdmin={userRole === 'owner' || userRole === 'admin'}
                    membershipRequests={membershipRequests}
                />
            )}
        </div>
    );
}

export default CalendarComponent;
