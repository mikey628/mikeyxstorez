import { motion } from "framer-motion";
import { ThemeSettings } from "@/components/ThemeSettings";
import { useLanguage, languages } from "@/contexts/LanguageContext";
import { Globe, Settings } from "lucide-react";

export const SettingsPanel = () => {
  const { lang, setLang, t } = useLanguage();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold">{t("settings")}</h3>
      </div>

      {/* Theme */}
      <ThemeSettings />

      {/* Language */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <Globe className="w-4 h-4" />
          {t("language")}
        </h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {languages.map((l) => (
            <motion.button
              key={l.code}
              onClick={() => setLang(l.code)}
              className={`relative px-3 py-2.5 rounded-xl border-2 transition-all flex items-center gap-2 text-sm ${
                lang === l.code
                  ? "border-primary bg-primary/10 shadow-lg shadow-primary/20 font-medium"
                  : "border-border/50 bg-card/50 hover:border-primary/30"
              }`}
              whileHover={{ scale: 1.03, y: -1 }}
              whileTap={{ scale: 0.97 }}
              style={{ perspective: "600px" }}
            >
              <motion.span
                className="text-lg"
                whileHover={{ rotateY: 15 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {l.flag}
              </motion.span>
              <span>{l.label}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};
