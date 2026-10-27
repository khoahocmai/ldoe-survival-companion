/**
 * Shared look of every text-like control (input, select, textarea, search box, picker button),
 * so hover, focus ring and disabled state are defined once.
 */
export const controlClass =
  'w-full rounded-control border border-line bg-surface px-3 text-sm placeholder:text-faint transition-colors hover:border-faint/60 focus:border-accent-solid focus:outline-none focus:ring-2 focus:ring-accent-solid/25 disabled:opacity-60';
