import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Crown, Clock, Loader2, Coins, Flame, Rocket,
  Target, Shield, TrendingUp, Gem, Zap, CheckCircle, XCircle, Send, Key,
} from "lucide-react";
import { motion } from "framer-motion";
import { AnimatedBackground } from "@/components/AnimatedBackground";

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
  const [applicationFee, setApplicationFee] = useState<number>(0);
  const [benefitsText, setBenefitsText] = useState<string>("");

  const isApproved = application?.status === "approved";

  useEffect(() => {
    fetchApplication();
    fetchFee();
    supabase.from("site_settings").select("value").eq("key", "reseller_benefits_text").maybeSingle()
      .then(({ data }) => setBenefitsText(data?.value || ""));
  }, [user]);

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

  const fetchFee = async () => {
    const { data } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "reseller_application_fee")
      .maybeSingle();
    setApplicationFee(Number(data?.value) || 0);
  };

  const handleSubmit = async () => {
    if (!user || !profile) return;
    if (!form.seller_name.trim() || !form.whatsapp.trim()) {
      toast.error("Seller Name and WhatsApp are required!");
      return;
    }

    // Check if user has enough credits for the fee
    if (applicationFee > 0 && (profile.wallet_points ?? 0) < applicationFee) {
      toast.error(`Insufficient credits! You need $${applicationFee} to submit application.`);
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
      // Deduct fee if applicable
      if (applicationFee > 0) {
        await supabase
          .from("profiles")
          .update({ wallet_points: (profile.wallet_points ?? 0) - applicationFee })
          .eq("user_id", user.id);
        refreshProfile();
      }
      toast.success("Application submitted! Wait for admin approval.");
      fetchApplication();
    }
    setSubmitting(false);
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
          <p className="text-muted-foreground">Become a reseller and get exclusive discounts on products.</p>
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

                  {applicationFee > 0 && (
                    <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-sm font-medium text-yellow-400">
                        💰 Application Fee: <span className="text-green-400 font-bold">${applicationFee}</span>
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        This amount will be deducted from your credit balance.
                      </p>
                    </div>
                  )}

                  <Button onClick={handleSubmit} disabled={submitting} className="w-full">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    Submit Application {applicationFee > 0 ? `($${applicationFee})` : ""}
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
                Your reseller application is under review. You'll get access to discounted pricing once approved.
              </p>
              <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">
                Submitted: {new Date(application.created_at).toLocaleDateString()}
              </Badge>
            </CardContent>
          </Card>
        )}

        {/* Approved - Show info about discount access */}
        {isApproved && (
          <Card className="border-green-500/30 bg-green-500/5">
            <CardContent className="p-6 space-y-3">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-6 h-6 text-green-400" />
                <div>
                  <p className="font-bold text-green-400 text-lg">Verified Reseller ✅</p>
                  <p className="text-sm text-muted-foreground">
                    You have access to exclusive discounted pricing on all products in the Store page.
                  </p>
                </div>
              </div>
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm">
                  🛒 Go to <span className="text-primary font-bold">Products</span> page to buy keys at your special reseller discount price!
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Reseller;
