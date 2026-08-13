import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      text,
      sourceLanguage = "Auto",
      targetLanguage = "English",
    } = body;

    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: "Please enter some text to translate.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (text.length > 10000) {
      return new Response(
        JSON.stringify({
          error: "The text is too long. Maximum 10,000 characters.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (sourceLanguage === targetLanguage) {
      return new Response(
        JSON.stringify({
          error: "Source and target languages must be different.",
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

    const instructions = `
You are a professional translation assistant.

Translate the user's text from ${sourceLanguage} to ${targetLanguage}.

Rules:
- Preserve the exact meaning of the original text.
- Do not add information.
- Do not remove important information.
- Keep names, numbers, dates, URLs, and technical terms accurate.
- Make the translation natural for a native speaker.
- Preserve paragraphs and general formatting when possible.
- Do not explain the translation.
- Do not mention that you are an AI.
- Return ONLY the translated text.
`;

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/interactions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          model: "gemini-3.6-flash",
          input: `${instructions}

TEXT TO TRANSLATE:

${text}`,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini translation error:", data);

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

    let translatedText = "";

    if (Array.isArray(data?.steps)) {
      for (const step of data.steps) {
        if (step?.type !== "model_output") {
          continue;
        }

        if (!Array.isArray(step?.content)) {
          continue;
        }

        for (const content of step.content) {
          if (
            content?.type === "text" &&
            typeof content?.text === "string"
          ) {
            translatedText += content.text;
          }
        }
      }
    }

    if (
      !translatedText &&
      typeof data?.output_text === "string"
    ) {
      translatedText = data.output_text;
    }

    if (!translatedText.trim()) {
      console.error(
        "Gemini returned no translation:",
        JSON.stringify(data, null, 2)
      );

      return new Response(
        JSON.stringify({
          error: "The AI did not return any translated text.",
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
        text: translatedText.trim(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Translation error:", error);

    return new Response(
      JSON.stringify({
        error:
          "Something went wrong while translating the text.",
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