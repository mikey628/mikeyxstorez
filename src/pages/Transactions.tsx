import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History } from "lucide-react";

const typeColors: Record<string, string> = {
  point_added: "bg-success/10 text-success",
  point_deducted: "bg-destructive/10 text-destructive",
  purchase: "bg-primary/10 text-primary",
  admin_edit: "bg-warning/10 text-warning",
};

const Transactions = () => {
  const { user } = useAuth();
  const [txns, setTxns] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setTxns(data || []);
    };
    fetch();
  }, [user]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground">All your point and purchase activities.</p>
        </div>

        {txns.length === 0 ? (
          <Card className="border-border/50">
            <CardContent className="p-12 text-center">
              <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No transactions yet.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {txns.map((tx) => (
              <Card key={tx.id} className="border-border/50">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={typeColors[tx.type] || ""}>
                      {tx.type.replace("_", " ")}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold ${tx.type === "point_added" ? "text-success" : "text-destructive"}`}>
                    {tx.type === "point_added" ? "+" : "-"}{tx.amount}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Transactions;
