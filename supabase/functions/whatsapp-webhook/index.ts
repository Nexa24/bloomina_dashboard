import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const VERIFY_TOKEN = "Bloomina_secret_token_2026"; // Must match what you typed in Meta portal

// Supabase client for DB operations (like logging or status updates)
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

serve(async (req) => {
  const url = new URL(req.url);

  // 1. VERIFICATION (GET) — Used by Meta to confirm your URL
  if (req.method === "GET") {
    const hubMode = url.searchParams.get("hub.mode");
    const hubToken = url.searchParams.get("hub.verify_token");
    const hubChallenge = url.searchParams.get("hub.challenge");

    if (hubMode === "subscribe" && hubToken === VERIFY_TOKEN) {
      console.log("Webhook Verified Successfully! 🚀");
      return new Response(hubChallenge, { status: 200 });
    } else {
      console.error("Verification Token Mismatch!");
      return new Response("Forbidden", { status: 403 });
    }
  }

  // 2. EVENTS (POST) — Actual data from WhatsApp (Orders, Messages, etc)
  if (req.method === "POST") {
    try {
      const body = await req.json();
      console.log("WhatsApp Event Received:", JSON.stringify(body, null, 2));

      // Handle the event (You can expand this logic as needed)
      // Example: Update order status or log the message into your DB
      // const { data, error } = await supabase.from('whatsapp_logs').insert([{ payload: body }]);

      return new Response("Received", { status: 200 });
    } catch (error) {
      console.error("Error Processing Webhook:", error);
      return new Response("Error", { status: 500 });
    }
  }

  return new Response("Method Not Allowed", { status: 405 });
});

