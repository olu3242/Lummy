import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // ── Typography ──────────────────────────────────────
      fontFamily: {
        display: ["var(--font-cabinet)", "system-ui", "sans-serif"],
        body: ["var(--font-satoshi)", "system-ui", "sans-serif"],
      },
      // ── Brand palette ────────────────────────────────────
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: "hsl(var(--card))",
        "card-foreground": "hsl(var(--card-foreground))",
        popover: "hsl(var(--popover))",
        "popover-foreground": "hsl(var(--popover-foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        secondary: "hsl(var(--secondary))",
        "secondary-foreground": "hsl(var(--secondary-foreground))",
        muted: "hsl(var(--muted))",
        "muted-foreground": "hsl(var(--muted-foreground))",
        accent: "hsl(var(--accent))",
        "accent-foreground": "hsl(var(--accent-foreground))",
        destructive: "hsl(var(--destructive))",
        "destructive-foreground": "hsl(var(--destructive-foreground))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        brand: {
          violet: "#7c3aed",
          "violet-light": "#8b5cf6",
          "violet-dark": "#6d28d9",
          fuchsia: "#d946ef",
          "fuchsia-light": "#e879f9",
          emerald: "#10b981",
          amber: "#f59e0b",
          coral: "#f97316",
          purple: "#6C4EF3",
          green: "#10B981",
          indigo: "#4F46E5",
          midnight: "#080815",
        },
        dark: {
          DEFAULT: "#070414",
          2: "#0e0920",
          3: "#160e2c",
          card: "rgba(255,255,255,0.04)",
          border: "rgba(255,255,255,0.08)",
        },
      },
      // ── Extended border radius ────────────────────────────
      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
        "6xl": "3rem",
      },
      // ── Box shadows ───────────────────────────────────────
      boxShadow: {
        "brand-sm": "0 4px 14px rgba(108,78,243,0.35)",
        "violet-sm": "0 4px 18px rgba(124,58,237,0.35)",
        violet: "0 10px 40px rgba(124,58,237,0.4)",
        "violet-lg": "0 20px 70px rgba(124,58,237,0.45)",
        card: "0 4px 24px rgba(0,0,0,0.3)",
        phone: "0 40px 100px rgba(124,58,237,0.35), 0 0 0 1px rgba(255,255,255,0.05)",
      },
      // ── Gradients via backgroundImage ─────────────────────
      backgroundImage: {
        "grad-brand": "linear-gradient(135deg, #7c3aed, #d946ef)",
        "grad-brand-h": "linear-gradient(90deg, #7c3aed, #d946ef, #7c3aed)",
        "grad-hero":
          "radial-gradient(circle at 65% 30%, rgba(124,58,237,0.45), transparent 35%), linear-gradient(135deg, #070414 0%, #100827 45%, #090515 100%)",
        "grad-grid":
          "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
        "grad-hiw": "linear-gradient(180deg, white, #f3f0ff)",
      },
      // ── Animation ────────────────────────────────────────
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "phone-float": {
          "0%, 100%": { transform: "translateY(0) rotate(-1deg)" },
          "50%": { transform: "translateY(-10px) rotate(1deg)" },
        },
        "pulse-dot": {
          "0%, 100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.75)" },
        },
        "grad-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.65s ease both",
        "phone-float": "phone-float 5s ease-in-out infinite",
        "pulse-dot": "pulse-dot 2s ease-in-out infinite",
        "grad-shift": "grad-shift 5s ease infinite",
      },
    },
  },
  plugins: [],
};

export default config;
