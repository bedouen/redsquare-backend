/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      // ─── COULEURS (Utilisées dans tous les composants) ───
      colors: {
        'brand-red': '#E63946',
        'brand-redDark': '#C62828',
        'brand-black': '#1A1A1A',
        'brand-white': '#FFFFFF',
        // Alias pour compatibilité
        'brand': {
          red: '#E63946',
          redDark: '#C62828',
          black: '#1A1A1A',
          white: '#FFFFFF',
        },
      },

      // ─── ANIMATIONS (Utilisées dans ProductCard, Home, etc.) ───
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce': 'bounce 1s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'progress': 'progress 1.5s ease-in-out forwards',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
      },

      // ─── KEYFRAMES ───
      keyframes: {
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0.5 },
        },
        bounce: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        progress: {
          '0%': { width: '0%' },
          '100%': { width: '100%' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: 0 },
          '100%': { transform: 'translateY(0)', opacity: 1 },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: 0 },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },

      // ─── OMBRES ───
      boxShadow: {
        'card': '0 2px 10px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 30px rgba(0,0,0,0.15)',
        'brand': '0 4px 20px rgba(230, 57, 70, 0.3)',
        'brand-lg': '0 8px 40px rgba(230, 57, 70, 0.4)',
      },

      // ─── BORDER RADIUS ───
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },

      // ─── Z-INDEX ───
      zIndex: {
        '50': '50',
        '60': '60',
      },

      // ─── BACKGROUND ───
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #E63946 0%, #C62828 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1A1A1A 0%, #333333 100%)',
      },
    },
  },
  plugins: [],
}