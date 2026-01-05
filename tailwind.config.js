/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  important: true, // Для избежания конфликтов с Bootstrap
  theme: {
    extend: {
      colors: {
        accent: '#8C99B9',
        'accent-hover': '#7e8bab',
        'h1-accent': '#33486e',
        'bg-main': '#e3e3e3',
        'bg-card': 'rgba(255, 255, 255, 0.95)',
        'bg-card-darker-7': 'rgba(255, 255, 255, 0.7)',
        'bg-card-darker-5': 'rgba(255, 255, 255, 0.5)',
        'bg-card-darker-3': 'rgba(255, 255, 255, 0.3)',
        'bg-row': '#f8f9fa',
        'border-white': '#dee2e6',
        'border-black': 'rgba(0, 0, 0, 0.1)',
        'border-black-light-1': 'rgba(255, 255, 255, 0.1)',
        'border-black-light-2': 'rgba(255, 255, 255, 0.2)',
        'text-primary-color': '#fff',
        'text-secondary-color': '#6c757d',
        'text-disabled': 'rgba(128, 128, 128, 0.8)',
        'border-disabled': 'rgba(128, 128, 128, 0.8)',
        'bg-shadow': 'rgba(0, 0, 0, 0.5)',
      },
      fontFamily: {
        sans: ['Gilroy-wt', 'sans-serif'],
      },
      fontSize: {
        'regular': '16px',
      },
      lineHeight: {
        'regular': '19px',
      },
    },
  },
  plugins: [],
  corePlugins: {
    preflight: false, // Отключаем preflight для избежания конфликтов с Bootstrap
  },
}

