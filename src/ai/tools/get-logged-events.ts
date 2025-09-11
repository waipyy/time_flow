
import { z } from 'zod';
import { ai } from '@/ai/genkit';
import { getDb } from '@/lib/firebase-admin';

export const getLoggedEventsTool = ai.defineTool(
  {
    name: 'get_logged_events',
    description: 'Retrieves a list of previously logged events within a specified time range.',
    inputSchema: z.object({
      startTime: z.string().describe('The start of the time range in ISO 8601 format.'),
      endTime: z.string().describe('The end of the time range in ISO 8601 format.'),
    }),
    outputSchema: z.object({
      events: z.array(
        z.object({
          title: z.string(),
          startTime: z.string(),
          endTime: z.string(),
        })
      ),
    }),
  },
  async ({ startTime, endTime }) => {
    console.log(`[AI Tool] Running get_logged_events for range: ${startTime} to ${endTime}`);
    try {
      const db = getDb();
      const eventsRef = db.collection('events');
      const snapshot = await eventsRef
        .where('startTime', '>=', new Date(startTime))
        .where('startTime', '<=', new Date(endTime))
        .orderBy('startTime')
        .get();

      if (snapshot.empty) {
        console.log('[AI Tool] No events found in the specified range.');
        return { events: [] };
      }

      const events = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          title: data.title,
          // Convert Firestore Timestamps to ISO strings
          startTime: data.startTime.toDate().toISOString(),
          endTime: data.endTime.toDate().toISOString(),
        };
      });

      console.log(`[AI Tool] Found ${events.length} events.`);
      return { events };
    } catch (error) {
      console.error('[AI Tool] Error fetching events:', error);
      // It's often better to return an empty list or a specific error message
      // that the AI can understand, rather than throwing an exception.
      return { events: [] };
    }
  }
);
