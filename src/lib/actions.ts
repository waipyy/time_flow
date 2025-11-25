
'use server';

import { z } from 'zod';
import type { Goal, TimeEvent, Tag, Task } from './types';
import { revalidatePath, revalidateTag } from 'next/cache';
import { parseNaturalLanguageInput, parseNaturalLanguageInputPrompt } from '@/ai/flows/parse-natural-language-input';
import { getDb } from './firebase-admin';


export async function addEvent(eventData: Omit<TimeEvent, 'id' | 'duration'>) {
  console.log('[DEBUG-2 Server] addEvent received raw data:', eventData);
  try {
    const db = getDb();
    const startTime = typeof eventData.startTime === 'string' ? new Date(eventData.startTime) : eventData.startTime;
    const endTime = typeof eventData.endTime === 'string' ? new Date(eventData.endTime) : eventData.endTime;
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

    console.log('[DEBUG-3 Server] Parsed Date objects:', {
      startTime,
      endTime,
      startTimeISO: startTime.toISOString(),
      endTimeISO: endTime.toISOString(),
    });
    
    const newEventData = {
      ...eventData,
      duration,
      startTime,
      endTime,
    };

    console.log('[DEBUG-4 Server] Data being sent to Firestore:', newEventData);
    const ref = await db.collection('events').add(newEventData);
    
    revalidateTag('events');
    revalidatePath('/');
    return { success: true, event: { ...newEventData, id: ref.id } };
  } catch (error) {
    console.error("Error adding event:", error);
    return { success: false, error: "Failed to create event." };
  }
}

export async function addEvents(eventsData: Omit<TimeEvent, 'id' | 'duration'>[]) {
  try {
    const db = getDb();
    const batch = db.batch();
    const events = [];

    for (const eventData of eventsData) {
      const startTime = typeof eventData.startTime === 'string' ? new Date(eventData.startTime) : eventData.startTime;
      const endTime = typeof eventData.endTime === 'string' ? new Date(eventData.endTime) : eventData.endTime;
      const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

      const newEventData = {
        ...eventData,
        duration,
        startTime,
        endTime,
      };
      
      const ref = db.collection('events').doc();
      batch.set(ref, newEventData);
      events.push({ ...newEventData, id: ref.id });
    }

    await batch.commit();
    
    revalidateTag('events');
    revalidatePath('/');
    return { success: true, events };
  } catch (error) {
    console.error("Error adding events:", error);
    return { success: false, error: "Failed to create events." };
  }
}

export async function updateEvent(eventId: string, eventData: Omit<TimeEvent, 'id' | 'duration'>) {
  try {
    const db = getDb();
    const startTime = typeof eventData.startTime === 'string' ? new Date(eventData.startTime) : eventData.startTime;
    const endTime = typeof eventData.endTime === 'string' ? new Date(eventData.endTime) : eventData.endTime;
    
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);

    const updatedEventData = {
        ...eventData,
        duration,
        startTime,
        endTime,
    };

    await db.collection('events').doc(eventId).update(updatedEventData);

    revalidateTag('events');
    revalidatePath('/');
    return { success: true, event: { ...eventData, id: eventId, duration } };
  } catch (error) {
    console.error("Error updating event:", error);
    return { success: false, error: "Failed to update event." };
  }
}

export async function deleteEvent(eventId: string) {
  try {
    const db = getDb();
    await db.collection('events').doc(eventId).delete();
    revalidateTag('events');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Error deleting event:", error);
    return { success: false, error: "Failed to delete event." };
  }
}

const goalSchema = z.object({
  name: z.string().min(1, 'Goal name is required'),
  eligibleTags: z.array(z.string()).min(1, 'At least one tag is required'),
  targetAmount: z.number().min(1, 'Target amount must be at least 1 hour'),
  timePeriod: z.enum(['daily', 'weekly', 'monthly']),
  comparison: z.enum(['at-least', 'no-more-than']),
});

export async function addGoal(goalData: Omit<Goal, 'id'>) {
  try {
    const validatedData = goalSchema.parse(goalData);
    const db = getDb();
    const ref = await db.collection('goals').add(validatedData);
    revalidatePath('/api/goals');
    revalidatePath('/');
    return { success: true, goal: { ...validatedData, id: ref.id } };
  } catch (error) {
    console.error("Error adding goal:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(', ') };
    }
    return { success: false, error: "Failed to create goal." };
  }
}

export async function updateGoal(goalId: string, goalData: Omit<Goal, 'id'>) {
  try {
    const validatedData = goalSchema.parse(goalData);
    const db = getDb();
    await db.collection('goals').doc(goalId).update(validatedData);
    revalidatePath('/api/goals');
    revalidatePath('/');
    return { success: true, goal: { ...validatedData, id: goalId } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(', ') };
    }
    console.error("Error updating goal:", error);
    return { success: false, error: "Failed to update goal." };
  }
}

export async function deleteGoal(goalId: string) {
  try {
    const db = getDb();
    await db.collection('goals').doc(goalId).delete();
    revalidatePath('/api/goals');
    revalidatePath('/');
    return { success: true };
  } catch (error)
{
    console.error("Error deleting goal:", error);
    return { success: false, error: "Failed to delete goal." };
  }
}

export async function parseEventWithAI(input: string, availableTagNames: string[], timezone: string) {
  if (!input) {
    return { success: false, error: 'Input cannot be empty.' };
  }
  
  if (!parseNaturalLanguageInputPrompt) {
    return { success: false, error: 'AI prompt not found.' };
  }

  try {
    const now = new Date();
    // Format 'now' into a string that includes the user's timezone.
    const nowInUserTz = new Intl.DateTimeFormat('en-US', {
      dateStyle: 'full',
      timeStyle: 'long',
      timeZone: timezone,
    }).format(now);
    
    const promptInput = { 
      text: input, 
      now: nowInUserTz, // Pass the formatted string
      availableTags: availableTagNames,
      timezone,
    };

    // Get the rendered prompt to show the user
    const renderedPrompt = await parseNaturalLanguageInputPrompt.render(promptInput);
    
    // Extract the full text from all message parts
    const promptText = renderedPrompt.messages
      .map(m => m.content.map(p => p.text || '').join(''))
      .join('\n\n');

    // Run the actual flow
    const result = await parseNaturalLanguageInput(promptInput);

    return { 
      success: true, 
      data: result,
      debug: {
        prompt: promptText,
        response: result,
      }
    };
  } catch (error) {
    console.error('AI parsing error:', error);
    return { success: false, error: 'Failed to parse input with AI. Please try again.' };
  }
}

const tagSchema = z.object({
  name: z.string().min(1, 'Tag name is required.'),
  color: z.string().regex(/^#[0-9a-f]{6}$/i, 'Must be a valid hex color code.'),
});

export async function addTag(tagData: Omit<Tag, 'id'>) {
  console.log('\n--- addTag ACTION TRIGGERED ---');
  try {
    console.log('STEP 1: Validating tag data with Zod...');
    const validatedData = tagSchema.parse(tagData);
    console.log('STEP 1 SUCCESS: Data validated:', validatedData);

    console.log('STEP 2: Getting Firestore DB instance...');
    const db = getDb();
    console.log('STEP 2 SUCCESS: Firestore DB instance obtained.');

    console.log('STEP 3: Adding document to "tags" collection...');
    const ref = await db.collection('tags').add(validatedData);
    console.log('STEP 3 SUCCESS: Document added with ID:', ref.id);

    const newTag = { ...validatedData, id: ref.id };
    
    console.log('STEP 4: Revalidating paths...');
    revalidatePath('/api/tags');
    revalidatePath('/');
    console.log('STEP 4 SUCCESS: Paths revalidated.');

    console.log('--- addTag ACTION SUCCEEDED ---');
    return { success: true, tag: newTag };

  } catch (error) {
    console.error('--- addTag ACTION FAILED ---');
    if (error instanceof z.ZodError) {
      console.error('Zod validation error:', error.errors);
      return { success: false, error: error.errors.map(e => e.message).join(', ') };
    }
    console.error('Unhandled error in addTag:', error);
    console.error('Full error object:', JSON.stringify(error, null, 2));
    return { success: false, error: "Failed to create tag. See server logs for details." };
  }
}


export async function updateTag(tagId: string, tagData: Omit<Tag, 'id'>) {
  try {
    const db = getDb();
    const validatedData = tagSchema.parse(tagData);
    await db.collection('tags').doc(tagId).update(validatedData);
    revalidatePath('/api/tags');
    revalidatePath('/');
    return { success: true, tag: { ...validatedData, id: tagId } };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(', ') };
    }
    console.error("updateTag: Error updating tag:", error);
    return { success: false, error: "Failed to update tag." };
  }
}

export async function deleteTag(tagId: string) {
  try {
    const db = getDb();
    await db.collection('tags').doc(tagId).delete();
    revalidatePath('/api/tags');
revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Error deleting tag:", error);
    return { success: false, error: "Failed to delete tag." };
  }
}

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  isCompleted: z.boolean().default(false),
  deadline: z.union([z.string(), z.date()]).optional().transform(val => {
    if (!val) return undefined;
    return typeof val === 'string' ? new Date(val) : val;
  }),
  createdAt: z.union([z.string(), z.date()]).transform(val => typeof val === 'string' ? new Date(val) : val),
  tags: z.array(z.string()).optional(),
});

export async function addTask(taskData: Omit<Task, 'id'>) {
  try {
    const validatedData = taskSchema.parse(taskData);
    const db = getDb();
    
    // Ensure dates are Firestore compatible
    const finalData = {
        ...validatedData,
        deadline: validatedData.deadline || null, // Firestore doesn't like undefined
        createdAt: validatedData.createdAt || new Date(),
    };

    const ref = await db.collection('tasks').add(finalData);
    
    revalidateTag('tasks');
    revalidatePath('/');
    return { success: true, task: { ...finalData, id: ref.id } };
  } catch (error) {
    console.error("Error adding task:", error);
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(', ') };
    }
    return { success: false, error: "Failed to create task." };
  }
}

export async function updateTask(taskId: string, taskData: Partial<Task>) {
  try {
    const db = getDb();
    
    // We partial parse because we might only be updating status
    const validatedData = taskSchema.partial().parse(taskData);
    
    // Ensure dates are Firestore compatible
    const finalData = {
        ...validatedData,
    };
    if (finalData.deadline === undefined) delete finalData.deadline;

    await db.collection('tasks').doc(taskId).update(finalData);

    revalidateTag('tasks');
    revalidatePath('/');
    return { success: true, task: { ...taskData, id: taskId } };
  } catch (error) {
    console.error("Error updating task:", error);
     if (error instanceof z.ZodError) {
      return { success: false, error: error.errors.map(e => e.message).join(', ') };
    }
    return { success: false, error: "Failed to update task." };
  }
}

export async function deleteTask(taskId: string) {
  try {
    const db = getDb();
    await db.collection('tasks').doc(taskId).delete();
    revalidateTag('tasks');
    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error("Error deleting task:", error);
    return { success: false, error: "Failed to delete task." };
  }
}
