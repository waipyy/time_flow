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

import { AiDebugView } from './ai-debug-view';
import { Accordion } from '../ui/accordion';
import { EventAccordionItem } from './event-accordion-item';
import { useEvents } from '@/hooks/use-events';

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
  setParsedEvents,
}: {
  prompt: string;
  setPrompt: (value: string) => void;
  handleAudioInput: () => void;
  isRecording: boolean;
  isParsing: boolean;
  handleParse: (text: string) => void;
  parsedEvents: ParseNaturalLanguageInputOutput['events'];
  availableTags: Tag[];
  setParsedEvents: (events: ParseNaturalLanguageInputOutput['events']) => void;
}) => {
  const [processedEventCount, setProcessedEventCount] = useState(0);

  useEffect(() => {
    setProcessedEventCount(0);
  }, [parsedEvents]);

  const handleEventProcessed = () => {
    setProcessedEventCount(prev => prev + 1);
  };
  
  return (
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
        <div className="flex justify-between items-center pr-2">
           <h3 className="font-semibold">Parsed Events</h3>
           {processedEventCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {processedEventCount} of {parsedEvents.length} saved
            </span>
          )}
        </div>
        <Accordion type="single" collapsible className="w-full max-h-60 overflow-y-auto rounded-md border p-2">
          {parsedEvents.map((event, index) => (
            <EventAccordionItem
              key={index}
              event={event}
              availableTags={availableTags}
              onEventProcessed={handleEventProcessed}
            />
          ))}
        </Accordion>
      </div>
    )}
  </div>
)};

// Extracted Footer component
const NaturalLanguageInputFooter = ({
  aiInteraction,
  setIsDebugViewOpen,
  parsedEvents,
  handleClose,
}: {
  aiInteraction: AiInteraction | null;
  setIsDebugViewOpen: (isOpen: boolean) => void;
  parsedEvents: TimeEvent[];
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
    <Button variant="outline" onClick={handleClose}>
      Close
    </Button>
  </>
);

import type { ParseNaturalLanguageInputOutput } from '@/ai/flows/parse-natural-language-input';

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
  const [parsedEvents, setParsedEvents] = useState<ParseNaturalLanguageInputOutput['events']>([]);
  const [isAcceptingAll, setIsAcceptingAll] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [aiInteraction, setAiInteraction] = useState<AiInteraction | null>(
    null
  );
  const [isDebugViewOpen, setIsDebugViewOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { mutateEvents } = useEvents();

  const recognitionRef = useRef<any>(null);

  const handleParse = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      setIsParsing(true);
      setParsedEvents([]);
      try {
        const availableTagNames = availableTags.map(tag => tag.name);
        const result = await parseNaturalLanguageInput({
          text: text,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          now: new Date().toISOString(),
          availableTags: availableTagNames,
        });

        // The result now has a shape of { events: [...], ...debugInfo }
        const { events, ...debugInfo } = result;

        const eventsWithGuaranteedTags = events.map((event) => ({
          ...event,
          tags: event.tags || [],
        }));

        setParsedEvents(eventsWithGuaranteedTags);
        setAiInteraction({ prompt: text, response: debugInfo });
      } catch (error) {
        console.error('Failed to parse natural language input:', error);
        toast({
          title: 'AI Parsing Error',
          description:
            error instanceof Error ? error.message : 'An unexpected error occurred while parsing your input. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsParsing(false);
      }
    },
    [toast, availableTags]
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
        handleParse(transcript);
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
  }, [toast, handleParse]);

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

  const handleClose = () => {
    // Only close if all events have been processed.
    // Or if there are no events to process.
    if (parsedEvents.every(e => e.status !== 'pending') || parsedEvents.length === 0) {
      onOpenChange(false);
      // Reset state on close
      setTimeout(() => {
        setPrompt('');
        setParsedEvents([]);
        setAiInteraction(null);
      }, 300); // Delay to allow animations
    } else {
      toast({
        title: 'Unsaved Events',
        description: 'Please save or cancel all parsed events before closing.',
        variant: 'default',
      });
    }
  };

  if (isMobile) {
    return (
      <>
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
            <div className="px-4">
              <NaturalLanguageInputContent
                prompt={prompt}
                setPrompt={setPrompt}
                handleAudioInput={handleAudioInput}
                isRecording={isRecording}
                isParsing={isParsing}
                handleParse={handleParse}
                parsedEvents={parsedEvents}
                availableTags={availableTags}
                setParsedEvents={setParsedEvents}
              />
            </div>
            <DrawerFooter>
              <NaturalLanguageInputFooter
                aiInteraction={aiInteraction}
                setIsDebugViewOpen={setIsDebugViewOpen}
                parsedEvents={parsedEvents}
                handleClose={handleClose}
              />
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
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
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
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
          <NaturalLanguageInputContent
            prompt={prompt}
            setPrompt={setPrompt}
            handleAudioInput={handleAudioInput}
            isRecording={isRecording}
            isParsing={isParsing}
            handleParse={handleParse}
            parsedEvents={parsedEvents}
            availableTags={availableTags}
            setParsedEvents={setParsedEvents}
          />
          <DialogFooter>
            <NaturalLanguageInputFooter
              aiInteraction={aiInteraction}
              setIsDebugViewOpen={setIsDebugViewOpen}
              parsedEvents={parsedEvents}
              handleClose={handleClose}
            />
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {aiInteraction && (
        <AiDebugView
          isOpen={isDebugViewOpen}
          onOpenChange={setIsDebugViewOpen}
          prompt={JSON.stringify(aiInteraction.prompt, null, 2)}
          response={JSON.stringify(aiInteraction.response, null, 2)}
        />
      )}
    </>
  );
}
