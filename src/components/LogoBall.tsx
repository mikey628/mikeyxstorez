import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { X, Tag, Gift, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Offer {
  id: string;
  title: string;
  description: string | null;
  type: string;
  price_points: number | null;
  duration_days: number | null;
  key_code: string | null;
}

export const LogoBall = () => {
  const [open, setOpen] = useState(false);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [logoVideo, setLogoVideo] = useState<string | null>(null);
  const [mediaOpen, setMediaOpen] = useState(false);
  const [nepalTime, setNepalTime] = useState("");
  const [pulse, setPulse] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Nepal time (UTC+5:45)
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const nepal = new Date(utc + 5 * 3600000 + 45 * 60000);
      setNepalTime(nepal.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true }));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const [{ data: offerData }, { data: settings }] = await Promise.all([
        supabase.from("offers").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("site_settings").select("*"),
      ]);
      setOffers(offerData || []);
      (settings || []).forEach((s: any) => {
        if (s.key === "logo_image_url") setLogoImage(s.value);
        if (s.key === "logo_video_url") setLogoVideo(s.value);
      });
    };
    fetchData();

    // Pulse off after 3s
    const t = setTimeout(() => setPulse(false), 3000);
    return () => clearTimeout(t);
  }, []);

  const offerKeys = offers.filter(o => o.type === "offer");
  const freeKeys = offers.filter(o => o.type === "free");
  const hasOffers = offers.length > 0;

  return (
    <>
      {/* The floating logo ball */}
      <motion.div
        className="fixed bottom-20 right-4 z-50 cursor-pointer"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.5 }}
      >
        {/* Pulse ring when offers exist */}
        {hasOffers && pulse && (
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/30"
            animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ repeat: Infinity, duration: 2 }}
          />
        )}
        <motion.button
          onClick={() => setOpen(true)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/40 flex items-center justify-center overflow-hidden border-2 border-primary/50"
        >
          {logoImage ? (
            <img src={logoImage} alt="Logo" className="w-full h-full object-cover" />
          ) : (
            <span className="text-primary-foreground font-black text-xl">M</span>
          )}
          {hasOffers && (
            <span className="absolute top-0 right-0 w-4 h-4 bg-destructive rounded-full text-[9px] text-white flex items-center justify-center font-bold">
              {offers.length}
            </span>
          )}
        </motion.button>
      </motion.div>

      {/* Popup modal */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              className="fixed inset-0 bg-background/60 backdrop-blur-sm z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed bottom-36 right-4 z-50 w-80 max-h-[70vh] overflow-y-auto bg-card/95 backdrop-blur-xl border border-border/50 rounded-2xl shadow-2xl shadow-primary/20"
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="p-4 space-y-4">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-8 h-8 rounded-full bg-primary/20 overflow-hidden border border-primary/30 cursor-pointer flex items-center justify-center"
                      onClick={() => { if (logoImage || logoVideo) { setOpen(false); setMediaOpen(true); } }}
                    >
                      {logoImage ? (
                        <img src={logoImage} alt="Logo" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-primary font-black text-sm">M</span>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold">MICKEY STORE</p>
                      <p className="text-xs text-muted-foreground">Special Offers</p>
                    </div>
                  </div>
                  <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Nepal Time */}
                <div className="flex items-center gap-2 bg-primary/10 rounded-lg px-3 py-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Nepal Time (NPT)</p>
                    <p className="text-sm font-mono font-bold text-primary">{nepalTime}</p>
                  </div>
                </div>

                {/* Media preview button */}
                {(logoImage || logoVideo) && (
                  <button
                    onClick={() => { setOpen(false); setMediaOpen(true); }}
                    className="w-full rounded-xl overflow-hidden border border-border/50 group relative"
                  >
                    {logoVideo ? (
                      <video src={logoVideo} className="w-full h-32 object-cover" muted autoPlay loop playsInline />
                    ) : (
                      <img src={logoImage!} alt="Promo" className="w-full h-32 object-cover" />
                    )}
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                      <span className="text-white text-xs font-medium bg-black/50 px-2 py-1 rounded-full">
                        {logoVideo ? "▶ Watch Promo" : "Click to View"}
                      </span>
                    </div>
                  </button>
                )}

                {/* Offer Keys */}
                {offerKeys.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Tag className="w-3 h-3" /> SPECIAL OFFERS
                    </p>
                    {offerKeys.map(offer => (
                      <div key={offer.id} className="bg-primary/10 border border-primary/20 rounded-xl p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-sm font-semibold">{offer.title}</p>
                            {offer.description && <p className="text-xs text-muted-foreground mt-0.5">{offer.description}</p>}
                          </div>
                          <div className="text-right shrink-0">
                            {offer.price_points && <Badge className="bg-primary/20 text-primary border-0 text-xs">{offer.price_points} pts</Badge>}
                            {offer.duration_days && <p className="text-xs text-muted-foreground mt-1">{offer.duration_days} days</p>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Free Keys */}
                {freeKeys.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                      <Gift className="w-3 h-3 text-success" /> 🎁 FREE GIVEAWAY
                    </p>
                    {freeKeys.map(offer => (
                      <div key={offer.id} className="bg-success/10 border border-success/30 rounded-xl p-3">
                        <p className="text-sm font-semibold">{offer.title}</p>
                        {offer.description && <p className="text-xs text-muted-foreground mt-0.5">{offer.description}</p>}
                        {offer.key_code && (
                          <div className="mt-2 bg-background/50 rounded-lg p-2 font-mono text-xs text-center select-all border border-success/20">
                            {offer.key_code}
                          </div>
                        )}
                        {offer.duration_days && (
                          <p className="text-xs text-success mt-1 font-medium">Valid for {offer.duration_days} days</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {offers.length === 0 && (
                  <div className="text-center py-6 text-muted-foreground">
                    <Tag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                    <p className="text-sm">No active offers right now</p>
                    <p className="text-xs">Check back soon!</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Full media viewer */}
      <AnimatePresence>
        {mediaOpen && (logoImage || logoVideo) && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMediaOpen(false)}
            >
              <button
                className="absolute top-4 right-4 text-white bg-white/10 rounded-full p-2 hover:bg-white/20"
                onClick={() => setMediaOpen(false)}
              >
                <X className="w-5 h-5" />
              </button>
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="max-w-lg w-full mx-4"
                onClick={(e) => e.stopPropagation()}
              >
                {logoVideo ? (
                  <video
                    ref={videoRef}
                    src={logoVideo}
                    className="w-full rounded-2xl"
                    controls
                    autoPlay
                  />
                ) : (
                  <img src={logoImage!} alt="Promo" className="w-full rounded-2xl" />
                )}
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
