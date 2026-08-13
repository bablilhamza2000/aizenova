import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      topic,
      tone = "Engaging",
      language = "English",
      length = "Medium",
      audience = "",
      hook = true,
    } = body;

    if (
      !topic ||
      typeof topic !== "string" ||
      topic.trim().length === 0
    ) {
      return new Response(
        JSON.stringify({
          error: "Please enter your blog topic.",
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
            "Blog topic is too long. Maximum 3000 characters.",
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

    let lengthInstruction = "";

    switch (length) {
      case "Short":
        lengthInstruction =
          "Write approximately 60-100 words.";
        break;

      case "Long":
        lengthInstruction =
          "Write approximately 180-250 words.";
        break;

      case "Medium":
      default:
        lengthInstruction =
          "Write approximately 100-170 words.";
        break;
    }

    const hookInstruction = hook
      ? "Start with a strong and relevant hook that captures the reader's attention."
      : "Start naturally without using an exaggerated hook.";

    const audienceInstruction = audience.trim()
      ? `Target audience: ${audience.trim()}`
      : "No specific target audience was provided.";

    const prompt = `
You are an expert blog writer and content strategist.

Write ONE engaging introduction for a blog article.

Blog topic:
${topic}

Tone:
${tone}

Language:
${language}

${audienceInstruction}

${hookInstruction}

Length:
${length}

${lengthInstruction}

Requirements:

- Write entirely in ${language}.
- Clearly introduce the topic.
- Make the reader understand why the topic matters.
- Keep the introduction natural and useful.
- Match the requested tone.
- Avoid generic filler.
- Do not repeat the title unnecessarily.
- Do not invent facts or statistics.
- Do not make unsupported claims.
- Do not mention that you are an AI.
- Do not explain your writing process.
- Return only the finished blog introduction.
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
      return new Response(
        JSON.stringify({
          error:
            "The AI did not return a blog introduction.",
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
      "Blog intro generator error:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          "Something went wrong while generating the blog introduction.",
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