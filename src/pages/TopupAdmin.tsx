import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { Shield, CheckCircle, XCircle, Eye, ExternalLink, Clock, Coins, Gamepad2 } from "lucide-react";
import { Navigate } from "react-router-dom";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";

const TopupAdmin = () => {
  const { isAdmin, isTopupAdmin, loading } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [proofViewUrl, setProofViewUrl] = useState<string | null>(null);
  const [proofLoading, setProofLoading] = useState(false);

  useEffect(() => {
    if (!isTopupAdmin && !isAdmin) return;
    const fetchData = async () => {
      const [{ data: reqs }, { data: siteSettings }] = await Promise.all([
        supabase.from("topup_requests").select("*, topup_servers(name,flag)").order("created_at", { ascending: false }),
        supabase.from("site_settings").select("key,value").in("key", [
          "topup_admin_can_view_proofs",
          "topup_admin_can_approve",
          "topup_admin_can_reject",
          "topup_currency",
        ]),
      ]);
      setRequests(reqs || []);
      const s: Record<string, string> = {};
      (siteSettings || []).forEach((x: any) => { s[x.key] = x.value || "true"; });
      setSettings(s);
    };
    fetchData();

    // Realtime updates
    const channel = supabase
      .channel("topup-admin-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "topup_requests" }, (payload) => {
        if (payload.eventType === "INSERT") {
          setRequests((prev) => [payload.new as any, ...prev]);
          toast.info(`🔔 New request: UID ${(payload.new as any).game_uid}`);
        } else if (payload.eventType === "UPDATE") {
          setRequests((prev) => prev.map((r) => r.id === (payload.new as any).id ? { ...r, ...(payload.new as any) } : r));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [isTopupAdmin, isAdmin]);

  if (!loading && !isTopupAdmin && !isAdmin) return <Navigate to="/dashboard" replace />;

  const canViewProofs = settings["topup_admin_can_view_proofs"] !== "false";
  const canApprove = settings["topup_admin_can_approve"] !== "false";
  const canReject = settings["topup_admin_can_reject"] !== "false";
  const currencySymbol = settings["topup_currency"] === "NPR" ? "Rs." : "$";

  const viewProof = async (storagePath: string) => {
    if (!storagePath) return;
    setProofLoading(true);
    setProofViewUrl(null);
    if (storagePath.startsWith("http")) {
      setProofViewUrl(storagePath);
      setProofLoading(false);
      return;
    }
    const { data, error } = await supabase.storage
      .from("payment-proofs")
      .createSignedUrl(storagePath, 3600);
    if (error || !data?.signedUrl) {
      toast.error("Could not load proof image");
      setProofLoading(false);
      return;
    }
    setProofViewUrl(data.signedUrl);
    setProofLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("topup_requests").update({ status }).eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success(`Request marked as ${status}`);
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
  };

  const pendingCount = requests.filter(r => r.status === "pending").length;

  return (
    <DashboardLayout>
      <AnimatedBackground />
      <div className="space-y-5 relative z-10 max-w-2xl mx-auto">
        <motion.div className="flex items-center gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Topup Admin Panel</h1>
            <p className="text-xs text-muted-foreground">
              {pendingCount} pending request{pendingCount !== 1 ? "s" : ""}
            </p>
          </div>
        </motion.div>

        {/* Permission indicators */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={canViewProofs ? "text-success border-success/50" : "text-muted-foreground"}>
            {canViewProofs ? "✅" : "❌"} View Proofs
          </Badge>
          <Badge variant="outline" className={canApprove ? "text-success border-success/50" : "text-muted-foreground"}>
            {canApprove ? "✅" : "❌"} Approve
          </Badge>
          <Badge variant="outline" className={canReject ? "text-success border-success/50" : "text-muted-foreground"}>
            {canReject ? "✅" : "❌"} Reject
          </Badge>
        </div>

        {/* Requests */}
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Coins className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No topup requests yet.</p>
            </div>
          ) : requests.map((req) => (
            <motion.div
              key={req.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-xl border ${
                req.status === "pending"
                  ? "border-warning/40 bg-warning/5"
                  : req.status === "approved"
                    ? "border-success/40 bg-success/5"
                    : "border-destructive/40 bg-destructive/5"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge
                      variant={req.status === "pending" ? "outline" : req.status === "approved" ? "default" : "destructive"}
                      className="text-xs capitalize"
                    >
                      {req.status}
                    </Badge>
                    {(req.fake_score ?? 0) >= 50 && (
                      <Badge variant="destructive" className="text-xs">⚠️ Suspicious</Badge>
                    )}
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(req.created_at).toLocaleString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold font-mono">{req.game_uid}</p>
                    {req.game_name && req.game_name !== `User@${req.game_uid}` && (
                      <span className="text-sm text-primary font-medium flex items-center gap-1">
                        <Gamepad2 className="w-3.5 h-3.5" />{req.game_name}
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground space-y-0.5">
                    <p><span className="font-medium text-foreground">{req.duration_label}</span> · {currencySymbol}{req.amount_paid}</p>
                    {req.server_name && <p>Server: {req.topup_servers?.flag} {req.server_name}</p>}
                    {req.payment_method && <p>Via: {req.payment_method.replace("qr_", "").toUpperCase()}</p>}
                  </div>
                </div>

                <div className="flex flex-col gap-1 shrink-0">
                  {req.payment_proof_url && canViewProofs && (
                    <Button variant="ghost" size="icon" title="View proof" onClick={() => viewProof(req.payment_proof_url)}>
                      {proofLoading ? (
                        <span className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  )}
                  {req.status === "pending" && canApprove && (
                    <Button variant="ghost" size="icon" title="Approve" onClick={() => updateStatus(req.id, "approved")}>
                      <CheckCircle className="w-4 h-4 text-success" />
                    </Button>
                  )}
                  {req.status === "pending" && canReject && (
                    <Button variant="ghost" size="icon" title="Reject" onClick={() => updateStatus(req.id, "rejected")}>
                      <XCircle className="w-4 h-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Proof View Dialog */}
        <Dialog open={!!proofViewUrl || proofLoading} onOpenChange={() => { setProofViewUrl(null); setProofLoading(false); }}>
          <DialogContent className="bg-card/95 backdrop-blur-xl max-w-xl">
            <DialogHeader>
              <DialogTitle>Payment Proof</DialogTitle>
            </DialogHeader>
            {proofLoading ? (
              <div className="flex items-center justify-center py-12 gap-3">
                <span className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
                <span className="text-muted-foreground text-sm">Loading...</span>
              </div>
            ) : proofViewUrl ? (
              <div className="space-y-3">
                <img src={proofViewUrl} alt="Payment proof" className="w-full max-h-96 object-contain rounded-lg border border-border/50" />
                <Button variant="outline" className="w-full" onClick={() => window.open(proofViewUrl, "_blank")}>
                  <ExternalLink className="w-4 h-4 mr-1" /> Open Full Image
                </Button>
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default TopupAdmin;
