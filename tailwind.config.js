/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      rotate: {
        'y-180': 'rotateY(180deg)',
      },
      transformStyle: {
        '3d': 'preserve-3d',
      },
      backfaceVisibility: {
        'hidden': 'hidden',
      }
    },
  },
  plugins: [],
};