import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      about,
      platform = "Instagram",
      language = "English",
      tone = "Professional",
      length = "Medium",
    } = body;

    if (!about || typeof about !== "string") {
      return new Response(
        JSON.stringify({
          error:
            "Please tell us something about yourself.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (about.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error:
            "Please tell us something about yourself.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (about.length > 5000) {
      return new Response(
        JSON.stringify({
          error:
            "Your information is too long. Maximum 5000 characters.",
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

    let lengthInstruction = "";

    switch (length) {
      case "Short":
        lengthInstruction =
          "Create a very concise bio, around 1-2 short sentences.";
        break;

      case "Long":
        lengthInstruction =
          "Create a detailed bio with several sentences.";
        break;

      case "Medium":
      default:
        lengthInstruction =
          "Create a balanced bio of around 2-4 sentences.";
        break;
    }

    const prompt = `
You are an expert personal branding and copywriting assistant.

Create a high-quality personal bio based on the information provided by the user.

About the person:
${about}

Platform:
${platform}

Language:
${language}

Tone:
${tone}

Length:
${length}

Instructions:

- Write entirely in ${language}.
- Match the requested ${tone} tone.
- Optimize the bio for ${platform}.
- Make it natural, authentic, clear, and engaging.
- Highlight the most useful information about the person.
- Do not invent important facts that the user did not provide.
- Avoid unnecessary clichés.
- Do not mention that you are an AI.
- ${lengthInstruction}
- Return ONLY the final bio.
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
            "The AI did not return any bio.",
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
      "Generate bio error:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          "Something went wrong while generating the bio.",
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