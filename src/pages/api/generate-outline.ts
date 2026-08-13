import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      topic,
      language = "English",
      depth = "Detailed",
    } = body;

    if (!topic || typeof topic !== "string") {
      return new Response(
        JSON.stringify({
          error: "Please enter an article topic.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (topic.trim().length === 0) {
      return new Response(
        JSON.stringify({
          error: "Please enter an article topic.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (topic.length > 3000) {
      return new Response(
        JSON.stringify({
          error:
            "Topic is too long. Maximum 3000 characters.",
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

    let depthInstruction = "";

    switch (depth) {
      case "Basic":
        depthInstruction =
          "Create a simple outline with a title and 5-7 main sections.";
        break;

      case "Comprehensive":
        depthInstruction =
          "Create a comprehensive outline with H1, H2, and relevant H3 subsections. Include detailed coverage of the topic.";
        break;

      case "Detailed":
      default:
        depthInstruction =
          "Create a detailed outline with an H1 title, H2 sections, and useful H3 subsections where appropriate.";
        break;
    }

    const prompt = `
You are an expert SEO content strategist.

Create a professional article outline for the following topic:

${topic}

Language:
${language}

Depth:
${depth}

${depthInstruction}

Requirements:

- Write entirely in ${language}.
- Make the structure logical and easy to follow.
- Make the outline useful for a real article writer.
- Include a strong H1 title.
- Use H2 headings for the main sections.
- Use H3 headings only when they add value.
- Avoid unnecessary sections.
- Avoid repeating the same idea.
- Make the structure SEO-friendly without keyword stuffing.
- Cover the important aspects of the topic.
- Do not write the full article.
- Do not add an introduction or conclusion outside the outline.

Format:

# H1: Article Title

## H2: Section
- Brief description of what this section should cover.

### H3: Subsection
- Brief description.

Return only the article outline.
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
        "No outline returned:",
        data
      );

      return new Response(
        JSON.stringify({
          error:
            "The AI did not return an outline.",
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
      "Outline generator error:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          "Something went wrong while generating the outline.",
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