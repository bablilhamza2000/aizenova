import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const prompt = body?.prompt;
    const style = body?.style || 'realistic';
    const aspectRatio = body?.aspectRatio || '1:1';

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Please provide a valid image prompt.',
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

    const finalPrompt = `
Create an image based on the following request.

User request:
${prompt}

Visual style:
${style}

Aspect ratio:
${aspectRatio}

Create a high-quality, visually appealing image.
Follow the user's description closely.
Do not add unnecessary text or watermarks.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image',
      contents: finalPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    let imageBase64 = '';

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData?.data) {
        imageBase64 = part.inlineData.data;
        break;
      }
    }

    if (!imageBase64) {
      throw new Error(
        'The image model did not return an image.'
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        image: `data:image/png;base64,${imageBase64}`,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

  } catch (error) {
    console.error('IMAGE GENERATION ERROR:', error);

    return new Response(
      JSON.stringify({
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate image.',
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