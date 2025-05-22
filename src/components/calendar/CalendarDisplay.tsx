
import React from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg, DatesSetArg } from '@fullcalendar/core';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface CalendarDisplayProps {
  isLoading: boolean;
  loadingError: string | null;
  calendarView: string;
  events: any[];
  onSelectDate: (selectInfo: DateSelectArg) => void;
  onEventClick: (clickInfo: EventClickArg) => void;
  onDatesSet: (arg: DatesSetArg) => void;
  onRetry: () => void;
}

const CalendarDisplay: React.FC<CalendarDisplayProps> = ({
  isLoading,
  loadingError,
  calendarView,
  events,
  onSelectDate,
  onEventClick,
  onDatesSet,
  onRetry
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Lessons Schedule</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[600px] flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-solid border-current border-r-transparent"></div>
              <p className="mt-2">Loading calendar...</p>
            </div>
          </div>
        ) : loadingError ? (
          <div className="h-[600px] flex items-center justify-center">
            <div className="text-center max-w-md">
              <p className="text-red-500 mb-2">{loadingError}</p>
              <Button onClick={onRetry}>Retry</Button>
            </div>
          </div>
        ) : (
          <div className="h-[600px] relative">
            <FullCalendar
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView={calendarView}
              events={events}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={3}
              weekends={true}
              select={onSelectDate}
              eventClick={onEventClick}
              datesSet={onDatesSet}
              height="100%"
              allDaySlot={false}
              slotDuration="00:30:00"
              slotLabelInterval="01:00"
              expandRows={true}
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CalendarDisplay;
