import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const topic = body?.topic;
    const language = body?.language || 'English';
    const tone = body?.tone || 'Professional';
    const number = body?.number || '10';

    if (!topic || typeof topic !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Please provide a valid topic.',
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

    const fullPrompt = `
You are the AI Idea Generator for AIZENOVA.

Generate exactly ${number} creative, useful, and original ideas based on the user's topic.

Topic:
${topic}

Language:
${language}

Tone:
${tone}

Requirements:

- Write entirely in ${language}.
- Generate exactly ${number} ideas.
- Make every idea different and useful.
- Avoid generic or repetitive ideas.
- Make the ideas practical and specific.
- Number every idea clearly.
- Give each idea a short title.
- Add a brief explanation for each idea.
- Match the requested tone.
- Do not mention that you are an AI.
- Do not add unnecessary introductions.
- Do not generate fewer or more than ${number} ideas.

Format:

1. Idea Title
Short explanation.

2. Idea Title
Short explanation.

Continue until exactly ${number} ideas are provided.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: fullPrompt,
    });

    const text = response.text || '';

    if (!text.trim()) {
      throw new Error(
        'Gemini returned an empty response.'
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        text,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('GEMINI IDEAS ERROR:', error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate ideas.',
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