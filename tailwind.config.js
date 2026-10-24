/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: '#0b0d11',
          900: '#11141a',
          850: '#161b22',
          800: '#1d232d',
          750: '#252c38',
          700: '#2e3746',
          600: '#404c60',
        },
        tactical: {
          amber: '#f59e0b',
          amberLight: '#fbbf24',
          amberDim: '#b45309',
          olive: '#656d4a',
          oliveDark: '#394029',
          oliveLight: '#a3b18a',
          rust: '#9c4125',
          hazard: '#ef4444',
          blue: '#3b82f6',
        }
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      }
    },
  },
  plugins: [],
}
