/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,md,mdx}'],
  theme: {
    extend: {
      colors: {
        obsidian: '#06070a',
        graphite: '#10141c',
        steel: '#c8d0dc',
        redline: '#9f1826'
      },
      boxShadow: {
        panel: '0 20px 60px rgba(0,0,0,.45), inset 0 1px 0 rgba(255,255,255,.06)'
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        sans: ['"Inter"', 'sans-serif']
      }
    }
  },
  plugins: []
};
