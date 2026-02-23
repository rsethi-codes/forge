import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#ff3131",
        secondary: "#f0b429",
        success: "#00d68f",
        background: "#0a0a0a",
        surface: "#111111",
        "surface-elevated": "#1a1a1a",
        "border-subtle": "#222222",
        "text-primary": "#f0f0f0",
        "text-secondary": "#888888",
      },
      fontFamily: {
        syne: ["var(--font-syne)"],
        sans: ["var(--font-dm-sans)"],
        mono: ["var(--font-jetbrains-mono)"],
        fraunces: ["var(--font-fraunces)"],
        lora: ["var(--font-lora)"],
      },
      gridTemplateColumns: {
        '15': 'repeat(15, minmax(0, 1fr))',
      },
    },
  },
  plugins: [],
};
export default config;
