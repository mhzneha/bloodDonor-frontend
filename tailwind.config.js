/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./App.tsx",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      fontFamily: {},
      colors: {
        primary: {
          100: "#EF5350",
          200: "#ED3632",
        },
        textColor: {
          100: "#6B7280",
        },
        gray: {
          100: "#F9FAFB;",
        },
        textGray: {
          100: "#F9FAFB;",
        },
        black: {
          DEFAULT: "#000000",
          100: "#8C8E98",
          200: "#666876",
          300: "#191d31",
        },
        grayBg: {
          100: "#EDE9E9",
        },
        danger: "#f75555",
      },
    },
  },
  plugins: [],
};
