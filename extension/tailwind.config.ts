import type { Config } from 'tailwindcss';

export default {
  content: [
    './src/**/*.{ts,tsx,html}',
    './public/**/*.html',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f4ff',
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
        surface: {
          0: '#0d0f1a',
          1: '#12152a',
          2: '#181c36',
          3: '#1f2442',
        },
        accent: {
          green: '#22c55e',
          yellow: '#f59e0b',
          red: '#ef4444',
          blue: '#3b82f6',
          purple: '#a855f7',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-in': 'slideIn 0.2s ease-out',
        'fade-in': 'fadeIn 0.3s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        slideIn: {
          '0%': { transform: 'translateY(-8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      boxShadow: {
        'glow-brand': '0 0 20px rgba(79, 110, 247, 0.3)',
        'glow-green': '0 0 20px rgba(34, 197, 94, 0.3)',
        'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.05)',
      },
    },
  },
  plugins: [],
} satisfies Config;
