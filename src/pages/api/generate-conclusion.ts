import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      content,
      tone = "Clear",
      language = "English",
      length = "Medium",
      purpose = "Blog Article",
      cta = true,
    } = body;

    if (
      !content ||
      typeof content !== "string" ||
      content.trim().length === 0
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Please enter the content you want to conclude.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (content.length > 6000) {
      return new Response(
        JSON.stringify({
          error:
            "Content is too long. Maximum 6000 characters.",
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
          "Write approximately 180-280 words.";
        break;

      case "Medium":
      default:
        lengthInstruction =
          "Write approximately 100-180 words.";
        break;
    }

    const ctaInstruction = cta
      ? "End with a natural takeaway, recommendation, or call to action when appropriate."
      : "End naturally without adding a call to action.";

    const prompt = `
You are an expert content writer and editor.

Write ONE strong conclusion based ONLY on the content provided below.

Content:
${content}

Content type:
${purpose}

Tone:
${tone}

Language:
${language}

${lengthInstruction}

${ctaInstruction}

Requirements:

- Write entirely in ${language}.
- Summarize the most important ideas without simply repeating the entire content.
- Provide a clear sense of closure.
- Reinforce the central message or main takeaway.
- Match the requested tone and content type.
- Keep the conclusion natural and useful.
- Do not introduce unrelated ideas.
- Do not invent facts or statistics.
- Do not make unsupported claims.
- Avoid phrases such as "In conclusion" unless they genuinely improve the writing.
- Do not mention that you are an AI.
- Do not explain your writing process.
- Return only the finished conclusion.
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
            "The AI did not return a conclusion.",
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
      "Conclusion generator error:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          "Something went wrong while generating the conclusion.",
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