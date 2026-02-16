import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/DashboardLayout";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { NepalFlag } from "@/components/NepalFlag";
import { Wallet, ShoppingCart, History, Package, User } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const socialIcons = {
  whatsapp: (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13.2a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-.81-.07 4.84 4.84 0 01-.38-4.56z"/>
    </svg>
  ),
  discord: (
    <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
      <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.095 2.157 2.42 0 1.333-.947 2.418-2.157 2.418z"/>
    </svg>
  ),
};

const Dashboard = () => {
  const { profile, user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [productCount, setProductCount] = useState(0);
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [{ data: txns }, { count }, { data: settings }] = await Promise.all([
        supabase.from("transactions").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
        supabase.from("products").select("*", { count: "exact", head: true }),
        supabase.from("site_settings").select("*"),
      ]);
      setRecentTransactions(txns || []);
      setProductCount(count || 0);
      const links: Record<string, string> = {};
      (settings || []).forEach((s: any) => { links[s.key] = s.value; });
      setSocialLinks(links);
    };
    fetchData();
  }, [user]);

  const stats = [
    { label: t("walletPoints"), value: profile?.wallet_points ?? 0, icon: Wallet, gradient: "from-purple-500/20 to-blue-500/20" },
    { label: t("totalPurchases"), value: profile?.total_purchases ?? 0, icon: ShoppingCart, gradient: "from-green-500/20 to-emerald-500/20" },
    { label: t("availableProducts"), value: productCount, icon: Package, gradient: "from-amber-500/20 to-orange-500/20" },
    { label: t("transactions"), value: recentTransactions.length, icon: History, gradient: "from-sky-500/20 to-indigo-500/20" },
  ];

  const activeSocials = [
    { key: "whatsapp_link", icon: socialIcons.whatsapp, label: "WhatsApp", color: "hover:text-green-400" },
    { key: "tiktok_link", icon: socialIcons.tiktok, label: "TikTok", color: "hover:text-pink-400" },
    { key: "discord_link", icon: socialIcons.discord, label: "Discord", color: "hover:text-indigo-400" },
  ].filter(s => socialLinks[s.key]);

  return (
    <DashboardLayout>
      <AnimatedBackground />
      <div className="space-y-6 relative z-10">
        {/* Header */}
        <motion.div
          className="flex items-center gap-3"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <NepalFlag className="w-8 h-10" />
          <div>
            <h1 className="text-2xl font-bold">{t("welcome")}, {profile?.display_name || profile?.email || "User"}!</h1>
            <p className="text-muted-foreground">{t("overview")}</p>
          </div>
        </motion.div>

        {/* Profile card */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card className="border-border/50 bg-card/50 backdrop-blur-md cursor-pointer hover:border-primary/30 transition-all hover:shadow-lg hover:shadow-primary/5" onClick={() => navigate("/profile")}>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden ring-2 ring-primary/20">
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
                <p className="text-xs text-muted-foreground">{t("points")}</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.05 }}
            >
              <Card className={`border-border/50 bg-gradient-to-br ${stat.gradient} backdrop-blur-sm hover:border-primary/20 transition-all hover:shadow-lg hover:shadow-primary/5`}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold mt-1">{stat.value}</p>
                    </div>
                    <stat.icon className="w-8 h-8 text-primary/60" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg">{t("recentTransactions")}</CardTitle>
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
                          <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString()}</p>
                        </div>
                        <span className={`text-sm font-semibold ${tx.type === "point_added" ? "text-success" : "text-destructive"}`}>
                          {tx.type === "point_added" ? "+" : "-"}{tx.amount} {t("pts")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm cursor-pointer hover:border-primary/50 transition-all hover:shadow-lg hover:shadow-primary/5" onClick={() => navigate("/products")}>
              <CardHeader>
                <CardTitle className="text-lg">{t("browseProducts")}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">
                  Explore our digital products and redeem your points for access keys.
                </p>
                <div className="flex items-center gap-2 text-primary text-sm font-medium">
                  <Package className="w-4 h-4" />
                  {t("viewAll")}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>




        {/* Social Links Footer */}
        {activeSocials.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-6 pt-6 pb-2"
          >
            {activeSocials.map((social) => (
              <motion.a
                key={social.key}
                href={socialLinks[social.key]}
                target="_blank"
                rel="noopener noreferrer"
                className={`text-muted-foreground ${social.color} transition-all duration-300`}
                whileHover={{ scale: 1.2, y: -3 }}
                whileTap={{ scale: 0.9 }}
                title={social.label}
              >
                {social.icon}
              </motion.a>
            ))}
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
