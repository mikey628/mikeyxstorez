import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Camera, User, Mail, Save, Phone, Eye, EyeOff, Coins, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

const Profile = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { t } = useLanguage();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [phoneNumber, setPhoneNumber] = useState(profile?.phone_number || "");
  const [whatsappNumber, setWhatsappNumber] = useState(profile?.whatsapp_number || "");
  const [discordLink, setDiscordLink] = useState(profile?.discord_link || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [topupHistory, setTopupHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setLoadingHistory(true);
      supabase
        .from("topup_requests")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .then(({ data }) => {
          setTopupHistory(data || []);
          setLoadingHistory(false);
        });
    }
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    const fileExt = file.name.split(".").pop();
    const filePath = `${user.id}/avatar.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true });
    if (uploadError) { toast.error("Failed to upload photo"); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath);
    await supabase.from("profiles").update({ photo_url: publicUrl }).eq("user_id", user.id);
    toast.success("Photo updated!");
    await refreshProfile();
    setUploading(false);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({
      display_name: displayName,
      phone_number: phoneNumber,
      whatsapp_number: whatsappNumber,
      discord_link: discordLink,
    }).eq("user_id", user.id);
    toast.success(t("profileUpdated") || "Profile updated!");
    await refreshProfile();
    setSaving(false);
  };

  const avatarUrl = profile?.photo_url;
  const maskedEmail = profile?.email
    ? profile.email.replace(/^(.{2})(.*)(@.*)$/, (_: string, a: string, b: string, c: string) => a + "*".repeat(b.length) + c)
    : "";

  const statusConfig: Record<string, { label: string; icon: any; className: string }> = {
    pending: { label: "Pending", icon: Clock, className: "text-warning border-warning/50 bg-warning/10" },
    approved: { label: "Approved", icon: CheckCircle, className: "text-success border-success/50 bg-success/10" },
    rejected: { label: "Rejected", icon: XCircle, className: "text-destructive border-destructive/50 bg-destructive/10" },
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-lg mx-auto">
        <h1 className="text-2xl font-bold">{t("profile")}</h1>

        <Tabs defaultValue="account">
          <TabsList className="w-full">
            <TabsTrigger value="account" className="flex-1">Account</TabsTrigger>
            <TabsTrigger value="topup" className="flex-1">
              Top-Up History
              {topupHistory.filter(r => r.status === "pending").length > 0 && (
                <span className="ml-1 bg-warning text-warning-foreground text-xs rounded-full px-1.5 py-0.5">
                  {topupHistory.filter(r => r.status === "pending").length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="account" className="space-y-4 mt-4">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">{t("yourPhoto") || "Your Photo"}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                <div
                  className="relative w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden cursor-pointer group"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-primary" />
                  )}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                <p className="text-xs text-muted-foreground">
                  {uploading ? "Uploading..." : t("clickToChangePhoto") || "Click to change photo"}
                </p>
              </CardContent>
            </Card>

            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-lg">{t("accountDetails") || "Account Details"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                    <Mail className="w-3 h-3" /> Email
                  </label>
                  <div className="relative">
                    <Input value={showEmail ? (profile?.email || "") : maskedEmail} disabled className="opacity-60 pr-10" />
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowEmail(!showEmail)}
                    >
                      {showEmail ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                    <User className="w-3 h-3" /> {t("displayName") || "Display Name"}
                  </label>
                  <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your name" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                    <Phone className="w-3 h-3" /> {t("phoneNumber") || "Phone Number"}
                  </label>
                  <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="+977 98XXXXXXXX" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                    WhatsApp Number
                  </label>
                  <Input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="+977 98XXXXXXXX" />
                </div>
                <div>
                  <label className="text-sm text-muted-foreground flex items-center gap-1 mb-1">
                    Discord
                  </label>
                  <Input value={discordLink} onChange={(e) => setDiscordLink(e.target.value)} placeholder="https://discord.gg/... or username" />
                </div>
                <Button onClick={handleSave} disabled={saving} className="w-full">
                  <Save className="w-4 h-4 mr-1" />
                  {saving ? "Saving..." : t("saveChanges") || "Save Changes"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="topup" className="space-y-3 mt-4">
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium">Wallet Points</p>
                  <p className="text-xl font-bold text-primary flex items-center gap-1">
                    <Coins className="w-4 h-4" /> {profile?.wallet_points ?? 0}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">Total purchases: {profile?.total_purchases ?? 0}</p>
              </CardContent>
            </Card>

            {loadingHistory ? (
              <div className="text-center py-8 text-muted-foreground text-sm">Loading history...</div>
            ) : topupHistory.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No top-up requests yet.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {topupHistory.map((req) => {
                  const cfg = statusConfig[req.status] || statusConfig.pending;
                  const StatusIcon = cfg.icon;
                  return (
                    <Card key={req.id} className="border-border/50 bg-card/50">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.className}`}>
                                <StatusIcon className="w-3 h-3" />
                                {cfg.label}
                              </span>
                              {req.server_name && (
                                <span className="text-xs text-muted-foreground">{req.server_name}</span>
                              )}
                            </div>
                            <p className="text-sm font-semibold mt-1.5">{req.duration_label}</p>
                            <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                              <p>UID: <span className="font-mono text-foreground">{req.game_uid}</span></p>
                              <p>Amount: <span className="text-primary font-medium">${req.amount_paid}</span></p>
                              <p>{new Date(req.created_at).toLocaleDateString()} · {new Date(req.created_at).toLocaleTimeString()}</p>
                            </div>
                            {req.admin_note && (
                              <p className="text-xs mt-1 text-muted-foreground italic">Note: {req.admin_note}</p>
                            )}
                          </div>
                          {req.payment_proof_url && (
                            <img
                              src={req.payment_proof_url}
                              alt="proof"
                              className="w-12 h-12 object-cover rounded-lg border border-border/50 cursor-pointer shrink-0"
                              onClick={() => window.open(req.payment_proof_url, "_blank")}
                            />
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
