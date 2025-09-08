
'use client';

import { useState } from 'react';
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
import { EventForm } from './event-form';
import { Loader2 } from 'lucide-react';
import type { Tag, TimeEvent } from '@/lib/types';
import { useTags } from '@/hooks/use-tags';

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
  const { toast } = useToast();
  const { tags: availableTagsFromHook } = useTags();

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setInputValue('');
      setParsedData(null);
      setIsLoading(false);
      setIsConfirming(false);
      setAiInteraction(null);
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
  
  if (isConfirming && parsedData) {
    const eventToEdit: Partial<TimeEvent> & {
      startTime: Date;
      endTime: Date;
    } = {
      title: parsedData.title,
      tags: parsedData.tags,
      startTime: new Date(parsedData.startTime),
      endTime: new Date(parsedData.endTime),
    };

    return (
      <EventForm
        isOpen={isOpen}
        onOpenChange={(open) => {
          if (!open) {
            handleClose();
          } else {
            onOpenChange(open);
          }
        }}
        eventToEdit={eventToEdit}
        onFinished={handleClose}
        availableTags={availableTagsFromHook}
        aiDebugInfo={aiInteraction}
      />
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
