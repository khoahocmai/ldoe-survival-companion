import { describe, it, expect } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CompactWikiCard } from './CompactWikiCard';

describe('CompactWikiCard', () => {
  it('renders primary title and Vietnamese subtitle', () => {
    const html = renderToStaticMarkup(<CompactWikiCard id="spear" title="Spear" subtitle="Ngọn giáo" onClick={() => {}} />);
    expect(html).toContain('Spear');
    expect(html).toContain('Ngọn giáo');
  });

  it('omits the subtitle line when none is given', () => {
    const html = renderToStaticMarkup(<CompactWikiCard id="iron_bar" title="Iron Bar" onClick={() => {}} />);
    expect(html).toContain('Iron Bar');
    expect(html).not.toContain('<p');
  });

  it('marks the selected card for assistive tech and styles it with the accent ring', () => {
    const html = renderToStaticMarkup(
      <CompactWikiCard id="machete" title="Machete" subtitle="Rựa dã chiến" isSelected onClick={() => {}} />
    );
    expect(html).toContain('aria-pressed="true"');
    expect(html).toContain('ring-accent-solid');
  });

  it('is keyboard focusable', () => {
    const html = renderToStaticMarkup(<CompactWikiCard id="a" title="A" onClick={() => {}} />);
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('role="button"');
  });

  it('shows at most three headline stats', () => {
    const html = renderToStaticMarkup(
      <CompactWikiCard
        id="a"
        title="A"
        onClick={() => {}}
        stats={[
          { label: 'Dmg', value: 17 },
          { label: 'Bền', value: 100 },
          { label: 'Tốc', value: 1.2 },
          { label: 'Tầm', value: 5 },
        ]}
      />
    );
    expect(html).toContain('Dmg');
    expect(html).toContain('Tốc');
    expect(html).not.toContain('Tầm');
  });

  it('renders badges with max 2 limit and overflow', () => {
    const html = renderToStaticMarkup(
      <CompactWikiCard
        id="machete"
        title="Machete"
        onClick={() => {}}
        badges={
          <>
            <span>RARE</span>
            <span>MELEE</span>
            <span>CUSTOM</span>
          </>
        }
      />
    );
    expect(html).toContain('RARE');
    expect(html).toContain('MELEE');
    expect(html).not.toContain('CUSTOM');
    expect(html).toContain('+1');
  });
});
