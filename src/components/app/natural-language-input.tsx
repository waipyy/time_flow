
'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { parseEventWithAI } from '@/lib/actions';
import type { ParseNaturalLanguageInputOutput } from '@/ai/flows/parse-natural-language-input';
import { Eye, Loader2 } from 'lucide-react';
import type { Tag } from '@/lib/types';
import { useTags } from '@/hooks/use-tags';
import { Accordion } from '@/components/ui/accordion';
import { EventAccordionItem } from './event-accordion-item';
import { AiDebugView } from './ai-debug-view';
import { EventForm } from './event-form'; // Import EventForm

interface NaturalLanguageInputProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  availableTags: Tag[];
}

export function NaturalLanguageInput({ isOpen, onOpenChange }: NaturalLanguageInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedData, setParsedData] = useState<ParseNaturalLanguageInputOutput | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [aiInteraction, setAiInteraction] = useState<{
    prompt: string,
    response: string
  } | null>(null);
  const [processedEventCount, setProcessedEventCount] = useState(0);
  const [isDebugViewOpen, setIsDebugViewOpen] = useState(false);
  const { toast } = useToast();
  const { tags: availableTagsFromHook } = useTags();

  useEffect(() => {
    if (parsedData && parsedData.events.length > 1 && processedEventCount === parsedData.events.length) {
      toast({
        title: 'All events processed',
        description: 'You can now close this dialog.',
      });
    }
  }, [processedEventCount, parsedData, toast]);

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setInputValue('');
      setParsedData(null);
      setIsLoading(false);
      setIsConfirming(false);
      setAiInteraction(null);
      setProcessedEventCount(0);
    }, 300);
  };

  const handleParse = async () => {
    setIsLoading(true);
    setAiInteraction(null);
    const availableTagNames = availableTagsFromHook?.map(t => t.name) || [];
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const result = await parseEventWithAI(inputValue, availableTagNames, timezone);
    setIsLoading(false);
    if (result.success && result.data && result.debug) {
      setParsedData(result.data);
      setAiInteraction({
        prompt: result.debug.prompt,
        response: JSON.stringify(result.debug.response, null, 2)
      });
      setIsConfirming(true);
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error || 'Could not parse the event.',
      });
    }
  };

  const handleEventProcessed = () => {
    setProcessedEventCount(prev => prev + 1);
  };

  if (isConfirming && parsedData) {
    // If only one event, show the EventForm directly
    if (parsedData.events.length === 1) {
      const event = parsedData.events[0];
      return (
        <>
          <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>Review and Save Event</DialogTitle>
                <DialogDescription>
                  AI has parsed the following event from your input. Review, edit, and save it.
                </DialogDescription>
              </DialogHeader>
              <EventForm
                className="p-4"
                eventToEdit={{
                  title: event.title,
                  tags: event.tags,
                  startTime: new Date(event.startTime),
                  endTime: new Date(event.endTime),
                }}
                onFinished={handleClose} // Close dialog after single event is saved/cancelled
                onCancelled={handleClose} // Close dialog after single event is saved/cancelled
                availableTags={availableTagsFromHook}
              />
              <DialogFooter>
                {aiInteraction && (
                  <Button type="button" variant="ghost" onClick={() => setIsDebugViewOpen(true)} className="mr-auto">
                    <Eye className="mr-2 h-4 w-4"/>
                    Inspect AI
                  </Button>
                )}
                {/* No 'Close' button needed here as form handles close on finish/cancel */}
              </DialogFooter>
            </DialogContent>
          </Dialog>
          {aiInteraction && (
            <AiDebugView 
                isOpen={isDebugViewOpen} 
                onOpenChange={setIsDebugViewOpen} 
                prompt={aiInteraction.prompt} 
                response={aiInteraction.response}
            />
          )}
        </>
      );
    }

    // If more than one event, show the accordion view
    return (
      <>
        <Dialog open={isOpen} onOpenChange={handleClose}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Review and Save Events</DialogTitle>
              <DialogDescription>
                AI has parsed the following events from your input. Review, edit, and save them individually.
              </DialogDescription>
            </DialogHeader>
            <Accordion type="single" collapsible className="w-full">
              {parsedData.events.map((event, index) => (
                <EventAccordionItem
                  key={index}
                  event={event}
                  availableTags={availableTagsFromHook}
                  onEventProcessed={handleEventProcessed}
                />
              ))}
            </Accordion>
            <DialogFooter>
              {aiInteraction && (
                <Button type="button" variant="ghost" onClick={() => setIsDebugViewOpen(true)} className="mr-auto">
                  <Eye className="mr-2 h-4 w-4"/>
                  Inspect AI
                </Button>
              )}
              <Button onClick={handleClose}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {aiInteraction && (
          <AiDebugView 
              isOpen={isDebugViewOpen} 
              onOpenChange={setIsDebugViewOpen} 
              prompt={aiInteraction.prompt} 
              response={aiInteraction.response}
          />
        )}
      </>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Log with AI</DialogTitle>
          <DialogDescription>
            Describe your activity in plain English. For example, "Worked on my
            resume from 2pm to 4pm."
          </DialogDescription>
        </DialogHeader>
        <Textarea
          placeholder="Type your activity here..."
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          rows={4}
        />
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleParse} disabled={isLoading || !inputValue}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Parse
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
