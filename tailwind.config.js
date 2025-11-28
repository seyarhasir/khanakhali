/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': '#b80b29', // Main color
        'brand-secondary': '#fec98f', // Secondary color
        'brand-navy': '#000000', // Black
        'brand-slate': '#000000', // Black
        'brand-gray': '#64748B', // Gray for text
        'brand-soft': '#FFFFFF', // White
        'brand-primary-soft': '#fce4e8', // Light version of main color
        'brand-secondary-soft': '#fff5e6', // Light version of secondary color
        'brand-accent': '#fec98f', // Secondary color
        'brand-success': '#10B981',
        'brand-danger': '#EF4444',
        'brand-warning': '#F59E0B',
      },
      fontFamily: {
        'farsi': ['Mj_Aramco', 'Segoe UI', 'Tahoma', 'Arial', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

