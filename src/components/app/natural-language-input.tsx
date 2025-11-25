'use client';

import { Eye, Loader2, Mic, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect, useCallback } from 'react';

import { parseNaturalLanguageInput } from '@/ai/flows/parse-natural-language-input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { addEvents } from '@/lib/actions';
import type { TimeEvent, Tag } from '@/lib/types';
import { Accordion } from '@/components/ui/accordion';
import { useEvents } from '@/hooks/use-events';

import { AiDebugView } from './ai-debug-view';
import { EventAccordionItem } from './event-accordion-item';
import { EventForm } from './event-form';

// Extracted Content component
const NaturalLanguageInputContent = ({
  prompt,
  setPrompt,
  handleAudioInput,
  isRecording,
  isParsing,
  handleParse,
  parsedEvents,
  availableTags,
}: {
  prompt: string;
  setPrompt: (value: string) => void;
  handleAudioInput: () => void;
  isRecording: boolean;
  isParsing: boolean;
  handleParse: (text: string) => void;
  parsedEvents: Omit<TimeEvent, 'id' | 'duration'>[];
  availableTags: Tag[];
}) => (
  <div className="grid gap-4 py-4">
    <div className="grid gap-2">
      <Textarea
        id="prompt"
        placeholder="e.g., 'Work on the Genkit integration for 2 hours, then have a 30-minute meeting with the team.'"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        className="min-h-[100px]"
      />
      <div className="flex justify-between items-center">
        <Button
          onClick={handleAudioInput}
          variant="outline"
          size="sm"
          disabled={isParsing}
        >
          <Mic
            className={`mr-2 h-4 w-4 ${isRecording ? 'text-red-500' : ''}`}
          />
          {isRecording ? 'Stop' : 'Record Audio'}
        </Button>
        <Button
          onClick={() => handleParse(prompt)}
          disabled={isParsing || !prompt}
        >
          {isParsing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Parse Input
        </Button>
      </div>
    </div>

    {isParsing && (
      <div className="text-center">
        <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
        <p className="mt-2 text-sm text-muted-foreground">
          AI is parsing your input...
        </p>
      </div>
    )}

    {parsedEvents.length > 0 && (
      <div className="space-y-2">
        <h3 className="font-semibold">Parsed Events</h3>
        <div className="max-h-60 overflow-y-auto rounded-md border p-2">
          <Accordion type="multiple" className="w-full">
            {parsedEvents.map((event, index) => (
              <EventAccordionItem
                key={index}
                event={event}
                isNewlyCreated
                availableTags={availableTags.map((t) => t.name)}
              />
            ))}
          </Accordion>
        </div>
      </div>
    )}
  </div>
);

// Extracted Footer component
const NaturalLanguageInputFooter = ({
  aiInteraction,
  setIsDebugViewOpen,
  parsedEvents,
  handleAcceptAll,
  isAcceptingAll,
  handleClose,
}: {
  aiInteraction: AiInteraction | null;
  setIsDebugViewOpen: (isOpen: boolean) => void;
  parsedEvents: Omit<TimeEvent, 'id' | 'duration'>[];
  handleAcceptAll: () => void;
  isAcceptingAll: boolean;
  handleClose: () => void;
}) => (
  <>
    {aiInteraction && (
      <Button
        type="button"
        variant="ghost"
        onClick={() => setIsDebugViewOpen(true)}
        className="mr-auto"
      >
        <Eye className="mr-2 h-4 w-4" />
        Inspect AI
      </Button>
    )}
    {parsedEvents.length > 0 && (
      <Button onClick={handleAcceptAll} disabled={isAcceptingAll}>
        {isAcceptingAll && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Accept All
      </Button>
    )}
    <Button variant="outline" onClick={handleClose}>
      Close
    </Button>
  </>
);

interface NaturalLanguageInputProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  availableTags: Tag[];
}

interface AiInteraction {
  prompt: string;
  response: any;
}

export function NaturalLanguageInput({
  isOpen,
  onOpenChange,
  availableTags,
}: NaturalLanguageInputProps) {
  const [prompt, setPrompt] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedEvents, setParsedEvents] = useState<
    Omit<TimeEvent, 'id' | 'duration'>[]
  >([]);
  const [isAcceptingAll, setIsAcceptingAll] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [aiInteraction, setAiInteraction] = useState<AiInteraction | null>(
    null
  );
  const [isDebugViewOpen, setIsDebugViewOpen] = useState(false);
  const [eventToCreate, setEventToCreate] = useState<Omit<
    TimeEvent,
    'id' | 'duration'
  > | null>(null);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { mutateEvents } = useEvents();

  const recognitionRef = useRef<any>(null);

  const handleClose = useCallback(() => {
    onOpenChange(false);
    setPrompt('');
    setParsedEvents([]);
    setAiInteraction(null);
  }, [onOpenChange]);

  const handleParse = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      setIsParsing(true);
      setParsedEvents([]);
      try {
        const tagNames = availableTags.map((tag) => tag.name);
        const { events, ...debugInfo } = await parseNaturalLanguageInput({
          text: text,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          now: new Date().toISOString(),
          availableTags: tagNames,
        });

        if (events.length === 1) {
          setEventToCreate(
            events[0] as Omit<TimeEvent, 'id' | 'duration'>
          );
          handleClose();
        } else {
          const eventsWithTags = events.map((event) => ({
            ...event,
            tags: event.tags?.filter((tag) => tagNames.includes(tag)) || [],
          }));

          setParsedEvents(
            eventsWithTags as Omit<TimeEvent, 'id' | 'duration'>[]
          );
          setAiInteraction({ prompt: text, response: debugInfo });
        }
      } catch (error) {
        console.error('Failed to parse natural language input:', error);
        toast({
          title: 'AI Parsing Error',
          description:
            'An unexpected error occurred while parsing your input. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsParsing(false);
      }
    },
    [toast, availableTags, handleClose]
  );

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setPrompt(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        toast({
          title: 'Speech Recognition Error',
          description: `An error occurred during speech recognition: ${event.error}`,
          variant: 'destructive',
        });
        setIsRecording(false);
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
      };
    }
  }, [toast]);

  const handleAudioInput = () => {
    if (recognitionRef.current) {
      if (isRecording) {
        recognitionRef.current.stop();
      } else {
        setIsRecording(true);
        setPrompt('');
        setParsedEvents([]);
        recognitionRef.current.start();
      }
    } else {
      toast({
        title: 'Speech Recognition Not Supported',
        description:
          'Your browser does not support speech recognition. Please try a different browser.',
        variant: 'destructive',
      });
    }
  };

  const handleAcceptAll = async () => {
    setIsAcceptingAll(true);
    try {
      await addEvents(parsedEvents);
      toast({
        title: 'Events Created',
        description: 'The new events have been added to your calendar.',
      });
      mutateEvents();
      handleClose();
    } catch (error) {
      console.error('Failed to create events:', error);
      toast({
        title: 'Error Creating Events',
        description:
          'An unexpected error occurred while saving your events. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsAcceptingAll(false);
    }
  };

  const mainDialog = (
    <NaturalLanguageInputContent
      prompt={prompt}
      setPrompt={setPrompt}
      handleAudioInput={handleAudioInput}
      isRecording={isRecording}
      isParsing={isParsing}
      handleParse={handleParse}
      parsedEvents={parsedEvents}
      availableTags={availableTags}
    />
  );
  const mainFooter = (
    <NaturalLanguageInputFooter
      aiInteraction={aiInteraction}
      setIsDebugViewOpen={setIsDebugViewOpen}
      parsedEvents={parsedEvents}
      handleAcceptAll={handleAcceptAll}
      isAcceptingAll={isAcceptingAll}
      handleClose={handleClose}
    />
  );

  return (
    <>
      {isMobile ? (
        <Drawer open={isOpen} onOpenChange={onOpenChange}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle className="flex items-center">
                <Sparkles className="mr-2 h-4 w-4 text-primary" />
                Log with AI
              </DrawerTitle>
              <DrawerDescription>
                Describe the events you want to log in natural language. The AI
                will parse them for you.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4">{mainDialog}</div>
            <DrawerFooter>{mainFooter}</DrawerFooter>
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <Sparkles className="mr-2 h-4 w-4 text-primary" />
                Log with AI
              </DialogTitle>
              <DialogDescription>
                Describe the events you want to log in natural language. The AI
                will parse them for you.
              </DialogDescription>
            </DialogHeader>
            {mainDialog}
            <DialogFooter>{mainFooter}</DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {eventToCreate && (
        <EventForm
          isOpen={!!eventToCreate}
          onOpenChange={(open) => {
            if (!open) {
              setEventToCreate(null);
            }
          }}
          eventToEdit={eventToCreate}
          availableTags={availableTags}
        />
      )}

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