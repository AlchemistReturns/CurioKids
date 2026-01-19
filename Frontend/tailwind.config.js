/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#3f51b5",
        secondary: "#ffc107",
        ternary: "#658C58",
        base: "#edf0f7",
        tigerYellow: "#FFC226",
        tigerOrange: "#FF6E4F",
        tigerCream: "#FFF9E6",
        tigerBrown: "#5A3E29",
        tigerCard: "#F0E491"
      },
    },
  },
  plugins: [],
};