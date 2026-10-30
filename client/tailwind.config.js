/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        burgundy: {
          950: '#23050B',
          900: '#380912',
          800: '#4E0E1B',
          700: '#691425',
          600: '#861A30',
          500: '#A4203B',
          DEFAULT: '#4E0E1B'
        },
        gold: {
          50: '#FDFCF7',
          100: '#FAF6E8',
          200: '#F4E9CB',
          300: '#EBD8A3',
          400: '#DFC274',
          500: '#D4AF37', // Champagne Gold
          600: '#B89326',
          700: '#91711A',
          800: '#6E5415',
          DEFAULT: '#D4AF37'
        },
        cream: {
          50: '#FDFBF7',
          100: '#FAF7F2',
          200: '#F5EFEB',
          300: '#EAE1D5',
          400: '#DBD0C0',
          DEFAULT: '#FAF7F2'
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
        cinzel: ['"Cinzel"', 'serif']
      },
      boxShadow: {
        glow: '0 0 25px -5px rgba(212, 175, 55, 0.3)',
        'glow-lg': '0 0 45px -5px rgba(212, 175, 55, 0.45)',
        'luxury': '0 20px 40px -15px rgba(56, 9, 18, 0.12)'
      }
    }
  },
  plugins: []
};
