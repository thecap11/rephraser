
'use server';

/**
 * @fileOverview AI flow for rephrasing and structuring .docx content.
 *
 * - generateRephrasedDocument - The main function to rephrase and structure a document.
 * - GenerateRephrasedDocumentInput - Input type for the generateRephrasedDocument function.
 * - GenerateRephrasedDocumentOutput - Output type for the generateRephrasedDocument function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateRephrasedDocumentInputSchema = z.object({
  documentText: z
    .string()
    .describe('The text content extracted from the .docx file.'),
  creativityLevel: z
    .number()
    .min(0)
    .max(1)
    .default(0.5)
    .describe('The creativity level for rephrasing (0-1).'),
  humanize: z.boolean().default(false).describe('Whether to use a more natural, human-like tone.'),
});
export type GenerateRephrasedDocumentInput = z.infer<
  typeof GenerateRephrasedDocumentInputSchema
>;

const structuredContentSchema = z.object({
  topic: z.string().describe('The main topic of the journal entry.'),
  experience: z.string().describe("The student's experience. This should be a concise summary of about 2-3 lines."),
  feelings: z.string().describe("The student's feelings about the experience. This should be a concise summary of about 2-3 lines."),
  learning: z.string().describe('What the student learned. This must be a very expanded and detailed academic elaboration, approximately 15-20 lines long. It should provide in-depth analysis and examples. It MUST include paragraphs interspersed with bullet points (using an asterisk "*" for each point) to break down key concepts.'),
  application: z
    .array(z.string())
    .describe('A list of 4-5 brief, real-world applications of what the student learned. Each item should be a single line.'),
  conclusion: z.string().describe('The conclusion of the journal entry. This should be a detailed academic elaboration of about 8-10 lines.'),
});

const GenerateRephrasedDocumentOutputSchema = z.object({
  rephrasedContent: structuredContentSchema,
});
export type GenerateRephrasedDocumentOutput = z.infer<
  typeof GenerateRephrasedDocumentOutputSchema
>;

export async function generateRephrasedDocument(
  input: GenerateRephrasedDocumentInput
): Promise<GenerateRephrasedDocumentOutput> {
  return generateRephrasedDocumentFlow(input);
}

const generateRephrasedDocumentFlow = ai.defineFlow(
  {
    name: 'generateRephrasedDocumentFlow',
    inputSchema: GenerateRephrasedDocumentInputSchema,
    outputSchema: GenerateRephrasedDocumentOutputSchema,
  },
  async input => {

    const tone = input.humanize ? 'natural and conversational' : 'academic';
    const paraphrasingInstruction = input.humanize
      ? 'Paraphrase it to be original, using simpler and more human-like words and sentence formations. Make it sound like a person talking naturally.'
      : 'Paraphrase it to be original, academic in tone, and preserve meaning.';

    const prompt = `Analyze the following journal entry. ${paraphrasingInstruction} Do not introduce or remove technical facts. Do not use bold formatting in your response.

Then, structure the rephrased content into the following JSON sections with specific lengths:
- 'topic': A brief topic summary.
- 'experience': A concise summary of the student's experience (2-3 lines).
- 'feelings': A concise summary of the student's feelings (2-3 lines).
- 'learning': A very expanded and detailed ${tone} elaboration of what the student learned (15-20 lines). Provide in-depth analysis, explanations, and examples. CRITICAL: This section MUST be formatted with paragraphs of text separated by newline characters, and include 2-3 bullet points (each formatted on a new line with a leading asterisk, like "* This is a point") to break down key concepts and make it more readable.
- 'application': An array of 4 to 5 strings, where each string is a brief, real-world application of the concepts in a single line. For each, provide a specific, industry-related use case (e.g., Healthcare, Finance).
- 'conclusion': A detailed ${tone} conclusion for the journal entry (8-10 lines).

If the original text doesn't explicitly mention one of these sections, infer it from the context.

Original Document Content:
${input.documentText}`;

    const {output} = await ai.generate({
      prompt: prompt,
      model: 'googleai/gemini-2.5-flash',
      config: {
        temperature: input.creativityLevel,
      },
      output: {
        schema: GenerateRephrasedDocumentOutputSchema,
      },
    });

    if (!output) {
      throw new Error('The AI model did not return any output.');
    }
    return output;
  }
);
