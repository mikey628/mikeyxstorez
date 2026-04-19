import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Package, ShoppingCart, FileDown, Loader2, Lock, Minus, Plus,
  ShieldCheck, Tag, ArrowRight, CheckCircle2, Crown, Copy, Wallet, Gift,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

type Tier = "normal" | "basic" | "pro" | "vip";

const TIER_LABEL: Record<Tier, string> = {
  normal: "Normal",
  basic: "Basic Reseller",
  pro: "Pro Reseller",
  vip: "VIP Reseller",
};

const Products = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [products, setProducts] = useState<any[]>([]);
  const [tier, setTier] = useState<Tier>("normal");

  // Buy dialog state
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<any>(null);
  const [duration, setDuration] = useState<number>(30);
  const [qty, setQty] = useState<number>(1);

  const [stocks, setStocks] = useState<Record<string, number>>({});
  const [purchasing, setPurchasing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genTimer, setGenTimer] = useState(3);
  const [deliveredKeys, setDeliveredKeys] = useState<string[]>([]);
  const [bonusKeys, setBonusKeys] = useState<string[]>([]);
  const [bonusNote, setBonusNote] = useState<string>("");

  const fetchAll = async () => {
    const [{ data: prods }, app] = await Promise.all([
      supabase.from("products").select("*").order("created_at"),
      user
        ? supabase
            .from("reseller_applications")
            .select("status, reseller_tier")
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null } as any),
    ]);
    setProducts(prods || []);
    if (app?.data && app.data.status === "approved") {
      setTier((app.data.reseller_tier as Tier) || "basic");
    } else {
      setTier("normal");
    }
  };

  useEffect(() => {
    fetchAll();
  }, [user?.id]);

  // Compute price for a product+duration based on tier.
  // Order: tier_prices[currentTier][d] → tier_prices.normal[d] → duration_prices[d] → price_points
  const priceFor = (product: any, d: number): number => {
    const tierPrices = product.tier_prices || {};
    const durationPrices = product.duration_prices || {};
    const tp = tierPrices[tier]?.[String(d)];
    if (typeof tp === "number") return Number(tp);
    const np = tierPrices.normal?.[String(d)];
    if (typeof np === "number") return Number(np);
    const dp = durationPrices[String(d)];
    if (typeof dp === "number") return Number(dp);
    return Number(product.price_points || 0);
  };

  const priceRangeFor = (product: any) => {
    const durations = product.duration_days || [30];
    const ps = durations.map((d: number) => priceFor(product, d));
    const min = Math.min(...ps);
    const max = Math.max(...ps);
    return { min, max };
  };

  const fetchStocks = async (product: any) => {
    const durations = product.duration_days || [30];
    const out: Record<string, number> = {};
    await Promise.all(
      durations.map(async (d: number) => {
        const { count } = await supabase
          .from("keys")
          .select("*", { count: "exact", head: true })
          .eq("product_id", product.id)
          .eq("is_used", false)
          .eq("duration_days", d);
        out[String(d)] = count || 0;
      })
    );
    setStocks(out);
  };

  const openBuy = (product: any) => {
    setSelected(product);
    setDuration((product.duration_days || [30])[0]);
    setQty(1);
    setStep(1);
    setStocks({});
    setDeliveredKeys([]);
    setBonusKeys([]);
    setBonusNote("");
    setGenerating(false);
    setGenProgress(0);
    setOpen(true);
    fetchStocks(product);
  };

  const closeBuy = () => {
    setOpen(false);
    setTimeout(() => {
      setSelected(null);
      setStep(1);
      setDeliveredKeys([]);
    }, 200);
  };

  const unitPrice = useMemo(
    () => (selected ? priceFor(selected, duration) : 0),
    [selected, duration, tier]
  );
  const totalPrice = unitPrice * qty;
  const stockForDuration = stocks[String(duration)] ?? 0;

  const handlePurchase = async () => {
    if (!user || !selected) return;
    if ((profile?.wallet_points ?? 0) < totalPrice) {
      toast.error("Insufficient balance. Add balance first.");
      return;
    }
    if (stockForDuration < qty) {
      toast.error(`Only ${stockForDuration} keys available for ${duration} days`);
      return;
    }

    setPurchasing(true);
    try {
      const { data, error } = await supabase.functions.invoke("purchase-key", {
        body: { product_id: selected.id, duration_days: duration, quantity: qty },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setStep(3);
      setGenerating(true);
      setPurchasing(false);

      let elapsed = 0;
      const total = 2500;
      const interval = setInterval(() => {
        elapsed += 100;
        setGenProgress(Math.min((elapsed / total) * 100, 100));
        setGenTimer(Math.max(0, Math.ceil((total - elapsed) / 1000)));
        if (elapsed >= total) {
          clearInterval(interval);
          setGenerating(false);
          setDeliveredKeys(data.keys || (data.key_code ? [data.key_code] : []));
          toast.success(`🎉 ${data.quantity || qty} key${qty > 1 ? "s" : ""} delivered!`);
          refreshProfile();
          fetchAll();
        }
      }, 100);
    } catch (err: any) {
      toast.error(err.message || "Purchase failed");
      setPurchasing(false);
    }
  };

  const copyAll = () => {
    navigator.clipboard.writeText(deliveredKeys.join("\n"));
    toast.success("All keys copied!");
  };

  return (
    <DashboardLayout>
      <AnimatedBackground />
      <div className="space-y-6 relative z-10">
        {/* Tier banner */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">{t("products")}</h1>
            <p className="text-muted-foreground text-sm">Browse and purchase digital access keys.</p>
          </div>
          <Badge
            variant="outline"
            className={`gap-1.5 px-3 py-1 ${
              tier === "normal"
                ? "border-border text-muted-foreground"
                : "border-primary text-primary bg-primary/10"
            }`}
          >
            <Crown className="w-3.5 h-3.5" />
            {TIER_LABEL[tier]} {tier !== "normal" && "Pricing"}
          </Badge>
        </div>

        {products.length === 0 ? (
          <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
            <CardContent className="p-12 text-center">
              <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t("noProducts")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {products.map((product, i) => {
              const { min, max } = priceRangeFor(product);
              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/40 hover:bg-card/80 transition-all duration-300 group hover:shadow-lg hover:shadow-primary/20 overflow-hidden">
                    <CardContent className="p-0">
                      {/* Header strip */}
                      <div className="flex items-center justify-between px-4 py-3 bg-card/50 border-b border-border/40">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
                            <Package className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-bold text-sm truncate">{product.name}</h3>
                            <div className="flex items-center gap-1 text-[11px] text-success">
                              <ShieldCheck className="w-3 h-3" /> Verified
                            </div>
                          </div>
                        </div>
                        {product.stock <= 0 && (
                          <Badge variant="destructive" className="text-[10px]">{t("outOfStock")}</Badge>
                        )}
                      </div>

                      {/* Body */}
                      <div className="p-4 space-y-3">
                        {product.description && (
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {product.description}
                          </p>
                        )}

                        <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">
                          <Tag className="w-2.5 h-2.5 mr-1" />
                          {(product.duration_days || [30]).length} variants
                        </Badge>

                        {product.file_url && (
                          <div className="flex items-center gap-1 text-[11px] text-primary/80">
                            <FileDown className="w-3 h-3" /> Includes downloadable file
                          </div>
                        )}

                        <div className="pt-2 border-t border-border/40">
                          <div className="flex items-center gap-1.5 text-success font-bold text-base">
                            <Tag className="w-3.5 h-3.5" />
                            From <span className="font-extrabold">${min.toFixed(2)}</span>
                            {max !== min && (
                              <span className="text-xs text-muted-foreground font-normal">
                                – ${max.toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>

                        <Button
                          disabled={product.stock <= 0}
                          onClick={() => openBuy(product)}
                          className="w-full font-semibold shadow-md shadow-primary/30 hover:shadow-primary/50"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2" /> Buy
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* 3-step Buy Dialog */}
        <Dialog open={open} onOpenChange={(v) => !v && closeBuy()}>
          <DialogContent className="bg-card/95 backdrop-blur-xl border-primary/30 max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-primary" />
                {selected?.name || "Purchase"}
              </DialogTitle>
            </DialogHeader>

            {/* Stepper */}
            <div className="flex items-center justify-center gap-2 py-2">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex items-center gap-2">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                      step >= n
                        ? "bg-primary border-primary text-primary-foreground shadow-md shadow-primary/40"
                        : "border-border text-muted-foreground"
                    }`}
                  >
                    {n}
                  </div>
                  {n < 3 && (
                    <div className={`w-8 h-0.5 ${step > n ? "bg-primary" : "bg-border"}`} />
                  )}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {/* STEP 1: Variant + qty */}
              {step === 1 && (
                <motion.div
                  key="s1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-2">
                      <Tag className="w-3 h-3 text-primary" /> Select Option
                    </label>
                    <div className="grid grid-cols-1 gap-2">
                      {(selected?.duration_days || [30]).map((d: number) => {
                        const p = selected ? priceFor(selected, d) : 0;
                        const stock = stocks[String(d)];
                        const hasStock = typeof stock === "number" ? stock > 0 : true;
                        const isSel = duration === d;
                        return (
                          <button
                            key={d}
                            onClick={() => setDuration(d)}
                            disabled={!hasStock}
                            className={`flex items-center justify-between px-3 py-3 rounded-lg border-2 transition-all ${
                              isSel
                                ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
                                : "border-border/50 hover:border-primary/40"
                            } ${!hasStock && "opacity-50 cursor-not-allowed"}`}
                          >
                            <div className="text-left">
                              <p className="font-semibold text-sm">{d} Day{d > 1 && "s"}</p>
                              <p className="text-[11px] text-muted-foreground">
                                {typeof stock === "number" ? `${stock} in stock` : "—"}
                              </p>
                            </div>
                            <span className="text-success font-bold">${p.toFixed(2)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mb-2">
                      <ShoppingCart className="w-3 h-3 text-primary" /> Quantity
                    </label>
                    <div className="flex items-center justify-between border-2 border-border/50 rounded-lg px-3 py-2">
                      <span className="text-sm text-muted-foreground">How many?</span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => setQty((q) => Math.max(1, q - 1))}
                        >
                          <Minus className="w-3 h-3" />
                        </Button>
                        <span className="font-bold w-6 text-center">{qty}</span>
                        <Button
                          size="icon"
                          variant="outline"
                          className="h-8 w-8"
                          onClick={() => setQty((q) => Math.min(stockForDuration || 20, q + 1))}
                        >
                          <Plus className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <Button
                    className="w-full h-11 font-semibold bg-gradient-to-r from-success to-success/80 text-success-foreground hover:opacity-90"
                    onClick={() => setStep(2)}
                    disabled={stockForDuration < qty}
                  >
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              )}

              {/* STEP 2: Confirm */}
              {step === 2 && (
                <motion.div
                  key="s2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-3"
                >
                  <div className="rounded-lg border border-border/50 p-4 space-y-2 text-sm">
                    <Row label="Product" value={selected?.name} />
                    <Row label="Duration" value={`${duration} day${duration > 1 ? "s" : ""}`} />
                    <Row label="Quantity" value={String(qty)} />
                    <Row label="Tier" value={TIER_LABEL[tier]} highlight={tier !== "normal"} />
                    <Row label="Unit Price" value={<span className="text-success font-semibold">${unitPrice.toFixed(2)}</span>} />
                    <div className="border-t border-border/50 pt-2 flex justify-between">
                      <span className="font-semibold">Total</span>
                      <span className="text-success font-bold text-lg">${totalPrice.toFixed(2)}</span>
                    </div>
                    <Row label="Your Balance" value={`$${profile?.wallet_points ?? 0}`} />
                    <Row
                      label="After"
                      value={`$${((profile?.wallet_points ?? 0) - totalPrice).toFixed(2)}`}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" className="flex-1" onClick={() => setStep(1)}>
                      Back
                    </Button>
                    <Button
                      className="flex-1 font-semibold"
                      onClick={handlePurchase}
                      disabled={
                        purchasing ||
                        (profile?.wallet_points ?? 0) < totalPrice ||
                        stockForDuration < qty
                      }
                    >
                      {purchasing ? "Processing..." : `Pay $${totalPrice.toFixed(2)}`}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Delivered */}
              {step === 3 && (
                <motion.div
                  key="s3"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-3"
                >
                  {generating ? (
                    <div className="py-6 flex flex-col items-center gap-4">
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="w-14 h-14 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center"
                      >
                        <Loader2 className="w-6 h-6 text-primary animate-pulse" />
                      </motion.div>
                      <p className="text-2xl font-bold text-primary">{genTimer}s</p>
                      <Progress value={genProgress} className="w-full h-2" />
                      <p className="text-xs text-muted-foreground">
                        Generating {qty} {duration}-day key{qty > 1 ? "s" : ""}...
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-success">
                        <CheckCircle2 className="w-5 h-5" />
                        <span className="font-semibold">{deliveredKeys.length} key{deliveredKeys.length > 1 && "s"} delivered</span>
                      </div>
                      <div className="bg-primary/5 border border-primary/30 p-3 rounded-lg max-h-48 overflow-y-auto space-y-1.5">
                        {deliveredKeys.map((k, i) => (
                          <div
                            key={i}
                            className="font-mono text-xs break-all select-all bg-background/50 px-2 py-1.5 rounded"
                          >
                            {k}
                          </div>
                        ))}
                      </div>
                      {selected?.file_url && (
                        <a href={selected.file_url} target="_blank" rel="noopener noreferrer">
                          <Button variant="outline" className="w-full">
                            <FileDown className="w-4 h-4 mr-2" /> Download File
                          </Button>
                        </a>
                      )}
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1" onClick={copyAll}>
                          <Copy className="w-4 h-4 mr-2" /> Copy All
                        </Button>
                        <Button className="flex-1" onClick={closeBuy}>Done</Button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

const Row = ({
  label,
  value,
  highlight,
}: { label: string; value: any; highlight?: boolean }) => (
  <div className="flex justify-between">
    <span className="text-muted-foreground">{label}:</span>
    <span className={highlight ? "text-primary font-semibold" : ""}>{value}</span>
  </div>
);

export default Products;
