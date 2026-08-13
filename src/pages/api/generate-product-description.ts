import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      product,
      platform = "Online Store",
      tone = "Persuasive",
      language = "English",
      length = "Medium",
      seo = true,
    } = body;

    if (
      !product ||
      typeof product !== "string"
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Please enter your product information.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (product.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error:
            "Please enter your product information.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (product.length > 4000) {
      return new Response(
        JSON.stringify({
          error:
            "Product information is too long. Maximum 4000 characters.",
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
          "Keep the description concise, around 80-130 words.";
        break;

      case "Long":
        lengthInstruction =
          "Write a detailed description, around 250-400 words.";
        break;

      case "Medium":
      default:
        lengthInstruction =
          "Write a balanced description, around 150-250 words.";
        break;
    }

    const seoInstruction = seo
      ? `
Optimize naturally for search engines.
Use relevant product terms naturally.
Do not keyword-stuff.
`
      : `
Do not specifically optimize for SEO.
Focus on natural and persuasive writing.
`;

    const prompt = `
You are an expert e-commerce copywriter.

Write ONE compelling product description based only on the product information provided.

Product information:
${product}

Platform:
${platform}

Tone:
${tone}

Language:
${language}

Length:
${length}

${lengthInstruction}

${seoInstruction}

Requirements:

- Write entirely in ${language}.
- Make the description persuasive but honest.
- Clearly explain the product's main features and benefits.
- Focus on benefits for the customer.
- Use natural language.
- Adapt the style to ${platform}.
- Do not invent specifications, prices, guarantees, certifications, reviews, or claims.
- Do not add information that is not supported by the product details.
- Avoid exaggerated claims.
- Do not mention that you are an AI.
- Do not add an introduction explaining the task.
- Return only the finished product description.
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
      console.error(
        "No product description returned:",
        data
      );

      return new Response(
        JSON.stringify({
          error:
            "The AI did not return a product description.",
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
      "Product description generator error:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          "Something went wrong while generating the product description.",
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