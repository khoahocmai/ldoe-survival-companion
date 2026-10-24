import { describe, it, expect, vi, afterEach } from 'vitest';
import { readStoredTheme } from './ThemeContext';

const stubEnv = (stored: string | null, osDark: boolean) => {
  vi.stubGlobal('localStorage', { getItem: () => stored });
  vi.stubGlobal('window', { matchMedia: () => ({ matches: osDark }) });
};

afterEach(() => vi.unstubAllGlobals());

describe('readStoredTheme', () => {
  it('returns a saved light or dark choice', () => {
    stubEnv('light', true);
    expect(readStoredTheme()).toBe('light');
    stubEnv('dark', false);
    expect(readStoredTheme()).toBe('dark');
  });

  it('defaults to dark when nothing is saved', () => {
    stubEnv(null, false);
    expect(readStoredTheme()).toBe('dark');
  });

  it('converts the retired "system" value to the OS preference', () => {
    stubEnv('system', false);
    expect(readStoredTheme()).toBe('light');
    stubEnv('system', true);
    expect(readStoredTheme()).toBe('dark');
  });

  it('ignores unknown values', () => {
    stubEnv('coffee', false);
    expect(readStoredTheme()).toBe('dark');
  });
});
