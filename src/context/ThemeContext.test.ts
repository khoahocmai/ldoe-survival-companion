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

  it('follows the OS preference when nothing is saved', () => {
    stubEnv(null, false);
    expect(readStoredTheme()).toBe('light');
    stubEnv(null, true);
    expect(readStoredTheme()).toBe('dark');
  });

  it('falls back to dark when the OS preference cannot be read', () => {
    vi.stubGlobal('localStorage', { getItem: () => null });
    vi.stubGlobal('window', {});
    expect(readStoredTheme()).toBe('dark');
  });

  it('converts the retired "system" value to the OS preference', () => {
    stubEnv('system', false);
    expect(readStoredTheme()).toBe('light');
    stubEnv('system', true);
    expect(readStoredTheme()).toBe('dark');
  });

  it('ignores unknown values and uses the OS preference', () => {
    stubEnv('coffee', false);
    expect(readStoredTheme()).toBe('light');
    stubEnv('coffee', true);
    expect(readStoredTheme()).toBe('dark');
  });
});
