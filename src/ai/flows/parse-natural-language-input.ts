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

const EventSchema = z.object({
  title: z.string().describe('A short, present-tense title for the event (e.g., "Work on resume").'),
  startTime: z.string().describe('The start time of the event in ISO format.'),
  endTime: z.string().describe('The end time of the event in ISO format.'),
  tags: z.array(z.string()).describe('Suggested tags for the event, chosen ONLY from the provided available tags.'),
  duration: z.number().describe('The duration of the event in minutes.'),
});

const ParseNaturalLanguageInputOutputSchema = z.object({
  events: z.array(EventSchema),
});
export type ParseNaturalLanguageInputOutput = z.infer<typeof ParseNaturalLanguageInputOutputSchema>;

export async function parseNaturalLanguageInput(input: ParseNaturalLanguageInputInput): Promise<ParseNaturalLanguageInputOutput> {
  return parseNaturalLanguageInputFlow(input);
}

export const parseNaturalLanguageInputPrompt = ai.definePrompt({
  name: 'parseNaturalLanguageInputPrompt',
  input: {schema: ParseNaturalLanguageInputInputSchema},
  output: {schema: ParseNaturalLanguageInputOutputSchema},
  prompt: `You are a time tracking assistant. Your job is to parse user input to extract one or more events by strictly following the rules provided.

The current time is {{{now}}}.
The user is in the {{{timezone}}} timezone.

**COMMON SENSE TIME RULE: APPLY THIS LOGIC FIRST**
- When a user gives an ambiguous time range that crosses a day boundary (e.g., "from 11 to 9 last night"), you MUST apply common sense.
- For an activity like "sleep", "from 11 to 9" means from 11 PM on one day to 9 AM on the next day. It does NOT mean from 11 AM to 9 AM (22 hours).
- If the start time is a larger number than the end time (e.g., 11 vs 9), assume it crosses midnight. The start time should be interpreted as PM and the end time as AM of the following day.
- Always choose the most recent, logical time period. "last night" means the night that just passed.

**CRITICAL ALGORITHM: FOLLOW THESE STEPS AFTER APPLYING THE COMMON SENSE RULE.**

**Step 1: Identify the Events and their Chronological Order**
- Find all distinct activities mentioned in the input (e.g., "Build AI project", "Eat").
- Determine the sequence in which they occurred. Keywords like "before that" mean the event mentioned first happened *after* the event mentioned second.

**Step 2: Anchor the Timeline (IF NO EXPLICIT TIMES ARE GIVEN)**
- This step only applies if the user gives durations without explicit start/end times (e.g., "worked for 1 hour").
- Find the **most recent event** in the sequence.
- The \`endTime\` of this most recent event is **EXACTLY** the current time: \`{{{now}}}\`.
- **CRITICAL**: When someone says "I just did X for Y minutes", they mean they **finished** doing X at the current time.
- **CRITICAL**: DO NOT use the current time as the \`startTime\` of any event. The current time is always an \`endTime\`.

**Step 3: Chain Events Backward from the Anchor (IF NO EXPLICIT TIMES ARE GIVEN)**
- Calculate the \`startTime\` of the most recent event by subtracting its duration from its \`endTime\`.
- For each preceding event in the sequence:
  - Its \`endTime\` becomes the \`startTime\` of the event that follows it chronologically.
  - Calculate its \`startTime\` by subtracting its duration from its \`endTime\`.

**Example Walkthrough (Duration-based):**
- **Input**: "I built an AI project for 1 hour, before that I ate for 20 mins"
- **Current Time**: 20:09:49 (8:09:49 PM)
- **Execution**:
  1. **Events**: "Build AI project" (60 mins), "Eat" (20 mins).
  2. **Order**: "Build AI project" is the most recent.
  3. **Anchor**: The \`endTime\` for "Build AI project" is **20:09:49**.
  4. **Chain**:
      - The \`startTime\` for "Build AI project" is **19:09:49** (20:09:49 - 60 mins).
      - The \`endTime\` for "Eat" is **19:09:49** (the startTime of "Build AI project").
      - The \`startTime\` for "Eat" is **18:49:49** (19:09:49 - 20 mins).

**Available Tags**: You MUST only use tags from this list.
{{#each availableTags}}
- {{{this}}}
{{/each}}

Input: {{{text}}}

**Output format**:
{
  "events": [
    {
      "title": "...",
      "startTime": "...",
      "endTime": "...",
      "tags": ["..."],
      "duration": ...
    }
  ]
}

Ensure the final events array is ordered chronologically by \`startTime\`.
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
    // Sort events by start time to ensure chronological order
    if (output && output.events) {
      output.events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }
    return output!;
  }
);
