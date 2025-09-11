
import { z } from 'zod';

export const ParseNaturalLanguageInputInputSchema = z.object({
  text: z.string().describe("A sentence describing the time spent on a task (e.g., 'I worked on my resume from 2pm to 4pm')."),
  now: z.string().describe("The current date and time in the user's local timezone."),
  availableTags: z.array(z.string()).describe('A list of available tags the user has already created.'),
  timezone: z.string().describe("The user's local timezone (e.g., 'America/New_York')."),
});
export type ParseNaturalLanguageInputInput = z.infer<typeof ParseNaturalLanguageInputInputSchema>;

export const ParseNaturalLanguageInputOutputSchema = z.object({
  title: z.string().describe('A short, present-tense title for the event (e.g., "Work on resume").'),
  startTime: z.string().describe('The start time of the event in ISO format.'),
  endTime: z.string().describe('The end time of the event in ISO format.'),
  tags: z.array(z.string()).describe('Suggested tags for the event, chosen ONLY from the provided available tags.'),
  duration: z.number().describe('The duration of the event in minutes.'),
});
export type ParseNaturalLanguageInputOutput = z.infer<typeof ParseNaturalLanguageInputOutputSchema>;
