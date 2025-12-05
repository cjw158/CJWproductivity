/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // 霓虹色彩系统
        neon: {
          cyan: "#00FFFF",
          pink: "#FF00FF",
          purple: "#8B5CF6",
          blue: "#3B82F6",
          green: "#00FF88",
          orange: "#FF6B00",
          red: "#FF0055",
          yellow: "#FFEE00",
        },
        // 暗黑背景
        dark: {
          900: "#0A0A0F",
          800: "#12121A",
          700: "#1A1A25",
          600: "#252533",
        },
        glass: {
          light: "rgba(255, 255, 255, 0.05)",
          medium: "rgba(255, 255, 255, 0.08)",
          dark: "rgba(0, 0, 0, 0.5)",
        },
        quadrant: {
          urgent: "rgba(239, 68, 68, 0.2)",
          important: "rgba(59, 130, 246, 0.2)",
          delegate: "rgba(234, 179, 8, 0.2)",
          eliminate: "rgba(107, 114, 128, 0.2)",
          1: "rgba(255, 0, 85, 0.15)", // neon red - urgent & important
          2: "rgba(0, 255, 255, 0.15)", // neon cyan - important
          3: "rgba(255, 238, 0, 0.15)", // neon yellow - urgent
          4: "rgba(139, 92, 246, 0.1)", // neon purple - neither
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "spotlight-in": {
          "0%": { opacity: "0", transform: "translateY(-20px) scale(0.95)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "spotlight-out": {
          "0%": { opacity: "1", transform: "translateY(0) scale(1)" },
          "100%": { opacity: "0", transform: "translateY(-20px) scale(0.95)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "neon-pulse": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 20px currentColor" },
          "50%": { boxShadow: "0 0 40px currentColor, 0 0 60px currentColor" },
        },
        "border-glow": {
          "0%, 100%": { borderColor: "rgba(0, 255, 255, 0.5)" },
          "50%": { borderColor: "rgba(255, 0, 255, 0.5)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "spotlight-in": "spotlight-in 0.3s ease-out",
        "spotlight-out": "spotlight-out 0.2s ease-in",
        "fade-in": "fade-in 0.3s ease-out",
        "neon-pulse": "neon-pulse 2s ease-in-out infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "border-glow": "border-glow 4s ease-in-out infinite",
      },
      backdropBlur: {
        xs: "2px",
        "2xl": "40px",
        "3xl": "64px",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "PingFang SC",
          "Hiragino Sans GB",
          "Microsoft YaHei",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require("@tailwindcss/typography"),
  ],
};
