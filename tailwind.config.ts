import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          main: "var(--bg-main)",
          surface: "var(--bg-surface)",
          hover: "var(--bg-surface-hover)",
          subtle: "var(--bg-surface-subtle)",
          card: "var(--bg-surface-card)",
          glass: "var(--bg-glass)",
        },
        border: {
          DEFAULT: "var(--border-main)",
          light: "var(--border-light)",
          subtle: "var(--border-subtle)",
        },
        txt: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          muted: "var(--text-muted)",
        },
        brand: {
          50: "#EEF2FF",
          100: "#E0E7FF",
          500: "#6366F1",
          600: "#4F46E5",
          700: "#4338CA",
        },
        gain: {
          DEFAULT: "#10B981",
          subtle: "var(--gain-subtle)",
          border: "var(--gain-border)",
        },
        loss: {
          DEFAULT: "#F43F5E",
          subtle: "var(--loss-subtle)",
          border: "var(--loss-border)",
        },
        warning: {
          DEFAULT: "#F59E0B",
          subtle: "var(--warning-subtle)",
          border: "var(--warning-border)",
        },
        ai: {
          DEFAULT: "#38BDF8",
          subtle: "var(--ai-subtle)",
          border: "var(--ai-border)",
        },
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "Courier New", "monospace"],
      },
      boxShadow: {
        glow: "0 0 20px -5px rgba(99, 102, 241, 0.25)",
        "glow-gain": "0 0 20px -5px rgba(16, 185, 129, 0.25)",
        "glow-loss": "0 0 20px -5px rgba(244, 63, 94, 0.25)",
        "glow-ai": "0 0 20px -5px rgba(56, 189, 248, 0.25)",
        premium: "0 10px 30px -10px rgba(0, 0, 0, 0.5)",
        "premium-light": "0 10px 30px -10px rgba(0, 0, 0, 0.08)",
      },
      animation: {
        "fade-in": "fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-up": "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        "pulse-subtle": "pulseSubtle 2s infinite ease-in-out",
        "spin-slow": "spin 8s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "scale(0.98)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
