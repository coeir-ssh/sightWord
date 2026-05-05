/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        kid: ['"Comic Sans MS"', 'system-ui', 'sans-serif'],
      },
      colors: {
        sky: {
          soft: '#cfe9ff',
        },
      },
    },
  },
  plugins: [],
};
