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
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        art: '0 4px 20px -2px rgba(26, 24, 23, 0.05)',
        'art-hover': '0 12px 30px -4px rgba(26, 24, 23, 0.12)',
      },
      borderRadius: {
        art: '1rem',
      },
      minHeight: {
        touch: '44px',
      },
      minWidth: {
        touch: '44px',
      },
    },
  },
  plugins: [],
};
