import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      pageTitle,
      keyword,
      content,
      language = "English",
      tone = "Professional",
    } = body;


    if (!pageTitle || typeof pageTitle !== "string") {
      return new Response(
        JSON.stringify({
          error: "Please enter a page title.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }


    if (!keyword || typeof keyword !== "string") {
      return new Response(
        JSON.stringify({
          error: "Please enter a main keyword.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }


    if (!content || typeof content !== "string") {
      return new Response(
        JSON.stringify({
          error: "Please describe your page content.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }


    if (pageTitle.length > 200) {
      return new Response(
        JSON.stringify({
          error:
            "Page title is too long. Maximum 200 characters.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }


    if (keyword.length > 200) {
      return new Response(
        JSON.stringify({
          error:
            "Keyword is too long. Maximum 200 characters.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }


    if (content.length > 5000) {
      return new Response(
        JSON.stringify({
          error:
            "Page content is too long. Maximum 5000 characters.",
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
            "GEMINI_API_KEY is missing.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }


    const prompt = `
You are an expert SEO copywriter.

Create ONE high-quality meta description for the following webpage.

Page title:
${pageTitle}

Main keyword:
${keyword}

Page content:
${content}

Language:
${language}

Tone:
${tone}

Requirements:

- Write entirely in ${language}.
- Include the main keyword naturally.
- Clearly communicate what the page offers.
- Make it attractive and useful to search users.
- Keep it concise and suitable for an SEO meta description.
- Aim for approximately 140-160 characters when possible.
- Do not use misleading clickbait.
- Do not add quotation marks.
- Do not add explanations.
- Return ONLY the meta description.
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
        "No generated text:",
        data
      );

      return new Response(
        JSON.stringify({
          error:
            "The AI did not return a meta description.",
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
      "Meta description generator error:",
      error
    );


    return new Response(
      JSON.stringify({
        error:
          "Something went wrong while generating the meta description.",
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