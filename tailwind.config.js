/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#F0E491",   
        secondary: "#BBC863",
        ternary: "#658C58",
        base: "#31694E"
      },
    },
  },
  plugins: [],
};