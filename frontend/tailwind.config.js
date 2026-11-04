/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        theme: {
          bg: 'var(--bg-main)',
          card: 'var(--bg-card)',
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          border: 'var(--border-color)',
          terracotta: 'var(--accent-terracotta)',
          gold: 'var(--accent-gold)',
          badge: 'var(--bg-badge)',
        },
        art: {
          charcoal: '#2B1D18',
          ochre: '#D99A3D',
          terracotta: '#C65D3B',
          cream: '#FFF9F2',
          stone: '#E8D8C7',
          sand: '#E8D8C7',
          midnight: '#1C1715',
          darkcard: '#2A211E',
          darkborder: '#493A34',
          darkstone: '#382B26',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      boxShadow: {
        glow: 'var(--shadow-glow)',
        'art-card': 'var(--shadow-card)',
        'art-hover': 'var(--shadow-card-hover)',
        art: '0 4px 20px -2px rgba(43, 29, 24, 0.06)',
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
