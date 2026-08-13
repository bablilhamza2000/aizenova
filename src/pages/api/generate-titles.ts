import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      topic,
      language = "English",
      tone = "Catchy",
      count = 10,
    } = body;

    if (!topic || typeof topic !== "string") {
      return new Response(
        JSON.stringify({
          error: "Please enter a topic or keyword.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (topic.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: "Please enter a topic or keyword.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (topic.length > 2000) {
      return new Response(
        JSON.stringify({
          error: "Topic is too long. Maximum 2000 characters.",
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

    const safeCount = Math.min(
      Math.max(Number(count) || 10, 1),
      20
    );

    const prompt = `
You are an expert content strategist and headline writer.

Generate exactly ${safeCount} engaging titles based on this topic:

${topic}

Requirements:

- Language: ${language}
- Tone: ${tone}
- Make every title unique.
- Make the titles natural and appealing.
- Avoid clickbait that is misleading.
- Keep the titles relevant to the topic.
- Use strong wording when appropriate.
- Do not add explanations.
- Do not number the titles.
- Return ONLY the titles.
- Put each title on its own line.
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
          error: "The AI did not return any titles.",
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
    console.error("Title generator error:", error);

    return new Response(
      JSON.stringify({
        error: "Something went wrong while generating titles.",
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