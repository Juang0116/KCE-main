import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],

  // Optimización para dispositivos táctiles (evita el sticky hover en móviles)
  future: {
    hoverOnlyWhenSupported: true,
  },

  // Sincronizado con brand.tokens.ts y brand.css
  darkMode: ['class'],

  safelist: [
    'bg-brand-blue',
    'bg-brand-yellow',
    'text-brand-blue',
    'text-brand-red',
    'border-brand-dark/10',
    'bg-brand-blue/10',
    {
      pattern: /(bg|text|border)-brand-(blue|yellow|red|terra|beige|dark|white)\/(5|10|15|20|30)/,
    },
  ],

  theme: {
    container: {
      center: true,
      padding: '1.5rem',
      screens: {
        '2xl': '1280px',
      },
    },
    extend: {
      colors: {
        // 1. Colores de Identidad (Paleta fija)
        brand: {
          yellow: '#FFC300',
          blue: '#0D5BA1',
          red: '#D32F2F',
          terra: '#C68436',
          beige: '#FFF5E1',
          dark: '#111827',
          white: '#FFFFFF',
        },
        // 2. Colores Semánticos (Cambian con el tema)
        // Uso: bg-surface, text-base, border-main
        surface: {
          DEFAULT: 'var(--color-surface)',
          2: 'var(--color-surface-2)',
        },
        base: 'var(--color-bg)',
        main: 'var(--color-text)',
        muted: 'var(--color-text-muted)',
      },

      fontFamily: {
        heading: ['var(--font-heading)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },

      borderRadius: {
        'brand': 'var(--radius)', // 20px (xl en tus tokens)
        'brand-lg': 'var(--radius-lg)',
        'brand-2xl': 'var(--radius-2xl)',
      },

      boxShadow: {
        soft: 'var(--shadow-soft)',
        pop: 'var(--shadow-pop)',
        hard: 'var(--shadow-hard)',
      },

      // Configuración del anillo de enfoque global
      ringColor: {
        DEFAULT: 'var(--color-ring)',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.3s var(--ease-out)',
        'slide-up': 'slideUp 0.4s var(--ease-out)',
        'shimmer': 'shimmer 1.5s infinite',
      },

      backgroundImage: {
        'hero-gradient': 'var(--gradient-hero)',
        'fade-bottom': 'var(--gradient-fade-bottom)',
      },

      zIndex: {
        header: 'var(--z-header)',
        chat: 'var(--z-chat)',
        modal: 'var(--z-modal)',
      },
    },
  },

  plugins: [
    typography,
  ],
};

export default config;