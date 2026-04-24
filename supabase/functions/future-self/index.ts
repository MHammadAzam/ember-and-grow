// LifeForge AI — Future Self projection.
// Given the user's letter + habit summary, returns "best future" and "worst future" projections.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface FutureSelfRequest {
  letter: string;
  horizonDays: number;
  habits: Array<{ name: string; streak: number; last30Completions: number }>;
  alterEgo?: { name: string; archetype: string; values: string[]; mantra: string } | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json()) as FutureSelfRequest;
    if (!body.letter || body.letter.trim().length < 10) {
      return new Response(JSON.stringify({ error: "Letter is too short. Write at least a sentence." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `You are the Future-Self oracle inside LifeForge AI, a mystical habit RPG.
Given the adventurer's letter to their future self, their current habits, and (optionally) their alter ego,
craft TWO vivid, second-person projections of who they may become in ${body.horizonDays} days:

- bestFuture: assume they stay consistent. Concrete, sensory, emotionally resonant. 3-5 sentences.
- worstFuture: assume habits collapse. Honest but compassionate, never cruel. 3-5 sentences.

Use mystical/forest imagery sparingly. Speak directly to them ("You wake...", "You feel..."). Never invent specific external people or events.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Letter to future self:\n"""${body.letter}"""\n\nCurrent habits: ${JSON.stringify(body.habits)}\n\nAlter ego: ${JSON.stringify(body.alterEgo ?? "none")}\n\nReturn the two projections now.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "render_futures",
              description: "Return best and worst future-self projections.",
              parameters: {
                type: "object",
                properties: {
                  bestFuture: { type: "string", description: "Best-case projection (3-5 sentences)." },
                  worstFuture: { type: "string", description: "Worst-case projection (3-5 sentences)." },
                },
                required: ["bestFuture", "worstFuture"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "render_futures" } },
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "The Oracle is resting. Try again in a moment." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Add funds in Settings → Workspace → Usage." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const argsStr = data?.choices?.[0]?.message?.tool_calls?.[0]?.function?.arguments;
    if (!argsStr) {
      console.error("No tool call returned", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Oracle returned no vision" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const parsed = JSON.parse(argsStr);
    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("future-self error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
