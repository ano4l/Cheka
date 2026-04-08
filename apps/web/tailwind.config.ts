import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: "#f5efe4",
        ink: "#14231d",
        moss: "#29473b",
        clay: "#7d5c46",
        coral: "#d17755",
      },
      boxShadow: {
        glow: "0 24px 80px rgba(20, 35, 29, 0.16)",
      },
      borderRadius: {
        "4xl": "2rem",
      },
    },
  },
  plugins: [],
};

export default config;

