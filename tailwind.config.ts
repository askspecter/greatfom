import type { Config } from "tailwindcss";

/**
 * Dime — cinematic "aurora" design tokens.
 * Deep near-black canvas, an iridescent cyan→violet→magenta signature gradient,
 * hairline glass surfaces, layered glows. A million-dollar crypto feel.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Dark glass surfaces (ink.* utilities flip to dark).
        ink: {
          950: "#05050a",
          900: "#0a0a12",
          800: "#12121c",
          700: "#1b1b28",
          line: "rgba(255,255,255,0.08)",
        },
        // Brand accent = soft violet sampled from the aurora ramp.
        pink: {
          DEFAULT: "#9aa6ff",
          soft: "#38e5cc",
          deep: "#ff5ca8",
        },
        // Signature aurora stops.
        aurora: {
          cyan: "#38e5cc",
          violet: "#7b5cff",
          magenta: "#ff5ca8",
          gold: "#ffcf6a",
        },
        up: "#4ef0a3",
        down: "#ff6b81",
        // Legacy aliases kept on the aurora ramp.
        rose: {
          DEFAULT: "#9aa6ff",
          soft: "#38e5cc",
        },
        ember: {
          DEFAULT: "#38e5cc",
          soft: "#ff5ca8",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "ui-sans-serif", "system-ui", "sans-serif"],
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(123,92,255,0.35), 0 20px 60px -20px rgba(123,92,255,0.55)",
        card: "0 40px 90px -50px rgba(123,92,255,0.6)",
        float: "0 24px 60px -30px rgba(0,0,0,0.9)",
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
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both",
        "glow-pulse": "glow-pulse 4s ease-in-out infinite",
        marquee: "marquee 40s linear infinite",
        float: "float 6s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
