import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        ocean: "#5BA7C8",
        mint: "#A9DEC8",
        ink: "#17324D",
        soft: "#F5FBFA"
      },
      boxShadow: {
        soft: "0 18px 55px rgba(23, 50, 77, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
