import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';

/**
 * Animated text must not duplicate words in the DOM: search engines index the rendered text, so a
 * split heading or letter-swap link has to read once ("Knit Polo", not "Knit PoloKnit Polo").
 */

const runtime = vi.hoisted(() => ({ reverts: 0 }));
vi.mock('../../src/core/motion', () => ({ motionMode: () => 'full', motionTempo: () => 1, motionStagger: () => 0.05 }));
vi.mock('../../src/motion/gsap', () => {
  const timeline = { to: () => timeline, play: () => timeline, progress: () => timeline };
  return {
    gsap: {
      set: () => undefined,
      timeline: () => timeline,
      context: (setup: () => void) => {
        setup();
        return { revert: () => { runtime.reverts += 1; } };
      },
    },
    ScrollTrigger: { create: () => undefined },
  };
});
import '../../src/components/text/text';

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('nk-text split headings', () => {
  afterEach(() => { document.body.innerHTML = ''; });

  it('keeps one copy of the heading text and names it for screen readers', async () => {
    document.body.innerHTML = '<nk-text effect="rise" split="chars" play-on-load><h1 data-text-target>Knit  Polo</h1></nk-text>';
    await settle();
    await settle();
    const heading = document.querySelector('h1')!;
    expect(heading.querySelectorAll('.nk-w').length).toBe(2);
    expect(heading.textContent!.replace(/\s+/g, ' ').trim()).toBe('Knit Polo');
    expect(heading.getAttribute('aria-label')).toBe('Knit Polo');
  });

  it('restores the original markup and label on removal', async () => {
    document.body.innerHTML = '<nk-text play-on-load><h2 data-text-target>Linen</h2></nk-text>';
    await settle();
    await settle();
    const host = document.querySelector('nk-text')!;
    const heading = host.querySelector('h2')!;
    host.remove();
    expect(heading.innerHTML).toBe('Linen');
    expect(heading.hasAttribute('aria-label')).toBe(false);
  });

  it('keeps a merchant-supplied label', async () => {
    document.body.innerHTML = '<nk-text play-on-load><h2 data-text-target aria-label="Own">Linen</h2></nk-text>';
    await settle();
    await settle();
    expect(document.querySelector('h2')!.getAttribute('aria-label')).toBe('Own');
  });
});

describe('letter-swap markup', () => {
  it('holds the label text once; the rolling copies are CSS-generated', () => {
    const snippet = readFileSync('theme/snippets/letter-swap.liquid', 'utf8');
    const markup = snippet.slice(snippet.indexOf('{%- enddoc -%}'));
    expect(markup).toContain('data-c=');
    // Letters are attribute values only, never element text.
    expect(markup).not.toMatch(/<span>\{\{ letter/);
    const css = readFileSync('src/styles/components/effects.css', 'utf8');
    expect(css).toMatch(/\.ls__c::before,\s*\.ls__c::after\s*\{\s*content: attr\(data-c\)/);
  });
});
