import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Key, Copy } from "lucide-react";

const MyKeys = () => {
  const { user } = useAuth();
  const [keys, setKeys] = useState<any[]>([]);

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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">My Keys</h1>
          <p className="text-muted-foreground">Your purchased access keys.</p>
        </div>

        {keys.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <Key className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No keys purchased yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {keys.map((k) => (
              <Card key={k.id} className="border-border/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{(k as any).products?.name || "Unknown Product"}</p>
                    <p className="font-mono text-sm text-muted-foreground mt-1">{k.key_code}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Purchased: {new Date(k.used_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => { navigator.clipboard.writeText(k.key_code); toast.success("Copied!"); }}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default MyKeys;
