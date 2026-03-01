/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // AWS Deep Blue - Primary brand color
        primary: {
          50: '#EAF2F8',   // Light blue background tint
          100: '#D5E5F1',
          200: '#ABCBE3',
          300: '#81B1D5',
          400: '#5797C7',
          500: '#123F6D',   // AWS Deep Blue (main)
          600: '#0F3258',   // Hover Blue
          700: '#0C2744',
          800: '#091C31',
          900: '#06111D',
        },
        // AWS Yellow - Accent (use sparingly)
        accent: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#F2B705',   // AWS Yellow (main)
          500: '#D4A004',
          600: '#B38B03',
        },
        // Neutrals per brand kit
        surface: {
          50: '#F8FAFC',   // Background
          100: '#F1F5F9',
          200: '#E5E7EB',   // Border Gray
          300: '#D1D5DB',
          400: '#9CA3AF',
          500: '#6B7280',   // Mid Gray
          600: '#4B5563',
          700: '#374151',
          800: '#1F2933',   // Dark Text
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
