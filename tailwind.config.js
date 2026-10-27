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
      // Type scale: 2xs (11) captions in dense UI, xs (12) labels, sm (14) body, base (16) titles, then lg/xl headings.
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1rem' }],
      },
      // Shared shape tokens so every control, card and dialog uses the same radius and height.
      borderRadius: {
        control: '0.5rem',
        card: '0.75rem',
        dialog: '1rem',
      },
      height: {
        'control-sm': '2rem',
        control: '2.25rem',
        'control-lg': '2.75rem',
      },
      width: {
        control: '2.25rem',
      },
      // Layering, lowest to highest. Keep new overlays on these names instead of raw numbers.
      zIndex: {
        raised: '10',
        sticky: '20',
        dropdown: '30',
        nav: '30',
        overlay: '40',
        modal: '50',
        toast: '60',
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
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
