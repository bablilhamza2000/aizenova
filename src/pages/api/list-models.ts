import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
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

    const models = [];

    for await (const model of await ai.models.list()) {
      models.push({
        name: model.name,
        displayName: model.displayName,
        supportedActions: model.supportedActions,
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        models,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('LIST MODELS ERROR:', error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : String(error),
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