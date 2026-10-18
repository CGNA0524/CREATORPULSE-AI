/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        background: "#0B1020",
        "background-secondary": "#111827",
        card: "#151D2E",
        "card-hover": "#1A2438",
        border: "#1E293B",
        "border-light": "#334155",
        primary: {
          DEFAULT: "#8B5CF6",
          hover: "#7C3AED",
          light: "#A78BFA",
          dark: "#6D28D9",
        },
        secondary: {
          DEFAULT: "#22D3EE",
          hover: "#06B6D4",
          light: "#67E8F9",
        },
        success: "#34D399",
        warning: "#FBBF24",
        error: "#F87171",
        foreground: "#F8FAFC",
        muted: "#94A3B8",
      },
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
    },
  },
  plugins: [],
};
