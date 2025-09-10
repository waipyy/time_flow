
'use client';

import {
  add,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  set,
  startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import type { Tag, TimeEvent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { EventForm } from './event-form';
import { Skeleton } from '../ui/skeleton';

interface CalendarViewProps {
  events: TimeEvent[];
  tags: Tag[];
}

// Helper function to parse date strings as UTC
const parseUTC = (dateString: string | Date) => {
  if (dateString instanceof Date) {
    return dateString;
  }
  const date = new Date(dateString);
  // The string is in ISO format (e.g., "2024-01-01T10:00:00.000Z"), which is already UTC.
  // new Date() correctly parses this. The issue arises when local-timezone-based
  // methods like getHours() are used. We need to use UTC methods like getUTCHours().
  return date;
};

export function CalendarView({ events: rawEvents, tags }: CalendarViewProps) {
  const events = useMemo(() => {
    if (!rawEvents) return [];
    return rawEvents.map(e => ({
    ...e,
    startTime: parseUTC(e.startTime),
    endTime: parseUTC(e.endTime),
  }))}, [rawEvents]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingEvent, setEditingEvent] = useState<TimeEvent | undefined>(
    undefined
  );

  const week = eachDayOfInterval({
    start: startOfWeek(currentDate, { weekStartsOn: 1 }),
    end: endOfWeek(currentDate, { weekStartsOn: 1 }),
  });

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const handlePrevWeek = () => {
    setCurrentDate((prev) => add(prev, { weeks: -1 }));
  };
  const handleNextWeek = () => {
    setCurrentDate((prev) => add(prev, { weeks: 1 }));
  };

  const getEventStyle = (event: TimeEvent & {startTime: Date}) => {
    const startHour =
      event.startTime.getUTCHours() + event.startTime.getUTCMinutes() / 60;
    const durationHours = event.duration / 60;

    return {
      top: `${startHour * 4}rem`, // 4rem per hour
      height: `${durationHours * 4}rem`,
    };
  };

  const getTagColor = (tagName: string) => {
    if (!tags) return '#cccccc';
    const tag = tags.find((t) => t.name === tagName);
    return tag ? tag.color : '#cccccc';
  };
  
  if (!rawEvents || !tags) {
    return <div className="h-full flex flex-col p-4"><Skeleton className="w-full h-full"/></div>
  }

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {format(startOfWeek(currentDate, { weekStartsOn: 1 }), 'MMMM yyyy')}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrevWeek}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleNextWeek}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-1 overflow-auto">
          {/* Time column */}
          <div className="w-20 border-r text-sm shrink-0">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-16 text-right pr-2 text-xs text-muted-foreground border-t pt-1"
              >
                {hour > 0 &&
                  format(set(new Date(), { hours: hour, minutes: 0 }), 'p')}
              </div>
            ))}
          </div>

          {/* Day columns */}
          <div className="flex-1 grid" style={{ gridTemplateColumns: 'repeat(7, minmax(140px, 1fr))' }}>
            {week.map((day) => (
              <div key={day.toString()} className="relative border-l">
                <div className="sticky top-0 bg-background z-10 text-center p-2 border-b">
                  <p className="text-sm font-medium">{format(day, 'EEE')}</p>
                  <p className="text-2xl font-semibold">{format(day, 'd')}</p>
                </div>
                <div className="relative">
                  {/* Hour lines */}
                  {hours.map((hour) => (
                    <div key={hour} className="h-16 border-t"></div>
                  ))}
                  {/* Events */}
                  {events
                    .filter((event) => isSameDay(event.startTime, day))
                    .map((event) => (
                      <div
                        key={event.id}
                        className="absolute w-[95%] left-1 p-1 rounded text-white text-xs cursor-pointer z-20 flex items-center justify-center"
                        style={{
                          ...getEventStyle(event as TimeEvent & {startTime: Date}),
                          backgroundColor: getTagColor(event.tags[0]),
                        }}
                        onClick={() => setEditingEvent(event)}
                      >
                        <p className="font-bold whitespace-normal text-center">
                          {event.title}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      {editingEvent && (
        <EventForm
          isOpen={!!editingEvent}
          onOpenChange={(isOpen) => !isOpen && setEditingEvent(undefined)}
          eventToEdit={editingEvent}
        />
      )}
    </>
  );
}
