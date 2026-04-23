// LifeForge AI — AI Life Coach edge function.
// Receives a compact summary of habits/streaks/moods/quests and returns
// personalized insights + suggested habits via the Lovable AI Gateway.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface CoachRequest {
  profile: { name: string; level: number; xp: number; title: string };
  habits: Array<{
    name: string;
    icon: string;
    streak: number;
    completedDates: string[]; // last 30 days only — caller trims
    createdAt: string;
    worldType: string;
  }>;
  moods: Array<{ date: string; mood: "sad" | "neutral" | "happy" }>;
  todayDone: number;
  todayTotal: number;
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

    const body = (await req.json()) as CoachRequest;

    const summary = {
      profile: body.profile,
      todaysProgress: `${body.todayDone}/${body.todayTotal}`,
      habits: body.habits.map((h) => ({
        name: h.name,
        streak: h.streak,
        worldType: h.worldType,
        last30Completions: h.completedDates.length,
        ageDays: Math.max(
          1,
          Math.ceil((Date.now() - new Date(h.createdAt).getTime()) / 86400000),
        ),
      })),
      recentMoods: body.moods.slice(-14),
    };

    const systemPrompt = `You are the AI Life Coach inside LifeForge AI, a mystical fantasy habit RPG.
Speak like a wise but warm forest sage — encouraging, specific, never generic. Use 1-2 emojis max per insight.
You analyze the user's habit data, streaks, and moods to surface real, evidence-based observations.
NEVER invent data not present in the input. If data is sparse, say so kindly and recommend a small first step.`;

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
            content: `Here is the adventurer's data:\n${JSON.stringify(summary, null, 2)}\n\nReturn coaching output now.`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "render_coaching",
              description: "Return structured coaching output for the user.",
              parameters: {
                type: "object",
                properties: {
                  headline: {
                    type: "string",
                    description:
                      "One short, motivating sentence (max 90 chars) summarizing their current state.",
                  },
                  insights: {
                    type: "array",
                    minItems: 2,
                    maxItems: 4,
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string", description: "Short title (max 40 chars)." },
                        body: {
                          type: "string",
                          description:
                            "1-2 sentences of specific, data-grounded observation.",
                        },
                        tone: {
                          type: "string",
                          enum: ["positive", "warning", "neutral"],
                        },
                      },
                      required: ["title", "body", "tone"],
                      additionalProperties: false,
                    },
                  },
                  suggestedHabits: {
                    type: "array",
                    minItems: 1,
                    maxItems: 3,
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string" },
                        icon: { type: "string", description: "A single emoji." },
                        reason: { type: "string", description: "Why this fits the user." },
                      },
                      required: ["name", "icon", "reason"],
                      additionalProperties: false,
                    },
                  },
                  focusAction: {
                    type: "string",
                    description:
                      "ONE concrete action to take in the next 24 hours, max 100 chars.",
                  },
                },
                required: ["headline", "insights", "suggestedHabits", "focusAction"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "render_coaching" } },
      }),
    });

    if (aiResp.status === 429) {
      return new Response(
        JSON.stringify({ error: "The Coach is resting. Try again in a moment." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (aiResp.status === 402) {
      return new Response(
        JSON.stringify({
          error: "AI credits exhausted. Add funds in Settings → Workspace → Usage.",
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await aiResp.json();
    const toolCall = data?.choices?.[0]?.message?.tool_calls?.[0];
    const argsStr = toolCall?.function?.arguments;
    if (!argsStr) {
      console.error("No tool call returned", JSON.stringify(data));
      return new Response(JSON.stringify({ error: "Coach returned no insight" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(argsStr);
    } catch (e) {
      console.error("Failed to parse tool args", argsStr);
      return new Response(JSON.stringify({ error: "Coach returned malformed insight" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-coach error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
