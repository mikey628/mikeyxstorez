import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { game_uid, package: pkg, amount, proof_url, user_email } = await req.json();

    const ADMIN_EMAIL = "asminchy79@gmail.com";
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    if (!RESEND_API_KEY) {
      // Log for admin — email not configured, but request is logged
      console.log("Payment proof received:", { game_uid, pkg, amount, proof_url, user_email });
      return new Response(JSON.stringify({ ok: true, note: "Email not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailBody = `
      <h2>💰 New Topup Request</h2>
      <p><strong>User:</strong> ${user_email}</p>
      <p><strong>Game UID:</strong> ${game_uid}</p>
      <p><strong>Package:</strong> ${pkg}</p>
      <p><strong>Amount:</strong> ${amount} pts</p>
      ${proof_url ? `<p><strong>Payment Proof:</strong> <a href="${proof_url}">View Screenshot</a></p>` : ""}
      <hr/>
      <p style="color:#888;font-size:12px;">Received at ${new Date().toISOString()}</p>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "noreply@resend.dev",
        to: [ADMIN_EMAIL],
        subject: `New Topup: ${game_uid} — ${pkg}`,
        html: emailBody,
      }),
    });

    const data = await res.json();
    return new Response(JSON.stringify({ ok: true, data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
