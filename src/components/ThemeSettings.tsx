import { Moon, Sun, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";

type ThemeMode = "dark" | "light" | "eye-protect";

const themes: { mode: ThemeMode; label: string; icon: typeof Moon; description: string }[] = [
  { mode: "dark", label: "Dark", icon: Moon, description: "Cool blue dark theme" },
  { mode: "light", label: "Light", icon: Sun, description: "Clean white theme" },
  { mode: "eye-protect", label: "Eye Protect", icon: Eye, description: "Warm tones, easy on eyes" },
];

export const ThemeSettings = () => {
  const [current, setCurrent] = useState<ThemeMode>("dark");

  useEffect(() => {
    const saved = localStorage.getItem("theme-mode") as ThemeMode | null;
    if (saved) {
      setCurrent(saved);
      applyTheme(saved);
    }
  }, []);

  const applyTheme = (mode: ThemeMode) => {
    const html = document.documentElement;
    html.classList.remove("dark", "eye-protect");
    if (mode === "dark") html.classList.add("dark");
    else if (mode === "eye-protect") html.classList.add("dark", "eye-protect");
    // light = no class
  };

  const setTheme = (mode: ThemeMode) => {
    setCurrent(mode);
    applyTheme(mode);
    localStorage.setItem("theme-mode", mode);
  };

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium text-muted-foreground">Theme</h4>
      <div className="grid grid-cols-3 gap-3">
        {themes.map((t) => (
          <motion.button
            key={t.mode}
            onClick={() => setTheme(t.mode)}
            className={`relative p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
              current === t.mode
                ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                : "border-border/50 bg-card/50 hover:border-primary/30"
            }`}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            style={{ perspective: "600px" }}
          >
            <motion.div
              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                current === t.mode ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
              }`}
              whileHover={{ rotateY: 15, rotateX: -10 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <t.icon className="w-5 h-5" />
            </motion.div>
            <span className="text-xs font-medium">{t.label}</span>
            <span className="text-[10px] text-muted-foreground leading-tight text-center">{t.description}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
