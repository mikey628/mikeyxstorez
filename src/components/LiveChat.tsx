import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Clock } from "lucide-react";
import { toast } from "sonner";

export const LiveChat = () => {
  const { user, profile } = useAuth();
  const [open, setOpen] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [welcomeMsg, setWelcomeMsg] = useState("Welcome! 👋 How can we help you today?");
  const [responseTime, setResponseTime] = useState("5-15 minutes");
  const [chatEnabled, setChatEnabled] = useState(true);
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("key,value")
      .in("key", ["chat_welcome_message", "chat_response_time", "chat_enabled"])
      .then(({ data }) => {
        (data || []).forEach((s: any) => {
          if (s.key === "chat_welcome_message") setWelcomeMsg(s.value || welcomeMsg);
          if (s.key === "chat_response_time") setResponseTime(s.value || responseTime);
          if (s.key === "chat_enabled") setChatEnabled(s.value !== "false");
        });
      });
  }, []);

  // Load or create session when chat opens
  useEffect(() => {
    if (!open || !user) return;
    const loadSession = async () => {
      // Find existing open session
      const { data: existing } = await supabase
        .from("chat_sessions")
        .select("id")
        .eq("user_id", user.id)
        .eq("status", "open")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      let sid = existing?.id;
      if (!sid) {
        const { data: created } = await supabase
          .from("chat_sessions")
          .insert({ user_id: user.id, user_email: user.email || "" })
          .select("id")
          .single();
        sid = created?.id;
      }
      if (!sid) return;
      setSessionId(sid);

      // Load messages
      const { data: msgs } = await supabase
        .from("chat_messages")
        .select("*")
        .eq("session_id", sid)
        .order("created_at");
      setMessages(msgs || []);
    };
    loadSession();
  }, [open, user]);

  // Realtime subscription
  useEffect(() => {
    if (!sessionId) return;
    const channel = supabase
      .channel(`chat-${sessionId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "chat_messages",
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        setMessages((prev) => [...prev, payload.new as any]);
        if (!open && (payload.new as any).sender_role === "admin") {
          setUnread((u) => u + 1);
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [sessionId, open]);

  useEffect(() => {
    if (open) setUnread(0);
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  const sendMessage = async () => {
    if (!input.trim() || !sessionId) return;
    setSending(true);
    await supabase.from("chat_messages").insert({
      session_id: sessionId,
      sender_role: "user",
      sender_id: user?.id,
      content: input.trim(),
    });
    setInput("");
    setSending(false);
  };

  if (!chatEnabled) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-box"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="w-80 sm:w-96 bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            style={{ maxHeight: "480px" }}
          >
            {/* Header */}
            <div className="bg-primary px-4 py-3 flex items-center justify-between shrink-0">
              <div>
                <p className="font-semibold text-primary-foreground text-sm">Live Support</p>
                <p className="text-primary-foreground/70 text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Typically replies in {responseTime}
                </p>
              </div>
              <button onClick={() => setOpen(false)} className="text-primary-foreground/70 hover:text-primary-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 min-h-0">
              {/* Welcome message */}
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                  <MessageCircle className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-sm px-3 py-2 max-w-[80%]">
                  <p className="text-sm">{welcomeMsg}</p>
                </div>
              </div>

              {!user && (
                <div className="text-center text-xs text-muted-foreground py-4 bg-muted/30 rounded-xl">
                  Please <a href="/auth" className="text-primary underline">sign in</a> to chat with us.
                </div>
              )}

              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2 ${msg.sender_role === "user" ? "flex-row-reverse" : ""}`}>
                  {msg.sender_role === "admin" && (
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                      <MessageCircle className="w-3.5 h-3.5 text-primary" />
                    </div>
                  )}
                  <div className={`rounded-2xl px-3 py-2 max-w-[80%] ${
                    msg.sender_role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted rounded-tl-sm"
                  }`}>
                    <p className="text-sm">{msg.content}</p>
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {user && (
              <div className="p-3 border-t border-border/50 flex gap-2 shrink-0">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type a message..."
                  className="text-sm h-9"
                  onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                />
                <Button size="icon" className="h-9 w-9 shrink-0" onClick={sendMessage} disabled={sending || !input.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={() => setOpen(!open)}
        className="relative w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="close" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <X className="w-6 h-6 text-primary-foreground" />
            </motion.div>
          ) : (
            <motion.div key="chat" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
              <MessageCircle className="w-6 h-6 text-primary-foreground" />
            </motion.div>
          )}
        </AnimatePresence>
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive rounded-full text-xs text-destructive-foreground flex items-center justify-center font-bold">
            {unread}
          </span>
        )}
      </motion.button>
    </div>
  );
};
