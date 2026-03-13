import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { uid } = await req.json();
    if (!uid) {
      return new Response(JSON.stringify({ error: "UID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try freefireinfo API
    const response = await fetch(`https://freefireinfo.vercel.app/api?uid=${encodeURIComponent(uid)}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "Invalid UID or API unavailable" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();

    // Extract nickname from various possible response shapes
    const nickname =
      data?.nickname ||
      data?.name ||
      data?.playerName ||
      data?.player?.nickname ||
      data?.data?.nickname ||
      data?.data?.name ||
      null;

    if (!nickname) {
      return new Response(JSON.stringify({ error: "Invalid UID. Player not found." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ nickname, uid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to verify UID" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
