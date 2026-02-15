import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization")!;

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const adminClient = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { product_id, duration_days } = await req.json();
    if (!product_id) {
      return new Response(JSON.stringify({ error: "Product ID required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check profile
    const { data: profile } = await adminClient
      .from("profiles")
      .select("wallet_points, is_banned, is_approved")
      .eq("user_id", user.id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (profile.is_banned) {
      return new Response(JSON.stringify({ error: "Your account is banned" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!profile.is_approved) {
      return new Response(JSON.stringify({ error: "Your account is not approved yet" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get product
    const { data: product } = await adminClient
      .from("products")
      .select("*")
      .eq("id", product_id)
      .single();

    if (!product) {
      return new Response(JSON.stringify({ error: "Product not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (product.stock <= 0) {
      return new Response(JSON.stringify({ error: "Out of stock" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine price based on duration
    const durationPrices = product.duration_prices || {};
    const price = durationPrices[String(duration_days || 30)] || product.price_points;

    if (profile.wallet_points < price) {
      return new Response(JSON.stringify({ error: "Insufficient points" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find available key
    const { data: availableKey } = await adminClient
      .from("keys")
      .select("*")
      .eq("product_id", product_id)
      .eq("is_used", false)
      .limit(1)
      .single();

    if (!availableKey) {
      return new Response(JSON.stringify({ error: "No keys available" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Mark key as used with duration
    const { error: keyError } = await adminClient
      .from("keys")
      .update({ 
        is_used: true, 
        used_by: user.id, 
        used_at: new Date().toISOString(),
        duration_days: duration_days || 30,
      })
      .eq("id", availableKey.id)
      .eq("is_used", false);

    if (keyError) {
      return new Response(JSON.stringify({ error: "Failed to claim key, try again" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduct points
    const { data: currentProfile } = await adminClient
      .from("profiles")
      .select("total_purchases")
      .eq("user_id", user.id)
      .single();

    await adminClient
      .from("profiles")
      .update({
        wallet_points: profile.wallet_points - price,
        total_purchases: (currentProfile?.total_purchases || 0) + 1,
      })
      .eq("user_id", user.id);

    // Reduce stock
    await adminClient
      .from("products")
      .update({ stock: product.stock - 1 })
      .eq("id", product_id);

    await adminClient.from("transactions").insert({
      user_id: user.id,
      type: "purchase",
      amount: price,
      description: `Purchased ${product.name} (${duration_days || 30} days)`,
      product_id: product_id,
      key_id: availableKey.id,
    });

    return new Response(
      JSON.stringify({ success: true, key_code: availableKey.key_code }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
