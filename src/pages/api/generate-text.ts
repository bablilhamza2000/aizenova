import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      prompt,
      textType = "blog",
      language = "English",
      tone = "Professional",
      length = "Medium",
    } = body;

    // -----------------------------
    // Validate prompt
    // -----------------------------

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: "Please enter a prompt.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (prompt.length > 5000) {
      return new Response(
        JSON.stringify({
          error: "Prompt is too long. Maximum 5000 characters.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // -----------------------------
    // Gemini API Key
    // -----------------------------

    const apiKey = import.meta.env.GEMINI_API_KEY;

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing.");

      return new Response(
        JSON.stringify({
          error:
            "Gemini API key is not configured. Please add GEMINI_API_KEY to your .env file.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // -----------------------------
    // Length instructions
    // -----------------------------

    let lengthInstruction = "";

    switch (length) {
      case "Short":
        lengthInstruction =
          "Keep the response concise, approximately 150-250 words.";
        break;

      case "Long":
        lengthInstruction =
          "Write a detailed response, approximately 700-1000 words.";
        break;

      case "Medium":
      default:
        lengthInstruction =
          "Write a medium-length response, approximately 400-600 words.";
        break;
    }

    // -----------------------------
    // Content type instructions
    // -----------------------------

    let typeInstruction = "";

    switch (textType) {
      case "blog":
        typeInstruction =
          "Create a well-structured blog article with a clear title, introduction, useful headings, and a conclusion.";
        break;

      case "idea":
        typeInstruction =
          "Generate useful and original content ideas. Present them as a clear numbered list with short explanations.";
        break;

      case "social":
        typeInstruction =
          "Create an engaging social media post. Make it concise, natural, and suitable for social media.";
        break;

      case "email":
        typeInstruction =
          "Write a professional and natural email with an appropriate structure and clear call to action.";
        break;

      case "description":
        typeInstruction =
          "Write an attractive and informative product description highlighting the main benefits and features.";
        break;

      case "summary":
        typeInstruction =
          "Create a clear and concise summary containing only the most important information.";
        break;

      default:
        typeInstruction =
          "Create useful, clear, well-structured content based on the user's request.";
    }

    // -----------------------------
    // Gemini instructions
    // -----------------------------

    const instructions = `
You are an expert AI writing assistant.

Create content based on the user's request.

Content type:
${textType}

Language:
${language}

Tone:
${tone}

Length:
${length}

${typeInstruction}

${lengthInstruction}

Important rules:

- Write entirely in ${language}.
- Follow the requested tone: ${tone}.
- Do not mention that you are an AI.
- Do not add unnecessary explanations before or after the requested content.
- Make the content natural, useful, and easy to read.
- Use proper grammar and spelling.
- Follow the user's instructions carefully.
`;

    // -----------------------------
    // Gemini API
    // -----------------------------

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: instructions,
              },
            ],
          },

          contents: [
            {
              role: "user",
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

    // -----------------------------
    // Gemini API error
    // -----------------------------

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

    // -----------------------------
    // Get generated text
    // -----------------------------

    const generatedText =
      data?.candidates?.[0]?.content?.parts
        ?.map((part: { text?: string }) => part.text || "")
        .join("")
        .trim();

    if (!generatedText) {
      console.error("No generated text returned:", data);

      return new Response(
        JSON.stringify({
          error: "The AI did not return any text.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    // -----------------------------
    // Return result
    // -----------------------------

    return new Response(
      JSON.stringify({
        text: generatedText,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Generate text error:", error);

    return new Response(
      JSON.stringify({
        error: "Something went wrong while generating the text.",
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