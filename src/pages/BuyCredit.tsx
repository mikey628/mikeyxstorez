import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  CreditCard, Upload, CheckCircle, Clock, Download, QrCode,
  AlertTriangle, DollarSign, Wallet,
} from "lucide-react";

const BuyCredit = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [packages, setPackages] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [selectedPkg, setSelectedPkg] = useState<any>(null);
  const [selectedPayment, setSelectedPayment] = useState<string>("");
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fakeWarning, setFakeWarning] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const proofRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: pkgs }, { data: siteSettings }] = await Promise.all([
        supabase.from("credit_packages" as any).select("*").eq("is_active", true).order("sort_order"),
        supabase.from("site_settings").select("*"),
      ]);
      setPackages(pkgs || []);
      const s: Record<string, string> = {};
      (siteSettings || []).forEach((x: any) => { s[x.key] = x.value || ""; });
      setSettings(s);
    };
    fetchData();
  }, []);

  // Fetch user's credit requests
  useEffect(() => {
    if (!user?.id) return;
    const fetchRequests = async () => {
      const { data } = await supabase.from("credit_requests" as any).select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20);
      setMyRequests(data || []);
    };
    fetchRequests();
  }, [user?.id, submitted]);

  const currency = settings["topup_currency"] || "USD";
  const currencySymbol = currency === "NPR" ? "Rs." : "$";
  const processingTime = settings["topup_processing_time"] || "5-30 minutes";

  const paymentMethods = [
    { key: "esewa", label: "eSewa", subtitle: "Scan to Pay", url: settings["esewa_qr_url"], color: "#60d669" },
    { key: "khalti", label: "Khalti", subtitle: "Scan to Pay", url: settings["khalti_qr_url"], color: "#5c2d91" },
    { key: "bank", label: "Bank Transfer", subtitle: "Scan to Pay", url: settings["bank_qr_url"], color: "#3b82f6" },
  ].filter(m => m.url);

  const selectedPaymentData = paymentMethods.find(m => m.key === selectedPayment);

  useEffect(() => {
    if (paymentMethods.length > 0 && !selectedPayment) {
      setSelectedPayment(paymentMethods[0].key);
    }
  }, [settings]);

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

  const handleSubmit = async () => {
    if (!selectedPkg) { toast.error("Select a credit package"); return; }
    if (paymentMethods.length > 0 && !selectedPayment) { toast.error("Select a payment method"); return; }
    if (paymentMethods.length > 0 && !proofFile) { toast.error("Upload payment proof screenshot"); return; }
    if (!user) { toast.error("Please sign in first"); return; }

    setSubmitting(true);
    try {
      let proofUrl: string | null = null;

      if (proofFile) {
        const path = `credit_proof_${Date.now()}_${proofFile.name}`;
        const { error: uploadErr } = await supabase.storage.from("payment-proofs").upload(path, proofFile);
        if (uploadErr) throw uploadErr;
        proofUrl = path;
      }

      const { error } = await supabase.from("credit_requests" as any).insert({
        user_id: user.id,
        package_id: selectedPkg.id,
        package_amount: selectedPkg.amount,
        amount_paid: selectedPkg.price,
        payment_method: `qr_${selectedPayment}`,
        payment_proof_url: proofUrl,
        status: "pending",
      });
      if (error) throw error;

      setSubmitted(true);
      toast.success("Credit purchase request submitted! 🎉");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    }
    setSubmitting(false);
  };

  const reset = () => {
    setSubmitted(false);
    setSelectedPkg(null);
    setProofFile(null);
    setProofPreview(null);
    setFakeWarning(false);
  };

  if (submitted) {
    return (
      <DashboardLayout>
        <AnimatedBackground />
        <div className="relative z-10 flex items-center justify-center min-h-[60vh]">
          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-center space-y-4 max-w-sm w-full">
            <div className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle className="w-10 h-10 text-success" />
            </div>
            <h1 className="text-2xl font-bold">Request Submitted! 🎉</h1>
            <p className="text-muted-foreground text-sm">Your credits will be added after admin approval.</p>
            <p className="text-muted-foreground text-sm">Processing time: <strong>{processingTime}</strong></p>
            <div className="bg-card/80 rounded-2xl p-5 text-left space-y-3 border border-border/50 shadow-lg">
              {[
                ["Credits", `${currencySymbol}${selectedPkg?.amount}`],
                ["Price", `${currencySymbol}${selectedPkg?.price}`],
                ["Payment", selectedPaymentData?.label || "—"],
                ["Status", "Pending"],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="font-semibold">{label}</span>
                  <span className="text-muted-foreground">{val}</span>
                </div>
              ))}
            </div>
            <Button onClick={reset} className="w-full">Buy More Credits</Button>
          </motion.div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AnimatedBackground />
      <div className="relative z-10 max-w-lg mx-auto space-y-5">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/20 flex items-center justify-center">
            <CreditCard className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold">Buy Credits 💳</h1>
          <p className="text-muted-foreground text-sm">Purchase credits to buy game keys</p>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-full px-4 py-1.5 w-fit mx-auto">
            <Wallet className="w-3 h-3" /> Your Balance: <strong className="text-primary">{currencySymbol}{profile?.wallet_points ?? 0}</strong>
          </div>
        </motion.div>

        {/* Credit Packages */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> Step 1: Select Credit Package
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              {packages.map((pkg) => (
                <motion.button key={pkg.id} whileTap={{ scale: 0.96 }}
                  onClick={() => setSelectedPkg(pkg)}
                  className={`text-left p-4 rounded-xl border-2 transition-all ${
                    selectedPkg?.id === pkg.id ? "border-primary bg-primary/10" : "border-border/50 bg-background/50 hover:border-primary/50"
                  }`}>
                  <div className="text-2xl mb-1">💰</div>
                  <p className="font-bold text-lg text-primary">{currencySymbol}{pkg.amount}</p>
                  <p className="text-xs text-muted-foreground">Credits</p>
                  {pkg.description && <p className="text-xs text-muted-foreground mt-1">{pkg.description}</p>}
                  <p className="text-sm font-semibold mt-2">Pay: {currencySymbol}{pkg.price}</p>
                  {selectedPkg?.id === pkg.id && (
                    <div className="flex items-center gap-1 text-primary text-xs mt-1">
                      <CheckCircle className="w-3 h-3" /> Selected
                    </div>
                  )}
                </motion.button>
              ))}
              {packages.length === 0 && (
                <div className="col-span-2 text-center py-6 text-muted-foreground text-sm">
                  No credit packages available yet.
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Payment Method */}
        {selectedPkg && paymentMethods.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-primary" /> Step 2: Select Payment Method
                </CardTitle>
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
        {selectedPkg && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <QrCode className="w-4 h-4 text-primary" /> Step 3: Scan QR & Upload Proof
                </CardTitle>
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

        {/* Confirm */}
        {selectedPkg && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-primary/30 bg-card/70 backdrop-blur-md shadow-lg">
              <CardContent className="pt-5 space-y-4">
                <div className="flex items-center gap-3 pb-3 border-b border-border/50">
                  <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">Confirm Purchase</h3>
                    <p className="text-xs text-muted-foreground">Review your credit purchase</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  {[
                    ["Credits", `${currencySymbol}${selectedPkg?.amount}`],
                    ["Price", `${currencySymbol}${selectedPkg?.price}`],
                    ["Payment", selectedPaymentData?.label || "—"],
                    ["Current Balance", `${currencySymbol}${profile?.wallet_points ?? 0}`],
                    ["After Purchase", `${currencySymbol}${(profile?.wallet_points ?? 0) + Number(selectedPkg?.amount || 0)}`],
                  ].map(([label, val]) => (
                    <div key={label} className="flex justify-between">
                      <span className="font-semibold">{label}</span>
                      <span className="text-muted-foreground">{val}</span>
                    </div>
                  ))}
                </div>
                <div className="flex gap-3 pt-2">
                  <Button variant="outline" className="flex-1" onClick={reset}>Cancel</Button>
                  <Button className="flex-1 font-semibold" onClick={handleSubmit}
                    disabled={submitting || (paymentMethods.length > 0 && !proofFile)}>
                    {submitting ? "Submitting..." : "Buy Credits 💳"}
                  </Button>
                </div>
                <p className="text-center text-xs text-muted-foreground">⏱ Credits added after admin approval</p>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Purchase History */}
        {myRequests.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" /> Purchase History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 max-h-60 overflow-y-auto">
                {myRequests.map((req: any) => (
                  <div key={req.id} className={`p-3 rounded-lg border text-sm ${
                    req.status === "approved" ? "border-success/30 bg-success/5" :
                    req.status === "rejected" ? "border-destructive/30 bg-destructive/5" :
                    "border-border/50 bg-muted/30"
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-bold text-primary">{currencySymbol}{req.package_amount} Credits</p>
                        <p className="text-xs text-muted-foreground">Paid: {currencySymbol}{req.amount_paid}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={req.status === "approved" ? "default" : req.status === "rejected" ? "destructive" : "outline"} className="text-[10px] capitalize">
                          {req.status}
                        </Badge>
                        <p className="text-[10px] text-muted-foreground mt-1">{new Date(req.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                    {req.admin_note && (
                      <p className="text-xs text-muted-foreground mt-1 italic">Note: {req.admin_note}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BuyCredit;
