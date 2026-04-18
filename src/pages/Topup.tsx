import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { LiveChat } from "@/components/LiveChat";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Coins, Upload, CheckCircle, Clock, Package, User, CreditCard, QrCode,
  AlertTriangle, Download, Server, ChevronRight, Gamepad2, Wallet,
} from "lucide-react";

const STORAGE_KEY = "topup_form_state";
function loadSavedState() {
  try { const r = localStorage.getItem(STORAGE_KEY); return r ? JSON.parse(r) : null; } catch { return null; }
}
function saveState(state: any) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
}

const ESEWA_GREEN = "#60d669";
const KHALTI_PURPLE = "#5c2d91";

const Topup = () => {
  const { user, profile } = useAuth();
  const [packages, setPackages] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [servers, setServers] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});

  const saved = loadSavedState();
  const [selectedGame, setSelectedGame] = useState<any>(saved?.selectedGame || null);
  const [selectedPkg, setSelectedPkg] = useState<any>(saved?.selectedPkg || null);
  const [selectedServer, setSelectedServer] = useState<any>(saved?.selectedServer || null);
  const [gameUid, setGameUid] = useState(saved?.gameUid || "");
  const [gameName, setGameName] = useState(saved?.gameName || "");

  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fakeWarning, setFakeWarning] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const proofRef = useRef<HTMLInputElement>(null);

  const [topupHistory, setTopupHistory] = useState<any[]>([]);

  useEffect(() => {
    saveState({ selectedGame, selectedPkg, selectedServer, gameUid, gameName });
  }, [selectedGame, selectedPkg, selectedServer, gameUid, gameName]);

  // Auto-save draft when user selects a package
  useEffect(() => {
    if (selectedPkg && gameUid && user?.id) {
      saveDraftHistory();
    }
  }, [selectedPkg?.id]);

  // Fetch user's topup history
  useEffect(() => {
    if (!user?.id) return;
    const fetchHistory = async () => {
      const { data } = await supabase.from("topup_history" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
      setTopupHistory(data || []);
    };
    fetchHistory();
  }, [user?.id, submitted]);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: pkgs }, { data: srvs }, { data: siteSettings }, { data: gms }] = await Promise.all([
        supabase.from("topup_packages").select("*").order("sort_order"),
        supabase.from("topup_servers").select("*").order("sort_order"),
        supabase.from("site_settings").select("*"),
        supabase.from("topup_games").select("*").order("sort_order"),
      ]);
      setPackages(pkgs || []);
      setServers(srvs || []);
      setGames(gms || []);
      const s: Record<string, string> = {};
      (siteSettings || []).forEach((x: any) => { s[x.key] = x.value || ""; });
      setSettings(s);

      if (saved?.selectedServer?.id) {
        const found = (srvs || []).find((srv: any) => srv.id === saved.selectedServer.id);
        if (found) setSelectedServer(found);
      }
      if (saved?.selectedPkg?.id) {
        const found = (pkgs || []).find((pkg: any) => pkg.id === saved.selectedPkg.id);
        if (found) setSelectedPkg(found);
      }
      if (saved?.selectedGame?.id) {
        const found = (gms || []).find((g: any) => g.id === saved.selectedGame.id);
        if (found) setSelectedGame(found);
      }
    };
    fetchData();
  }, []);

  const currency = settings["topup_currency"] || "USD";
  const currencySymbol = currency === "NPR" ? "Rs." : "$";
  const processingTime = settings["topup_processing_time"] || "5-30 minutes";

  // Payment methods derived from uploaded QRs
  const paymentMethods = [
    { key: "esewa", label: "eSewa", subtitle: "Scan to Pay", url: settings["esewa_qr_url"], color: "#60d669" },
    { key: "khalti", label: "Khalti", subtitle: "Scan to Pay", url: settings["khalti_qr_url"], color: "#5c2d91" },
    { key: "bank", label: "Bank Transfer", subtitle: "Scan to Pay", url: settings["bank_qr_url"], color: "#3b82f6" },
  ].filter(m => m.url);

  const selectedPaymentData = paymentMethods.find(m => m.key === selectedPayment);

  // Auto-select first payment method if none selected
  useEffect(() => {
    if (paymentMethods.length > 0 && !selectedPayment) {
      setSelectedPayment(paymentMethods[0].key);
    }
  }, [settings]);

  // Packages filtered by selected game
  const filteredPackages = selectedGame
    ? packages.filter(p => p.game_id === selectedGame.id)
    : packages;

  // Check if UID step is complete
  const uidStepComplete = gameUid.trim().length > 0 && gameName.trim().length > 0;

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let fakeSuspicion = 0;
    if (file.size < 10000) fakeSuspicion += 50;
    if (file.type === "image/png" && file.size < 50000) fakeSuspicion += 30;
    setFakeWarning(fakeSuspicion >= 50);
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  // Save draft to topup_history when user has selected key items
  const saveDraftHistory = async () => {
    if (!user?.id || !gameUid) return;
    try {
      await supabase.from("topup_history" as any).insert({
        user_id: user.id,
        game_name: selectedGame?.name || null,
        game_uid: gameUid,
        player_name: gameName || null,
        server_name: selectedServer?.name || null,
        package_label: selectedPkg?.label || null,
        package_price: selectedPkg?.price || 0,
        payment_method: selectedPayment || null,
        status: "draft",
      });
    } catch {}
  };

  const handleSubmit = async () => {
    if (!selectedPkg) { toast.error("Select a package"); return; }
    if (servers.length > 0 && !selectedServer) { toast.error("Select a server"); return; }
    if (!gameUid.trim() || !gameName.trim()) { toast.error("Enter your UID and Game Name"); return; }
    if (paymentMethods.length > 0 && !selectedPayment) { toast.error("Select a payment method"); return; }
    if (paymentMethods.length > 0 && !proofFile) { toast.error("Upload payment proof screenshot"); return; }

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
        proofUrl = path;
        supabase.functions.invoke("notify-payment-proof", {
          body: {
            game_uid: gameUid,
            game_name: gameName,
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
        payment_method: `qr_${selectedPayment}`,
        payment_proof_url: proofUrl,
        status: "pending",
        fake_score: fakeScore,
        server_id: selectedServer?.id || null,
        server_name: selectedServer?.name || null,
      });
      if (error) throw error;

      // Save to history as submitted
      if (user?.id) {
        await supabase.from("topup_history" as any).insert({
          user_id: user.id,
          game_name: selectedGame?.name || null,
          game_uid: gameUid,
          player_name: gameName || null,
          server_name: selectedServer?.name || null,
          package_label: selectedPkg.label,
          package_price: selectedPkg.price,
          payment_method: selectedPayment,
          status: "submitted",
        });
      }

      localStorage.removeItem(STORAGE_KEY);
      setSubmitted(true);
      toast.success("Request submitted! We'll process it soon 🎉");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    }
    setSubmitting(false);
  };

  const reset = () => {
    setSubmitted(false); setSelectedPkg(null); setSelectedServer(null);
    setGameUid(""); setGameName("");
    setProofFile(null); setProofPreview(null); setFakeWarning(false);
    setSelectedGame(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const stepOffset = servers.length > 0 ? 1 : 0;
  const gameOffset = games.length > 0 ? 1 : 0;

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <AnimatedBackground />
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4 relative z-10 max-w-sm w-full">
          <div className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-success" />
          </div>
          <h1 className="text-2xl font-bold">Order Placed! 🎉</h1>
          <p className="text-muted-foreground text-sm">Processing time: <strong>{processingTime}</strong></p>
          <div className="bg-card/80 rounded-2xl p-5 text-left space-y-3 border border-border/50 shadow-lg">
            <div className="flex items-center gap-2 pb-2 border-b border-border/50">
              <CheckCircle className="w-5 h-5 text-success" />
              <span className="font-semibold">Order Summary</span>
            </div>
            {[
              ["Player ID", gameUid],
              ["Nickname", gameName],
              ["Item", selectedPkg?.label],
              ["Price", `${currencySymbol}${selectedPkg?.price}`],
              ["Payment", selectedPaymentData?.label || "—"],
              ["Server", selectedServer ? `${selectedServer.flag} ${selectedServer.name}` : "—"],
            ].filter(([, v]) => v && v !== "—").map(([label, val]) => (
              <div key={label} className="flex justify-between text-sm">
                <span className="font-semibold text-foreground">{label}</span>
                <span className="text-muted-foreground">{val}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm pt-1">
              <span className="font-semibold">Status</span>
              <Badge variant="outline" className="text-warning border-warning/50">Pending</Badge>
            </div>
          </div>
          <Button onClick={reset} className="w-full">Submit Another Request</Button>
        </motion.div>
        <LiveChat />
      </div>
    );
  }

  // Topup on/off gate
  if (settings["topup_enabled"] === "false") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <AnimatedBackground />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4 relative z-10 max-w-sm w-full bg-card/80 border border-border/50 rounded-2xl p-8 backdrop-blur-md"
        >
          <div className="w-16 h-16 mx-auto rounded-full bg-warning/20 flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-warning" />
          </div>
          <h1 className="text-xl font-bold">Topup Temporarily Closed</h1>
          <p className="text-muted-foreground text-sm">
            The topup service is currently disabled. Please check back later.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AnimatedBackground />
      <div className="relative z-10 max-w-lg mx-auto px-4 py-8 space-y-5 pb-24">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center">
            <Coins className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Top Up</h1>
          <p className="text-muted-foreground text-sm">Fill in your details and complete payment</p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-full px-4 py-1.5 w-fit mx-auto">
            <Clock className="w-3 h-3" /> Processing: <strong>{processingTime}</strong>
          </div>
        </motion.div>

        {/* Game Selection */}
        {games.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-primary" /> Step 1: Select Game
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-2">
                {games.map((game) => (
                  <motion.button key={game.id} whileTap={{ scale: 0.95 }}
                    onClick={() => { setSelectedGame(game); setSelectedPkg(null); }}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      selectedGame?.id === game.id ? "border-primary bg-primary/10" : "border-border/50 bg-background/50 hover:border-primary/50"
                    }`}>
                    {game.image_url ? (
                      <img src={game.image_url} alt={game.name} className="w-10 h-10 object-contain mx-auto mb-1 rounded-lg" />
                    ) : (
                      <span className="text-3xl block mb-1">{game.emoji || "🎮"}</span>
                    )}
                    <p className="text-xs font-medium truncate">{game.name}</p>
                  </motion.button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Server Selection */}
        {servers.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Server className="w-4 h-4 text-primary" /> Step {1 + gameOffset}: Select Server
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {servers.map((srv) => (
                  <motion.button key={srv.id} whileTap={{ scale: 0.95 }}
                    onClick={() => { setSelectedServer(srv); setGameName(""); }}
                    className={`p-3 rounded-xl border-2 transition-all text-center ${
                      selectedServer?.id === srv.id ? "border-primary bg-primary/10" : "border-border/50 bg-background/50 hover:border-primary/50"
                    }`}>
                    {srv.logo_url
                      ? <img src={srv.logo_url} alt={srv.name} className="w-8 h-8 object-contain mx-auto mb-1 rounded" />
                      : <span className="text-2xl block mb-1">{srv.flag || "🌐"}</span>}
                    <p className="text-xs font-medium truncate">{srv.name}</p>
                    {selectedServer?.id === srv.id && <CheckCircle className="w-3 h-3 text-primary mx-auto mt-1" />}
                  </motion.button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* UID & Game Name */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="w-4 h-4 text-primary" /> Step {1 + gameOffset + stepOffset}: Enter Your Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  {selectedGame?.uid_label || "Game UID"}
                </label>
                <Input
                  placeholder={`Enter your ${selectedGame?.uid_label || "Game UID"}...`}
                  value={gameUid}
                  onChange={(e) => setGameUid(e.target.value)}
                  className="bg-background/50 font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">
                  {selectedGame?.id_label || "Game Name / Player Name"}
                </label>
                <Input
                  placeholder="Enter your in-game name..."
                  value={gameName}
                  onChange={(e) => setGameName(e.target.value)}
                  className="bg-background/50"
                />
              </div>
              {gameUid && gameName && (
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                  className="bg-success/10 border border-success/30 rounded-xl p-3 flex items-center gap-2 text-success text-sm">
                  <CheckCircle className="w-4 h-4" /> Ready — {gameName} ({gameUid})
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Package Selection */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="w-4 h-4 text-primary" /> Step {2 + gameOffset + stepOffset}: Choose Package
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {filteredPackages.map((pkg) => (
                <motion.button key={pkg.id} whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedPkg(pkg)}
                  className={`text-left p-3 rounded-xl border-2 transition-all ${
                    selectedPkg?.id === pkg.id ? "border-primary bg-primary/10" : "border-border/50 bg-background/50 hover:border-primary/50"
                  }`}>
                  {pkg.image_url
                    ? <img src={pkg.image_url} alt={pkg.label} className="w-full h-16 object-cover rounded-lg mb-2" />
                    : <div className="w-full h-14 rounded-lg mb-2 bg-primary/5 flex items-center justify-center text-2xl">{pkg.emoji || "💎"}</div>}
                  <p className="font-semibold text-sm">{pkg.label}</p>
                  {pkg.diamonds && <p className="text-xs text-muted-foreground">{pkg.emoji || "💎"} {pkg.diamonds}</p>}
                  {pkg.description && <p className="text-xs text-muted-foreground truncate">{pkg.description}</p>}
                  <p className="text-primary font-bold text-sm mt-1">{currencySymbol}{pkg.price}</p>
                  {selectedPkg?.id === pkg.id && (
                    <div className="flex items-center gap-1 text-primary text-xs mt-1">
                      <CheckCircle className="w-3 h-3" /> Selected
                    </div>
                  )}
                </motion.button>
              ))}
              {filteredPackages.length === 0 && (
                <div className="col-span-2 text-center py-6 text-muted-foreground text-sm">
                  {selectedGame ? `No packages for ${selectedGame.name} yet.` : "No packages available."}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Step: Select Payment Method (like screenshot) */}
        {paymentMethods.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {3 + gameOffset + stepOffset}
                  </div>
                  <CardTitle className="text-base">Select the Payment You Want to Use</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                {paymentMethods.map((method) => (
                  <motion.button key={method.key} whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedPayment(method.key)}
                    className={`w-full flex items-center justify-between px-4 py-3.5 rounded-xl border-2 transition-all ${
                      selectedPayment === method.key
                        ? "border-primary bg-primary/5"
                        : "border-border/50 bg-background/50 hover:border-primary/30"
                    }`}>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg font-bold"
                        style={{ backgroundColor: `${method.color}20`, border: `1.5px solid ${method.color}60` }}>
                        {method.key === "esewa" ? "e" : method.key === "khalti" ? "K" : "🏦"}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-sm">{method.label}</p>
                        <p className="text-xs text-muted-foreground">{method.subtitle}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{currencySymbol}{selectedPkg?.price || "—"}</span>
                      {selectedPayment === method.key && (
                        <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                    </div>
                  </motion.button>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* QR Code + Upload Proof */}
        {uidStepComplete && selectedPkg && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                    {4 + gameOffset + stepOffset}
                  </div>
                  <CardTitle className="text-base">Scan QR & Upload Proof</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedPaymentData?.url ? (
                  <div className="text-center space-y-3">
                    <img src={selectedPaymentData.url} alt="QR Code"
                      className="w-52 h-52 object-contain mx-auto rounded-xl border border-border/50 bg-white p-2 shadow-md" />
                    <p className="text-xs text-muted-foreground">
                      Pay <strong className="text-foreground">{currencySymbol}{selectedPkg?.price}</strong> via {selectedPaymentData.label}
                    </p>
                    <Button variant="outline" size="sm"
                      onClick={() => { const a = document.createElement("a"); a.href = selectedPaymentData.url; a.download = `${selectedPayment}_qr.png`; a.target = "_blank"; a.click(); }}>
                      <Download className="w-3 h-3 mr-1" /> Download QR
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <QrCode className="w-10 h-10 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">QR not set for this method</p>
                  </div>
                )}

                <div className="border-2 border-dashed border-border/50 rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 transition-all"
                  onClick={() => proofRef.current?.click()}>
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
                  <input ref={proofRef} type="file" accept="image/*" className="hidden" onChange={handleProofChange} />
                </div>

                {fakeWarning && (
                  <div className="flex items-center gap-2 text-warning text-sm bg-warning/10 rounded-lg p-3">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> Upload a real payment screenshot.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Order Summary + Submit (like "Place Order" in screenshot) */}
        {uidStepComplete && selectedPkg && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-primary/30 bg-card/70 backdrop-blur-md shadow-lg">
              <CardContent className="pt-5 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Place Order</h3>
                    <p className="text-xs text-muted-foreground">Review your order details</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    ["Player ID", gameUid],
                    ["Nickname", gameName],
                    ["Item", selectedPkg?.label],
                    [`Price`, `${currencySymbol}${selectedPkg?.price}`],
                    ["Payment", selectedPaymentData?.label || "—"],
                    selectedServer ? ["Server", `${selectedServer.flag} ${selectedServer.name}`] : null,
                  ].filter(Boolean).map(([label, val]) => (
                    <div key={label as string} className="flex justify-between">
                      <span className="font-semibold">{label}</span>
                      <span className="text-muted-foreground">{val}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={reset}>Cancel</Button>
                  <Button className="flex-1 font-semibold" onClick={handleSubmit}
                    disabled={submitting || (paymentMethods.length > 0 && !proofFile)}>
                    {submitting ? "Submitting..." : "Pay Now 💳"}
                  </Button>
                </div>
                <p className="text-center text-xs text-muted-foreground">⏱ Processing: {processingTime}</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Initial CTA when nothing selected yet */}
        {!uidStepComplete && !selectedPkg && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <p className="text-center text-xs text-muted-foreground">
              Complete all steps above to place your order
            </p>
          </motion.div>
        )}

        {/* User's Topup History */}
        {user && topupHistory.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Your History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                {topupHistory.map((h: any) => (
                  <div key={h.id} className={`p-3 rounded-lg border text-sm ${
                    h.status === "submitted" ? "border-success/30 bg-success/5" : "border-border/50 bg-muted/30"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div className="space-y-0.5">
                        {h.game_name && <p className="text-xs text-muted-foreground">{h.game_name}</p>}
                        <p className="font-mono text-xs">{h.game_uid}</p>
                        {h.player_name && <p className="text-xs text-primary">{h.player_name}</p>}
                        {h.package_label && <p className="font-medium text-xs">{h.package_label} · {currencySymbol}{h.package_price}</p>}
                      </div>
                      <div className="text-right">
                        <Badge variant={h.status === "submitted" ? "default" : "outline"} className="text-[10px] capitalize">
                          {h.status}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(h.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {h.status === "draft" && h.game_uid && (
                      <Button variant="ghost" size="sm" className="w-full mt-2 h-7 text-xs"
                        onClick={() => {
                          setGameUid(h.game_uid);
                          if (h.player_name) setGameName(h.player_name);
                        }}>
                        Resume this order →
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
      <LiveChat />
    </div>
  );
};

export default Topup;
