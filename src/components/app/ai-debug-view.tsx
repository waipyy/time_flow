'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AiDebugViewProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  prompt: string;
  response: string;
}

export function AiDebugView({ isOpen, onOpenChange, prompt, response }: AiDebugViewProps) {

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Inspect AI Interaction</DialogTitle>
          <DialogDescription>
            Review the exact prompt sent to the model and the raw response received.
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="prompt" className="flex-grow flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="prompt">Prompt</TabsTrigger>
            <TabsTrigger value="response">Response</TabsTrigger>
          </TabsList>
          <TabsContent value="prompt" className="flex-grow min-h-0">
            <ScrollArea className="h-full w-full rounded-md border p-4">
              <pre className="text-sm whitespace-pre-wrap">{prompt}</pre>
            </ScrollArea>
          </TabsContent>
          <TabsContent value="response" className="flex-grow min-h-0">
            <ScrollArea className="h-full w-full rounded-md border p-4">
              <pre className="text-sm whitespace-pre-wrap">{response}</pre>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
