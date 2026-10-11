/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        saffron: {
          50: '#fff8f0',
          100: '#ffedd5',
          200: '#fed7aa',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        navy: {
          50: '#f0f4ff',
          100: '#e0e8ff',
          400: '#6080e0',
          600: '#1e3a8a',
          700: '#1e3a6e',
          800: '#172554',
          900: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Noto Sans', 'Noto Sans Devanagari', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
