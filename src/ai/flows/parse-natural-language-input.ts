 'use server';

/**
 * @fileOverview Parses natural language input to extract event details, tags, and time information.
 *
 * - parseNaturalLanguageInput - A function that handles the natural language parsing process.
 * - ParseNaturalLanguageInputInput - The input type for the parseNaturalLanguageInput function.
 * - ParseNaturalLanguageInputOutput - The return type for the parseNaturalLanguageInput function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseNaturalLanguageInputInputSchema = z.object({
  text: z
    .string()
    .describe("A sentence describing the time spent on a task (e.g., 'I worked on my resume from 2pm to 4pm')."),
  now: z.string().describe('The current date and time in the user\'s local timezone.'),
  availableTags: z.array(z.string()).describe('A list of available tags the user has already created.'),
  timezone: z.string().describe("The user's local timezone (e.g., 'America/New_York')."),
});
export type ParseNaturalLanguageInputInput = z.infer<typeof ParseNaturalLanguageInputInputSchema>;

const ParseNaturalLanguageInputOutputSchema = z.object({
  title: z.string().describe('A short, present-tense title for the event (e.g., "Work on resume").'),
  startTime: z.string().describe('The start time of the event in ISO format.'),
  endTime: z.string().describe('The end time of the event in ISO format.'),
  tags: z.array(z.string()).describe('Suggested tags for the event, chosen ONLY from the provided available tags.'),
  duration: z.number().describe('The duration of the event in minutes.'),
});
export type ParseNaturalLanguageInputOutput = z.infer<typeof ParseNaturalLanguageInputOutputSchema>;

export async function parseNaturalLanguageInput(input: ParseNaturalLanguageInputInput): Promise<ParseNaturalLanguageInputOutput> {
  return parseNaturalLanguageInputFlow(input);
}

export const parseNaturalLanguageInputPrompt = ai.definePrompt({
  name: 'parseNaturalLanguageInputPrompt',
  input: {schema: ParseNaturalLanguageInputInputSchema},
  output: {schema: ParseNaturalLanguageInputOutputSchema},
  prompt: `You are a time tracking assistant. Your job is to parse user input to
extract the event title, start/end times, suggested tags, and duration.

The current time is {{{now}}}. Use this as the reference for any relative time expressions.
The user is in the {{{timezone}}} timezone. All times you extract should be interpreted as being in this timezone.

IMPORTANT TITLE RULES:
1. The title should be a short, concise summary of the activity (e.g., "Work out", "Read book", "Project A meeting").
2. The title MUST be in the present tense (e.g., use "Work out" not "Worked out").
3. The title should NOT include personal pronouns ("I"), conversational filler ("today"), or other unnecessary words.

IMPORTANT TIME RULES:
1. If the user provides an explicit start and end time (e.g., "from 2pm to 4pm"), you MUST use those times.
2. If the user provides only a duration (e.g., "for 2 hours"), you should assume the event just finished. The current time (passed in the \`{{{now}}}\` variable) is the END time of the event. Calculate the start time based on the duration.
3. If the user provides a start time and a duration (e.g., "worked for 2 hours starting at 1pm"), calculate the end time from there.

Here is a list of available tags you can use:
{{#each availableTags}}
- {{{this}}}
{{/each}}

You MUST only use tags from the list above. Do not create new tags.

Input: {{{text}}}

Output:{
  "title": "extracted event title",
  "startTime": "extracted start time in ISO format",
  "endTime": "extracted end time in ISO format",
  "tags": ["tag1", "tag2"],
  "duration": extracted duration in minutes
}

Make sure the extracted times are in ISO format.
`,
});

const parseNaturalLanguageInputFlow = ai.defineFlow(
  {
    name: 'parseNaturalLanguageInputFlow',
    inputSchema: ParseNaturalLanguageInputInputSchema,
    outputSchema: ParseNaturalLanguageInputOutputSchema,
  },
  async input => {
    const {output} = await parseNaturalLanguageInputPrompt(input);
    return output!;
  }
);
