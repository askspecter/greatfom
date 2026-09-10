import type { Config } from "tailwindcss";

/**
 * Dime — holographic-glass design tokens.
 * Near-black canvas, an iridescent cyan→periwinkle→violet signature gradient,
 * hairline glass surfaces — matching the glass "D" logo.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark glass surfaces (ink.* utilities flip to dark).
        ink: {
          950: "#0b0d16",
          900: "#0a0b12",
          800: "#12141f",
          700: "#1a1d2b",
          line: "rgba(255,255,255,0.10)",
        },
        // Brand accent = iridescent periwinkle sampled from the logo's glow.
        pink: {
          DEFAULT: "#a9b8ff",
          soft: "#8fd0ff",
          deep: "#c9a2ff",
        },
        // Legacy aliases kept on the holographic ramp.
        rose: {
          DEFAULT: "#a9b8ff",
          soft: "#8fd0ff",
        },
        ember: {
          DEFAULT: "#8fd0ff",
          soft: "#c9a2ff",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(140,160,255,0.35), 0 20px 60px -20px rgba(120,140,255,0.5)",
        card: "0 40px 90px -50px rgba(90,120,255,0.55)",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "glow-pulse": {
          "0%,100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both",
        "glow-pulse": "glow-pulse 4s ease-in-out infinite",
        marquee: "marquee 32s linear infinite",
        shimmer: "shimmer 2.2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
