/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        maroon: {
          50:  '#fdf2f2',
          100: '#fce4e4',
          200: '#f9c8c8',
          300: '#f49d9d',
          400: '#ec6464',
          500: '#df3b3b',
          600: '#cc1f1f',
          700: '#7B1C1C',
          800: '#6b1a1a',
          900: '#5c1a1a',
        },
        gold: {
          300: '#e8d38a',
          400: '#d9bb5e',
          500: '#C9A84C',
          600: '#b8922e',
          700: '#9a7520',
        },
        cream: {
          50:  '#FFFEF9',
          100: '#FDF6EC',
          200: '#F5ECD7',
          300: '#ede0c4',
        },
      },
      fontFamily: {
        serif: ['EB Garamond', 'Georgia', 'serif'],
        tamil: ['Noto Sans Tamil', 'Latha', 'sans-serif'],
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        dyslexic: ['OpenDyslexic', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
