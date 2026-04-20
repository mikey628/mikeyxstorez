import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Wallet, Plus, Upload, CheckCircle, Clock, AlertTriangle, QrCode, DollarSign,
} from "lucide-react";

const QUICK_AMOUNTS = [5, 10, 20, 50];

const BuyCredit = () => {
  const { user, profile } = useAuth();

  const [amount, setAmount] = useState<string>("");
  const [methods, setMethods] = useState<any[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<any>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [transactionCode, setTransactionCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [fakeWarning, setFakeWarning] = useState(false);
  const [myRequests, setMyRequests] = useState<any[]>([]);
  const proofRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      const { data: m } = await supabase
        .from("payment_methods" as any)
        .select("*")
        .eq("is_active", true)
        .order("sort_order");
      setMethods(m || []);
      if (m && m.length > 0) setSelectedMethod(m[0]);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    supabase
      .from("credit_requests" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setMyRequests(data || []));
  }, [user?.id, submitted]);

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    let suspicion = 0;
    if (file.size < 10000) suspicion += 50;
    if (file.type === "image/png" && file.size < 50000) suspicion += 30;
    setFakeWarning(suspicion >= 50);
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    const amt = Number(amount);
    if (!amt || amt < 1) return toast.error("Enter a valid amount (min $1)");
    if (amt > 5000) return toast.error("Max $5,000 per request");
    if (!selectedMethod) return toast.error("Select a payment method");
    if (!proofFile) return toast.error("Upload payment proof");
    if (!transactionCode.trim()) return toast.error("Enter transaction code");
    if (!user) return toast.error("Sign in first");

    setSubmitting(true);
    try {
      const path = `credit_${user.id}_${Date.now()}_${proofFile.name}`;
      const { error: upErr } = await supabase.storage
        .from("payment-proofs")
        .upload(path, proofFile);
      if (upErr) throw upErr;

      const { error } = await supabase.from("credit_requests" as any).insert({
        user_id: user.id,
        package_id: null,
        package_amount: amt,
        amount_paid: amt,
        payment_method: selectedMethod.name,
        payment_proof_url: path,
        transaction_code: transactionCode.trim(),
        status: "pending",
      });
      if (error) throw error;

      setSubmitted(true);
      toast.success("Request submitted! 🎉 Balance added after admin approval.");
    } catch (err: any) {
      toast.error(err.message || "Failed to submit");
    }
    setSubmitting(false);
  };

  const reset = () => {
    setSubmitted(false);
    setAmount("");
    setProofFile(null);
    setProofPreview(null);
    setTransactionCode("");
    setFakeWarning(false);
  };

  if (submitted) {
    return (
      <DashboardLayout>
        <AnimatedBackground />
        <div className="relative z-10 max-w-md mx-auto pt-10 text-center space-y-4">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 mx-auto rounded-full bg-success/20 flex items-center justify-center"
          >
            <CheckCircle className="w-10 h-10 text-success" />
          </motion.div>
          <h1 className="text-2xl font-bold">Request Submitted!</h1>
          <p className="text-muted-foreground text-sm">
            Your <span className="text-success font-bold">${amount}</span> will be added after admin approval.
          </p>
          <p className="text-xs text-muted-foreground">
            Transaction code: <span className="font-semibold text-foreground">{transactionCode}</span>
          </p>
          <Button onClick={reset} className="w-full">Add More Balance</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <AnimatedBackground />
      <div className="relative z-10 max-w-lg mx-auto space-y-5 pb-10">
        {/* Header */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-md overflow-hidden">
          <CardContent className="p-5 text-center space-y-3">
            <div className="flex items-center justify-center gap-2">
              <Wallet className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold">Add Balance</h1>
            </div>
            <p className="text-xs text-muted-foreground">Add funds to your account for faster checkout</p>
            <div className="bg-gradient-to-r from-primary/30 to-primary/10 rounded-xl p-4 border border-primary/30">
              <p className="text-xs text-muted-foreground">Current Balance</p>
              <p className="text-3xl font-extrabold text-success">
                ${(profile?.wallet_points ?? 0).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Amount */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-md">
          <CardContent className="p-5 space-y-3">
            <label className="text-xs font-semibold flex items-center gap-1 text-muted-foreground">
              <DollarSign className="w-3 h-3" /> Amount (USD)
            </label>
            <Input
              type="number"
              min={1}
              max={5000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              className="text-lg font-bold h-12"
            />
            <div className="flex gap-2 flex-wrap">
              {QUICK_AMOUNTS.map((a) => (
                <Button
                  key={a}
                  size="sm"
                  variant={amount === String(a) ? "default" : "outline"}
                  onClick={() => setAmount(String(a))}
                  className="flex-1 min-w-[60px]"
                >
                  ${a}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card className="border-border/50 bg-card/60 backdrop-blur-md">
          <CardContent className="p-5 space-y-3">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Payment Method
            </label>
            {methods.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground text-sm">
                <QrCode className="w-8 h-8 mx-auto mb-2 opacity-40" />
                No payment methods configured. Contact admin.
              </div>
            ) : (
              <div className="space-y-2">
                {methods.map((m) => {
                  const isSel = selectedMethod?.id === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMethod(m)}
                      className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                        isSel
                          ? "border-primary bg-primary/10 shadow-md shadow-primary/20"
                          : "border-border/50 hover:border-primary/40"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-5 h-5 rounded-full border-2 ${
                            isSel ? "border-primary bg-primary" : "border-border"
                          } flex items-center justify-center`}
                        >
                          {isSel && <div className="w-2 h-2 rounded-full bg-primary-foreground" />}
                        </div>
                        <div className="text-left">
                          <p className="font-semibold text-sm">{m.name}</p>
                          {m.currency && (
                            <p className="text-[11px] text-muted-foreground">{m.currency}</p>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {selectedMethod?.qr_url && (
              <div className="text-center pt-3 space-y-2">
                <img
                  src={selectedMethod.qr_url}
                  alt="QR"
                  className="w-44 h-44 mx-auto rounded-lg border border-border/50 bg-white p-2 object-contain"
                />
                {selectedMethod.instructions && (
                  <p className="text-xs text-muted-foreground whitespace-pre-line">
                    {selectedMethod.instructions}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Proof Upload */}
        {selectedMethod && (
          <Card className="border-border/50 bg-card/60 backdrop-blur-md">
            <CardContent className="p-5 space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Upload Payment Proof
              </label>
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
                <div className="flex items-center gap-2 text-warning text-xs bg-warning/10 rounded-lg p-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" /> Upload a real payment screenshot.
                </div>
              )}

              <div className="space-y-2 pt-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Transaction Code
                </label>
                <Input
                  value={transactionCode}
                  onChange={(e) => setTransactionCode(e.target.value)}
                  placeholder="Enter payment transaction code"
                  className="h-11"
                />
                <p className="text-[11px] text-muted-foreground">
                  Pay first, then paste your transaction code, then confirm.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Button
          className="w-full h-12 text-base font-bold shadow-lg shadow-primary/30"
          onClick={handleSubmit}
          disabled={submitting || !amount || !selectedMethod || !proofFile || !transactionCode.trim()}
        >
          <Plus className="w-5 h-5 mr-2" /> Confirm Balance Request
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          ⚡ Min: $1.00 | Max: $5,000.00 — added after admin approval
        </p>

        {/* History */}
        {myRequests.length > 0 && (
          <Card className="border-border/50 bg-card/60 backdrop-blur-md">
            <CardContent className="p-4 space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Clock className="w-4 h-4 text-primary" /> Deposit History
              </div>
              {myRequests.slice(0, 8).map((r: any) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between text-xs p-2 rounded bg-background/40"
                >
                  <div>
                    <span className="text-success font-bold">${r.amount_paid}</span>
                    <span className="text-muted-foreground ml-2">{r.payment_method}</span>
                    {r.transaction_code && <span className="text-muted-foreground ml-2">• Code: {r.transaction_code}</span>}
                  </div>
                  <Badge
                    variant={
                      r.status === "approved"
                        ? "default"
                        : r.status === "rejected"
                        ? "destructive"
                        : "secondary"
                    }
                    className="text-[10px]"
                  >
                    {r.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default BuyCredit;
