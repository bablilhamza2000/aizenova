import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();

    const {
      text,
      language = "English",
      analysisLevel = "Standard",
    } = body;

    if (
      !text ||
      typeof text !== "string" ||
      text.trim().length === 0
    ) {
      return new Response(
        JSON.stringify({
          error: "Please enter text to analyze.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (text.length > 8000) {
      return new Response(
        JSON.stringify({
          error:
            "Text is too long. Maximum 8000 characters.",
        }),
        {
          status: 400,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (text.trim().length < 80) {
      return new Response(
        JSON.stringify({
          error:
            "Please provide at least 80 characters.",
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

    const detailInstruction =
      analysisLevel === "Detailed"
        ? `
Provide a detailed explanation and identify several concrete linguistic signals.
`
        : `
Provide a concise explanation and identify the most relevant linguistic signals.
`;

    const prompt = `
You are a text-analysis assistant.

Analyze the following text for linguistic patterns that may be commonly associated with AI-generated writing.

IMPORTANT:
This is NOT a definitive AI detector.
Do NOT claim that you can prove whether a human or AI wrote the text.
Your score is only an estimated likelihood based on stylistic and linguistic patterns.

Text:
${text}

Language:
${language}

${detailInstruction}

Consider signals such as:

- Repetitive sentence structures
- Predictable phrasing
- Unusually uniform tone
- Generic transitions
- Excessive formality
- Lack of natural variation
- Repetition of ideas
- Highly polished but generic wording
- Sentence-length variation
- Specificity and originality
- Natural imperfections

Do not treat grammar, correctness, or formal writing alone as evidence of AI authorship.

Return ONLY valid JSON in exactly this structure:

{
  "aiScore": 0,
  "humanScore": 100,
  "classification": "More human-like",
  "analysis": "Short explanation of the result.",
  "signals": [
    "Signal 1",
    "Signal 2",
    "Signal 3"
  ]
}

Rules:

- aiScore must be an integer from 0 to 100.
- humanScore must equal 100 minus aiScore.
- classification must be one of:
  "More human-like"
  "Mixed / uncertain"
  "More AI-like"
- Keep the result cautious and probabilistic.
- Do not say the score is proof.
- Return valid JSON only.
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
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
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
      return new Response(
        JSON.stringify({
          error:
            "The AI did not return an analysis.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    let parsed;

    try {
      parsed =
        JSON.parse(generatedText);
    } catch {
      console.error(
        "Invalid JSON returned by Gemini:",
        generatedText
      );

      return new Response(
        JSON.stringify({
          error:
            "The AI returned an invalid analysis format.",
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
    }

    let aiScore =
      Math.round(
        Number(parsed.aiScore) || 0
      );

    aiScore =
      Math.max(
        0,
        Math.min(100, aiScore)
      );

    const humanScore =
      100 - aiScore;

    let classification =
      parsed.classification;

    if (
      classification !== "More human-like" &&
      classification !== "Mixed / uncertain" &&
      classification !== "More AI-like"
    ) {
      if (aiScore >= 70) {
        classification =
          "More AI-like";
      } else if (aiScore >= 40) {
        classification =
          "Mixed / uncertain";
      } else {
        classification =
          "More human-like";
      }
    }

    const signals =
      Array.isArray(parsed.signals)
        ? parsed.signals
            .filter(
              (item: unknown) =>
                typeof item === "string"
            )
            .slice(0, 6)
        : [];

    return new Response(
      JSON.stringify({
        aiScore,
        humanScore,
        classification,
        analysis:
          typeof parsed.analysis === "string"
            ? parsed.analysis
            : "The result is only an estimate based on linguistic patterns.",
        signals,
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
      "AI content detector error:",
      error
    );

    return new Response(
      JSON.stringify({
        error:
          "Something went wrong while analyzing the text.",
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