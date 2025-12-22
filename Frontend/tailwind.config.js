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
        base: "#edf0f7"
      },
    },
  },
  plugins: [],
};