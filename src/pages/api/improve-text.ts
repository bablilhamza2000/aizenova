import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      text,
      style = "Natural",
      language = "English",
      level = "Balanced",
      goal = "Overall Quality",
      preserveMeaning = true,
      preserveTone = false,
    } = body;

    if (
      !text ||
      typeof text !== "string" ||
      text.trim().length === 0
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Please enter the text you want to improve.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (text.length > 6000) {
      return new Response(
        JSON.stringify({
          error:
            "Text is too long. Maximum 6000 characters.",
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

    let levelInstruction = "";

    switch (level) {
      case "Light":
        levelInstruction =
          "Make subtle improvements while keeping the original wording and structure whenever possible.";
        break;

      case "Advanced":
        levelInstruction =
          "Make substantial improvements to clarity, flow, vocabulary, sentence structure, and readability while preserving the author's ideas.";
        break;

      case "Balanced":
      default:
        levelInstruction =
          "Make balanced improvements to grammar, clarity, flow, vocabulary, and readability without unnecessarily rewriting the entire text.";
        break;
    }

    const meaningInstruction = preserveMeaning
      ? "Preserve the original meaning and factual information."
      : "Preserve the main ideas but allow reasonable restructuring where it improves the writing.";

    const toneInstruction = preserveTone
      ? "Keep the original tone as much as possible."
      : `Adapt the writing to a ${style} style.`;

    const prompt = `
You are an expert editor and professional content writer.

Improve the following text.

Original text:
${text}

Target language:
${language}

Target writing style:
${style}

Main improvement goal:
${goal}

Improvement level:
${level}

${levelInstruction}

${meaningInstruction}

${toneInstruction}

Requirements:

- Write entirely in ${language}.
- Improve grammar, spelling, punctuation, clarity, flow, and readability where appropriate.
- Make the text sound natural and human.
- Improve awkward or unclear sentences.
- Avoid unnecessary repetition.
- Keep the original ideas and facts.
- Do not invent facts, statistics, names, sources, or claims.
- Do not add unrelated information.
- Do not make the text unnecessarily complicated.
- Do not use excessive buzzwords.
- Do not mention that you are an AI.
- Do not explain what you changed.
- Return only the improved version of the text.
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
            "The AI did not return improved text.",
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
      "Text improver error:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          "Something went wrong while improving the text.",
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