
'use client';

import { useState } from 'react';
import { EventForm } from './event-form';
import type { Tag } from '@/lib/types';
import type { ParseNaturalLanguageInputOutput } from '@/ai/flows/parse-natural-language-input';
import { AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { CheckCircle2, XCircle } from 'lucide-react';

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

  return (
    <AccordionItem value={event.title}>
      <AccordionTrigger>
        <div className="flex items-center justify-between w-full pr-4">
          <span>{event.title}</span>
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
