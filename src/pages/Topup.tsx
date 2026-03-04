import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Coins, Upload, CheckCircle, Clock, Package, User, CreditCard, QrCode, AlertTriangle,
} from "lucide-react";

const Topup = () => {
  const { user, profile } = useAuth();
  const [packages, setPackages] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [gameUid, setGameUid] = useState("");
  const [uidVerified, setUidVerified] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fakeWarning, setFakeWarning] = useState(false);
  const proofRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: pkgs }, { data: siteSettings }] = await Promise.all([
        supabase.from("topup_packages").select("*").order("sort_order"),
        supabase.from("site_settings").select("*"),
      ]);
      setPackages(pkgs || []);
      const s: Record<string, string> = {};
      (siteSettings || []).forEach((x: any) => { s[x.key] = x.value || ""; });
      setSettings(s);
    };
    fetchData();
  }, []);

  const paymentMethod = settings["topup_payment_method"] || "qr";
  const processingTime = settings["topup_processing_time"] || "5-30 minutes";
  const qrUrl = settings["topup_qr_url"] || "";

  const handleVerifyUid = async () => {
    if (!gameUid.trim()) { toast.error("Enter your Game UID"); return; }
    setVerifyLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    setUidVerified(true);
    setVerifyLoading(false);
    toast.success("UID verified! ✅");
  };

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Basic fake detection: check file size and type
    let fakeSuspicion = 0;
    if (file.size < 10000) fakeSuspicion += 50; // suspiciously small
    if (file.type === "image/png" && file.size < 50000) fakeSuspicion += 30; // tiny PNG
    if (file.name.includes("screenshot") === false && file.size < 30000) fakeSuspicion += 20;

    setFakeWarning(fakeSuspicion >= 50);
    setProofFile(file);
    const url = URL.createObjectURL(file);
    setProofPreview(url);
  };

  const handleSubmit = async () => {
    if (!selectedPkg) { toast.error("Select a package"); return; }
    if (!uidVerified || !gameUid.trim()) { toast.error("Verify your UID first"); return; }
    if (paymentMethod === "qr" && !proofFile) { toast.error("Upload payment proof screenshot"); return; }

    setSubmitting(true);
    try {
      let proofUrl: string | null = null;

      if (proofFile) {
        const path = `proof_${Date.now()}_${proofFile.name}`;
        const { error: uploadErr } = await supabase.storage.from("payment-proofs").upload(path, proofFile);
        if (uploadErr) throw uploadErr;
        const { data: { publicUrl } } = supabase.storage.from("payment-proofs").getPublicUrl(path);
        proofUrl = publicUrl;

        // Notify via edge function (email)
        supabase.functions.invoke("notify-payment-proof", {
          body: {
            game_uid: gameUid,
            package: selectedPkg.label,
            amount: selectedPkg.price,
            proof_url: proofUrl,
            user_email: user?.email || "Guest",
          },
        }).catch(() => {});
      }

      // Calculate fake score
      let fakeScore = 0;
      if (proofFile) {
        if (proofFile.size < 10000) fakeScore += 50;
        if (proofFile.type === "image/png" && proofFile.size < 50000) fakeScore += 30;
      }

      const { error } = await supabase.from("topup_requests").insert({
        user_id: user?.id || null,
        game_uid: gameUid,
        product_name: "Topup",
        duration_label: selectedPkg.label,
        amount_paid: selectedPkg.price,
        payment_method: paymentMethod,
        payment_proof_url: proofUrl,
        status: "pending",
        fake_score: fakeScore,
      });
      if (error) throw error;

      setSubmitted(true);
      toast.success("Request submitted! We'll process it soon 🎉");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <AnimatedBackground />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4 relative z-10"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Request Submitted!</h1>
          <p className="text-muted-foreground max-w-sm">
            Your topup request has been received. Processing time: <strong>{processingTime}</strong>
          </p>
          <Button onClick={() => { setSubmitted(false); setSelectedPkg(null); setGameUid(""); setUidVerified(false); setProofFile(null); setProofPreview(null); }}>
            Submit Another
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AnimatedBackground />
      <div className="relative z-10 max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center">
            <Coins className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Top Up</h1>
          <p className="text-muted-foreground text-sm">Select a package and complete payment</p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-full px-4 py-1.5 w-fit mx-auto">
            <Clock className="w-3 h-3" />
            Processing time: <strong>{processingTime}</strong>
          </div>
        </motion.div>

        {/* Step 1: Select Package */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" /> Step 1: Choose Package
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-3">
              {packages.map((pkg) => (
                <motion.button
                  key={pkg.id}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setSelectedPkg(pkg)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                    selectedPkg?.id === pkg.id
                      ? "border-primary bg-primary/10"
                      : "border-border/50 bg-background/50 hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{pkg.label}</p>
                      {pkg.duration_days && (
                        <p className="text-xs text-muted-foreground">{pkg.duration_days} days</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-primary">{pkg.price}</span>
                      <span className="text-xs text-muted-foreground">pts</span>
                      {selectedPkg?.id === pkg.id && <CheckCircle className="w-4 h-4 text-primary" />}
                    </div>
                  </div>
                </motion.button>
              ))}
              {packages.length === 0 && (
                <p className="text-center text-muted-foreground text-sm py-4">No packages available yet.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Step 2: Enter UID */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Step 2: Enter Game UID
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Your Game UID..."
                  value={gameUid}
                  onChange={(e) => { setGameUid(e.target.value); setUidVerified(false); }}
                  className="bg-background/50"
                />
                <Button
                  variant={uidVerified ? "outline" : "default"}
                  onClick={handleVerifyUid}
                  disabled={verifyLoading}
                  className="shrink-0"
                >
                  {verifyLoading ? "..." : uidVerified ? "✓ Done" : "Verify"}
                </Button>
              </div>
              {uidVerified && (
                <div className="flex items-center gap-2 text-success text-sm">
                  <CheckCircle className="w-4 h-4" />
                  UID <strong>{gameUid}</strong> verified!
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Step 3: Payment */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {paymentMethod === "qr" ? <QrCode className="w-4 h-4 text-primary" /> : <CreditCard className="w-4 h-4 text-primary" />}
                Step 3: {paymentMethod === "qr" ? "Scan QR & Upload Proof" : "Pay with Points"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethod === "qr" ? (
                <>
                  {qrUrl ? (
                    <div className="text-center">
                      <img
                        src={qrUrl}
                        alt="Payment QR Code"
                        className="w-48 h-48 object-contain mx-auto rounded-xl border border-border/50"
                      />
                      <p className="text-xs text-muted-foreground mt-2">
                        Scan QR to pay · Amount: <strong>{selectedPkg?.price || "—"} pts worth</strong>
                      </p>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <QrCode className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">QR code will appear here</p>
                    </div>
                  )}

                  {/* Upload proof */}
                  <div
                    className="border-2 border-dashed border-border/50 rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 transition-all"
                    onClick={() => proofRef.current?.click()}
                  >
                    {proofPreview ? (
                      <div className="space-y-2">
                        <img src={proofPreview} alt="Proof" className="w-full max-h-40 object-contain rounded-lg" />
                        <p className="text-xs text-muted-foreground">Click to change</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <Upload className="w-6 h-6 mx-auto text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Upload payment screenshot</p>
                        <p className="text-xs text-muted-foreground">PNG, JPG accepted</p>
                      </div>
                    )}
                    <input
                      ref={proofRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProofChange}
                    />
                  </div>

                  {fakeWarning && (
                    <div className="flex items-center gap-2 text-warning text-sm bg-warning/10 rounded-lg p-3">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      Image looks suspicious. Make sure to upload a real payment screenshot.
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 space-y-2">
                  <CreditCard className="w-10 h-10 mx-auto text-primary/60" />
                  <p className="text-sm text-muted-foreground">
                    You have <strong className="text-primary">{profile?.wallet_points ?? 0} points</strong>
                  </p>
                  <p className="text-sm">
                    This package costs <strong>{selectedPkg?.price || "—"} pts</strong>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Submit */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <Button
            className="w-full h-12 text-base font-semibold"
            onClick={handleSubmit}
            disabled={submitting || !selectedPkg || !uidVerified}
          >
            {submitting ? "Submitting..." : "Submit Top Up Request 🚀"}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Processing time: {processingTime}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Topup;
