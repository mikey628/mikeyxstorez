import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Key, Copy, Eye, EyeOff } from "lucide-react";

const MyKeys = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [keys, setKeys] = useState<any[]>([]);
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("keys")
        .select("*, products(name)")
        .eq("used_by", user.id)
        .order("used_at", { ascending: false });
      setKeys(data || []);
    };
    fetch();
  }, [user]);

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys((prev) => {
      const next = new Set(prev);
      if (next.has(keyId)) next.delete(keyId);
      else next.add(keyId);
      return next;
    });
  };

  const maskKey = (code: string) => {
    if (code.length <= 4) return "****";
    return code.slice(0, 2) + "*".repeat(code.length - 4) + code.slice(-2);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">{t("myKeys")}</h1>
          <p className="text-muted-foreground">{t("yourPurchasedKeys") || "Your purchased access keys."}</p>
        </div>

        {keys.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">{t("noKeysPurchased") || "No keys purchased yet."}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {keys.map((k) => {
              const isVisible = visibleKeys.has(k.id);
              return (
                <Card key={k.id} className="border-border/50">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{(k as any).products?.name || "Unknown Product"}</p>
                      <p className="font-mono text-sm text-muted-foreground mt-1 truncate">
                        {isVisible ? k.key_code : maskKey(k.key_code)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {k.duration_days && `${k.duration_days} ${t("days")} · `}
                        {t("purchased") || "Purchased"}: {new Date(k.used_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleKeyVisibility(k.id)}
                        title={isVisible ? "Hide" : "Show"}
                      >
                        {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(k.key_code);
                          toast.success("Copied!");
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyKeys;
