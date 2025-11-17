'use server';

/**
 * @fileOverview Allows users to adjust the creativity level of the AI rephrasing.
 *
 * Exports:
 * - `adjustCreativityLevel`: Function to rephrase content with adjustable creativity.
 * - `AdjustCreativityLevelInput`: Input type for `adjustCreativityLevel`.
 * - `AdjustCreativityLevelOutput`: Output type for `adjustCreativityLevel`.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdjustCreativityLevelInputSchema = z.object({
  text: z.string().describe('The text to be rephrased.'),
  creativityLevel: z
    .number()
    .min(0)
    .max(1)
    .default(0.5)
    .describe('The creativity level for rephrasing (0-1).'),
});
export type AdjustCreativityLevelInput = z.infer<typeof AdjustCreativityLevelInputSchema>;

const AdjustCreativityLevelOutputSchema = z.object({
  rephrasedText: z.string().describe('The rephrased text.'),
});
export type AdjustCreativityLevelOutput = z.infer<typeof AdjustCreativityLevelOutputSchema>;

export async function adjustCreativityLevel(
  input: AdjustCreativityLevelInput
): Promise<AdjustCreativityLevelOutput> {
  return adjustCreativityLevelFlow(input);
}

const adjustCreativityLevelPrompt = ai.definePrompt({
  name: 'adjustCreativityLevelPrompt',
  input: {schema: AdjustCreativityLevelInputSchema},
  output: {schema: AdjustCreativityLevelOutputSchema},
  prompt: `Rephrase the following text with a creativity level of {{creativityLevel}}:

Text: {{{text}}}`,
  config: {
    temperature: 0.7, // overall tone
    safetySettings: [
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_ONLY_HIGH',
      },
    ],
  },
});

const adjustCreativityLevelFlow = ai.defineFlow(
  {
    name: 'adjustCreativityLevelFlow',
    inputSchema: AdjustCreativityLevelInputSchema,
    outputSchema: AdjustCreativityLevelOutputSchema,
  },
  async input => {
    // Dynamically set temperature based on creativity level
    const {output} = await ai.generate({
      prompt: `Rephrase the following text with a creativity level of ${input.creativityLevel}:\n\nText: ${input.text}`,
      model: 'googleai/gemini-2.5-flash',
      config: {
        temperature: input.creativityLevel,
      },
      output: {
        schema: AdjustCreativityLevelOutputSchema,
      },
    });
    return output!;
  }
);
