
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { TimeEvent, Tag } from '@/lib/types';
import { addEvent, updateEvent, deleteEvent } from '@/lib/actions';
import { CalendarIcon, Loader2, Check, Trash2, Eye } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { Textarea } from '../ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Badge } from '../ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '../ui/alert-dialog';
import { useRouter } from 'next/navigation';
import { ScrollArea } from '../ui/scroll-area';
import { TimePicker } from '../ui/time-picker';
import { AiDebugView } from './ai-debug-view';
import { useEvents } from '@/hooks/use-events';

const eventFormSchema = z.object({
  title: z.string().min(2, {
    message: 'Title must be at least 2 characters.',
  }),
  description: z.string().optional(),
  tags: z.array(z.string()).min(1, 'At least one tag is required.'),
  startTime: z.date(),
  endTime: z.date(),
}).refine(data => data.endTime > data.startTime, {
    message: 'End time must be after start time.',
    path: ['endTime'],
});

type EventFormValues = z.infer<typeof eventFormSchema>;

interface EventFormProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  eventToEdit?: Partial<TimeEvent>;
  onFinished?: () => void;
  availableTags?: Tag[];
  aiDebugInfo?: { prompt: string; response: string; } | null;
}

export function EventForm({ isOpen, onOpenChange, eventToEdit, onFinished, availableTags, aiDebugInfo }: EventFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTagsPopoverOpen, setIsTagsPopoverOpen] = useState(false);
  const [isDebugViewOpen, setIsDebugViewOpen] = useState(false);
  const router = useRouter();
  const { mutateEvents } = useEvents();
  
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      title: '',
      description: '',
      tags: [],
      startTime: new Date(),
      endTime: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  useEffect(() => {
    if (eventToEdit) {
      form.reset({
        title: eventToEdit.title || '',
        description: eventToEdit.description || '',
        tags: eventToEdit.tags || [],
        startTime: eventToEdit.startTime ? new Date(eventToEdit.startTime) : new Date(),
        endTime: eventToEdit.endTime ? new Date(eventToEdit.endTime) : new Date(Date.now() + 60 * 60 * 1000),
      });
    } else {
      form.reset({
        title: '',
        description: '',
        tags: [],
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000),
      });
    }
  }, [eventToEdit, form, isOpen]);

  const handleClose = () => {
    if (isLoading) return;
    onOpenChange(false);
    if (onFinished) onFinished();
  };

  const onSubmit = async (data: EventFormValues) => {
    setIsLoading(true);
    try {
      const action = eventToEdit?.id ? updateEvent(eventToEdit.id, data) : addEvent(data);
      const result = await action;

      if (result.success) {
        await mutateEvents(); // Re-fetch events
        toast({
          title: `Event ${eventToEdit?.id ? 'updated' : 'created'}`,
          description: `"${result.event.title}" has been saved.`,
        });
        handleClose();
      } else {
        throw new Error(result.error || 'Something went wrong.');
      }
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Could not save event.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!eventToEdit?.id) return;
    setIsLoading(true);
    try {
        const result = await deleteEvent(eventToEdit.id!);
        if (result.success) {
            await mutateEvents(); // Re-fetch events
            toast({
                title: 'Event deleted',
                description: `The event has been removed.`,
            });
            handleClose();
        } else {
            throw new Error(result.error || 'Could not delete the event.');
        }
    } catch (error)
{
        toast({
            variant: 'destructive',
            title: 'Error',
            description: error instanceof Error ? error.message : 'Could not delete event.',
        });
    } finally {
        setIsLoading(false);
    }
  };
  
  const getTagColor = (tagName: string) => {
    if (!availableTags) return '#cccccc';
    const tag = availableTags.find(t => t.name === tagName);
    return tag ? tag.color : '#cccccc';
  }

  return (
    <>
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{eventToEdit?.id ? 'Edit Event' : 'Create Event'}</DialogTitle>
          <DialogDescription>
            {eventToEdit?.id ? 'Update the details of your event.' : 'Add a new event to your timeline.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Project work" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Add more details..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="tags"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <Popover open={isTagsPopoverOpen} onOpenChange={setIsTagsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isTagsPopoverOpen}
                        className="w-full justify-between"
                      >
                         <div className="flex gap-1 flex-wrap">
                          {field.value.length > 0 ? field.value.map(tag => (
                            <Badge key={tag} style={{ backgroundColor: getTagColor(tag) }}>
                              {tag}
                            </Badge>
                            )) : "Select tags..."}
                        </div>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[375px] p-0">
                      <Command>
                        <CommandInput placeholder="Search tags..." />
                        <CommandList>
                          <ScrollArea className="h-48">
                            <CommandGroup>
                              {availableTags?.map((tag) => (
                                <CommandItem
                                  key={tag.id}
                                  value={tag.name}
                                  onSelect={(currentValue) => {
                                    const currentTags = field.value || [];
                                    const newTags = currentTags.includes(currentValue)
                                      ? currentTags.filter((t) => t !== currentValue)
                                      : [...currentTags, currentValue];
                                    field.onChange(newTags);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      (field.value || []).includes(tag.name) ? "opacity-100" : "opacity-0"
                                    )}
                                  />
                                  {tag.name}
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </ScrollArea>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="startTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Start Time</FormLabel>
                     <div className="flex items-center gap-2">
                        <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button
                                variant={'outline'}
                                className={cn(
                                'w-full pl-3 text-left font-normal flex-1',
                                !field.value && 'text-muted-foreground'
                                )}
                            >
                                {field.value ? format(field.value, 'PP') : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                            initialFocus
                            />
                        </PopoverContent>
                        </Popover>
                        <TimePicker date={field.value} setDate={field.onChange} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="endTime"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>End Time</FormLabel>
                    <div className="flex items-center gap-2">
                        <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button
                                variant={'outline'}
                                className={cn(
                                'w-full pl-3 text-left font-normal flex-1',
                                !field.value && 'text-muted-foreground'
                                )}
                            >
                                {field.value ? format(field.value, 'PP') : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                            initialFocus
                            />
                        </PopoverContent>
                        </Popover>
                        <TimePicker date={field.value} setDate={field.onChange} />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
               {eventToEdit?.id && (
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button type="button" variant="destructive" className='mr-auto' disabled={isLoading}>
                            <Trash2 className="mr-2 h-4 w-4"/>
                            Delete
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete this event.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete Event</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
               )}
               {aiDebugInfo && (
                  <Button type="button" variant="ghost" onClick={() => setIsDebugViewOpen(true)} className='ml-2 mr-auto' disabled={isLoading}>
                    <Eye className="mr-2 h-4 w-4"/>
                    Inspect AI
                  </Button>
                )}
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {eventToEdit?.id ? 'Save Changes' : 'Create Event'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
    {aiDebugInfo && (
        <AiDebugView 
            isOpen={isDebugViewOpen} 
            onOpenChange={setIsDebugViewOpen} 
            prompt={aiDebugInfo.prompt} 
            response={aiDebugInfo.response}
        />
    )}
    </>
  );
}
