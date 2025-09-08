'use server';

/**
 * @fileOverview An AI agent for extracting event details from natural language input.
 * 
 * - extractEventDetails - A function that handles the event details extraction process.
 * - ExtractEventDetailsInput - The input type for the extractEventDetails function.
 * - ExtractEventDetailsOutput - The return type for the extractEventDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ExtractEventDetailsInputSchema = z.object({
  naturalLanguageInput: z
    .string()
    .describe('The natural language input describing the event.'),
});
export type ExtractEventDetailsInput = z.infer<typeof ExtractEventDetailsInputSchema>;

const ExtractEventDetailsOutputSchema = z.object({
  title: z.string().describe('The title of the event.'),
  tags: z.array(z.string()).describe('Suggested tags for the event.'),
  startTime: z.string().describe('The start time of the event (ISO format).'),
  endTime: z.string().describe('The end time of the event (ISO format).'),
  duration: z.number().describe('The duration of the event in minutes.'),
});
export type ExtractEventDetailsOutput = z.infer<typeof ExtractEventDetailsOutputSchema>;

export async function extractEventDetails(
  input: ExtractEventDetailsInput
): Promise<ExtractEventDetailsOutput> {
  return extractEventDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'extractEventDetailsPrompt',
  input: {schema: ExtractEventDetailsInputSchema},
  output: {schema: ExtractEventDetailsOutputSchema},
  prompt: `You are a helpful assistant designed to extract event details from natural language input.

  Given the following input, please extract the event title, tags, start time, end time, and duration.

  Input: {{{naturalLanguageInput}}}

  Make sure the start time and end time are in ISO format.
  The duration must be in minutes.

  Example Output:
  {
    "title": "Meeting with John",
    "tags": ["meeting", "John"],
    "startTime": "2024-01-01T10:00:00.000Z",
    "endTime": "2024-01-01T11:00:00.000Z",
    "duration": 60
  }
  `,
});

const extractEventDetailsFlow = ai.defineFlow(
  {
    name: 'extractEventDetailsFlow',
    inputSchema: ExtractEventDetailsInputSchema,
    outputSchema: ExtractEventDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
