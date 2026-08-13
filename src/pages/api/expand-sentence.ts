import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      text,
      tone = "Natural",
      language = "English",
      length = "Medium",
      purpose = "General Writing",
      preserve = true,
    } = body;

    if (
      !text ||
      typeof text !== "string" ||
      text.trim().length === 0
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Please enter a sentence or short paragraph.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (text.length > 3000) {
      return new Response(
        JSON.stringify({
          error:
            "Text is too long. Maximum 3000 characters.",
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
      case "Light":
        lengthInstruction =
          "Expand it moderately, adding only a few useful details.";
        break;

      case "Detailed":
        lengthInstruction =
          "Expand it substantially with relevant context, explanations, and descriptive details.";
        break;

      case "Medium":
      default:
        lengthInstruction =
          "Expand it with a balanced amount of useful detail without becoming unnecessarily long.";
        break;
    }

    const meaningInstruction = preserve
      ? "Preserve the original meaning, intent, and factual information exactly."
      : "Keep the original idea as the foundation, while allowing reasonable improvements to clarity and detail.";

    const prompt = `
You are an expert writer and editor.

Expand the following sentence or short paragraph into clearer and more detailed writing.

Original text:
${text}

Tone:
${tone}

Language:
${language}

Writing purpose:
${purpose}

Expansion level:
${length}

${lengthInstruction}

${meaningInstruction}

Requirements:

- Write entirely in ${language}.
- Improve clarity and readability.
- Add relevant context and useful detail.
- Keep the writing natural.
- Match the requested tone.
- Do not add unrelated information.
- Do not invent facts, statistics, names, examples, or claims that are not supported by the original text.
- Do not unnecessarily repeat the same idea.
- Keep the original intent.
- Do not mention that you are an AI.
- Do not explain the changes.
- Return only the expanded text.
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
            "The AI did not return expanded text.",
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
      "Sentence expander error:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          "Something went wrong while expanding the sentence.",
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