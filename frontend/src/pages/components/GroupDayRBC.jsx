// GroupDayRBC.jsx
import React from 'react';
import { Calendar } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './GroupDayRBCOverrides.css';

// LOGICAL CHANGE: use date-fns to identify the "day" range
import { startOfDay, endOfDay } from 'date-fns';

export function GroupDayRBC({
    localizer,
    view,
    date,
    onNavigate,
    toolbar,
    style,
    events,
    startAccessor,
    endAccessor,
    selectable,
    resources,
    onSelectEvent,
    onSelectSlot,
    onShowMore,
    dayPropGetter,
}) {
    // LOGICAL CHANGE: figure out who has shifts for this "date"
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);

    // Find earliest shift start for each resource within this day
    function getEarliestShift(resourceId) {
        // Filter events for this resource *and* that fall within today's date
        const resourceEvents = events.filter(e =>
            e.resourceId === resourceId &&
            e.start >= dayStart && e.start <= dayEnd
        );
        if (resourceEvents.length === 0) return null;

        // Sort by start time to find earliest
        resourceEvents.sort((a, b) => a.start - b.start);
        return resourceEvents[0].start;  // earliest start time
    }

    // LOGICAL CHANGE: sort resources so that those with a shift come first,
    // and among them, we sort by earliest shift start ascending
    const sortedResources = [...resources].sort((a, b) => {
        const aEarliest = getEarliestShift(a.resourceId);
        const bEarliest = getEarliestShift(b.resourceId);

        // If both have no shift => treat them as equal or secondary sort
        if (!aEarliest && !bEarliest) return 0;
        // If only one has shift => the one with a shift comes first
        if (aEarliest && !bEarliest) return -1;
        if (!aEarliest && bEarliest) return 1;
        // If both have shift => earlier shift start is first
        return aEarliest - bEarliest;
    });

    return (
        <div className="group-day-rbc">
            <Calendar
                localizer={localizer}
                view={view}
                date={date}
                onNavigate={onNavigate}
                toolbar={toolbar}
                style={style}
                events={events}
                startAccessor={startAccessor}
                endAccessor={endAccessor}
                selectable={selectable}

                // LOGICAL CHANGE: pass sorted resources
                resources={sortedResources}
                resourceIdAccessor="resourceId"
                resourceTitleAccessor="resourceTitle"

                onSelectEvent={onSelectEvent}
                onSelectSlot={onSelectSlot}
                onShowMore={onShowMore}
                dayPropGetter={dayPropGetter}
            />
        </div>
    );
}

export default GroupDayRBC;
