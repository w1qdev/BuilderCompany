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
        primary: {
          DEFAULT: "#E87A2E",
          light: "#F5A623",
          dark: "#D4601A",
        },
        dark: {
          DEFAULT: "#2D1B0E",
          light: "#3D2B1A",
        },
        neutral: {
          DEFAULT: "#585858",
          light: "#808080",
        },
        warm: {
          bg: "#FFF8F0",
          light: "#FFFDF9",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
