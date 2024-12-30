import React from 'react';
import { Calendar } from 'react-big-calendar';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './GroupDayRBCOverrides.css';

export function GroupDayRBC(props) {
    const {
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
    } = props;

    return (
        // 1) Wrap the RBC <Calendar> in a container with a unique class
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
                resources={resources}
                onSelectEvent={onSelectEvent}
                onSelectSlot={onSelectSlot}
                onShowMore={onShowMore}
                dayPropGetter={dayPropGetter}
                resourceId="resourceId"
                resourceTitle="resourceTitle"
            />
        </div>
    );
}

export default GroupDayRBC;
