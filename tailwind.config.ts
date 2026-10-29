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
        minsu: {
          green: {
            900: "#123F17",
            800: "#164D1C",
            700: "#1B5E20",
            600: "#25702A",
            500: "#2E7D32",
            100: "#DCEFDD",
            50: "#F1F8F1",
          },
          gold: {
            600: "#B88A00",
            500: "#F2B705",
            400: "#F9C733",
            100: "#FFF1C2",
          },
        },
        ink: {
          DEFAULT: "#1F2A24",
          muted: "#55645B",
        },
        line: "#D6DDD8",
        surface: "#FFFFFF",
        page: "#F6F8F6",
      },
      fontFamily: {
        heading: ["var(--font-montserrat)", "sans-serif"],
        sans: ["var(--font-inter)", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
