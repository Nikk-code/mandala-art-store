/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        art: {
          charcoal: '#1A1817',
          ochre: '#C88D42',
          terracotta: '#A84B29',
          cream: '#FDFBF7',
          stone: '#EAE6DF',
          sand: '#D9D0C1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
