import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      text,
      style = "Professional",
      language = "English",
    } = body;

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({
          error: "Please enter some text to rewrite.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (text.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: "Please enter some text to rewrite.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (text.length > 5000) {
      return new Response(
        JSON.stringify({
          error:
            "Text is too long. Maximum 5000 characters.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const apiKey =
      import.meta.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error(
        "GEMINI_API_KEY is missing."
      );

      return new Response(
        JSON.stringify({
          error:
            "GEMINI_API_KEY is not configured.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const prompt = `
You are an expert editor and content rewriting assistant.

Rewrite the following text while preserving its original meaning.

Original text:
${text}

Writing style:
${style}

Language:
${language}

Requirements:

- Write entirely in ${language}.
- Preserve the original meaning and important information.
- Improve clarity, grammar, flow, and readability.
- Follow the requested writing style.
- Do not add unsupported facts.
- Do not remove important information.
- Do not change names, numbers, dates, or facts from the original text.
- Do not mention that you are an AI.
- Return only the rewritten text.
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
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
      console.error(
        "Gemini API error:",
        data
      );

      return new Response(
        JSON.stringify({
          error:
            data?.error?.message ||
            "Gemini API request failed.",
        }),
        {
          status: response.status,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const generatedText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.error(
        "No rewritten text returned:",
        data
      );

      return new Response(
        JSON.stringify({
          error:
            "The AI did not return rewritten text.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
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
          "Content-Type": "application/json",
        },
      }
    );

  } catch (error) {
    console.error(
      "Rewrite text error:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          "Something went wrong while rewriting the text.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
};