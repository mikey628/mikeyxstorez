import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { KeyRound, Mail, Lock, User } from "lucide-react";
import { AnimatedBackground } from "@/components/AnimatedBackground";
import { motion } from "framer-motion";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isForgot) {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });
      if (error) toast.error(error.message);
      else toast.success("Password reset email sent! Check your inbox.");
      setLoading(false);
      return;
    }

    if (isLogin) {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
      } else if (signInData.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_approved, is_banned")
          .eq("user_id", signInData.user.id)
          .single();

        if (profile?.is_banned) {
          await supabase.auth.signOut();
          toast.error("Your account has been banned.");
        } else if (!profile?.is_approved) {
          await supabase.auth.signOut();
          toast.error("Your account is pending approval. Please wait for admin to approve your login.");
        } else {
          toast.success("Logged in successfully!");
          navigate("/dashboard");
        }
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Account created! Please wait for admin approval before logging in.");
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      <AnimatedBackground />
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md"
      >
        <Card className="border-border/50 bg-card/70 backdrop-blur-xl shadow-2xl shadow-primary/10">
          <CardHeader className="text-center space-y-2">
            <motion.div
              className="mx-auto w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-2 ring-2 ring-primary/20"
              animate={{ boxShadow: ["0 0 0 0 hsl(262 83% 58% / 0)", "0 0 20px 5px hsl(262 83% 58% / 0.15)", "0 0 0 0 hsl(262 83% 58% / 0)"] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <KeyRound className="w-7 h-7 text-primary" />
            </motion.div>
            <CardTitle className="text-2xl font-bold">MICKEY OFFICIAL STORE</CardTitle>
            <CardDescription>
              {isForgot ? "Reset your password" : isLogin ? "Sign in to your account" : "Create a new account"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && !isForgot && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Display Name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="pl-10 bg-background/50 backdrop-blur-sm" />
                </motion.div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-10 bg-background/50 backdrop-blur-sm" />
              </div>
              {!isForgot && (
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} className="pl-10 bg-background/50 backdrop-blur-sm" />
                </div>
              )}
              <Button type="submit" className="w-full shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? "Loading..." : isForgot ? "Send Reset Link" : isLogin ? "Sign In" : "Sign Up"}
              </Button>
            </form>
            <div className="mt-4 text-center space-y-2">
              {!isForgot && (
                <button onClick={() => setIsForgot(true)} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                  Forgot password?
                </button>
              )}
              <div>
                <button onClick={() => { setIsLogin(!isLogin); setIsForgot(false); }} className="text-sm text-primary hover:underline">
                  {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </button>
              </div>
              {isForgot && (
                <button onClick={() => setIsForgot(false)} className="text-sm text-primary hover:underline">
                  Back to Sign In
                </button>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
