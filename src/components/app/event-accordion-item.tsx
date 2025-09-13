
'use client';

import { useState } from 'react';
import { EventForm } from './event-form';
import type { Tag } from '@/lib/types';
import type { ParseNaturalLanguageInputOutput } from '@/ai/flows/parse-natural-language-input';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';

type EventStatus = 'pending' | 'saved' | 'cancelled';

interface EventAccordionItemProps {
  event: ParseNaturalLanguageInputOutput['events'][0];
  availableTags: Tag[];
  onEventProcessed: () => void;
}

export function EventAccordionItem({ event, availableTags, onEventProcessed }: EventAccordionItemProps) {
  const [status, setStatus] = useState<EventStatus>('pending');

  const handleFinished = (success: boolean) => {
    setStatus(success ? 'saved' : 'cancelled');
    onEventProcessed();
  };
  
  const getStatusIndicator = () => {
    switch (status) {
      case 'saved':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'cancelled':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const formattedTime = `${format(new Date(event.startTime), 'h:mm a')} - ${format(new Date(event.endTime), 'h:mm a')}`;

  return (
    <AccordionItem value={event.title} disabled={status !== 'pending'}>
      <AccordionTrigger>
        <div className="flex items-center justify-between w-full pr-4">
          <div className="flex flex-col items-start text-left">
            <span className="font-semibold">{event.title}</span>
            <span className="text-sm text-muted-foreground">{formattedTime}</span>
            <div className="flex gap-1 mt-1">
              {event.tags.map(tag => <Badge key={tag} variant="outline">{tag}</Badge>)}
            </div>
          </div>
          {getStatusIndicator()}
        </div>
      </AccordionTrigger>
      <AccordionContent>
        {status === 'pending' ? (
          <EventForm
            className="p-4 border-t"
            eventToEdit={{
              title: event.title,
              tags: event.tags,
              startTime: new Date(event.startTime),
              endTime: new Date(event.endTime),
            }}
            onFinished={() => handleFinished(true)}
            onCancelled={() => handleFinished(false)}
            availableTags={availableTags}
          />
        ) : (
          <div className="p-4 text-center text-lg">
            {status === 'saved' ? 'Event Saved!' : 'Action Cancelled.'}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}
