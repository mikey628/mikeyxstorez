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

    // User client (respects RLS)
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    // Admin client (bypasses RLS)
    const adminClient = createClient(supabaseUrl, supabaseKey);

    // Get current user
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { product_id } = await req.json();
    if (!product_id) {
      return new Response(JSON.stringify({ error: "Product ID required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user is banned
    const { data: profile } = await adminClient
      .from("profiles")
      .select("wallet_points, is_banned")
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

    if (profile.wallet_points < product.price_points) {
      return new Response(JSON.stringify({ error: "Insufficient points" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find an available key - use FOR UPDATE to prevent race conditions
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

    // Mark key as used
    const { error: keyError } = await adminClient
      .from("keys")
      .update({ is_used: true, used_by: user.id, used_at: new Date().toISOString() })
      .eq("id", availableKey.id)
      .eq("is_used", false); // Extra safety check

    if (keyError) {
      return new Response(JSON.stringify({ error: "Failed to claim key, try again" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Deduct points
    await adminClient
      .from("profiles")
      .update({
        wallet_points: profile.wallet_points - product.price_points,
        total_purchases: (await adminClient.from("profiles").select("total_purchases").eq("user_id", user.id).single()).data!.total_purchases + 1,
      })
      .eq("user_id", user.id);

    // Reduce stock
    await adminClient
      .from("products")
      .update({ stock: product.stock - 1 })
      .eq("id", product_id);

    // Log transaction
    await adminClient.from("transactions").insert({
      user_id: user.id,
      type: "purchase",
      amount: product.price_points,
      description: `Purchased ${product.name}`,
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
