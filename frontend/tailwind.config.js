/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#2563EB",
          light: "#60A5FA",
          dark: "#1D4ED8",
        },
        accent: "#F97373",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};


