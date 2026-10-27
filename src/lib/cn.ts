import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Teach the merger our custom tokens (tailwind.config.js) so e.g. a caller's `h-control-sm` really replaces a
// component's default `h-control` instead of both staying and the stylesheet order deciding.
const merge = extendTailwindMerge({
  extend: {
    classGroups: {
      h: [{ h: ['control-sm', 'control', 'control-lg'] }],
      w: [{ w: ['control'] }],
      rounded: [{ rounded: ['control', 'card', 'dialog'] }],
      'font-size': [{ text: ['2xs'] }],
      z: [{ z: ['raised', 'sticky', 'dropdown', 'nav', 'overlay', 'modal', 'toast'] }],
    },
  },
});

/** Joins class names and lets the last conflicting Tailwind class win. */
export const cn = (...inputs: ClassValue[]) => merge(clsx(inputs));
