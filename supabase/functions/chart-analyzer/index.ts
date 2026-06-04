import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
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
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const { image_url, image_base64, symbol, timeframe, notes } = body as {
      image_url?: string; image_base64?: string; symbol?: string; timeframe?: string; notes?: string;
    };

    if (!image_url && !image_base64) {
      return new Response(JSON.stringify({ error: "image_url or image_base64 required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const imageContent = image_url
      ? { type: "image_url", image_url: { url: image_url } }
      : { type: "image_url", image_url: { url: `data:image/png;base64,${image_base64}` } };

    const systemPrompt = `You are Charted AI's elite technical analyst specialized in commodities futures (Gold, Silver, Crude Oil, Natural Gas, Copper, Corn, Soybean, Wheat). Analyze the chart and return STRICTLY a tool call with:
- bias: long | short | neutral
- setup_name: e.g. "Bull Flag", "Liquidity Sweep", "Range Reversal"
- trend, pattern
- support_levels & resistance_levels: arrays of numeric prices
- entry_price, stop_loss, target_price, risk_reward
- confidence (0-100)
- timeframe_outlook
- key_observations (bullets)
- risks (bullets)
- summary (1-2 sentences)

Never give financial guarantees. If chart is unreadable, set bias=neutral and confidence < 30 and explain in summary.`;

    const userText = `Analyze this chart.${symbol ? ` Symbol: ${symbol}.` : ""}${timeframe ? ` Timeframe: ${timeframe}.` : ""}${notes ? ` User notes: ${notes}.` : ""}`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: [{ type: "text", text: userText }, imageContent] },
        ],
        tools: [{
          type: "function",
          function: {
            name: "submit_chart_analysis",
            description: "Submit structured chart analysis.",
            parameters: {
              type: "object",
              properties: {
                bias: { type: "string", enum: ["long", "short", "neutral"] },
                setup_name: { type: "string" },
                trend: { type: "string" },
                pattern: { type: "string" },
                support_levels: { type: "array", items: { type: "number" } },
                resistance_levels: { type: "array", items: { type: "number" } },
                entry_price: { type: "number" },
                stop_loss: { type: "number" },
                target_price: { type: "number" },
                risk_reward: { type: "number" },
                confidence: { type: "number" },
                timeframe_outlook: { type: "string" },
                key_observations: { type: "array", items: { type: "string" } },
                risks: { type: "array", items: { type: "string" } },
                summary: { type: "string" },
              },
              required: ["bias", "confidence", "summary", "support_levels", "resistance_levels", "key_observations", "risks"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "submit_chart_analysis" } },
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) return new Response(JSON.stringify({ error: "Rate limited" }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (aiRes.status === 402) return new Response(JSON.stringify({ error: "AI credits exhausted" }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      throw new Error(`AI gateway error ${aiRes.status}`);
    }

    const aiData = await aiRes.json();
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No structured output from AI");
    const a = JSON.parse(toolCall.function.arguments);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: row, error: insErr } = await admin.from("chart_analyses").insert({
      user_id: userId,
      symbol: symbol ?? null,
      timeframe: timeframe ?? null,
      image_url: image_url ?? null,
      bias: a.bias,
      setup_name: a.setup_name ?? null,
      trend: a.trend ?? null,
      pattern: a.pattern ?? null,
      support_levels: a.support_levels ?? [],
      resistance_levels: a.resistance_levels ?? [],
      entry_price: a.entry_price ?? null,
      stop_loss: a.stop_loss ?? null,
      target_price: a.target_price ?? null,
      risk_reward: a.risk_reward ?? null,
      confidence: Math.round(a.confidence ?? 0),
      timeframe_outlook: a.timeframe_outlook ?? null,
      key_observations: a.key_observations ?? [],
      risks: a.risks ?? [],
      summary: a.summary ?? null,
      raw_response: a,
    }).select().single();
    if (insErr) throw insErr;

    return new Response(JSON.stringify({ success: true, analysis: row }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("chart-analyzer error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
