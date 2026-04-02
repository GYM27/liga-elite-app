/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0b0d',
        surface: '#12141a',
        primary: {
          DEFAULT: '#39ff14',
          glow: 'rgba(57, 255, 20, 0.4)',
        },
        secondary: '#0ea5e9',
        danger: '#ef4444',
        muted: '#94a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
      backgroundImage: {
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0) 100%)',
      }
    },
  },
  plugins: [],
}
