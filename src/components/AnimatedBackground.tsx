import { motion } from "framer-motion";

const orbs = [
  { size: 350, x: "5%", y: "15%", hue: 262, opacity: 0.18, duration: 20, delay: 0 },
  { size: 280, x: "65%", y: "55%", hue: 280, opacity: 0.12, duration: 25, delay: 2 },
  { size: 220, x: "35%", y: "75%", hue: 200, opacity: 0.15, duration: 18, delay: 4 },
  { size: 400, x: "75%", y: "8%", hue: 320, opacity: 0.1, duration: 22, delay: 1 },
  { size: 200, x: "15%", y: "45%", hue: 180, opacity: 0.12, duration: 30, delay: 3 },
  { size: 150, x: "50%", y: "30%", hue: 240, opacity: 0.08, duration: 15, delay: 5 },
];

export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.02]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "50px 50px",
        }}
      />

      {/* Floating orbs with blur and color cycling */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            filter: "blur(80px)",
          }}
          animate={{
            x: [0, 50, -40, 30, 0],
            y: [0, -40, 30, -50, 0],
            scale: [1, 1.3, 0.85, 1.15, 1],
            background: [
              `radial-gradient(circle, hsla(${orb.hue}, 80%, 55%, ${orb.opacity}), transparent 70%)`,
              `radial-gradient(circle, hsla(${orb.hue + 40}, 85%, 60%, ${orb.opacity + 0.05}), transparent 70%)`,
              `radial-gradient(circle, hsla(${orb.hue + 80}, 75%, 50%, ${orb.opacity}), transparent 70%)`,
              `radial-gradient(circle, hsla(${orb.hue + 20}, 80%, 55%, ${orb.opacity + 0.03}), transparent 70%)`,
              `radial-gradient(circle, hsla(${orb.hue}, 80%, 55%, ${orb.opacity}), transparent 70%)`,
            ],
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
          background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.2), hsl(262 83% 70% / 0.4), hsl(var(--primary) / 0.2), transparent)",
        }}
        animate={{ top: ["-5%", "105%"] }}
        transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
      />

      {/* Second scanning line (slower, opposite) */}
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{
          background: "linear-gradient(90deg, transparent, hsl(200 80% 60% / 0.15), transparent)",
        }}
        animate={{ top: ["105%", "-5%"] }}
        transition={{ duration: 14, repeat: Infinity, ease: "linear", delay: 3 }}
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
