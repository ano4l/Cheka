import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0f172a",
        muted: "#475569",
        accent: {
          DEFAULT: "#0f766e",
          strong: "#115e59",
          soft: "#ccfbf1",
        },
        butter: {
          DEFAULT: "#f5d34a",
          soft: "#fdf3c1",
          deep: "#d4a017",
        },
        cream: "#fdf9ec",
        sand: "#f5ecd3",
        line: "#e5e7eb",
        surface: "#ffffff",
        canvas: "#f7f8fa",
      },
      boxShadow: {
        soft: "0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.05)",
        elevated: "0 10px 30px rgba(15, 23, 42, 0.08)",
        glass: "0 8px 24px -8px rgba(15, 23, 42, 0.12), 0 1px 0 rgba(255, 255, 255, 0.6) inset",
        "glass-lg": "0 24px 48px -12px rgba(15, 23, 42, 0.18), 0 1px 0 rgba(255, 255, 255, 0.7) inset",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
        "4xl": "2rem",
      },
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Consolas", "monospace"],
      },
      backgroundImage: {
        "cream-gradient": "linear-gradient(140deg, #fdf9ec 0%, #f5ecd3 55%, #ecdcb8 100%)",
        "cream-radial":
          "radial-gradient(120% 80% at 0% 0%, #fdf9ec 0%, #faf2d8 35%, #efe4c0 70%, #e8dbb0 100%)",
        "glass-shine":
          "linear-gradient(135deg, rgba(255, 255, 255, 0.85) 0%, rgba(255, 255, 255, 0.55) 60%, rgba(255, 255, 255, 0.35) 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
