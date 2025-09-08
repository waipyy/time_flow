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
import type { Tag } from '@/lib/types';
import { addTag, updateTag } from '@/lib/actions';
import { Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { mutate } from 'swr';

const tagFormSchema = z.object({
  name: z.string().min(1, 'Name is required.'),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'Must be a valid hex color code.'),
});

type TagFormValues = z.infer<typeof tagFormSchema>;

interface TagFormProps {
  tagToEdit?: Tag;
  children?: React.ReactNode;
}

export function TagForm({ tagToEdit, children }: TagFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<TagFormValues>({
    resolver: zodResolver(tagFormSchema),
    defaultValues: {
      name: '',
      color: '#84cc16',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (tagToEdit) {
        form.reset({
          name: tagToEdit.name,
          color: tagToEdit.color,
        });
      } else {
        form.reset({
          name: '',
          color: `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`,
        });
      }
    }
  }, [isOpen, tagToEdit, form]);

  const handleOpenChange = (open: boolean) => {
    if (isLoading) return;
    setIsOpen(open);
  };
  
  const onSubmit = async (data: TagFormValues) => {
    setIsLoading(true);
    try {
      const action = tagToEdit?.id
        ? updateTag(tagToEdit.id, data)
        : addTag(data);
      
      const result = await action;

      if (result.success) {
        await mutate('/api/tags');
        toast({
          title: `Tag ${tagToEdit?.id ? 'updated' : 'created'}`,
          description: `"${result.tag.name}" has been saved.`,
        });
        handleOpenChange(false);
      } else {
        throw new Error(result.error || 'Could not save the tag.');
      }
    } catch (error) {
       toast({
        variant: 'destructive',
        title: 'Error saving tag',
        description: error instanceof Error ? error.message : 'Please try again.',
      });
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      {children && <DialogTrigger asChild>{children}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{tagToEdit?.id ? 'Edit Tag' : 'Create Tag'}</DialogTitle>
          <DialogDescription>
            {tagToEdit?.id ? 'Update your tag details.' : 'Create a new tag for organizing your events.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tag Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Work" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="color"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Color</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Input type="color" {...field} className="w-12 h-10 p-1"/>
                      <Input type="text" {...field} placeholder="#84cc16" />
                    </div>
                  </FormControl>
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
                {tagToEdit?.id ? 'Save Changes' : 'Create Tag'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
