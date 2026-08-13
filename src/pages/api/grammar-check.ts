import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      text,
      language = "English",
    } = body;

    if (!text || typeof text !== "string") {
      return new Response(
        JSON.stringify({
          error: "Please enter some text.",
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
          error: "Please enter some text.",
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
          error: "Text is too long. Maximum 5000 characters.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const apiKey = import.meta.env.GEMINI_API_KEY;

    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error: "GEMINI_API_KEY is missing.",
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
You are an expert grammar and writing editor.

Correct the following text written in ${language}.

Fix:
- Grammar
- Spelling
- Punctuation
- Sentence structure
- Awkward wording
- Clarity when necessary

Rules:
- Keep the original meaning.
- Do not add new information.
- Do not remove important information.
- Keep the same language: ${language}.
- Keep the original tone as much as possible.
- Return ONLY the corrected text.
- Do not explain the corrections.
- Do not mention AI.

Text:

${text}
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
      console.error("Gemini API error:", data);

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
      console.error("No generated text:", data);

      return new Response(
        JSON.stringify({
          error: "The AI did not return corrected text.",
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
    console.error("Grammar checker error:", error);

    return new Response(
      JSON.stringify({
        error:
          "Something went wrong while checking the text.",
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