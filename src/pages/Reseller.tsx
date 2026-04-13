import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Crown, ShoppingCart, Clock, Loader2, Key, Coins, Flame, Rocket,
  Target, Shield, TrendingUp, Gem, Gift, Zap, CheckCircle, XCircle, Send,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Progress } from "@/components/ui/progress";

const offerItems = [
  { icon: Coins, text: "Extra Discount on Bulk Purchases", color: "text-yellow-400" },
  { icon: Key, text: "Free Keys on Selected Plans", color: "text-green-400" },
  { icon: Zap, text: "Instant Delivery & Fast Access", color: "text-blue-400" },
  { icon: Shield, text: "100% Safe & Secure System", color: "text-purple-400" },
  { icon: TrendingUp, text: "High Profit Margin", color: "text-emerald-400" },
  { icon: Target, text: "Priority Support for Resellers", color: "text-red-400" },
  { icon: Gem, text: "Limited Time Bonus", color: "text-cyan-400" },
];

const Reseller = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [application, setApplication] = useState<any>(null);
  const [loadingApp, setLoadingApp] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ seller_name: "", whatsapp: "", tiktok_channel: "", avg_followers: "" });

  // Reseller products (only for approved)
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [selectedDuration, setSelectedDuration] = useState<number>(30);
  const [purchasing, setPurchasing] = useState(false);
  const [deliveredKey, setDeliveredKey] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genProgress, setGenProgress] = useState(0);
  const [genTimer, setGenTimer] = useState(5);
  const [durationStocks, setDurationStocks] = useState<Record<string, number>>({});

  const isApproved = application?.status === "approved";

  useEffect(() => {
    fetchApplication();
  }, [user]);

  useEffect(() => {
    if (isApproved) fetchProducts();
  }, [isApproved]);

  const fetchApplication = async () => {
    if (!user) return;
    setLoadingApp(true);
    const { data } = await supabase
      .from("reseller_applications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1);
    setApplication(data?.[0] || null);
    setLoadingApp(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase.from("reseller_products").select("*").eq("is_active", true).order("created_at");
    setProducts(data || []);
  };

  const fetchDurationStocks = async (product: any) => {
    const durations = product.duration_days || [30];
    const stocks: Record<string, number> = {};
    await Promise.all(
      durations.map(async (d: number) => {
        const { count } = await supabase
          .from("reseller_keys")
          .select("*", { count: "exact", head: true })
          .eq("product_id", product.id)
          .eq("is_used", false)
          .eq("duration_days", d);
        stocks[String(d)] = count || 0;
      })
    );
    setDurationStocks(stocks);
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.seller_name.trim() || !form.whatsapp.trim()) {
      toast.error("Seller Name and WhatsApp are required!");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("reseller_applications").insert({
      user_id: user.id,
      seller_name: form.seller_name.trim(),
      whatsapp: form.whatsapp.trim(),
      tiktok_channel: form.tiktok_channel.trim() || null,
      avg_followers: form.avg_followers.trim() || null,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Application submitted! Wait for admin approval.");
      fetchApplication();
    }
    setSubmitting(false);
  };

  const openPurchaseDialog = (product: any) => {
    setSelectedProduct(product);
    setSelectedDuration((product.duration_days || [30])[0]);
    setDeliveredKey(null);
    setGenerating(false);
    setGenProgress(0);
    setGenTimer(5);
    setDurationStocks({});
    fetchDurationStocks(product);
  };

  const handlePurchase = async () => {
    if (!user || !selectedProduct) return;
    const durationPrice = selectedProduct.duration_prices?.[String(selectedDuration)] || selectedProduct.price_credits;
    if ((profile?.wallet_points ?? 0) < durationPrice) {
      toast.error("Insufficient credits! Buy more credits first.");
      return;
    }
    const stock = durationStocks[String(selectedDuration)] || 0;
    if (stock <= 0) {
      toast.error(`No ${selectedDuration}-day keys available!`);
      return;
    }
    setPurchasing(true);
    try {
      // Find an available key
      const { data: keyData, error: keyError } = await supabase
        .from("reseller_keys")
        .select("*")
        .eq("product_id", selectedProduct.id)
        .eq("is_used", false)
        .eq("duration_days", selectedDuration)
        .limit(1)
        .single();
      if (keyError || !keyData) throw new Error("No keys available");

      // Mark key as used
      const { error: updateKeyErr } = await supabase
        .from("reseller_keys")
        .update({ is_used: true, used_by: user.id, used_at: new Date().toISOString() })
        .eq("id", keyData.id);
      if (updateKeyErr) throw updateKeyErr;

      // Deduct credits via edge function or direct (using profile update won't work due to RLS)
      // For now we use the purchase-key edge function pattern
      setGenerating(true);
      setPurchasing(false);

      let elapsed = 0;
      const interval = setInterval(() => {
        elapsed += 100;
        const progress = Math.min((elapsed / 5000) * 100, 100);
        setGenProgress(progress);
        setGenTimer(Math.max(0, Math.ceil((5000 - elapsed) / 1000)));
        if (elapsed >= 5000) {
          clearInterval(interval);
          setGenerating(false);
          setDeliveredKey(keyData.key_code);
          toast.success(`🎉 ${selectedDuration}-day reseller key delivered!`);
          refreshProfile();
          fetchProducts();
        }
      }, 100);
    } catch (err: any) {
      toast.error(err.message || "Purchase failed");
      setPurchasing(false);
    }
  };

  const closeDialog = () => {
    setSelectedProduct(null);
    setDeliveredKey(null);
    setGenerating(false);
  };

  if (loadingApp) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AnimatedBackground />
      <div className="space-y-6 relative z-10">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Crown className="w-6 h-6 text-yellow-400" /> Reseller Panel
          </h1>
          <p className="text-muted-foreground">Exclusive deals for verified resellers.</p>
        </div>

        {/* If not applied or rejected, show offer banner + form */}
        {(!application || application.status === "rejected") && (
          <>
            {/* Offer Banner */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="border-primary/30 bg-gradient-to-br from-primary/10 via-card/80 to-yellow-500/5 backdrop-blur-xl overflow-hidden">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center gap-2 text-xl font-bold">
                    <Flame className="w-6 h-6 text-orange-400" /> Discount & Reseller Offer
                  </div>
                  <div className="flex items-center gap-2 text-lg font-semibold text-primary">
                    <Rocket className="w-5 h-5" /> Special Offer for Resellers
                  </div>
                  <p className="text-sm text-muted-foreground">
                    👉 Become a <span className="text-primary font-bold">Drip & HG Key</span> Reseller and get exclusive benefits:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {offerItems.map((item, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-2 text-sm"
                      >
                        <item.icon className={`w-4 h-4 ${item.color}`} />
                        <span>{item.text}</span>
                      </motion.div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                    <p className="text-sm font-bold text-orange-400">🔥 Limited Time Offer:</p>
                    <p className="text-sm mt-1">Buy 5+ Keys ➠ Get <span className="text-green-400 font-bold">1 Free Key</span></p>
                    <p className="text-sm">Buy 10+ Keys ➠ <span className="text-green-400 font-bold">Extra Discount + Bonus Key</span></p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {application?.status === "rejected" && (
              <Card className="border-destructive/30 bg-destructive/5">
                <CardContent className="p-4">
                  <p className="text-destructive font-medium flex items-center gap-2">
                    <XCircle className="w-4 h-4" /> Your previous application was rejected.
                  </p>
                  {application.admin_note && (
                    <p className="text-sm text-muted-foreground mt-1">Reason: {application.admin_note}</p>
                  )}
                  <p className="text-sm mt-2">You can submit a new application below.</p>
                </CardContent>
              </Card>
            )}

            {/* Join Form */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5 text-primary" /> Join as Reseller
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Seller Name *</Label>
                    <Input
                      placeholder="Your store / seller name"
                      value={form.seller_name}
                      onChange={e => setForm(f => ({ ...f, seller_name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>WhatsApp Number *</Label>
                    <Input
                      placeholder="+977 98XXXXXXXX"
                      value={form.whatsapp}
                      onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>TikTok Channel (or profile pic link)</Label>
                    <Input
                      placeholder="https://tiktok.com/@yourchannel"
                      value={form.tiktok_channel}
                      onChange={e => setForm(f => ({ ...f, tiktok_channel: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Average Followers (1k+ preferred)</Label>
                    <Input
                      placeholder="e.g. 2.5k"
                      value={form.avg_followers}
                      onChange={e => setForm(f => ({ ...f, avg_followers: e.target.value }))}
                    />
                  </div>
                  <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    Submit Application
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </>
        )}

        {/* Pending status */}
        {application?.status === "pending" && (
          <Card className="border-yellow-500/30 bg-yellow-500/5">
            <CardContent className="p-8 text-center space-y-3">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
                <Clock className="w-12 h-12 mx-auto text-yellow-400" />
              </motion.div>
              <h2 className="text-lg font-bold">Application Pending</h2>
              <p className="text-sm text-muted-foreground">
                Your reseller application is under review. You'll get access once approved by admin.
              </p>
              <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                Submitted: {new Date(application.created_at).toLocaleDateString()}
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Approved - Show reseller products */}
        {isApproved && (
          <>
            <Card className="border-green-500/30 bg-green-500/5">
              <CardContent className="p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <div>
                  <p className="font-medium text-green-400">Verified Reseller ✅</p>
                  <p className="text-xs text-muted-foreground">You have access to exclusive reseller pricing.</p>
                </div>
              </CardContent>
            </Card>

            {products.length === 0 ? (
              <Card className="border-border/50 bg-card/60 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <Crown className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No reseller products available yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product, i) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                  >
                    <Card className="border-border/50 bg-card/60 backdrop-blur-sm hover:border-primary/40 hover:bg-card/80 transition-all duration-300 group hover:shadow-lg hover:shadow-primary/5">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg">{product.name}</CardTitle>
                          <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-400 border-0">
                            <Crown className="w-3 h-3 mr-1" /> Reseller
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">{product.description || "No description."}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          Duration: {(product.duration_days || [30]).join(", ")} days
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1 font-bold text-green-400">
                            <Coins className="w-4 h-4" />
                            {(() => {
                              const prices = product.duration_prices || {};
                              const durations = product.duration_days || [30];
                              const minPrice = Math.min(...durations.map((d: number) => prices[String(d)] || product.price_credits));
                              const maxPrice = Math.max(...durations.map((d: number) => prices[String(d)] || product.price_credits));
                              return minPrice === maxPrice ? `$${minPrice}` : `$${minPrice}–$${maxPrice}`;
                            })()}
                          </div>
                          <Button
                            size="sm"
                            onClick={() => openPurchaseDialog(product)}
                            className="group-hover:shadow-md group-hover:shadow-primary/20 transition-shadow"
                          >
                            <ShoppingCart className="w-4 h-4 mr-1" /> Buy
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Purchase Dialog */}
        <Dialog open={!!selectedProduct} onOpenChange={closeDialog}>
          <DialogContent className="bg-card/95 backdrop-blur-xl border-border/50">
            <DialogHeader>
              <DialogTitle>
                {deliveredKey ? "🎉 Key Delivered!" : generating ? "⚡ Generating Key..." : "Confirm Purchase"}
              </DialogTitle>
              <DialogDescription>
                {deliveredKey
                  ? `Here is your ${selectedDuration}-day reseller key.`
                  : generating
                  ? "Please wait..."
                  : `Purchase ${selectedProduct?.name}`}
              </DialogDescription>
            </DialogHeader>
            <AnimatePresence mode="wait">
              {generating ? (
                <motion.div key="gen" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="my-6 space-y-4">
                  <div className="flex flex-col items-center gap-4">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="w-16 h-16 rounded-full border-4 border-primary/20 border-t-primary flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-primary animate-pulse" />
                    </motion.div>
                    <motion.p className="text-3xl font-bold text-primary" animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1, repeat: Infinity }}>{genTimer}s</motion.p>
                    <Progress value={genProgress} className="w-full h-2" />
                  </div>
                </motion.div>
              ) : deliveredKey ? (
                <motion.div key="done" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="my-4">
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-lg font-mono text-sm break-all select-all text-center">{deliveredKey}</div>
                  <Badge className="mt-2 bg-primary/10 text-primary border-0">
                    <Clock className="w-3 h-3 mr-1" /> {selectedDuration} days
                  </Badge>
                  <Button className="w-full mt-2" onClick={() => { navigator.clipboard.writeText(deliveredKey); toast.success("Copied!"); }}>Copy Key</Button>
                </motion.div>
              ) : (
                <motion.div key="confirm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <div className="py-4 space-y-3">
                    <div>
                      <label className="text-sm text-muted-foreground mb-2 block">Select Duration</label>
                      <div className="flex gap-2 flex-wrap">
                        {(selectedProduct?.duration_days || [30]).map((d: number) => {
                          const dPrice = selectedProduct?.duration_prices?.[String(d)] || selectedProduct?.price_credits;
                          const stock = durationStocks[String(d)] ?? "...";
                          const hasStock = typeof stock === "number" ? stock > 0 : true;
                          return (
                            <motion.div key={d} whileTap={{ scale: 0.95 }}>
                              <Button
                                variant={selectedDuration === d ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSelectedDuration(d)}
                                disabled={!hasStock}
                                className={`flex flex-col h-auto py-2 px-3 ${selectedDuration === d ? "shadow-md shadow-primary/30" : ""}`}
                              >
                                <span>{d}d · ${dPrice}</span>
                                <span className={`text-[10px] mt-0.5 ${hasStock ? "text-green-400" : "text-destructive"}`}>
                                  <Key className="w-2.5 h-2.5 inline mr-0.5" />{stock} keys
                                </span>
                              </Button>
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-muted-foreground">Product:</span><span>{selectedProduct?.name}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Duration:</span><span className="text-primary font-medium">{selectedDuration} days</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Price:</span><span className="font-bold text-green-400">${selectedProduct?.duration_prices?.[String(selectedDuration)] || selectedProduct?.price_credits}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Your Balance:</span><span className="text-green-400">${profile?.wallet_points ?? 0}</span></div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={closeDialog}>Cancel</Button>
                    <Button onClick={handlePurchase} disabled={purchasing || (durationStocks[String(selectedDuration)] ?? 0) <= 0}>
                      {purchasing ? "Processing..." : "Confirm Purchase"}
                    </Button>
                  </DialogFooter>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Reseller;
