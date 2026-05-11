// Whop webhook → grants/revokes Learn course access automatically.
// Public endpoint (verify_jwt = false). Authenticity is verified via HMAC SHA-256
// of the raw request body using WHOP_WEBHOOK_SECRET.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-whop-signature, whop-signature",
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return mismatch === 0;
}

function toHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacHex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return toHex(sig);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const SECRET = Deno.env.get("WHOP_WEBHOOK_SECRET");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!SECRET || !SUPABASE_URL || !SERVICE_ROLE) {
    console.error("[whop-webhook] missing env");
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const rawBody = await req.text();

  // Whop sends HMAC SHA-256 hex digest in the signature header.
  const sigHeader =
    req.headers.get("x-whop-signature") ?? req.headers.get("whop-signature") ?? "";
  // Some payload formats are like "sha256=..." or "t=...,v1=..."; extract hex
  const sigCandidates: string[] = [];
  if (sigHeader.includes("=")) {
    for (const part of sigHeader.split(",")) {
      const [k, v] = part.split("=").map((s) => s.trim());
      if (v && /^[0-9a-f]+$/i.test(v)) sigCandidates.push(v.toLowerCase());
      if (k && /^[0-9a-f]+$/i.test(k)) sigCandidates.push(k.toLowerCase());
    }
  } else if (sigHeader) {
    sigCandidates.push(sigHeader.toLowerCase());
  }

  const expected = await hmacHex(SECRET, rawBody);
  const ok = sigCandidates.some((s) => timingSafeEqual(s, expected));
  if (!ok) {
    console.warn("[whop-webhook] signature mismatch");
    return new Response(JSON.stringify({ error: "Invalid signature" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Whop event shape: { action: "membership.went_valid", data: {...} }
  const action: string = payload?.action ?? payload?.event ?? "";
  const data = payload?.data ?? payload ?? {};

  const membershipId: string | null =
    data?.id ?? data?.membership_id ?? data?.membership?.id ?? null;
  const planId: string | null =
    data?.plan_id ?? data?.plan?.id ?? data?.product_id ?? null;
  const email: string | null =
    data?.email ??
    data?.user?.email ??
    data?.metadata?.email ??
    data?.checkout?.metadata?.email ??
    null;
  const userIdMeta: string | null =
    data?.metadata?.user_id ??
    data?.checkout?.metadata?.user_id ??
    data?.passthrough?.user_id ??
    null;

  console.log("[whop-webhook] event", { action, membershipId, planId, email, userIdMeta });

  const grantEvents = new Set([
    "membership.went_valid",
    "membership_went_valid",
    "payment.succeeded",
    "payment_succeeded",
  ]);
  const revokeEvents = new Set([
    "membership.went_invalid",
    "membership_went_invalid",
    "membership.cancel_at_period_end_changed",
  ]);

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
    auth: { persistSession: false },
  });

  if (grantEvents.has(action)) {
    if (!membershipId && !email && !userIdMeta) {
      return new Response(JSON.stringify({ error: "No identifier on event" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const row = {
      user_id: userIdMeta,
      email: email ? email.toLowerCase() : null,
      source: "whop",
      whop_membership_id: membershipId,
      whop_plan_id: planId,
      status: "active",
      granted_at: new Date().toISOString(),
      revoked_at: null,
      metadata: data,
    };
    const { error } = membershipId
      ? await supabase
          .from("learn_access")
          .upsert(row, { onConflict: "whop_membership_id" })
      : await supabase.from("learn_access").insert(row);
    if (error) {
      console.error("[whop-webhook] upsert error", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, granted: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (revokeEvents.has(action) && membershipId) {
    const { error } = await supabase
      .from("learn_access")
      .update({ status: "revoked", revoked_at: new Date().toISOString() })
      .eq("whop_membership_id", membershipId);
    if (error) {
      console.error("[whop-webhook] revoke error", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ ok: true, revoked: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Acknowledge unrelated events so Whop doesn't retry.
  return new Response(JSON.stringify({ ok: true, ignored: action }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
