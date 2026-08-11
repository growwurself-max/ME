/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef7f4', 100: '#d5ebe3', 200: '#abd7c8',
          300: '#7bbca7', 400: '#4e9d85', 500: '#31806a',
          600: '#236656', 700: '#1c5145', 800: '#173f37', 900: '#12312b',
        },
      },
      boxShadow: { card: '0 1px 2px rgba(16,24,40,.06), 0 8px 24px -12px rgba(16,24,40,.18)' },
    },
  },
  plugins: [],
};
