/** @type {import('tailwindcss').Config} */
export default {
  content: ["./app/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // PositiveNRG Brand Colors - Warm & Calming
        sunrise: {
          50: '#FFFDF7',   // Soft Cream Background
          100: '#FFF8E1',
          200: '#FFE87C',   // Sunrise Yellow Primary
          300: '#FFD54F',
          400: '#FFC107',
          500: '#FFB300',
          600: '#FF8F00',
          700: '#FF6F00',
          800: '#E65100',
          900: '#BF360C',
        },
        peach: {
          50: '#FFF8F5',
          100: '#FFE8E0',
          200: '#FFB88C',   // Peach Orange Secondary
          300: '#FF9A6B',
          400: '#FF7B4A',
          500: '#FF5C29',
          600: '#E53E3E',
          700: '#C53030',
          800: '#9C1C1C',
          900: '#742A2A',
        },
        pastel: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#A8E6A1',   // Pastel Green Support
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#166534',
          900: '#14532D',
        },
        charcoal: {
          50: '#F8F9FA',
          100: '#F1F3F4',
          200: '#E8EAED',
          300: '#DADCE0',
          400: '#BDC1C6',
          500: '#9AA0A6',
          600: '#80868B',
          700: '#5F6368',
          800: '#3C4043',
          900: '#333333',   // Charcoal Gray Text
        },
        mist: {
          50: '#FAFAFA',
          100: '#F5F5F5',
          200: '#EEEEEE',
          300: '#E0E0E0',
          400: '#BDBDBD',
          500: '#B5B5B5',   // Mist Gray Secondary Text
          600: '#9E9E9E',
          700: '#757575',
          800: '#616161',
          900: '#424242',
        },
      },
      fontFamily: {
        // Friendly, approachable fonts
        heading: ['Poppins', 'Nunito', 'system-ui', 'sans-serif'],
        body: ['Inter', 'Open Sans', 'system-ui', 'sans-serif'],
        accent: ['Nunito', 'Poppins', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'soft': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'warm': '0 4px 16px rgba(255, 184, 140, 0.15)',
        'sunrise': '0 4px 16px rgba(255, 232, 124, 0.2)',
      },
      backgroundImage: {
        'sunrise-gradient': 'linear-gradient(135deg, #FFE87C 0%, #FFB88C 50%, #A8E6A1 100%)',
        'warm-gradient': 'linear-gradient(135deg, #FFE87C 0%, #FFB88C 100%)',
        'calm-gradient': 'linear-gradient(135deg, #A8E6A1 0%, #FFE87C 100%)',
      },
    },
  },
  plugins: [],
};
