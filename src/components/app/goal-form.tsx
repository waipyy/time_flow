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
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import type { Goal, Tag } from '@/lib/types';
import { addGoal, updateGoal } from '@/lib/actions';
import { Loader2, Check } from 'lucide-react';
import { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '../ui/command';
import { cn } from '@/lib/utils';
import { Badge } from '../ui/badge';
import { mutate } from 'swr';
import { ScrollArea } from '../ui/scroll-area';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';

const goalFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters.'),
  eligibleTagIds: z.array(z.string()).min(1, 'At least one tag is required.'),
  targetAmount: z.coerce.number().min(1, 'Target must be at least 1 hour.'),
  timePeriod: z.enum(['daily', 'weekly', 'monthly']),
  comparison: z.enum(['at-least', 'no-more-than']),
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

interface GoalFormProps {
  goalToEdit?: Goal;
  children?: React.ReactNode;
  availableTags: Tag[];
}

export function GoalForm({ goalToEdit, children, availableTags }: GoalFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isTagsPopoverOpen, setIsTagsPopoverOpen] = useState(false);

  // Helper: convert tag names to IDs (for backward compat when editing old goals)
  const tagNamesToIds = (names: string[]): string[] => {
    if (!availableTags) return [];
    return names.map(name => availableTags.find(t => t.name === name)?.id).filter((id): id is string => !!id);
  };

  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      name: '',
      eligibleTagIds: [],
      targetAmount: 10,
      timePeriod: 'weekly',
      comparison: 'at-least',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (goalToEdit) {
        // Use eligibleTagIds if available, otherwise convert eligibleTags (names) to IDs
        const tagIds = goalToEdit.eligibleTagIds?.length
          ? goalToEdit.eligibleTagIds
          : tagNamesToIds(goalToEdit.eligibleTags || []);
        form.reset({
          name: goalToEdit.name || '',
          eligibleTagIds: tagIds,
          targetAmount: goalToEdit.targetAmount || 10,
          timePeriod: goalToEdit.timePeriod || 'weekly',
          comparison: goalToEdit.comparison || 'at-least',
        })
      } else {
        form.reset({
          name: '',
          eligibleTagIds: [],
          targetAmount: 10,
          timePeriod: 'weekly',
          comparison: 'at-least',
        })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, goalToEdit, form]);

  const handleOpenChange = (open: boolean) => {
    if (isLoading) return;
    setIsOpen(open);
  };

  const onSubmit = async (data: GoalFormValues) => {
    setIsLoading(true);
    try {
      const action = goalToEdit?.id ? updateGoal(goalToEdit.id, data) : addGoal(data);
      const result = await action;

      if (result.success) {
        await mutate('/api/goals');
        toast({
          title: `Goal ${goalToEdit?.id ? 'updated' : 'created'}`,
          description: `"${result.goal.name}" has been saved.`,
        });
        handleOpenChange(false);
      } else {
        throw new Error(result.error || 'Something went wrong.');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Could not save goal.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Get tag details by ID
  const getTagById = (tagId: string) => availableTags?.find(t => t.id === tagId);
  const getTagColor = (tagId: string) => getTagById(tagId)?.color || '#cccccc';
  const getTagName = (tagId: string) => getTagById(tagId)?.name || 'Unknown';

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{goalToEdit?.id ? 'Edit Goal' : 'Create Goal'}</DialogTitle>
          <DialogDescription>
            {goalToEdit?.id ? 'Update your goal details.' : 'Set a new time-based goal.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Goal Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Weekly Fitness" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comparison"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Condition</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="flex space-x-4"
                    >
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="at-least" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          At least
                        </FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center space-x-2 space-y-0">
                        <FormControl>
                          <RadioGroupItem value="no-more-than" />
                        </FormControl>
                        <FormLabel className="font-normal">
                          No more than
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target (hours)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="20" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="timePeriod"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Period</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a period" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="eligibleTagIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Eligible Tags</FormLabel>
                  <Popover open={isTagsPopoverOpen} onOpenChange={setIsTagsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isTagsPopoverOpen}
                        className="w-full justify-between"
                      >
                        <div className="flex gap-1 flex-wrap">
                          {field.value.length > 0 ? field.value.map((tagId: string) => (
                            <Badge key={tagId} style={{ backgroundColor: getTagColor(tagId) }}>
                              {getTagName(tagId)}
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
                            <CommandEmpty>No tags found.</CommandEmpty>
                            <CommandGroup>
                              {availableTags?.map((tag) => (
                                <CommandItem
                                  key={tag.id}
                                  value={tag.name}
                                  onSelect={() => {
                                    const currentTagIds = field.value || [];
                                    const newTagIds = currentTagIds.includes(tag.id)
                                      ? currentTagIds.filter((t: string) => t !== tag.id)
                                      : [...currentTagIds, tag.id];
                                    field.onChange(newTagIds);
                                  }}
                                >
                                  <Check
                                    className={cn(
                                      "mr-2 h-4 w-4",
                                      (field.value || []).includes(tag.id) ? "opacity-100" : "opacity-0"
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {goalToEdit?.id ? 'Save Changes' : 'Create Goal'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
