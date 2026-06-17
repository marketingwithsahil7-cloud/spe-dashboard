/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        pitch: '#0A0A0F',
        surface: '#12121A',
        surfaceLight: '#1A1A2E',
        grass: '#00FF87',
        grassDim: '#00CC6A',
        amber: '#FFB800',
        danger: '#FF3D57',
        ice: '#00D4FF',
      },
      fontFamily: {
        display: ['Oswald', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      borderRadius: {
        glass: '16px',
      },
      backdropBlur: {
        glass: '24px',
      },
      animation: {
        'pulse-red': 'pulseRed 2s ease-in-out infinite',
        shimmer: 'shimmer 1.5s infinite',
        float: 'float 3s ease-in-out infinite',
        marquee: 'marquee 20s linear infinite',
      },
      keyframes: {
        pulseRed: {
          '0%, 100%': {
            boxShadow: '0 0 20px rgba(255, 61, 87, 0.4)',
            transform: 'scale(1)',
          },
          '50%': {
            boxShadow: '0 0 30px rgba(255, 61, 87, 0.7)',
            transform: 'scale(1.05)',
          },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
    },
  },
  plugins: [],
}
