import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      text,
      language = "English",
      length = "Medium",
    } = body;

    // Check text
    if (!text || typeof text !== "string" || text.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: "Please enter some text to summarize.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Limit text size
    if (text.length > 20000) {
      return new Response(
        JSON.stringify({
          error:
            "The text is too long. Please keep it under 20,000 characters.",
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
      console.error("GEMINI_API_KEY is missing.");

      return new Response(
        JSON.stringify({
          error:
            "Gemini API key is not configured. Please add GEMINI_API_KEY to your environment variables.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Summary length
    let lengthInstruction = "";

    switch (length) {
      case "Short":
        lengthInstruction =
          "Create a very concise summary containing only the essential points.";
        break;

      case "Long":
        lengthInstruction =
          "Create a detailed summary that covers all important points while remaining much shorter than the original text.";
        break;

      case "Medium":
      default:
        lengthInstruction =
          "Create a clear medium-length summary covering the main ideas and important details.";
        break;
    }

    // Instructions
    const prompt = `
You are an expert text summarization assistant.

Summarize the following text.

Language:
${language}

Summary length:
${length}

Instructions:
- Write entirely in ${language}.
- ${lengthInstruction}
- Keep the original meaning accurate.
- Do not invent information.
- Do not add facts that are not present in the original text.
- Remove unnecessary repetition.
- Keep the most important ideas, facts, and conclusions.
- Make the summary natural and easy to read.
- Do not mention that you are an AI.
- Do not add an introduction such as "Here is the summary".
- Return only the final summary.

TEXT TO SUMMARIZE:

${text}
`;

    // Gemini API
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
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
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 3000,
          },
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

    // Extract generated text
    const generatedText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      console.error("No generated text returned:", data);

      return new Response(
        JSON.stringify({
          error: "The AI did not return a summary.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Return summary
    return new Response(
      JSON.stringify({
        summary: generatedText.trim(),
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Summarize text error:", error);

    return new Response(
      JSON.stringify({
        error:
          "Something went wrong while generating the summary.",
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