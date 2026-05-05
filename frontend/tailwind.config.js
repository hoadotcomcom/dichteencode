/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Cream / paper background
        cream: {
          50:  '#fffcf5',
          100: '#fef8e7',
          200: '#fbedc8',
          300: '#f5dc99',
        },
        // Hot pink — primary action
        hot: {
          50:  '#fff0f6',
          100: '#ffd6e5',
          200: '#ffadcb',
          300: '#ff7aa8',
          400: '#ff4785',
          500: '#ff1f6b',
          600: '#e6005a',
          700: '#b8004a',
          800: '#80003a',
        },
        // Electric blue — link / focus
        zap: {
          50:  '#eef4ff',
          100: '#dde8ff',
          200: '#b8cfff',
          300: '#85a8ff',
          400: '#5b7cff',
          500: '#3b54ff',
          600: '#2535e6',
          700: '#1c28b8',
        },
        // Neon lime — accent / highlight
        lime: {
          50:  '#f6fde7',
          100: '#ecfbc4',
          200: '#d6f580',
          300: '#bcec3a',
          400: '#a4d91a',
          500: '#85b30a',
          600: '#638608',
        },
        // Soft lavender
        lav: {
          100: '#f3e8ff',
          200: '#e0c8ff',
          300: '#c89fff',
          400: '#a370ff',
          500: '#7c3aed',
        },
        ink: {
          900: '#0f0a1f',
          800: '#1a1330',
          700: '#2a1f4a',
        },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        // Neo-brutalist hard shadow
        'brutal-sm': '3px 3px 0 0 rgb(15 10 31)',
        'brutal':    '5px 5px 0 0 rgb(15 10 31)',
        'brutal-lg': '8px 8px 0 0 rgb(15 10 31)',
        'brutal-xl': '12px 12px 0 0 rgb(15 10 31)',
        'brutal-pink': '5px 5px 0 0 rgb(255 31 107)',
        'brutal-zap':  '5px 5px 0 0 rgb(59 84 255)',
        'brutal-lime': '5px 5px 0 0 rgb(164 217 26)',
        'pop':       '0 0 0 4px rgb(255 31 107 / 0.2), 5px 5px 0 0 rgb(15 10 31)',
      },
      animation: {
        'fade-in':   'fadeIn 0.3s ease-out',
        'slide-up':  'slideUp 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'bounce-in': 'bounceIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'wiggle':    'wiggle 0.6s ease-in-out',
        'spin-slow': 'spin 12s linear infinite',
        'float':     'float 6s ease-in-out infinite',
        'sparkle':   'sparkle 1.4s ease-in-out infinite',
        'pulse-ring':'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer':   'shimmer 2s linear infinite',
      },
      keyframes: {
        fadeIn:    { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp:   { '0%': { opacity: '0', transform: 'translateY(30px) scale(0.95)' }, '100%': { opacity: '1', transform: 'translateY(0) scale(1)' } },
        bounceIn:  { '0%': { opacity: '0', transform: 'scale(0.5) rotate(-8deg)' }, '60%': { transform: 'scale(1.05) rotate(2deg)' }, '100%': { opacity: '1', transform: 'scale(1) rotate(0)' } },
        wiggle:    { '0%, 100%': { transform: 'rotate(-2deg)' }, '50%': { transform: 'rotate(2deg)' } },
        float:     { '0%, 100%': { transform: 'translateY(0) rotate(0)' }, '50%': { transform: 'translateY(-12px) rotate(3deg)' } },
        sparkle:   { '0%, 100%': { opacity: '0.3', transform: 'scale(0.8)' }, '50%': { opacity: '1', transform: 'scale(1.2)' } },
        pulseRing: { '0%': { transform: 'scale(0.8)', opacity: '0.5' }, '100%': { transform: 'scale(2)', opacity: '0' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
      backgroundImage: {
        'grid-paper': "linear-gradient(rgb(15 10 31 / 0.04) 1px, transparent 1px), linear-gradient(90deg, rgb(15 10 31 / 0.04) 1px, transparent 1px)",
        'dots': "radial-gradient(rgb(15 10 31 / 0.1) 1px, transparent 1px)",
      },
      backgroundSize: {
        'grid-md': '32px 32px',
        'dots-md': '20px 20px',
      },
    },
  },
  plugins: [],
}
