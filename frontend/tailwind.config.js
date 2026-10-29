/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#E50914', // A cinematic red
        dark: {
          900: '#141414', // Deep background
          800: '#181818', // Card background
          700: '#282828', // Hover state
        }
      }
    },
  },
  plugins: [],
}