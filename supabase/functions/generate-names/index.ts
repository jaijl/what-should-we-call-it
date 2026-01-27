import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

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
    // Get user ID from JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Create Supabase client with service role to access database functions
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        {
          status: 401,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    // Check if user can generate
    const { data: canGenerate, error: checkError } = await supabase.rpc(
      "can_user_generate",
      { p_user_id: user.id }
    );

    if (checkError) {
      console.error("Error checking generation limit:", checkError);
      return new Response(
        JSON.stringify({ error: "Failed to check generation limit" }),
        {
          status: 500,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

    if (!canGenerate) {
      return new Response(
        JSON.stringify({
          error: "Generation limit reached",
          message: "You've used your 2 free generations. Upgrade to premium for unlimited generations.",
          requiresUpgrade: true
        }),
        {
          status: 403,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

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

      let errorMessage = "Failed to call OpenAI API";
      try {
        const errorJson = JSON.parse(error);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch {
        errorMessage = error.substring(0, 200);
      }

      return new Response(
        JSON.stringify({ error: `OpenAI API error: ${errorMessage}` }),
        {
          status: response.status,
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

    // Increment generation count after successful generation
    const { error: incrementError } = await supabase.rpc(
      "increment_generation_count",
      { p_user_id: user.id }
    );

    if (incrementError) {
      console.error("Error incrementing generation count:", incrementError);
      // Don't fail the request, just log the error
    }

    // Get updated generation count to return to user
    const { data: usageData } = await supabase
      .from("generation_usage")
      .select("generation_count")
      .eq("user_id", user.id)
      .single();

    const { data: subscriptionData } = await supabase
      .from("user_subscriptions")
      .select("subscription_status")
      .eq("user_id", user.id)
      .eq("subscription_status", "active")
      .maybeSingle();

    const isPremium = subscriptionData !== null;
    const generationsUsed = usageData?.generation_count || 0;
    const generationsRemaining = isPremium ? -1 : Math.max(0, 2 - generationsUsed);

    return new Response(
      JSON.stringify({
        names,
        usage: {
          generationsUsed,
          generationsRemaining,
          isPremium
        }
      }),
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
