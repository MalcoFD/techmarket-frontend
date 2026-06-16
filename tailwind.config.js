/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#eff6ff',
          100: '#dbeafe',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        techmarket: {
          blue:   '#1e3a8a',
          accent: '#f59e0b',
          dark:   '#0f172a',
          card:   '#1e293b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 4px 24px 0 rgba(0,0,0,0.18)',
        'card-hover': '0 8px 32px 0 rgba(59,130,246,0.25)',
      }
    },
  },
  plugins: [],
}
