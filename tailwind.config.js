/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Mono"', 'monospace'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        // Valores em src/index.css (variáveis por tema)
        brand: {
          bg:        'rgb(var(--c-bg) / <alpha-value>)',
          card:      'rgb(var(--c-card) / <alpha-value>)',
          border:    'rgb(var(--c-border) / <alpha-value>)',
          subtle:    'rgb(var(--c-subtle) / <alpha-value>)',
          muted:     'rgb(var(--c-muted) / <alpha-value>)',
          text:      'rgb(var(--c-text) / <alpha-value>)',
          primary:   'rgb(var(--c-primary) / <alpha-value>)',
          button:    'rgb(var(--c-button) / <alpha-value>)',
          accent:    'rgb(var(--c-accent) / <alpha-value>)',
          secondary: 'rgb(var(--c-secondary) / <alpha-value>)',
          highlight: 'rgb(var(--c-highlight) / <alpha-value>)',
        },
        status: {
          ok:     'rgb(var(--c-ok) / <alpha-value>)',
          warn:   'rgb(var(--c-warn) / <alpha-value>)',
          danger: 'rgb(var(--c-danger) / <alpha-value>)',
        },
      },
      animation: {
        'fade-up':   'fadeUp 0.5s ease forwards',
        'pulse-dot': 'pulseDot 1.5s ease-in-out infinite',
        'shimmer':   'shimmer 1.8s linear infinite',
        'slide-in-right': 'slideInRight 0.25s ease-out',
      },
      keyframes: {
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseDot: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%':      { opacity: '0.4', transform: 'scale(0.8)' },
        },
        slideInRight: {
          '0%':   { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
