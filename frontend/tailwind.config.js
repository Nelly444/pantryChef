/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream:   { DEFAULT: '#f4f0e6', dark: '#e2ead4' },
        bark:    { DEFAULT: '#2c1f0e', light: '#5c3d1e' },
        sage:    { DEFAULT: '#7a9e6e', light: '#a8c49a', dark: '#4e7a42' },
        forest:  { DEFAULT: '#3d5c2e', light: '#5c7a42', dark: '#2a4020' },
        olive:   { DEFAULT: '#8a9a6a', light: '#d8e4c0' },
        harvest: { DEFAULT: '#9b8b4a' }, // medium pantry-coverage indicator
        rust:    { DEFAULT: '#8b3d20' }, // low pantry-coverage indicator
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['Lato', 'sans-serif'],
      },
      animation: {
        'shine-pulse': 'shine-pulse 8s infinite linear',
      },
      keyframes: {
        'shine-pulse': {
          '0%':  { 'background-position': '0% 0%' },
          '50%': { 'background-position': '100% 100%' },
          'to':  { 'background-position': '0% 0%' },
        },
      },
    },
  },
  plugins: [],
}
