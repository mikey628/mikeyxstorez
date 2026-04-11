import { useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { motion } from "framer-motion";
import { Wallet, Zap, ShoppingCart, ArrowRight, CreditCard } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="min-h-screen flex flex-col bg-background relative overflow-hidden">
      <AnimatedBackground />

      {/* Nav */}
      <nav className="relative z-10 flex items-center justify-between px-6 py-4 border-b border-border/30 bg-card/40 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Wallet className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">MICKEY STORE</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/topup">Top Up</Link>
          </Button>
          <Button size="sm" asChild>
            <Link to="/auth">Sign In</Link>
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-2xl mx-auto space-y-6"
        >
          <motion.div
            className="mx-auto w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center ring-2 ring-primary/20 mb-4"
            animate={{
              boxShadow: [
                "0 0 0 0 hsl(var(--primary) / 0)",
                "0 0 30px 10px hsl(var(--primary) / 0.15)",
                "0 0 0 0 hsl(var(--primary) / 0)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Wallet className="w-10 h-10 text-primary" />
          </motion.div>

          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground">
            Mickey <span className="text-primary">Official</span> Store
          </h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Buy game keys, top up your favourite games and manage your orders — all in one place.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button size="lg" className="w-full sm:w-auto shadow-lg shadow-primary/30 gap-2" asChild>
                <Link to="/topup">
                  <Zap className="w-5 h-5" />
                  Top Up Now
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2" asChild>
                <Link to="/auth">
                  <CreditCard className="w-5 h-5" />
                  Buy Credits 💳
                </Link>
              </Button>
            </motion.div>
            <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}>
              <Button size="lg" variant="ghost" className="w-full sm:w-auto gap-2" asChild>
                <Link to="/auth">
                  <ShoppingCart className="w-5 h-5" />
                  Browse Store
                </Link>
              </Button>
            </motion.div>
          </div>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 max-w-2xl w-full"
        >
          {[
            { icon: "⚡", title: "Instant Top-Up", desc: "Fast game top-ups processed by our team" },
            { icon: "🔑", title: "Game Keys", desc: "Premium keys for your favourite games" },
            { icon: "💰", title: "Best Prices", desc: "Competitive pricing with credit system" },
          ].map((f) => (
            <div
              key={f.title}
              className="p-5 rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm text-left space-y-2"
            >
              <span className="text-2xl">{f.icon}</span>
              <p className="font-semibold text-sm">{f.title}</p>
              <p className="text-xs text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </motion.div>
      </main>

      <footer className="relative z-10 text-center py-6 text-xs text-muted-foreground border-t border-border/30">
        © {new Date().getFullYear()} Mickey Official Store · All rights reserved
      </footer>
    </div>
  );
};

export default Index;
