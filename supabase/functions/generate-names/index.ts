import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface RequestBody {
  currentTitle: string;
  count?: number;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const { currentTitle, count = 5 }: RequestBody = await req.json();

    if (!currentTitle || currentTitle.trim() === "") {
      return new Response(
        JSON.stringify({ error: "Current title is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const prompt = `You are helping people come up with creative names. Generate ${count} creative and unique name suggestions for the following context:

"${currentTitle}"

Requirements:
- Names should be relevant to the context
- Keep names concise (1-4 words)
- Make them creative and memorable
- Vary the style (some professional, some fun, some descriptive)
- Return ONLY a JSON array of strings, nothing else

Example format: ["Name 1", "Name 2", "Name 3"]`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openaiApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a creative naming assistant. You always respond with a valid JSON array of name suggestions."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.9,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error("OpenAI API error:", error);
      return new Response(
        JSON.stringify({ error: "Failed to generate names" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content.trim();

    let names: string[];
    try {
      names = JSON.parse(generatedText);
      if (!Array.isArray(names)) {
        throw new Error("Response is not an array");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", generatedText);
      return new Response(
        JSON.stringify({ error: "Invalid response from AI" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    return new Response(
      JSON.stringify({ names }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in generate-names function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
