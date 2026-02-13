import { motion } from "framer-motion";

const orbs = [
  { size: 300, x: "10%", y: "20%", color: "hsl(var(--primary) / 0.15)", duration: 20, delay: 0 },
  { size: 250, x: "70%", y: "60%", color: "hsl(var(--primary) / 0.1)", duration: 25, delay: 2 },
  { size: 200, x: "40%", y: "80%", color: "hsl(var(--accent) / 0.12)", duration: 18, delay: 4 },
  { size: 350, x: "80%", y: "10%", color: "hsl(var(--primary) / 0.08)", duration: 22, delay: 1 },
  { size: 180, x: "20%", y: "50%", color: "hsl(var(--accent) / 0.1)", duration: 30, delay: 3 },
];

export const AnimatedBackground = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Grid overlay */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      {/* Floating orbs with blur */}
      {orbs.map((orb, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: orb.size,
            height: orb.size,
            left: orb.x,
            top: orb.y,
            background: `radial-gradient(circle, ${orb.color}, transparent 70%)`,
            filter: "blur(60px)",
          }}
          animate={{
            x: [0, 40, -30, 20, 0],
            y: [0, -30, 20, -40, 0],
            scale: [1, 1.2, 0.9, 1.1, 1],
          }}
          transition={{
            duration: orb.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: orb.delay,
          }}
        />
      ))}

      {/* Scanning line effect */}
      <motion.div
        className="absolute left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)",
        }}
        animate={{ top: ["-5%", "105%"] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, hsl(var(--background)) 100%)",
        }}
      />
    </div>
  );
};
