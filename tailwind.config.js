/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#0e1a12",
        paper: "#f4f0e8",
        moss: "#2d5a27",
        sage: "#7aad6e",
        pale: "#c8ddb8",
        amber: "#d4a843",
        mist: "#e8ede4",
        mid: "#5a7a54",
      },
    },
  },
  plugins: [],
}
