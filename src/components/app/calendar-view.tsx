
'use client';

import {
  add,
  eachDayOfInterval,
  endOfDay,
  endOfWeek,
  format,
  isSameDay,
  isWithinInterval,
  max,
  min,
  set,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import type { Tag, TimeEvent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { EventForm } from './event-form';
import { Skeleton } from '../ui/skeleton';

interface CalendarViewProps {
  events: TimeEvent[];
  tags: Tag[];
}

// Helper function to ensure date strings are parsed into Date objects.
// The ISO strings from Firestore are already in UTC.
const parseDate = (dateString: string | Date): Date => {
  return typeof dateString === 'string' ? new Date(dateString) : dateString;
};

export function CalendarView({ events: rawEvents, tags }: CalendarViewProps) {
  if (rawEvents && rawEvents.length > 0) {
    console.log('[DEBUG-5 Client] Raw event data received by CalendarView:', JSON.parse(JSON.stringify(rawEvents[0])));
  }
  const events = useMemo(() => {
    if (!rawEvents) return [];
    const parsed = rawEvents.map(e => ({
      ...e,
      startTime: parseDate(e.startTime),
      endTime: parseDate(e.endTime),
    }));
    if (parsed.length > 0) {
      const firstEvent = parsed[0];
      console.log('[DEBUG-6 Client] First event after parsing in CalendarView:', {
        ...firstEvent,
        startTimeISO: firstEvent.startTime.toISOString(),
        endTimeISO: firstEvent.endTime.toISOString(),
        startTimeLocal: firstEvent.startTime.toString(),
        endTimeLocal: firstEvent.endTime.toString()
      });
    }
    return parsed;
  }, [rawEvents]);

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

  const getEventStyle = (event: TimeEvent & {startTime: Date, endTime: Date}, currentDay: Date) => {
    const startOfCurrentDay = startOfDay(currentDay);
    const endOfCurrentDay = endOfDay(currentDay);

    const startOfEventOnDay = max([event.startTime, startOfCurrentDay]);
    const endOfEventOnDay = min([event.endTime, endOfCurrentDay]);

    // Calculate start position relative to the beginning of the current day
    const startHour = (startOfEventOnDay.getTime() - startOfCurrentDay.getTime()) / (1000 * 60 * 60);
    const durationHours = (endOfEventOnDay.getTime() - startOfCurrentDay.getTime()) / (1000 * 60 * 60);

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
                    .filter((event) =>
                      isWithinInterval(day, {
                        start: startOfDay(event.startTime),
                        end: endOfDay(event.endTime),
                      })
                    )
                    .map((event) => (
                      <div
                        key={event.id + format(day, 'yyyy-MM-dd')}
                        className="absolute w-[95%] left-1 p-1 rounded text-white text-xs cursor-pointer z-20 flex items-center justify-center"
                        style={{
                          ...getEventStyle(event as TimeEvent & {startTime: Date, endTime: Date}, day),
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

    