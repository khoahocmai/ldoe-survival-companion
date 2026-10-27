import { describe, it, expect } from 'vitest';
import { cn } from './cn';

describe('cn', () => {
  it('lets a caller override a default width', () => {
    expect(cn('w-full', 'w-20')).toBe('w-20');
  });

  it('knows the custom control heights and radii', () => {
    expect(cn('h-control', 'h-control-sm')).toBe('h-control-sm');
    expect(cn('rounded-control', 'rounded-card')).toBe('rounded-card');
  });

  it('keeps unrelated classes and drops falsy values', () => {
    expect(cn('px-3', false && 'hidden', undefined, 'text-2xs', 'text-xs')).toBe('px-3 text-xs');
  });
});
