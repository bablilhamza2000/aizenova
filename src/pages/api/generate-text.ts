import type { APIRoute } from 'astro';
import { GoogleGenAI } from '@google/genai';

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  try {
    const apiKey = import.meta.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: 'GEMINI_API_KEY is not configured.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const body = await request.json();

    const prompt = String(body?.prompt || '').trim();
    const type = String(body?.type || 'blog');
    const language = String(body?.language || 'English');
    const tone = String(body?.tone || 'Professional');
    const length = String(body?.length || 'Medium');

    if (!prompt) {
      return new Response(
        JSON.stringify({
          error: 'Please enter a prompt.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (prompt.length > 5000) {
      return new Response(
        JSON.stringify({
          error: 'Prompt is too long. Maximum 5000 characters.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const typeInstructions: Record<string, string> = {
      blog:
        'Write a well-structured blog article with a clear introduction, useful sections, and a concise conclusion.',

      idea:
        'Generate a useful list of original content ideas. Make every idea specific and practical.',

      social:
        'Write an engaging social media post suitable for a professional audience.',

      email:
        'Write a clear and professional email with an appropriate structure.',

      description:
        'Write a compelling product description that clearly explains benefits, features, and value.',

      summary:
        'Create a concise and accurate summary that preserves the most important information.',
    };

    const instruction =
      typeInstructions[type] || typeInstructions.blog;

    const lengthInstructions: Record<string, string> = {
      Short:
        'Keep the response concise, around 150-300 words when appropriate.',

      Medium:
        'Provide a balanced response, around 400-700 words when appropriate.',

      Long:
        'Provide a detailed and comprehensive response, around 800-1200 words when appropriate.',
    };

    const lengthInstruction =
      lengthInstructions[length] || lengthInstructions.Medium;

    const systemPrompt = `
You are AIZENOVA AI Text Generator.

Create high-quality original content.

Content type:
${type}

Language:
${language}

Tone:
${tone}

Length:
${length}

Instructions:
${instruction}

${lengthInstruction}

User request:
${prompt}

Important:
- Write entirely in ${language}.
- Follow the requested tone.
- Do not mention that you are an AI unless the user explicitly asks.
- Do not include unnecessary meta commentary.
- Do not fabricate specific facts when factual accuracy matters.
- Make the response useful, natural, readable, and well structured.
`.trim();

    const ai = new GoogleGenAI({
      apiKey,
    });

    const response = await ai.interactions.create({
      model: 'gemini-3-flash-preview',
      input: systemPrompt,
    });

    const text = response.output_text?.trim() || '';

    if (!text) {
      throw new Error('Gemini returned an empty response.');
    }

    return new Response(
      JSON.stringify({
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
    console.error('Gemini API error:', error);

    const message =
      error instanceof Error
        ? error.message
        : 'Unknown server error.';

    return new Response(
      JSON.stringify({
        error: `AI generation failed: ${message}`,
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