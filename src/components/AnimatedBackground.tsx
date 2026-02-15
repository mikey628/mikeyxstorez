import { motion } from "framer-motion";

const orbs = [
  { size: 350, x: "5%", y: "15%", hue: 210, opacity: 0.15, duration: 25, delay: 0 },
  { size: 280, x: "65%", y: "55%", hue: 220, opacity: 0.1, duration: 30, delay: 2 },
  { size: 220, x: "35%", y: "75%", hue: 200, opacity: 0.12, duration: 22, delay: 4 },
  { size: 400, x: "75%", y: "8%", hue: 230, opacity: 0.08, duration: 28, delay: 1 },
];

export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full will-change-transform"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            filter: "blur(100px)",
            background: `radial-gradient(circle, hsla(${orb.hue}, 80%, 55%, ${orb.opacity}), transparent 70%)`,
          }}
          animate={{
            x: [0, 30, -20, 0],
            y: [0, -25, 15, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}

      {/* Scanning line */}
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.15), transparent)",
        }}
        animate={{ top: ["-5%", "105%"] }}
        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: "radial-gradient(ellipse at center, transparent 30%, hsl(var(--background)) 100%)",
        }}
      />
    </div>
  );
};
