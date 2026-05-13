/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      colors: {
        ranch: {
          50: '#faf7f2',
          100: '#f2ece0',
          200: '#e5d8bd',
          300: '#d3bc8f',
          400: '#be9c63',
          500: '#a88149',
          600: '#8c683a',
          700: '#6f5230',
          800: '#5a432b',
          900: '#4a3826',
          950: '#2a1f16'
        },
        wagyu: {
          50: '#fdf4f4',
          100: '#fbe6e6',
          200: '#f5c5c5',
          300: '#ea9898',
          400: '#db6464',
          500: '#c83f3f',
          600: '#a82828',
          700: '#8a2121',
          800: '#722020',
          900: '#621f1f',
          950: '#340d0d'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
