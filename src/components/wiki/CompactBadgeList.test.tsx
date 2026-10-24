import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CompactBadgeList } from './CompactBadgeList';

describe('CompactBadgeList', () => {
  it('renders nothing when no badges are passed', () => {
    const html = renderToStaticMarkup(<CompactBadgeList />);
    expect(html).toBe('');
  });

  it('filters out falsy badges (null, undefined, false)', () => {
    const html = renderToStaticMarkup(
      <CompactBadgeList>
        {null}
        {undefined}
        {false}
      </CompactBadgeList>
    );
    expect(html).toBe('');
  });

  it('renders 1 badge without overflow', () => {
    const html = renderToStaticMarkup(
      <CompactBadgeList>
        <span>COMMON</span>
      </CompactBadgeList>
    );
    expect(html).toContain('COMMON');
    expect(html).not.toContain('+');
  });

  it('renders 2 badges without overflow', () => {
    const html = renderToStaticMarkup(
      <CompactBadgeList>
        <span>COMMON</span>
        <span>MELEE</span>
      </CompactBadgeList>
    );
    expect(html).toContain('COMMON');
    expect(html).toContain('MELEE');
    expect(html).not.toContain('+');
  });

  it('renders max 2 badges and +1 for 3 badges', () => {
    const html = renderToStaticMarkup(
      <CompactBadgeList>
        <span>RARE</span>
        <span>MELEE</span>
        <span>CUSTOM</span>
      </CompactBadgeList>
    );
    expect(html).toContain('RARE');
    expect(html).toContain('MELEE');
    expect(html).not.toContain('CUSTOM');
    expect(html).toContain('+1');
  });

  it('renders max 2 badges and +2 for 4 badges', () => {
    const html = renderToStaticMarkup(
      <CompactBadgeList>
        <span>RARE</span>
        <span>MELEE</span>
        <span>CUSTOM</span>
        <span>STACK20</span>
      </CompactBadgeList>
    );
    expect(html).toContain('RARE');
    expect(html).toContain('MELEE');
    expect(html).not.toContain('CUSTOM');
    expect(html).not.toContain('STACK20');
    expect(html).toContain('+2');
  });

  it('supports custom max threshold', () => {
    const html = renderToStaticMarkup(
      <CompactBadgeList max={1}>
        <span>ITEM1</span>
        <span>ITEM2</span>
        <span>ITEM3</span>
      </CompactBadgeList>
    );
    expect(html).toContain('ITEM1');
    expect(html).not.toContain('ITEM2');
    expect(html).toContain('+2');
  });
});
