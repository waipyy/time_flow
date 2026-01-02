import {
  add,
  eachDayOfInterval,
  endOfDay,
  endOfWeek,
  // format,
  // isSameDay,
  isWithinInterval,
  max,
  min,
  set,
  startOfDay,
  startOfWeek,
} from 'date-fns';
import { toZonedTime, formatInTimeZone } from 'date-fns-tz';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState, MouseEvent } from 'react';

import type { Tag, TimeEvent } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { EventForm } from './event-form';
import { Skeleton } from '../ui/skeleton';

interface CalendarViewProps {
  events: TimeEvent[];
  tags: Tag[];
}

// Use detection for local dev, but fallback to something valid if needed.
// Since this is a client-side component (or runs locally), we can trust resolvedOptions.
const TIMEZONE = Intl.DateTimeFormat().resolvedOptions().timeZone;

// Helper function to ensure date strings are parsed into Date objects.
// The ISO strings from Firestore are already in UTC.
const parseDate = (dateString: string | Date): Date => {
  return typeof dateString === 'string' ? new Date(dateString) : dateString;
};

// Type for an event with calculated position properties
interface EventWithPosition extends TimeEvent {
  startTime: Date;
  endTime: Date;
  column?: number;
  totalColumns?: number;
}

export function CalendarView({ events: rawEvents, tags }: CalendarViewProps) {
  const events = useMemo(() => {
    if (!rawEvents) return [];
    const parsedEvents = rawEvents.map(e => ({
      ...e,
      startTime: parseDate(e.startTime),
      endTime: parseDate(e.endTime),
    }));
    return parsedEvents;
  }, [rawEvents]);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [editingEvent, setEditingEvent] = useState<TimeEvent | undefined>(
    undefined
  );
  const [dragStartDate, setDragStartDate] = useState<Date | null>(null);
  const [draggingEvent, setDraggingEvent] = useState<Partial<TimeEvent> | null>(null);


  const week = useMemo(() => {
    // Convert currentDate (local Date) to a Date object that, when interpreted locally, represents the same instant in TIMEZONE.
    const zonedCurrentDate = toZonedTime(currentDate, TIMEZONE);

    // Calculate start/end of week based on this zoned date, which will give us Dates corresponding to the week in TIMEZONE.
    const startOfTargetWeek = startOfWeek(zonedCurrentDate, { weekStartsOn: 1 });
    const endOfTargetWeek = endOfWeek(zonedCurrentDate, { weekStartsOn: 1 });

    return eachDayOfInterval({
      start: startOfTargetWeek,
      end: endOfTargetWeek,
    });
  }, [currentDate]);

  const hours = Array.from({ length: 24 }, (_, i) => i);

  const displayedEvents = useMemo(() => {
    if (draggingEvent) {
      return [...events, draggingEvent as TimeEvent];
    }
    return events;
  }, [events, draggingEvent]);

  const handlePrevWeek = () => {
    setCurrentDate((prev) => add(prev, { weeks: -1 }));
  };
  const handleNextWeek = () => {
    setCurrentDate((prev) => add(prev, { weeks: 1 }));
  };

  const getTimeFromMouseEvent = (day: Date, e: MouseEvent<HTMLDivElement>): Date => {
    const rect = e.currentTarget.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;

    // The container's total height is 24 hours * 2.5rem/hour = 60rem
    // We can calculate the fraction of the day that has passed based on the click position
    const totalHours = (offsetY / rect.height) * 24;
    const hour = Math.floor(totalHours);
    const minutesInHour = (totalHours - hour) * 60;
    const minutes = Math.round(minutesInHour / 15) * 15; // Round to nearest 15 minutes

    const zonedDay = toZonedTime(day, TIMEZONE);
    return set(zonedDay, { hours: hour, minutes, seconds: 0, milliseconds: 0 });
  };

  const handleMouseDown = (day: Date, e: MouseEvent<HTMLDivElement>) => {
    const startDate = getTimeFromMouseEvent(day, e);
    setDragStartDate(startDate);
    setDraggingEvent({
      startTime: startDate,
      endTime: startDate,
      title: 'New Event',
      tagIds: [], // Empty for new event
    });
  };

  const handleMouseMove = (day: Date, e: MouseEvent<HTMLDivElement>) => {
    if (!dragStartDate) return;

    let startDate = dragStartDate;
    let endDate = getTimeFromMouseEvent(day, e);

    if (endDate < startDate) {
      [startDate, endDate] = [endDate, startDate];
    }

    setDraggingEvent(prev => ({
      ...prev,
      startTime: startDate,
      endTime: endDate,
    }));
  };

  const handleMouseUp = () => {
    if (!dragStartDate || !draggingEvent?.startTime || !draggingEvent?.endTime) {
      // If there was no drag, cancel any potential ghost placeholder
      setDraggingEvent(null);
      return;
    };

    let { startTime, endTime } = draggingEvent;

    // If start and end are the same (a simple click), make it a 1-hour event
    if (startTime.getTime() === endTime.getTime()) {
      endTime = add(startTime, { hours: 1 });
    }

    const newEvent: Partial<TimeEvent> = {
      startTime,
      endTime,
    };
    setEditingEvent(newEvent as TimeEvent);
    setDragStartDate(null); // Reset drag state
    setDraggingEvent(null);
  };

  const getEventsWithOverlapData = (day: Date, events: EventWithPosition[]): EventWithPosition[] => {
    const dayStart = startOfDay(toZonedTime(day, TIMEZONE));
    const dayEnd = endOfDay(toZonedTime(day, TIMEZONE));

    const eventsForDay = events
      .filter(event => {
        if (!event || !event.startTime || !event.endTime) return false;
        const eventStartZoned = toZonedTime(event.startTime, TIMEZONE);
        const eventEndZoned = toZonedTime(event.endTime, TIMEZONE);

        return isWithinInterval(eventStartZoned, { start: dayStart, end: dayEnd }) ||
          isWithinInterval(eventEndZoned, { start: dayStart, end: dayEnd }) ||
          (eventStartZoned < dayStart && eventEndZoned > dayEnd);
      })
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    if (eventsForDay.length === 0) {
      return [];
    }

    let eventGroups: EventWithPosition[][] = [];
    let currentGroup: EventWithPosition[] = [eventsForDay[0]];

    for (let i = 1; i < eventsForDay.length; i++) {
      const currentEvent = eventsForDay[i];
      const lastEventInGroup = currentGroup[currentGroup.length - 1];

      if (currentEvent.startTime < lastEventInGroup.endTime) {
        currentGroup.push(currentEvent);
      } else {
        eventGroups.push(currentGroup);
        currentGroup = [currentEvent];
      }
    }
    eventGroups.push(currentGroup);

    const positionedEvents: EventWithPosition[] = [];
    for (const group of eventGroups) {
      const columns: EventWithPosition[][] = [];
      for (const event of group) {
        let placed = false;
        for (let i = 0; i < columns.length; i++) {
          const column = columns[i];
          const lastEventInColumn = column[column.length - 1];
          if (event.startTime >= lastEventInColumn.endTime) {
            column.push(event);
            event.column = i;
            placed = true;
            break;
          }
        }

        if (!placed) {
          event.column = columns.length;
          columns.push([event]);
        }
      }

      const totalColumns = columns.length;
      for (const event of group) {
        event.totalColumns = totalColumns;
        positionedEvents.push(event);
      }
    }

    return positionedEvents;
  };
  const getEventStyle = (event: EventWithPosition, currentDay: Date) => {
    const startOfCurrentDay = startOfDay(toZonedTime(currentDay, TIMEZONE));
    const endOfCurrentDay = endOfDay(toZonedTime(currentDay, TIMEZONE));

    const startOfEventOnDay = max([
      toZonedTime(event.startTime, TIMEZONE),
      startOfCurrentDay,
    ]);
    const endOfEventOnDay = min([
      toZonedTime(event.endTime, TIMEZONE),
      endOfCurrentDay,
    ]);

    // Calculate start position relative to the beginning of the current day
    const startHour = (startOfEventOnDay.getTime() - startOfCurrentDay.getTime()) / (1000 * 60 * 60);
    const durationHours = (endOfEventOnDay.getTime() - startOfEventOnDay.getTime()) / (1000 * 60 * 60);

    const baseStyle = {
      top: `${startHour * 2.5}rem`, // 2.5rem per hour
      height: `${durationHours * 2.5}rem`,
    };

    if (event.column !== undefined && event.totalColumns !== undefined && event.totalColumns > 1) {
      const widthPercentage = 98 / event.totalColumns; // 98% to leave a small gap
      const leftPercentage = (event.column / event.totalColumns) * 98;
      return {
        ...baseStyle,
        left: `${leftPercentage + 1}%`, // +1 for left offset
        width: `${widthPercentage - 1}%`, // -1 for right offset
      };
    }

    return {
      ...baseStyle,
      left: '1%',
      width: '98%',
    };
  };

  const getTagColor = (tagId: string) => {
    if (!tags || !tagId) return '#cccccc';
    const tag = tags.find((t) => t.id === tagId);
    return tag ? tag.color : '#cccccc';
  };

  if (!rawEvents || !tags) {
    return <div className="h-full flex flex-col p-4"><Skeleton className="w-full h-full" /></div>
  }

  return (
    <>
      <div className="h-full flex flex-col">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {formatInTimeZone(startOfWeek(toZonedTime(currentDate, TIMEZONE), { weekStartsOn: 1 }), TIMEZONE, 'MMMM yyyy')}
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
            {/* Spacer to align with the sticky day headers */}
            <div className="sticky top-0 bg-background z-10 text-center p-2 border-b">
              <p className="text-sm font-medium invisible">Mon</p>
              <p className="text-2xl font-semibold invisible">8</p>
            </div>
            <div className="relative">
              {hours.map((hour) => {
                const dateForLabel = set(toZonedTime(new Date(), TIMEZONE), { hours: hour, minutes: 0 });
                const formattedLabel = formatInTimeZone(dateForLabel, TIMEZONE, 'p');
                return (
                  <div
                    key={hour}
                    className="h-10 text-right pr-2 text-xs text-muted-foreground border-t flex items-center"
                  >
                    {formattedLabel}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Day columns */}
          <div className="flex-1 grid" style={{ gridTemplateColumns: 'repeat(7, minmax(200px, 1fr))' }} onMouseLeave={() => setDragStartDate(null)}>
            {week.map((day) => {
              const eventsWithPosition = getEventsWithOverlapData(day, displayedEvents as EventWithPosition[]);
              return (
                <div key={day.toString()} className="relative border-l">
                  <div className="sticky top-0 bg-background z-10 text-center p-2 border-b">
                    <p className="text-sm font-medium">{formatInTimeZone(day, TIMEZONE, 'EEE')}</p>
                    <p className="text-2xl font-semibold">{formatInTimeZone(day, TIMEZONE, 'd')}</p>
                  </div>
                  <div
                    className="relative h-[60rem]" // Explicit height for event positioning
                    onMouseDown={(e) => handleMouseDown(day, e)}
                    onMouseMove={(e) => handleMouseMove(day, e)}
                    onMouseUp={handleMouseUp}
                  >
                    {/* Hour lines */}
                    {hours.map((hour) => (
                      <div
                        key={hour}
                        className="h-10 border-t"
                        style={{ pointerEvents: 'none' }} // Disable pointer events on individual slots
                      ></div>
                    ))}
                    {/* Events */}
                    {eventsWithPosition.map((event) => (
                      <div
                        key={event.id || 'placeholder-event'}
                        className="absolute p-1 rounded text-white text-xs cursor-pointer z-20 flex items-center justify-center overflow-hidden" // Added overflow-hidden
                        style={{
                          ...getEventStyle(event, day),
                          backgroundColor: getTagColor(event.tagIds?.[0]),
                        }}
                        onClick={() => setEditingEvent(event)}
                        onMouseDown={(e) => e.stopPropagation()}
                      >
                        <p className="font-bold whitespace-normal text-center">
                          {event.title}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {editingEvent && (
        <EventForm
          isOpen={!!editingEvent}
          onOpenChange={(isOpen) => !isOpen && setEditingEvent(undefined)}
          eventToEdit={editingEvent}
          availableTags={tags}
        />
      )}
    </>
  );
}
