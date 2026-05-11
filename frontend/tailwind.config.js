/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream:  { DEFAULT: '#faf7f2', dark: '#f0ead8' },
        bark:   { DEFAULT: '#2c1f0e', light: '#5c3d1e' },
        sage:   { DEFAULT: '#7a9e6e', light: '#a8c49a', dark: '#4e7a42' },
        terra:  { DEFAULT: '#c4622d', light: '#e8855a', dark: '#8f3e14' },
        wheat:  { DEFAULT: '#d4a853', light: '#e8cc8a' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['Lato', 'sans-serif'],
      },
    },
  },
  plugins: [],
}