import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      topic,
      language = "English",
      count = 10,
    } = body;

    if (!topic || typeof topic !== "string") {
      return new Response(
        JSON.stringify({
          error: "Please enter a topic or article content.",
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
          error: "Please enter a topic or article content.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (topic.length > 5000) {
      return new Response(
        JSON.stringify({
          error:
            "Topic is too long. Maximum 5000 characters.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    const faqCount = Number(count);

    if (
      !Number.isInteger(faqCount) ||
      faqCount < 1 ||
      faqCount > 15
    ) {
      return new Response(
        JSON.stringify({
          error: "FAQ count must be between 1 and 15.",
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

    const prompt = `
You are an expert content writer and SEO assistant.

Generate ${faqCount} useful Frequently Asked Questions and answers based on the topic or article below.

Topic or article:
${topic}

Language:
${language}

Requirements:

- Write entirely in ${language}.
- Generate exactly ${faqCount} questions.
- Each question must be relevant to the provided topic.
- Each answer should be clear, accurate, useful, and easy to understand.
- Avoid repeating the same question.
- Do not invent facts that are not supported by the topic.
- Use natural language that matches what real users might search for.
- Make the questions useful for an FAQ section of a website article.
- Number every question.
- Put the answer directly below each question.
- Do not add an introduction or conclusion.
- Do not mention that you are an AI.

Format:

1. Question?
Answer: ...

2. Question?
Answer: ...

Return only the FAQ content.
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
        "No FAQ results returned:",
        data
      );

      return new Response(
        JSON.stringify({
          error:
            "The AI did not return any FAQs.",
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
      "FAQ generator error:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          "Something went wrong while generating FAQs.",
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