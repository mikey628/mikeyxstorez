import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, supabaseKey);

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json();
    const product_id: string = body.product_id;
    const duration_days: number = Number(body.duration_days || 30);
    const quantity: number = Math.max(1, Math.min(20, Number(body.quantity || 1)));
    if (!product_id) return json({ error: "Product ID required" }, 400);

    // Profile checks
    const { data: profile } = await adminClient
      .from("profiles")
      .select("wallet_points, is_banned, is_approved, total_purchases")
      .eq("user_id", user.id)
      .single();
    if (!profile) return json({ error: "Profile not found" }, 404);
    if (profile.is_banned) return json({ error: "Your account is banned" }, 403);
    if (!profile.is_approved) return json({ error: "Your account is not approved yet" }, 403);

    // Product
    const { data: product } = await adminClient
      .from("products")
      .select("*")
      .eq("id", product_id)
      .single();
    if (!product) return json({ error: "Product not found" }, 404);

    // Determine tier — approved reseller's tier or "normal"
    const { data: app } = await adminClient
      .from("reseller_applications")
      .select("status, reseller_tier")
      .eq("user_id", user.id)
      .maybeSingle();
    const tier =
      app && app.status === "approved" ? (app.reseller_tier || "basic") : "normal";

    // Resolve unit price: tier_prices[tier][duration] → duration_prices[duration] → price_points
    const tierPrices = (product.tier_prices || {}) as Record<string, Record<string, number>>;
    const durationPrices = (product.duration_prices || {}) as Record<string, number>;
    const tierForDuration = tierPrices[tier]?.[String(duration_days)];
    const normalForDuration = durationPrices[String(duration_days)];
    const unitPrice = Number(
      tierForDuration ?? normalForDuration ?? product.price_points ?? 0
    );
    const totalPrice = unitPrice * quantity;

    if (Number(profile.wallet_points) < totalPrice) {
      return json({ error: `Insufficient balance. Need $${totalPrice}, have $${profile.wallet_points}` }, 400);
    }

    // Find available keys matching duration
    const { data: availableKeys } = await adminClient
      .from("keys")
      .select("*")
      .eq("product_id", product_id)
      .eq("is_used", false)
      .eq("duration_days", duration_days)
      .limit(quantity);

    if (!availableKeys || availableKeys.length < quantity) {
      return json({
        error: `Only ${availableKeys?.length || 0} of ${quantity} ${duration_days}-day keys available`,
      }, 400);
    }

    // Claim them
    const claimedIds: string[] = [];
    const claimedCodes: string[] = [];
    for (const k of availableKeys) {
      const { error: claimErr } = await adminClient
        .from("keys")
        .update({
          is_used: true,
          used_by: user.id,
          used_at: new Date().toISOString(),
          duration_days,
        })
        .eq("id", k.id)
        .eq("is_used", false);
      if (!claimErr) {
        claimedIds.push(k.id);
        claimedCodes.push(k.key_code);
      }
    }

    if (claimedCodes.length === 0) {
      return json({ error: "Failed to claim keys, try again" }, 500);
    }

    const actualTotal = unitPrice * claimedCodes.length;

    // Deduct balance + bump purchases
    await adminClient
      .from("profiles")
      .update({
        wallet_points: Number(profile.wallet_points) - actualTotal,
        total_purchases: (profile.total_purchases || 0) + claimedCodes.length,
      })
      .eq("user_id", user.id);

    // Reduce stock
    await adminClient
      .from("products")
      .update({ stock: Math.max(0, (product.stock || 0) - claimedCodes.length) })
      .eq("id", product_id);

    // Log transactions
    const txRows = claimedIds.map((kid) => ({
      user_id: user.id,
      type: "purchase",
      amount: unitPrice,
      description: `Purchased ${product.name} (${duration_days}d) [${tier}]`,
      product_id,
      key_id: kid,
    }));
    if (txRows.length) await adminClient.from("transactions").insert(txRows);

    return json({
      success: true,
      tier,
      unit_price: unitPrice,
      total_price: actualTotal,
      quantity: claimedCodes.length,
      keys: claimedCodes,
      // backward-compat
      key_code: claimedCodes[0],
    });
  } catch (err: any) {
    return json({ error: err?.message || "Internal error" }, 500);
  }
});
