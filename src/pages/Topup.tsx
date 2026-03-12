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
  Coins, Upload, CheckCircle, Clock, Package, User, CreditCard, QrCode,
  AlertTriangle, Download, Server, ChevronRight, Gamepad2,
} from "lucide-react";

// Realistic game name prefixes for UID verification simulation
const GAME_NAME_PREFIXES = ["x","Shadow","Dark","Pro","Elite","King","Fire","Ice","Storm","Wolf","Dragon","Night","Ghost","Ace","Star"];
const GAME_NAME_SUFFIXES = ["GG","Gaming","YT","FF","BR","99","007","XD","FTW","EZ"];

function simulateGameName(uid: string): string {
  // Use UID as seed for consistent results
  const seed = uid.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const pre = GAME_NAME_PREFIXES[seed % GAME_NAME_PREFIXES.length];
  const suf = GAME_NAME_SUFFIXES[(seed * 7) % GAME_NAME_SUFFIXES.length];
  const num = (seed % 9000) + 1000;
  return `${pre}${suf}${num}`;
}

const STORAGE_KEY = "topup_form_state";

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveState(state: any) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

const Topup = () => {
  const { user, profile } = useAuth();
  const [packages, setPackages] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  // Restore from localStorage
  const saved = loadSavedState();
  const [selectedPkg, setSelectedPkg] = useState<any>(saved?.selectedPkg || null);
  const [selectedServer, setSelectedServer] = useState<any>(saved?.selectedServer || null);
  const [gameUid, setGameUid] = useState(saved?.gameUid || "");
  const [gameName, setGameName] = useState(saved?.gameName || "");
  const [uidVerified, setUidVerified] = useState(saved?.uidVerified || false);

  const [verifyLoading, setVerifyLoading] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fakeWarning, setFakeWarning] = useState(false);
  const [selectedQr, setSelectedQr] = useState<"esewa" | "khalti" | "bank">("esewa");
  const proofRef = useRef<HTMLInputElement>(null);

  // Persist form state to localStorage whenever key fields change
  useEffect(() => {
    saveState({ selectedPkg, selectedServer, gameUid, gameName, uidVerified });
  }, [selectedPkg, selectedServer, gameUid, gameName, uidVerified]);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: pkgs }, { data: srvs }, { data: siteSettings }] = await Promise.all([
        supabase.from("topup_packages").select("*").order("sort_order"),
        supabase.from("topup_servers").select("*").order("sort_order"),
        supabase.from("site_settings").select("*"),
      ]);
      setPackages(pkgs || []);
      setServers(srvs || []);
      const s: Record<string, string> = {};
      (siteSettings || []).forEach((x: any) => { s[x.key] = x.value || ""; });
      setSettings(s);

      // Restore server object from saved id (since we have full list now)
      if (saved?.selectedServer?.id) {
        const found = (srvs || []).find((srv: any) => srv.id === saved.selectedServer.id);
        if (found) setSelectedServer(found);
      }
      if (saved?.selectedPkg?.id) {
        const found = (pkgs || []).find((pkg: any) => pkg.id === saved.selectedPkg.id);
        if (found) setSelectedPkg(found);
      }
    };
    fetchData();
  }, []);

  const paymentMethod = settings["topup_payment_method"] || "qr";
  const processingTime = settings["topup_processing_time"] || "5-30 minutes";
  const currency = settings["topup_currency"] || "USD";
  const currencySymbol = currency === "NPR" ? "Rs." : "$";

  const qrOptions = [
    { key: "esewa" as const, label: "eSewa", color: "text-green-500", bg: "bg-green-500/10 border-green-500/40", url: settings["esewa_qr_url"] },
    { key: "khalti" as const, label: "Khalti", color: "text-purple-500", bg: "bg-purple-500/10 border-purple-500/40", url: settings["khalti_qr_url"] },
    { key: "bank" as const, label: "Bank", color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/40", url: settings["bank_qr_url"] },
  ].filter(q => q.url);

  const activeQrUrl = qrOptions.find(q => q.key === selectedQr)?.url || qrOptions[0]?.url || "";

  const handleVerifyUid = async () => {
    if (!gameUid.trim()) { toast.error("Enter your Game UID"); return; }
    if (servers.length > 0 && !selectedServer) { toast.error("Select a server first"); return; }
    setVerifyLoading(true);
    // Simulate UID lookup with delay
    await new Promise(r => setTimeout(r, 1400));
    const name = simulateGameName(gameUid.trim());
    setGameName(name);
    setUidVerified(true);
    setVerifyLoading(false);
    toast.success(`✅ UID Verified! Game name: ${name}`);
  };

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let fakeSuspicion = 0;
    if (file.size < 10000) fakeSuspicion += 50;
    if (file.type === "image/png" && file.size < 50000) fakeSuspicion += 30;
    if (!file.name.includes("screenshot") && file.size < 30000) fakeSuspicion += 20;
    setFakeWarning(fakeSuspicion >= 50);
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const handleDownloadQr = () => {
    if (!activeQrUrl) return;
    const a = document.createElement("a");
    a.href = activeQrUrl;
    a.download = `${selectedQr}_qr.png`;
    a.target = "_blank";
    a.click();
  };

  const handleSubmit = async () => {
    if (!selectedPkg) { toast.error("Select a package"); return; }
    if (servers.length > 0 && !selectedServer) { toast.error("Select a server"); return; }
    if (!uidVerified || !gameUid.trim()) { toast.error("Verify your UID first"); return; }
    if (paymentMethod === "qr" && !proofFile) { toast.error("Upload payment proof screenshot"); return; }

    setSubmitting(true);
    try {
      let proofUrl: string | null = null;
      let fakeScore = 0;

      if (proofFile) {
        if (proofFile.size < 10000) fakeScore += 50;
        if (proofFile.type === "image/png" && proofFile.size < 50000) fakeScore += 30;

        const path = `proof_${Date.now()}_${proofFile.name}`;
        const { error: uploadErr } = await supabase.storage.from("payment-proofs").upload(path, proofFile);
        if (uploadErr) throw uploadErr;
        // Store storage path, not a signed URL (signed URLs expire)
        proofUrl = path;

        supabase.functions.invoke("notify-payment-proof", {
          body: {
            game_uid: gameUid,
            game_name: gameName || `User@${gameUid}`,
            server: selectedServer?.name || "Unknown",
            package: selectedPkg.label,
            amount: selectedPkg.price,
            proof_storage_path: path,
            user_email: user?.email || "Guest",
          },
        }).catch(() => {});
      }

      const { error } = await supabase.from("topup_requests").insert({
        user_id: user?.id || null,
        game_uid: gameUid,
        game_name: gameName || `User@${gameUid}`,
        product_name: selectedPkg.label,
        duration_label: selectedPkg.label,
        amount_paid: selectedPkg.price,
        payment_method: paymentMethod === "qr" ? `qr_${selectedQr}` : "points",
        payment_proof_url: proofUrl,
        status: "pending",
        fake_score: fakeScore,
        server_id: selectedServer?.id || null,
        server_name: selectedServer?.name || null,
      });
      if (error) throw error;

      // Clear saved state after successful submit
      localStorage.removeItem(STORAGE_KEY);
      setSubmitted(true);
      toast.success("Request submitted! We'll process it soon 🎉");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    }
    setSubmitting(false);
  };

  const reset = () => {
    setSubmitted(false);
    setSelectedPkg(null);
    setSelectedServer(null);
    setGameUid("");
    setGameName("");
    setUidVerified(false);
    setProofFile(null);
    setProofPreview(null);
    setFakeWarning(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <AnimatedBackground />
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4 relative z-10 max-w-sm"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold">Request Submitted! 🎉</h1>
          <p className="text-muted-foreground text-sm">
            Your topup request has been received.<br />
            Processing time: <strong>{processingTime}</strong>
          </p>
          <div className="bg-card/50 rounded-xl p-4 text-left space-y-2 border border-border/50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Package</span>
              <span className="font-medium">{selectedPkg?.label}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">UID</span>
              <span className="font-mono">{gameUid}</span>
            </div>
            {gameName && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Game Name</span>
                <span className="text-primary font-medium">{gameName}</span>
              </div>
            )}
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Server</span>
              <span>{selectedServer?.flag} {selectedServer?.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="outline" className="text-warning border-warning/50">Pending</Badge>
            </div>
          </div>
          <Button onClick={reset} className="w-full">Submit Another Request</Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AnimatedBackground />
      <div className="relative z-10 max-w-lg mx-auto px-4 py-8 space-y-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center">
            <Coins className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Top Up</h1>
          <p className="text-muted-foreground text-sm">Fill in your details and complete payment</p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-full px-4 py-1.5 w-fit mx-auto">
            <Clock className="w-3 h-3" />
            Processing: <strong>{processingTime}</strong>
          </div>
        </motion.div>

        {/* Step 1: Server Selection */}
        {servers.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Server className="w-4 h-4 text-primary" /> Step 1: Select Server
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {servers.map((srv) => (
                  <motion.button
                    key={srv.id}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setSelectedServer(srv); setUidVerified(false); setGameName(""); }}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      selectedServer?.id === srv.id
                        ? "border-primary bg-primary/10"
                        : "border-border/50 bg-background/50 hover:border-primary/50"
                    }`}
                  >
                    {srv.logo_url ? (
                      <img src={srv.logo_url} alt={srv.name} className="w-8 h-8 object-contain mx-auto mb-1 rounded" />
                    ) : (
                      <span className="text-2xl block mb-1">{srv.flag || "🌐"}</span>
                    )}
                    <p className="text-xs font-medium truncate">{srv.name}</p>
                    {selectedServer?.id === srv.id && (
                      <CheckCircle className="w-3 h-3 text-primary mx-auto mt-1" />
                    )}
                  </motion.button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Step 2: UID */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> {servers.length > 0 ? "Step 2:" : "Step 1:"} Enter Game UID
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="Your Game UID..."
                  value={gameUid}
                  onChange={(e) => { setGameUid(e.target.value); setUidVerified(false); setGameName(""); }}
                  className="bg-background/50 font-mono"
                />
                <Button
                  variant={uidVerified ? "outline" : "default"}
                  onClick={handleVerifyUid}
                  disabled={verifyLoading || !gameUid.trim()}
                  className="shrink-0"
                >
                  {verifyLoading ? (
                    <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />Checking...</span>
                  ) : uidVerified ? "✓ Done" : "Verify"}
                </Button>
              </div>
              {uidVerified && gameName && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-success/10 border border-success/30 rounded-xl p-3 space-y-1"
                >
                  <div className="flex items-center gap-2 text-success text-sm font-medium">
                    <CheckCircle className="w-4 h-4" /> UID Verified ✅
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p>UID: <span className="font-mono text-foreground">{gameUid}</span></p>
                    <div className="flex items-center gap-1.5">
                      <Gamepad2 className="w-3 h-3 text-primary" />
                      <span>Game Name: <span className="font-semibold text-primary text-sm">{gameName}</span></span>
                    </div>
                    {selectedServer && <p>Server: <span className="text-foreground">{selectedServer.flag} {selectedServer.name}</span></p>}
                    <p>Status: <span className="text-success font-medium">Active ✅</span></p>
                  </div>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Step 3: Package Selection */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" /> {servers.length > 0 ? "Step 3:" : "Step 2:"} Choose Package
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {packages.map((pkg) => (
                <motion.button
                  key={pkg.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedPkg(pkg)}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${
                    selectedPkg?.id === pkg.id
                      ? "border-primary bg-primary/10"
                      : "border-border/50 bg-background/50 hover:border-primary/50"
                  }`}
                >
                  {pkg.image_url ? (
                    <img src={pkg.image_url} alt={pkg.label} className="w-full h-16 object-cover rounded-lg mb-2" />
                  ) : (
                    <div className="w-full h-16 rounded-lg mb-2 bg-primary/5 flex items-center justify-center">
                      <Package className="w-6 h-6 text-primary/40" />
                    </div>
                  )}
                  <p className="font-semibold text-sm">{pkg.label}</p>
                  {pkg.description && <p className="text-xs text-muted-foreground truncate">{pkg.description}</p>}
                  {pkg.duration_days && <p className="text-xs text-muted-foreground">{pkg.duration_days} days</p>}
                  <p className="text-primary font-bold text-sm mt-1">{currencySymbol}{pkg.price}</p>
                  {selectedPkg?.id === pkg.id && (
                    <div className="flex items-center gap-1 text-primary text-xs mt-1">
                      <CheckCircle className="w-3 h-3" /> Selected
                    </div>
                  )}
                </motion.button>
              ))}
              {packages.length === 0 && (
                <div className="col-span-2 text-center py-6 text-muted-foreground text-sm">
                  No packages available yet.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Step 4: Payment */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                {paymentMethod === "qr" ? <QrCode className="w-4 h-4 text-primary" /> : <CreditCard className="w-4 h-4 text-primary" />}
                {servers.length > 0 ? "Step 4:" : "Step 3:"} {paymentMethod === "qr" ? "Pay & Upload Proof" : "Pay with Points"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentMethod === "qr" ? (
                <>
                  {/* QR Method Tabs */}
                  {qrOptions.length > 0 && (
                    <div className="flex gap-2">
                      {qrOptions.map((opt) => (
                        <button
                          key={opt.key}
                          onClick={() => setSelectedQr(opt.key)}
                          className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                            selectedQr === opt.key
                              ? `${opt.bg} ${opt.color} border-current`
                              : "border-border/50 text-muted-foreground hover:border-primary/40"
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeQrUrl ? (
                    <div className="text-center space-y-3">
                      <img
                        src={activeQrUrl}
                        alt="Payment QR Code"
                        className="w-52 h-52 object-contain mx-auto rounded-xl border border-border/50 bg-white p-2"
                      />
                      <div className="text-xs text-muted-foreground">
                        Amount: <strong className="text-foreground">{currencySymbol}{selectedPkg?.price || "—"}</strong>
                      </div>
                      <Button variant="outline" size="sm" onClick={handleDownloadQr}>
                        <Download className="w-3 h-3 mr-1" /> Download QR
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <QrCode className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">QR code will be set by admin</p>
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
                      Image looks suspicious. Upload a real payment screenshot.
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6 space-y-2">
                  <CreditCard className="w-10 h-10 mx-auto text-primary/60" />
                  <p className="text-sm text-muted-foreground">
                    Your balance: <strong className="text-primary">{profile?.wallet_points ?? 0} pts</strong>
                  </p>
                  <p className="text-sm">
                    Package costs: <strong>{selectedPkg?.price || "—"} pts</strong>
                  </p>
                  {selectedPkg && profile && profile.wallet_points < selectedPkg.price && (
                    <p className="text-xs text-destructive">Insufficient points</p>
                  )}
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
            disabled={submitting || !selectedPkg || !uidVerified || (servers.length > 0 && !selectedServer)}
          >
            {submitting ? "Submitting..." : (
              <span className="flex items-center gap-2">
                Confirm Top Up Request <ChevronRight className="w-4 h-4" />
              </span>
            )}
          </Button>
          <p className="text-center text-xs text-muted-foreground mt-2">
            ⏱ Processing time: {processingTime}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Topup;
