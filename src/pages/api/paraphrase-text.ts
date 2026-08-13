import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      text,
      language = "English",
      style = "Natural",
    } = body;

    // Validate text
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: "Please enter some text to paraphrase.",
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

    // Gemini API key
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
You are an expert paraphrasing assistant.

Rewrite the user's text while preserving its original meaning.

Language: ${language}
Writing style: ${style}

Rules:
- Write entirely in ${language}.
- Preserve the original meaning.
- Do not add information that is not present in the original text.
- Do not remove important information.
- Use different wording and sentence structures.
- Make the result natural and easy to read.
- Correct grammar and spelling when necessary.
- Avoid unnecessary repetition.
- Do not mention that you are an AI.
- Do not explain what you changed.
- Return only the paraphrased text.
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
          input: `${instructions}\n\nTEXT TO PARAPHRASE:\n\n${text}`,
        }),
      }
    );

    const data = await response.json();

    // Gemini API error
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

    /*
     * Interactions API response:
     *
     * steps
     *   └── model_output
     *       └── content
     *           └── text
     */

    let generatedText = "";

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
            generatedText += content.text;
          }
        }
      }
    }

    // Fallback if output_text exists
    if (
      !generatedText &&
      typeof data?.output_text === "string"
    ) {
      generatedText = data.output_text;
    }

    if (!generatedText.trim()) {
      console.error(
        "Gemini returned no text. Full response:",
        JSON.stringify(data, null, 2)
      );

      return new Response(
        JSON.stringify({
          error: "The AI did not return any paraphrased text.",
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
    console.error("Paraphrase error:", error);

    return new Response(
      JSON.stringify({
        error:
          "Something went wrong while paraphrasing the text.",
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