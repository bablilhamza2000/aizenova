import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      topic,
      platform = "Instagram",
      tone = "Engaging",
      language = "English",
      hashtags = true,
    } = body;

    if (
      !topic ||
      typeof topic !== "string"
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Please describe what you want to post about.",
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
          error:
            "Please describe what you want to post about.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (topic.length > 3000) {
      return new Response(
        JSON.stringify({
          error:
            "Topic is too long. Maximum 3000 characters.",
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

    const hashtagInstruction = hashtags
      ? "Include a small number of relevant hashtags at the end."
      : "Do not include hashtags.";

    const prompt = `
You are an expert social media content writer.

Create ONE engaging social media post based on the user's topic.

Topic:
${topic}

Platform:
${platform}

Tone:
${tone}

Language:
${language}

${hashtagInstruction}

Requirements:

- Write entirely in ${language}.
- Adapt the writing style to ${platform}.
- Make the post natural and engaging.
- Follow the requested tone.
- Keep it appropriate for the selected platform.
- Clearly communicate the main idea.
- Do not invent facts, statistics, names, or claims.
- Do not mention that you are an AI.
- Do not provide explanations before or after the post.
- Return only the final social media post.
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

    const data =
      await response.json();

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
        "No social media post returned:",
        data
      );

      return new Response(
        JSON.stringify({
          error:
            "The AI did not return a social media post.",
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
      "Social media generator error:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          "Something went wrong while generating the social media post.",
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