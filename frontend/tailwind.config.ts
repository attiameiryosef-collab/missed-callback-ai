import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef2ff",
          100: "#e0e7ff",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
      },
      boxShadow: {
        card: "0 1px 2px 0 rgb(15 23 42 / 0.05), 0 6px 16px -4px rgb(15 23 42 / 0.07)",
        "card-hover":
          "0 1px 2px 0 rgb(15 23 42 / 0.06), 0 12px 28px -8px rgb(15 23 42 / 0.12)",
        rail: "1px 0 0 0 rgb(15 23 42 / 0.04), 4px 0 16px -8px rgb(15 23 42 / 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
