import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const { reportType = "weekly" } = await req.json().catch(() => ({}));

    // Pull recent activity
    const since = new Date();
    since.setDate(since.getDate() - (reportType === "monthly" ? 30 : reportType === "daily" ? 1 : 7));

    const [tradesRes, signalsRes, postsRes, perfRes] = await Promise.all([
      supabase.from("trades").select("*").eq("user_id", userId).gte("executed_at", since.toISOString()).order("executed_at", { ascending: false }).limit(100),
      supabase.from("ai_signals").select("*").eq("user_id", userId).gte("created_at", since.toISOString()).order("created_at", { ascending: false }).limit(50),
      supabase.from("posts").select("id,content,prediction_text,prediction_confidence,prediction_outcome,created_at").eq("user_id", userId).gte("created_at", since.toISOString()).limit(50),
      supabase.from("trading_performance").select("*").eq("user_id", userId).maybeSingle(),
    ]);

    const trades = tradesRes.data ?? [];
    const signals = signalsRes.data ?? [];
    const posts = postsRes.data ?? [];
    const perf = perfRes.data;

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const systemPrompt = `You are an elite trading performance coach for Charted AI. You analyze a trader's recent activity and produce:
1. A coaching report (headline, summary, strengths, mistakes, emotional insights, focus tasks)
2. Their Trader DNA archetype (one of: Momentum Trader, Liquidity Hunter, Scalper, Swing Trader, Breakout Trader, Reversal Specialist, News Trader, Position Trader, Unclassified)
3. Scores 0-100 for discipline, consistency, risk_mgmt, overall_rating, and a tier label (Beginner/Intermediate/Advanced/Elite/Pro)

Be specific. Reference real patterns from the data. Never give financial guarantees. If data is too sparse, say so and still classify with low confidence.`;

    const userPrompt = `Trader activity (last ${reportType} period):

PERFORMANCE SNAPSHOT: ${JSON.stringify(perf ?? "none")}
TRADES (${trades.length}): ${JSON.stringify(trades.slice(0, 30))}
AI SIGNALS (${signals.length}): ${JSON.stringify(signals.slice(0, 20))}
PREDICTION POSTS (${posts.length}): ${JSON.stringify(posts.slice(0, 20))}

Return ONLY a tool call with structured analysis.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "submit_coach_analysis",
            description: "Submit the structured coaching report and trader DNA.",
            parameters: {
              type: "object",
              properties: {
                report: {
                  type: "object",
                  properties: {
                    headline: { type: "string" },
                    summary: { type: "string" },
                    strengths: { type: "array", items: { type: "string" } },
                    mistakes: { type: "array", items: { type: "string" } },
                    emotional_insights: { type: "array", items: { type: "string" } },
                    focus_tasks: { type: "array", items: { type: "string" } },
                    discipline_score: { type: "number" },
                    consistency_score: { type: "number" },
                    risk_mgmt_score: { type: "number" },
                    overall_rating: { type: "number" },
                    tier: { type: "string" },
                  },
                  required: ["headline","summary","strengths","mistakes","emotional_insights","focus_tasks","discipline_score","consistency_score","risk_mgmt_score","overall_rating","tier"],
                },
                dna: {
                  type: "object",
                  properties: {
                    archetype: { type: "string" },
                    archetype_confidence: { type: "number" },
                    strengths: { type: "array", items: { type: "string" } },
                    weaknesses: { type: "array", items: { type: "string" } },
                    biases: { type: "array", items: { type: "string" } },
                    best_session: { type: "string" },
                    worst_session: { type: "string" },
                    recommended_strategies: { type: "array", items: { type: "string" } },
                    summary: { type: "string" },
                  },
                  required: ["archetype","archetype_confidence","strengths","weaknesses","biases","recommended_strategies","summary"],
                },
              },
              required: ["report","dna"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_coach_analysis" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Try again shortly." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      throw new Error(`AI gateway error ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured output from AI");
    const parsed = JSON.parse(toolCall.function.arguments);
    const { report, dna } = parsed;

    // Service role for writes (RLS-bypass for atomic upsert)
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const periodEnd = new Date().toISOString();
    const periodStart = since.toISOString();

    const { data: reportRow, error: repErr } = await admin.from("ai_coach_reports").insert({
      user_id: userId,
      report_type: reportType,
      period_start: periodStart,
      period_end: periodEnd,
      headline: report.headline,
      summary: report.summary,
      strengths: report.strengths ?? [],
      mistakes: report.mistakes ?? [],
      emotional_insights: report.emotional_insights ?? [],
      focus_tasks: report.focus_tasks ?? [],
      discipline_score: Math.round(report.discipline_score),
      consistency_score: Math.round(report.consistency_score),
      risk_mgmt_score: Math.round(report.risk_mgmt_score),
      overall_rating: Math.round(report.overall_rating),
      tier: report.tier,
      metadata: { trade_count: trades.length, signal_count: signals.length, post_count: posts.length },
    }).select().single();

    if (repErr) throw repErr;

    const { error: dnaErr } = await admin.from("trader_dna").upsert({
      user_id: userId,
      archetype: dna.archetype,
      archetype_confidence: Math.round(dna.archetype_confidence),
      strengths: dna.strengths ?? [],
      weaknesses: dna.weaknesses ?? [],
      biases: dna.biases ?? [],
      best_session: dna.best_session ?? null,
      worst_session: dna.worst_session ?? null,
      recommended_strategies: dna.recommended_strategies ?? [],
      summary: dna.summary ?? null,
      last_calculated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    if (dnaErr) throw dnaErr;

    return new Response(JSON.stringify({ success: true, report: reportRow, dna }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-coach error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
