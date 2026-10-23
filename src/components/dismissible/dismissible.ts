import { define } from '../../core/define';
import { NkElement } from '../../core/element';
import { animate } from '../../core/motion';
import './dismissible.css';

const PREFIX = 'nk-dismissed:';

function remembered(key: string): boolean {
  try {
    return sessionStorage.getItem(PREFIX + key) === '1';
  } catch {
    return false;
  }
}

function remember(key: string): void {
  try {
    sessionStorage.setItem(PREFIX + key, '1');
  } catch {
    // Private mode / blocked storage: the banner simply returns on the next page.
  }
}

/**
 * <nk-dismissible key="…"> — closable promotion bar (sections/promo-banner.liquid, from HyperUI
 * announcements/banners). Liquid renders the close button hidden so it never appears without a
 * script to honour it. The key includes a hash of the message, so editing the text shows the bar
 * again; the theme editor never hides it on load.
 */
export class NkDismissible extends NkElement {
  protected mount(): void {
    const key = this.getAttribute('key') ?? '';
    const host = this.closest<HTMLElement>('.shopify-section') ?? this;
    const editor = Boolean(window.Shopify?.designMode);
    if (key && !editor && remembered(key)) {
      host.hidden = true;
      return;
    }
    const button = this.ref<HTMLButtonElement>('dismiss');
    if (!button) return;
    button.hidden = false;
    this.on(button, 'click', () => {
      if (key && !editor) remember(key);
      const animation = animate(host, [{ opacity: 1 }, { opacity: 0 }], { duration: 180, easing: 'ease-out' });
      const hide = () => { host.hidden = true; };
      if (animation) animation.finished.then(hide, hide);
      else hide();
    });
  }
}

define('nk-dismissible', NkDismissible);
