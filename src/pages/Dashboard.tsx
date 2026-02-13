import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { NepalFlag } from "@/components/NepalFlag";
import { Wallet, ShoppingCart, History, Package, User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: txns } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      setRecentTransactions(txns || []);

      const { count } = await supabase.from("products").select("*", { count: "exact", head: true });
      setProductCount(count || 0);
    };
    fetchData();
  }, [user]);

  const stats = [
    { label: "Wallet Points", value: profile?.wallet_points ?? 0, icon: Wallet, color: "text-primary" },
    { label: "Total Purchases", value: profile?.total_purchases ?? 0, icon: ShoppingCart, color: "text-success" },
    { label: "Available Products", value: productCount, icon: Package, color: "text-warning" },
    { label: "Transactions", value: recentTransactions.length, icon: History, color: "text-muted-foreground" },
  ];

  return (
    <DashboardLayout>
      <AnimatedBackground />
      <div className="space-y-6 relative z-10">
        {/* Header with Nepal flag */}
        <div className="flex items-center gap-3">
          <NepalFlag className="w-8 h-10" />
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {profile?.display_name || profile?.email || "User"}!</h1>
            <p className="text-muted-foreground">Here's your account overview.</p>
          </div>
        </div>

        {/* Profile quick card */}
        <Card className="border-border/50 bg-gradient-to-r from-primary/5 to-transparent cursor-pointer hover:border-primary/30 transition-all" onClick={() => navigate("/profile")}>
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden">
              {profile?.photo_url ? (
                <img src={profile.photo_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <User className="w-6 h-6 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium">{profile?.display_name || profile?.email}</p>
              <p className="text-xs text-muted-foreground">View & edit your profile →</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-primary">{profile?.wallet_points ?? 0}</p>
              <p className="text-xs text-muted-foreground">Points</p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.label} className="border-border/50 hover:border-primary/20 transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-2xl font-bold mt-1">{stat.value}</p>
                  </div>
                  <stat.icon className={`w-8 h-8 ${stat.color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="text-lg">Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {recentTransactions.length === 0 ? (
                <p className="text-muted-foreground text-sm">No transactions yet.</p>
              ) : (
                <div className="space-y-3">
                  {recentTransactions.map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                      <div>
                        <p className="text-sm font-medium">{tx.description}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`text-sm font-semibold ${tx.type === "point_added" ? "text-success" : "text-destructive"}`}>
                        {tx.type === "point_added" ? "+" : "-"}{tx.amount} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-border/50 cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/products")}>
            <CardHeader>
              <CardTitle className="text-lg">Browse Products</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm mb-4">
                Explore our digital products and redeem your points for access keys.
              </p>
              <div className="flex items-center gap-2 text-primary text-sm font-medium">
                <Package className="w-4 h-4" />
                View All Products →
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
