import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef7f3",
          100: "#d6ece1",
          200: "#aed9c4",
          300: "#7ec1a3",
          400: "#4fa382",
          500: "#328768",
          600: "#246c53",
          700: "#1e5744",
          800: "#1a4638",
          900: "#173a2f",
        },
      },
    },
  },
  plugins: [],
};

export default config;
