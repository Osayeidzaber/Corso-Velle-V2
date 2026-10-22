import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { setConfigForTests } from '../../src/core/config';
import { NkElement } from '../../src/core/element';
import '../../src/components/carousel/carousel';
import '../../src/components/footer/footer';

function mount(html: string): void {
  document.body.innerHTML = html;
  document.querySelectorAll<NkElement>('nk-carousel, nk-footer').forEach((el) => {
    el.disconnectedCallback(); el.connectedCallback();
  });
}
const rail = `<nk-carousel><div data-ref="viewport"><ul data-ref="track">
  <li class="slide"><a id="product-a" href="/products/a">A</a><button>Quick add</button></li>
  <li class="slide"><a id="product-b" href="/products/b">B</a></li>
</ul></div><button data-carousel-pause data-play-label="Play" data-pause-label="Pause" hidden><span data-carousel-pause-label>Pause</span></button></nk-carousel>`;

beforeEach(() => {
  setConfigForTests(null);
  vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function(this: HTMLElement) {
    return this.classList.contains('slide') ? [...this.parentElement!.children].indexOf(this) * 210 : 0;
  });
  vi.spyOn(HTMLElement.prototype, 'scrollWidth', 'get').mockImplementation(function(this: HTMLElement) {
    return this.dataset.ref === 'track' ? this.children.length * 210 : 600;
  });
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(600);
});
afterEach(() => { document.body.replaceChildren(); vi.restoreAllMocks(); vi.unstubAllGlobals(); setConfigForTests(null); });

describe('infinite product carousel', () => {
  it('wraps native scrolling while keeping one accessible set of products', () => {
    mount(rail);
    const viewport = document.querySelector<HTMLElement>('[data-ref="viewport"]')!;
    const original = document.querySelector<HTMLElement>('[data-carousel-original]')!;
    const start = original.offsetLeft;
    expect(start).toBeGreaterThan(0);
    expect(document.querySelectorAll('#product-a')).toHaveLength(1);
    expect(document.querySelectorAll('[data-carousel-clone]')).toHaveLength(8);
    expect([...document.querySelectorAll('[data-carousel-clone] a')].every((link) => link.getAttribute('tabindex') === '-1')).toBe(true);
    viewport.scrollLeft = start + 420 + 35;
    viewport.dispatchEvent(new Event('scroll'));
    expect(viewport.scrollLeft).toBe(start + 35);
  });

  it('exposes persistent pause feedback and removes all duplicates on disconnect', () => {
    mount(rail);
    const carousel = document.querySelector<NkElement>('nk-carousel')!;
    const pause = carousel.querySelector<HTMLButtonElement>('[data-carousel-pause]')!;
    expect(pause.hidden).toBe(false);
    pause.click();
    expect(pause.getAttribute('aria-pressed')).toBe('true');
    expect(pause.textContent).toBe('Play');
    carousel.remove();
    expect(carousel.querySelectorAll('[data-carousel-clone]')).toHaveLength(0);
    document.body.append(carousel);
    expect(carousel.querySelectorAll('[data-carousel-clone]')).toHaveLength(8);
  });

  it('renders a native static rail in design mode', () => {
    vi.stubGlobal('Shopify', { designMode: true });
    window.Shopify = { designMode: true };
    mount(rail);
    expect(document.querySelectorAll('[data-carousel-clone]')).toHaveLength(0);
    expect(document.querySelector<HTMLButtonElement>('[data-carousel-pause]')!.hidden).toBe(true);
    delete window.Shopify;
  });

  it('routes duplicate card clicks through the matching accessible original once', () => {
    mount(rail);
    const original = document.getElementById('product-b')!;
    const clicked = vi.fn((event: Event) => event.preventDefault());
    original.addEventListener('click', clicked);
    document.querySelector<HTMLAnchorElement>('[data-carousel-clone][data-carousel-index="1"] a')!.click();
    expect(clicked).toHaveBeenCalledOnce();
    expect(document.activeElement).toBe(original);
  });
});

describe('footer menu lifecycle', () => {
  it('opens desktop menus, collapses mobile menus, and exposes selected editor content', () => {
    const query = new EventTarget() as MediaQueryList;
    let desktop = true;
    Object.defineProperty(query, 'matches', { get: () => desktop });
    vi.stubGlobal('matchMedia', () => query);
    mount('<nk-footer data-reveal><footer><details data-footer-menu open><summary>Explore</summary><a href="/collections/all">Shop</a></details></footer></nk-footer>');
    const footer = document.querySelector<NkElement>('nk-footer')!;
    const menu = footer.querySelector('details')!;
    expect(menu.open).toBe(true);
    menu.querySelector('summary')!.click();
    expect(menu.open).toBe(true);
    desktop = false; query.dispatchEvent(new Event('change'));
    expect(menu.open).toBe(false);
    footer.onEditorSelect?.();
    expect(menu.open).toBe(true);
    expect(footer.hasAttribute('data-reveal-ready')).toBe(false);
  });
});
