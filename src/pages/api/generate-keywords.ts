import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      topic,
      language = 'English',
      keywordType = 'All',
    } = body;

    if (!topic || typeof topic !== 'string') {
      return new Response(
        JSON.stringify({
          error: 'Please enter a topic.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const trimmedTopic = topic.trim();

    if (trimmedTopic.length === 0) {
      return new Response(
        JSON.stringify({
          error: 'Please enter a topic.',
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    if (trimmedTopic.length > 2000) {
      return new Response(
        JSON.stringify({
          error:
            'Topic is too long. Maximum 2000 characters.',
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
      console.error('GEMINI_API_KEY is missing.');

      return new Response(
        JSON.stringify({
          error:
            'GEMINI_API_KEY is not configured.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    let keywordInstruction = '';

    switch (keywordType) {
      case 'Primary':
        keywordInstruction =
          'Focus mainly on primary keywords that directly describe the topic.';
        break;

      case 'Long-tail':
        keywordInstruction =
          'Focus mainly on specific long-tail keyword phrases.';
        break;

      case 'Related':
        keywordInstruction =
          'Focus mainly on semantically related keywords and supporting terms.';
        break;

      case 'Questions':
        keywordInstruction =
          'Focus mainly on question-based keywords users may search for.';
        break;

      case 'All':
      default:
        keywordInstruction =
          'Provide a balanced mix of primary, related, long-tail, and question keywords.';
        break;
    }

    const prompt = `
You are an SEO keyword research assistant.

Generate useful keyword ideas for the following topic:

Topic:
${trimmedTopic}

Language:
${language}

Keyword type:
${keywordType}

Instructions:

- Write the keywords in ${language}.
- ${keywordInstruction}
- Prioritize relevant search phrases.
- Include natural variations of the main topic.
- Avoid irrelevant or overly broad keywords.
- Do not invent fake search-volume numbers.
- Do not claim that a keyword has a specific search volume or ranking difficulty unless actual data is provided.
- Group the results clearly.
- Include a Primary Keyword section.
- Include Related Keywords when relevant.
- Include Long-tail Keywords when relevant.
- Include Question Keywords when relevant.
- Keep the output useful for an SEO content writer.
- Return only the keyword research results.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API error:', data);

      return new Response(
        JSON.stringify({
          error:
            data?.error?.message ||
            'Gemini API request failed.',
        }),
        {
          status: response.status,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const generatedText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.error(
        'No keyword results returned:',
        data
      );

      return new Response(
        JSON.stringify({
          error:
            'The AI did not return any keywords.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
    }

    return new Response(
      JSON.stringify({
        text: generatedText.trim(),
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error(
      'Keyword generator error:',
      error
    );

    return new Response(
      JSON.stringify({
        error:
          'Something went wrong while generating keywords.',
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