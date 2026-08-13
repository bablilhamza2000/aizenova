import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const text = body?.text;
    const language = body?.language || 'English';
    const length = body?.length || 'Medium';

    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Please provide valid text to summarize.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const apiKey = import.meta.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'GEMINI_API_KEY is missing.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
    });

    const lengthInstructions: Record<string, string> = {
      Short:
        'Create a very concise summary containing only the most important points.',
      Medium:
        'Create a balanced summary that covers the main ideas and important supporting details.',
      Detailed:
        'Create a detailed summary that preserves the important ideas, facts, explanations, and relevant details while remaining much shorter than the original text.',
    };

    const lengthInstruction =
      lengthInstructions[length] ||
      lengthInstructions.Medium;

    const prompt = `
You are the AI Summarizer for AIZENOVA.

Your task is to summarize the user's text accurately and clearly.

Requested language:
${language}

Requested summary length:
${length}

Length instructions:
${lengthInstruction}

Original text:
"""
${text}
"""

Requirements:

- Write entirely in ${language}.
- Preserve the original meaning.
- Include the most important ideas, facts, arguments, and conclusions.
- Do not invent information.
- Do not add facts that are not present in the original text.
- Do not change the meaning of the original text.
- Remove unnecessary repetition and filler.
- Use clear and natural language.
- Structure the summary with short paragraphs or bullet points when appropriate.
- Do not mention that you are an AI.
- Do not introduce the summary with unnecessary phrases.
- Return only the summary.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const result = response.text || '';

    if (!result.trim()) {
      throw new Error(
        'Gemini returned an empty summary.'
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        text: result.trim(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('GEMINI SUMMARIZER ERROR:', error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to summarize text.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
};