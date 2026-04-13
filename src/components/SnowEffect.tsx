import { useEffect, useState } from "react";
import { getTheme } from "./ThemeSettings";

const FLAKE_COUNT = 40;

export const SnowEffect = () => {
  const [active, setActive] = useState(getTheme() === "cold");

  useEffect(() => {
    const handler = (e: Event) => {
      setActive((e as CustomEvent).detail === "cold");
    };
    window.addEventListener("theme-change", handler);
    return () => window.removeEventListener("theme-change", handler);
  }, []);

  if (!active) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {Array.from({ length: FLAKE_COUNT }).map((_, i) => {
        const size = Math.random() * 4 + 2;
        const left = Math.random() * 100;
        const delay = Math.random() * 10;
        const duration = Math.random() * 8 + 6;
        return (
          <div
            key={i}
            className="absolute rounded-full bg-white/70"
            style={{
              width: size,
              height: size,
              left: `${left}%`,
              top: "-10px",
              animation: `snowfall ${duration}s linear ${delay}s infinite`,
              filter: "blur(0.5px)",
            }}
          />
        );
      })}
    </div>
  );
};
