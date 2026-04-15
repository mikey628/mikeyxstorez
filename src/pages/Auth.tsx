import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Mail, Lock, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgot, setIsForgot] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [lampOn, setLampOn] = useState(false);
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
        const [{ data: profile }, { data: approvalSetting }] = await Promise.all([
          supabase.from("profiles").select("is_approved, is_banned").eq("user_id", signInData.user.id).single(),
          supabase.from("site_settings").select("value").eq("key", "require_approval").maybeSingle(),
        ]);

        const requireApproval = approvalSetting?.value !== "false";

        if (profile?.is_banned) {
          await supabase.auth.signOut();
          toast.error("Your account has been banned.");
        } else if (requireApproval && !profile?.is_approved) {
          await supabase.auth.signOut();
          toast.error("Your account is pending approval. Please wait for admin to approve your login.");
        } else {
          toast.success("Logged in successfully!");
          navigate("/dashboard");
        }
      }
    } else {
      const { data: approvalSetting } = await supabase
        .from("site_settings").select("value").eq("key", "require_approval").maybeSingle();
      const requireApproval = approvalSetting?.value !== "false";

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName } },
      });
      if (error) {
        toast.error(error.message);
      } else {
        if (requireApproval) {
          toast.success("Account created! Please wait for admin approval before logging in.");
        } else {
          toast.success("Account created! You can now sign in.");
        }
        setIsLogin(true);
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1a1d2e] relative overflow-hidden transition-colors duration-700">
      {/* Ambient glow when lamp is on */}
      <AnimatePresence>
        {lampOn && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 pointer-events-none"
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-yellow-400/10 blur-[120px]" />
            <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[300px] h-[400px] bg-gradient-to-b from-yellow-300/15 via-yellow-200/5 to-transparent blur-[60px]" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lamp */}
      <div className="relative z-20 flex flex-col items-center mb-8 cursor-pointer select-none" onClick={() => setLampOn(!lampOn)}>
        {/* Wire */}
        <div className="w-[3px] h-16 bg-gray-500/60" />
        {/* Lamp base/mount */}
        <div className="w-16 h-4 bg-gray-500/80 rounded-b-lg" />
        {/* Bulb */}
        <motion.div
          className="w-20 h-20 rounded-full flex items-center justify-center relative -mt-2"
          animate={{
            backgroundColor: lampOn ? "rgba(250, 204, 21, 0.9)" : "rgba(107, 114, 128, 0.5)",
            boxShadow: lampOn
              ? "0 0 60px 20px rgba(250, 204, 21, 0.4), 0 0 120px 40px rgba(250, 204, 21, 0.15)"
              : "0 0 0 0 transparent",
          }}
          transition={{ duration: 0.5 }}
        >
          {lampOn && (
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 rounded-full bg-yellow-300/40 blur-xl"
            />
          )}
        </motion.div>
        <p className="text-gray-400 text-xs mt-3 tracking-wider">Lamp (click)</p>
      </div>

      {/* Login Form - only visible when lamp is ON */}
      <AnimatePresence>
        {lampOn && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="relative z-10 w-full max-w-sm px-6"
          >
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-100 tracking-wide">Member Login</h1>
              <p className="text-gray-400 text-sm mt-1">
                {isForgot ? "Reset your password" : isLogin ? "Sign in to continue" : "Create a new account"}
              </p>
            </div>

            <form onSubmit={handleAuth} className="space-y-4">
              {!isLogin && !isForgot && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Username"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="pl-10 bg-gray-800/60 border-gray-700/50 text-gray-100 placeholder:text-gray-500 focus:border-yellow-500/50 focus:ring-yellow-500/20"
                    />
                  </div>
                </motion.div>
              )}
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                <Input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10 bg-gray-800/60 border-gray-700/50 text-gray-100 placeholder:text-gray-500 focus:border-yellow-500/50 focus:ring-yellow-500/20"
                />
              </div>
              {!isForgot && (
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                  <Input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="pl-10 bg-gray-800/60 border-gray-700/50 text-gray-100 placeholder:text-gray-500 focus:border-yellow-500/50 focus:ring-yellow-500/20"
                  />
                </div>
              )}
              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-yellow-500 hover:bg-yellow-400 text-gray-900 font-bold shadow-lg shadow-yellow-500/20 transition-all"
              >
                {loading ? "Loading..." : isForgot ? "Send Reset Link" : isLogin ? "Sign in" : "Sign Up"}
              </Button>
            </form>

            <div className="mt-4 text-center space-y-2">
              {!isForgot && (
                <button onClick={() => setIsForgot(true)} className="text-sm text-gray-400 hover:text-yellow-400 transition-colors">
                  Forgot password?
                </button>
              )}
              <div>
                <button onClick={() => { setIsLogin(!isLogin); setIsForgot(false); }} className="text-sm text-yellow-400 hover:underline">
                  {isLogin ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
                </button>
              </div>
              {isForgot && (
                <button onClick={() => setIsForgot(false)} className="text-sm text-yellow-400 hover:underline">
                  Back to Sign In
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint when lamp is off */}
      <AnimatePresence>
        {!lampOn && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-gray-600 text-sm mt-4 z-10"
          >
            Turn on the lamp to login
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Auth;
