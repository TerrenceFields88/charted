import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SYSTEM_PROMPT = `You are Charted AI — an elite trading copilot for commodities futures traders (Gold, Silver, Crude Oil, Natural Gas, Copper, Corn, Soybean, Wheat). Think of yourself as ChatGPT for traders.

You help with:
- Technical analysis (support/resistance, patterns, indicators, market structure)
- Trade ideas, entries, stops, targets, risk/reward, position sizing
- Macro & fundamentals for commodities
- Trade journaling & psychology coaching
- Explaining concepts (futures basics, contract specs, rollover, contango/backwardation)
- Risk management discipline

Voice & style:
- Sharp, confident, concise. No fluff. Speak like a senior prop-desk mentor.
- Always use markdown: bold for key levels, bullet lists, fenced code for formulas, > blockquotes for warnings.
- When suggesting a trade, ALWAYS include: bias, entry, stop, target, R:R, confidence, and key invalidation. Format as a clean checklist.
- Never give absolute guarantees. Use words like "could", "if X then Y", "watch for".
- Refuse off-topic requests politely and steer back to trading.

Compliance: Education only — not financial advice. Mention this once at the start of any explicit trade idea.`;

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

    const { messages, conversation_id } = await req.json();
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Light user context — recent DNA + score, so the assistant feels personal
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const [dnaRes, scoreRes] = await Promise.all([
      admin.from("trader_dna").select("archetype,strengths,weaknesses,summary").eq("user_id", userId).maybeSingle(),
      admin.from("trader_scores").select("rank_tier,accuracy_percentage,total_predictions,reputation_points").eq("user_id", userId).maybeSingle(),
    ]);

    const contextLines: string[] = [];
    if (dnaRes.data) contextLines.push(`User Trader DNA: ${dnaRes.data.archetype}. ${dnaRes.data.summary ?? ""}`);
    if (scoreRes.data) contextLines.push(`User stats: ${scoreRes.data.rank_tier} tier, ${scoreRes.data.accuracy_percentage}% accuracy over ${scoreRes.data.total_predictions} predictions, ${scoreRes.data.reputation_points} rep.`);
    const userContext = contextLines.length ? `\n\n[Personal context — use sparingly]\n${contextLines.join("\n")}` : "";

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + userContext },
          ...messages.slice(-30),
        ],
      }),
    });

    if (!aiRes.ok) {
      if (aiRes.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited — try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (aiRes.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await aiRes.text();
      console.error("AI gateway error", aiRes.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Tap the stream to capture the full assistant text for persistence
    const reader = aiRes.body!.getReader();
    const decoder = new TextDecoder();
    const encoder = new TextEncoder();
    let fullText = "";

    const stream = new ReadableStream({
      async start(controller) {
        let buffer = "";
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
            buffer += decoder.decode(value, { stream: true });
            let nl: number;
            while ((nl = buffer.indexOf("\n")) !== -1) {
              let line = buffer.slice(0, nl);
              buffer = buffer.slice(nl + 1);
              if (line.endsWith("\r")) line = line.slice(0, -1);
              if (!line.startsWith("data: ")) continue;
              const jsonStr = line.slice(6).trim();
              if (jsonStr === "[DONE]") continue;
              try {
                const parsed = JSON.parse(jsonStr);
                const delta = parsed.choices?.[0]?.delta?.content;
                if (delta) fullText += delta;
              } catch { /* partial */ }
            }
          }
        } finally {
          controller.close();
          // Persist assistant message (best-effort)
          if (conversation_id && fullText.trim()) {
            try {
              await admin.from("chat_messages").insert({
                conversation_id, user_id: userId, role: "assistant", content: fullText,
              });
              await admin.from("chat_conversations").update({ last_message_at: new Date().toISOString() }).eq("id", conversation_id);
            } catch (e) { console.error("persist assistant failed", e); }
          }
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
    });
  } catch (e) {
    console.error("charted-chat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
