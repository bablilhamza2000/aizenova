import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      request: emailRequest,
      tone = "Professional",
      language = "English",
      length = "Medium",
    } = body;

    if (
      !emailRequest ||
      typeof emailRequest !== "string"
    ) {
      return new Response(
        JSON.stringify({
          error: "Please describe what your email should say.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (emailRequest.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: "Please describe what your email should say.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (emailRequest.length > 3000) {
      return new Response(
        JSON.stringify({
          error:
            "Request is too long. Maximum 3000 characters.",
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
      console.error("GEMINI_API_KEY is missing.");

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
          "Keep the email concise, around 80-150 words.";
        break;

      case "Long":
        lengthInstruction =
          "Write a detailed email, around 250-400 words.";
        break;

      case "Medium":
      default:
        lengthInstruction =
          "Write a balanced email, around 150-250 words.";
        break;
    }

    const prompt = `
You are an expert professional email writer.

Write an email based on the user's request.

User request:
${emailRequest}

Tone:
${tone}

Language:
${language}

Length:
${length}

${lengthInstruction}

Important requirements:

- Write entirely in ${language}.
- Make the email natural and human-sounding.
- Follow the requested tone.
- Use an appropriate greeting.
- Organize the email clearly.
- Include a suitable closing.
- Do not invent specific names, dates, companies, or facts that were not provided.
- If the user did not provide a recipient name, use a neutral greeting.
- If useful, include a clear call to action.
- Do not mention that you are an AI.
- Do not explain what you are doing.
- Return only the complete email.
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
        "No email returned:",
        data
      );

      return new Response(
        JSON.stringify({
          error:
            "The AI did not return an email.",
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
      "Email generator error:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          "Something went wrong while generating the email.",
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