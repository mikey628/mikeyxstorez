import { RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";

export const FloatingRefresh = () => {
  const [spinning, setSpinning] = useState(false);

  const handleRefresh = () => {
    setSpinning(true);
    window.location.reload();
  };

  return (
    <motion.button
      onClick={handleRefresh}
      className="fixed bottom-6 right-6 z-50 w-10 h-10 rounded-full bg-primary/80 backdrop-blur-md text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center border border-primary/40 hover:bg-primary transition-colors"
      whileHover={{ scale: 1.15 }}
      whileTap={{ scale: 0.9 }}
      title="Refresh page"
    >
      <motion.div animate={spinning ? { rotate: 360 } : {}} transition={{ duration: 0.5 }}>
        <RefreshCw className="w-4 h-4" />
      </motion.div>
    </motion.button>
  );
};
