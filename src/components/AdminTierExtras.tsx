import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Trash2, Edit, CreditCard, Upload, Power } from "lucide-react";

const TIERS = ["basic", "pro", "vip"] as const;
type Tier = typeof TIERS[number];

/* ---------- Tier Pricing Editor (per product) ---------- */
export const AdminTierPrices = ({
  products,
  onSaved,
}: {
  products: any[];
  onSaved?: () => void;
}) => {
  const [openProd, setOpenProd] = useState<any>(null);
  const [tierPrices, setTierPrices] = useState<Record<Tier, Record<string, string>>>({
    basic: {}, pro: {}, vip: {},
  });
  const [saving, setSaving] = useState(false);

  const open = (p: any) => {
    setOpenProd(p);
    const tp = (p.tier_prices || {}) as any;
    const initial: any = { basic: {}, pro: {}, vip: {} };
    TIERS.forEach((t) => {
      const obj = tp[t] || {};
      Object.keys(obj).forEach((k) => {
        initial[t][k] = String(obj[k]);
      });
    });
    setTierPrices(initial);
  };

  const save = async () => {
    if (!openProd) return;
    setSaving(true);
    const cleaned: any = {};
    TIERS.forEach((t) => {
      const obj: Record<string, number> = {};
      Object.entries(tierPrices[t]).forEach(([k, v]) => {
        const n = parseFloat(v);
        if (!isNaN(n) && n > 0) obj[k] = n;
      });
      if (Object.keys(obj).length) cleaned[t] = obj;
    });
    const { error } = await supabase
      .from("products")
      .update({ tier_prices: cleaned })
      .eq("id", openProd.id);
    setSaving(false);
    if (error) toast.error(error.message);
    else {
      toast.success("Tier prices saved");
      setOpenProd(null);
      onSaved?.();
    }
  };

  return (
    <>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4 space-y-3">
          <h3 className="font-bold flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" /> Reseller Tier Pricing
          </h3>
          <p className="text-xs text-muted-foreground">
            Set discounted prices for Basic / Pro / VIP resellers per product. Empty = falls back to normal price.
          </p>
          {products.map((p) => {
            const tp = (p.tier_prices || {}) as any;
            const counts = TIERS.map((t) => Object.keys(tp[t] || {}).length);
            return (
              <div
                key={p.id}
                className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/30"
              >
                <div>
                  <p className="font-medium text-sm">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    Basic: {counts[0]} · Pro: {counts[1]} · VIP: {counts[2]}
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={() => open(p)}>
                  <Edit className="w-3 h-3 mr-1" /> Edit Tiers
                </Button>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Dialog open={!!openProd} onOpenChange={(v) => !v && setOpenProd(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Tier Prices — {openProd?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {(openProd?.duration_days || [30]).map((d: number) => (
              <div key={d} className="border border-border/40 rounded-lg p-3 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground">
                  {d} day{d > 1 && "s"} — Normal: $
                  {openProd?.duration_prices?.[String(d)] ?? openProd?.price_points ?? 0}
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {TIERS.map((t) => (
                    <div key={t}>
                      <label className="text-[10px] uppercase text-muted-foreground">{t}</label>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="$"
                        value={tierPrices[t]?.[String(d)] ?? ""}
                        onChange={(e) =>
                          setTierPrices((s) => ({
                            ...s,
                            [t]: { ...s[t], [String(d)]: e.target.value },
                          }))
                        }
                        className="h-8 text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenProd(null)}>
              Cancel
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save Tier Prices"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

/* ---------- Payment Methods CRUD ---------- */
export const AdminPaymentMethods = () => {
  const [methods, setMethods] = useState<any[]>([]);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    name: "",
    method_type: "qr",
    currency: "USD",
    instructions: "",
    is_active: true,
  });
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchMethods = async () => {
    const { data } = await supabase
      .from("payment_methods" as any)
      .select("*")
      .order("sort_order");
    setMethods(data || []);
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const openNew = () => {
    setEditing(null);
    setForm({ name: "", method_type: "qr", currency: "USD", instructions: "", is_active: true });
    setQrFile(null);
    setDialog(true);
  };
  const openEdit = (m: any) => {
    setEditing(m);
    setForm({
      name: m.name || "",
      method_type: m.method_type || "qr",
      currency: m.currency || "USD",
      instructions: m.instructions || "",
      is_active: m.is_active,
    });
    setQrFile(null);
    setDialog(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Name required");
    setUploading(true);
    try {
      let qr_url = editing?.qr_url || null;
      if (qrFile) {
        const path = `payment-method-${Date.now()}-${qrFile.name}`;
        const { error: upErr } = await supabase.storage
          .from("topup-qr")
          .upload(path, qrFile, { upsert: true });
        if (upErr) throw upErr;
        const { data: pub } = supabase.storage.from("topup-qr").getPublicUrl(path);
        qr_url = pub.publicUrl;
      }
      const payload = { ...form, qr_url };
      if (editing) {
        await supabase.from("payment_methods" as any).update(payload).eq("id", editing.id);
      } else {
        await supabase.from("payment_methods" as any).insert(payload);
      }
      toast.success("Saved");
      setDialog(false);
      fetchMethods();
    } catch (e: any) {
      toast.error(e.message || "Failed");
    }
    setUploading(false);
  };

  const remove = async (id: string) => {
    await supabase.from("payment_methods" as any).delete().eq("id", id);
    toast.success("Deleted");
    fetchMethods();
  };

  const toggle = async (m: any) => {
    await supabase
      .from("payment_methods" as any)
      .update({ is_active: !m.is_active })
      .eq("id", m.id);
    fetchMethods();
  };

  return (
    <>
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-primary" /> Payment Methods (Add Balance)
            </h3>
            <Button size="sm" onClick={openNew}>
              <Plus className="w-3 h-3 mr-1" /> Add
            </Button>
          </div>
          {methods.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-4">
              No payment methods yet. Users can't add balance until you create one.
            </p>
          )}
          {methods.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between p-3 bg-background/50 rounded-lg border border-border/30"
            >
              <div className="flex items-center gap-3">
                {m.qr_url && (
                  <img src={m.qr_url} alt="" className="w-10 h-10 rounded object-cover" />
                )}
                <div>
                  <p className="font-medium text-sm">{m.name}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {m.method_type} · {m.currency}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Badge variant={m.is_active ? "default" : "secondary"} className="text-[10px]">
                  {m.is_active ? "Active" : "Off"}
                </Badge>
                <Button size="icon" variant="ghost" onClick={() => toggle(m)}>
                  <Power className="w-3 h-3" />
                </Button>
                <Button size="icon" variant="ghost" onClick={() => openEdit(m)}>
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => remove(m.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit" : "Add"} Payment Method</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs">Name</label>
              <Input
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="e.g. Binance Pay, eSewa, Bank Transfer"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs">Type</label>
                <Input
                  value={form.method_type}
                  onChange={(e) => setForm((s) => ({ ...s, method_type: e.target.value }))}
                  placeholder="qr / bank / crypto"
                />
              </div>
              <div>
                <label className="text-xs">Currency</label>
                <Input
                  value={form.currency}
                  onChange={(e) => setForm((s) => ({ ...s, currency: e.target.value }))}
                  placeholder="USD / USDT / NPR / INR"
                />
              </div>
            </div>
            <div>
              <label className="text-xs">QR Image (upload)</label>
              <Input
                type="file"
                accept="image/*"
                onChange={(e) => setQrFile(e.target.files?.[0] || null)}
              />
              {editing?.qr_url && !qrFile && (
                <img src={editing.qr_url} alt="" className="w-24 h-24 mt-2 rounded border" />
              )}
            </div>
            <div>
              <label className="text-xs">Instructions (optional)</label>
              <Textarea
                value={form.instructions}
                onChange={(e) => setForm((s) => ({ ...s, instructions: e.target.value }))}
                placeholder="e.g. Send to wallet 0x... and upload screenshot"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={save} disabled={uploading}>
              {uploading ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

/* ---------- Topup On/Off toggle ---------- */
export const AdminTopupToggle = () => {
  const [enabled, setEnabled] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "topup_enabled")
      .maybeSingle()
      .then(({ data }) => {
        setEnabled(data?.value !== "false");
        setLoading(false);
      });
  }, []);

  const toggle = async () => {
    const next = !enabled;
    setEnabled(next);
    await supabase
      .from("site_settings")
      .upsert({ key: "topup_enabled", value: next ? "true" : "false" }, { onConflict: "key" });
    toast.success(`Topup page ${next ? "enabled" : "disabled"}`);
  };

  if (loading) return null;
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardContent className="p-4 flex items-center justify-between">
        <div>
          <h3 className="font-bold flex items-center gap-2">
            <Power className="w-4 h-4 text-primary" /> Topup Page
          </h3>
          <p className="text-xs text-muted-foreground">
            Turn the entire Topup page on or off for users.
          </p>
        </div>
        <Button
          variant={enabled ? "default" : "outline"}
          onClick={toggle}
          className={enabled ? "" : "border-destructive text-destructive"}
        >
          {enabled ? "✅ Enabled" : "⛔ Disabled"}
        </Button>
      </CardContent>
    </Card>
  );
};

/* ---------- Reseller Tier dropdown for an application ---------- */
export const ResellerTierSelect = ({
  application,
  onChange,
}: {
  application: any;
  onChange?: () => void;
}) => {
  const [tier, setTier] = useState<Tier>(application.reseller_tier || "basic");

  const save = async (t: Tier) => {
    setTier(t);
    await supabase
      .from("reseller_applications")
      .update({ reseller_tier: t })
      .eq("id", application.id);
    toast.success(`Tier set to ${t.toUpperCase()}`);
    onChange?.();
  };

  return (
    <div className="flex gap-1">
      {TIERS.map((t) => (
        <Button
          key={t}
          size="sm"
          variant={tier === t ? "default" : "outline"}
          className="h-7 text-[10px] uppercase px-2"
          onClick={() => save(t)}
        >
          {t}
        </Button>
      ))}
    </div>
  );
};
