import type { Config } from 'tailwindcss';

export default {
  content: ['./src/**/*.{ts,tsx,html}', './public/**/*.html'],
  theme: {
    extend: {
      colors: {
        // Cyberpunk neon palette
        neon: {
          cyan:   '#00f5ff',
          pink:   '#ff006e',
          purple: '#bf00ff',
          green:  '#39ff14',
          orange: '#ff9500',
          blue:   '#0080ff',
        },
        // Dark backgrounds (void-like)
        void: {
          0: '#010108',
          1: '#05050f',
          2: '#080818',
          3: '#0c0c22',
          4: '#10102e',
        },
        // Glass surfaces
        glass: {
          DEFAULT: 'rgba(255,255,255,0.03)',
          hover:   'rgba(255,255,255,0.06)',
          active:  'rgba(0,245,255,0.05)',
        },
        // Keep brand for backwards compat
        brand: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6ff',
          300: '#a3bbff',
          400: '#7896ff',
          500: '#4f6ef7',
          600: '#3a52eb',
          700: '#2f3fd7',
          800: '#2c35ae',
          900: '#2a3288',
          950: '#1c2055',
        },
        // Surfaces (legacy)
        surface: {
          0: '#010108',
          1: '#05050f',
          2: '#080818',
          3: '#0c0c22',
        },
        accent: {
          green:  '#39ff14',
          yellow: '#ff9500',
          red:    '#ff006e',
          blue:   '#00f5ff',
          purple: '#bf00ff',
        },
      },
      fontFamily: {
        sans:    ['Inter', 'ui-sans-serif', 'system-ui'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'monospace'],
        display: ['Orbitron', 'ui-sans-serif'],
      },
      animation: {
        'slide-up':    'slide-up 0.25s ease-out',
        'fade-in':     'fade-in 0.3s ease-out',
        'pool-float':  'pool-float 6s ease-in-out infinite',
        'neon-pulse':  'neon-pulse 2s ease-in-out infinite',
        'glow-pulse':  'glow-pulse-cyan 3s ease-in-out infinite',
        'spin-slow':   'spin 4s linear infinite',
      },
      keyframes: {
        'slide-up':  { from: { transform: 'translateY(8px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'fade-in':   { from: { opacity: '0' }, to: { opacity: '1' } },
        'pool-float':{ '0%,100%': { transform: 'translateY(0) scale(1)', opacity: '0.8' }, '33%': { transform: 'translateY(-4px) scale(1.05)', opacity: '1' }, '66%': { transform: 'translateY(3px) scale(0.97)', opacity: '0.9' } },
        'neon-pulse':{ '0%,100%': { opacity: '1' }, '50%': { opacity: '0.6' } },
        'glow-pulse-cyan': { '0%,100%': { boxShadow: '0 0 8px rgba(0,245,255,0.3)' }, '50%': { boxShadow: '0 0 20px rgba(0,245,255,0.6), 0 0 40px rgba(0,245,255,0.2)' } },
      },
      boxShadow: {
        'neon-cyan':   '0 0 16px rgba(0,245,255,0.5), 0 0 40px rgba(0,245,255,0.2)',
        'neon-pink':   '0 0 16px rgba(255,0,110,0.5), 0 0 40px rgba(255,0,110,0.2)',
        'neon-purple': '0 0 16px rgba(191,0,255,0.5), 0 0 40px rgba(191,0,255,0.2)',
        'neon-green':  '0 0 16px rgba(57,255,20,0.5),  0 0 40px rgba(57,255,20,0.2)',
        'glass':       'inset 0 1px 0 rgba(255,255,255,0.05), 0 8px 32px rgba(0,0,0,0.4)',
      },
      backdropBlur: { glass: '20px' },
    },
  },
  plugins: [],
} satisfies Config;
