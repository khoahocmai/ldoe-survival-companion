import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ErrorBoundary } from './ErrorBoundary';

describe('ErrorBoundary', () => {
  it('renders its children when nothing fails', () => {
    const html = renderToStaticMarkup(
      <ErrorBoundary>
        <p>ok</p>
      </ErrorBoundary>
    );
    expect(html).toContain('ok');
  });

  it('turns a thrown error into a message instead of a blank page', () => {
    const { error } = ErrorBoundary.getDerivedStateFromError(new Error('boom'));
    const boundary = new ErrorBoundary({ children: null });
    boundary.state = { error: error as unknown as Error };
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const html = renderToStaticMarkup(boundary.render() as React.ReactElement);
    expect(html).toContain('Trang này bị lỗi');
    expect(html).toContain('boom');
  });
});
