import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      topic,
      platform = "Instagram",
      language = "English",
      count = 15,
    } = body;


    if (!topic || typeof topic !== "string") {
      return new Response(
        JSON.stringify({
          error:
            "Please enter your topic or content.",
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
            "Please enter your topic or content.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }


    if (topic.length > 5000) {
      return new Response(
        JSON.stringify({
          error:
            "Content is too long. Maximum 5000 characters.",
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


    const safeCount = Math.min(
      Math.max(Number(count) || 15, 1),
      30
    );


    const prompt = `
You are an expert social media strategist.

Generate exactly ${safeCount} relevant hashtags based on the following content:

${topic}

Platform:
${platform}

Language:
${language}

Requirements:

- Generate exactly ${safeCount} hashtags.
- Every hashtag must be relevant to the content.
- Adapt the hashtags to ${platform}.
- Mix broad, medium, and niche hashtags when appropriate.
- Avoid irrelevant or spammy hashtags.
- Do not repeat hashtags.
- Every hashtag must start with #.
- Do not add numbering.
- Do not add explanations.
- Return ONLY the hashtags.
- Put each hashtag on a separate line.
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
        "No generated text returned:",
        data
      );

      return new Response(
        JSON.stringify({
          error:
            "The AI did not return any hashtags.",
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
      "Generate hashtags error:",
      error
    );


    return new Response(
      JSON.stringify({
        error:
          "Something went wrong while generating hashtags.",
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