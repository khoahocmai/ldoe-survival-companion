/** @type {import('tailwindcss').Config} */

// Semantic colour tokens. The actual values live in src/index.css as CSS variables so light and
// dark mode are defined once instead of repeating `dark:` variants in every component.
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: token('bg'),
        surface: token('surface'),
        subtle: token('subtle'),
        raised: token('raised'),
        line: token('line'),
        fg: token('fg'),
        muted: token('muted'),
        faint: token('faint'),
        accent: {
          DEFAULT: token('accent'),
          solid: token('accent-solid'),
          soft: token('accent-soft'),
          fg: token('accent-fg'),
        },
        ok: { DEFAULT: token('ok'), soft: token('ok-soft') },
        info: { DEFAULT: token('info'), soft: token('info-soft') },
        warn: { DEFAULT: token('warn'), soft: token('warn-soft') },
        danger: { DEFAULT: token('danger'), soft: token('danger-soft') },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      boxShadow: {
        card: '0 1px 2px rgb(0 0 0 / 0.04)',
        pop: '0 12px 32px -8px rgb(0 0 0 / 0.25)',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'slide-in': { from: { transform: 'translateX(16px)', opacity: '0' }, to: { transform: 'none', opacity: '1' } },
        'pop-in': { from: { transform: 'scale(.97)', opacity: '0' }, to: { transform: 'none', opacity: '1' } },
      },
      animation: {
        'fade-in': 'fade-in .15s ease-out',
        'slide-in': 'slide-in .18s ease-out',
        'pop-in': 'pop-in .15s ease-out',
      },
    },
  },
  plugins: [],
};
