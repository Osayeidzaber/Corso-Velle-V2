// Loaded on every page: core services + header, menu drawer, cart drawer, accordions.
// Section-level components load on demand (own chunk + CSS) when their tag is on the page.
import '../styles/global.css';

import { define } from '../core/define';
import { installLazyLoader, registerLazy } from '../core/lazy';
import { installMotionPolicy } from '../core/motion';
import { NkCartDrawer } from '../components/cart/cart-drawer';
import { NkCartItems } from '../components/cart/cart-items';
import { NkDisclosure } from '../components/disclosure/disclosure';
import { NkHeader } from '../components/header/header';
import { installModalTriggers, NkModal } from '../components/modal/modal';
import { NkNavDrawer } from '../components/nav-drawer/nav-drawer';
import { installCardInteractions } from '../components/product/card-interactions';
import { installCartRenderer } from '../services/cart-render';
import { installEditorAdapter } from '../services/editor';

installEditorAdapter();
installMotionPolicy();
installCartRenderer();
installModalTriggers();
installCardInteractions();

define('nk-header', NkHeader);
define('nk-modal', NkModal);
define('nk-nav-drawer', NkNavDrawer);
define('nk-cart-drawer', NkCartDrawer);
define('nk-cart-items', NkCartItems);
define('nk-disclosure', NkDisclosure);

// Rewrites of the supplied example components (master-plan/05).
registerLazy('nk-reveal', () => import('../components/reveal/reveal'));
registerLazy('nk-text', () => import('../components/text/text'));
registerLazy('nk-marquee', () => import('../components/marquee/marquee'));
registerLazy('nk-carousel', () => import('../components/carousel/carousel'));
registerLazy('nk-accordion-gallery', () => import('../components/accordion-gallery/accordion-gallery'));
registerLazy('nk-footer', () => import('../components/footer/footer'));
registerLazy('nk-tabs', () => import('../components/tabs/tabs'));
registerLazy('nk-expand-media', () => import('../components/expand-media/expand-media'));
registerLazy('nk-elastic-line', () => import('../components/elastic-line/elastic-line'));
registerLazy('nk-search-pill', () => import('../components/search-pill/search-pill'));
registerLazy('nk-predictive-search', () => import('../components/predictive-search/predictive-search'));
registerLazy('nk-facets', () => import('../components/facets/facets'));
registerLazy('nk-parallax', () => import('../components/motion/parallax'));
registerLazy('nk-background-video', () => import('../components/media/background-video'));
registerLazy('nk-hero-slides', () => import('../components/media/hero-slides'));
registerLazy('nk-scene', () => import('../components/motion/scene'));
registerLazy('nk-stagger', () => import('../components/motion/stagger'));
registerLazy('nk-size-guide', () => import('../components/size-guide/size-guide'));
registerLazy('nk-fit-finder', () => import('../components/fit-finder/fit-finder'));
registerLazy('nk-recommendations', () => import('../components/recommendations/recommendations'));
// Optional section kit (docs/SECTION-SOURCES.md): only the sections that need behaviour.
registerLazy('nk-countdown', () => import('../components/countdown/countdown'));
registerLazy('nk-dismissible', () => import('../components/dismissible/dismissible'));
registerLazy('nk-count-up', () => import('../components/count-up/count-up'));
registerLazy('nk-video', () => import('../components/video/video'));
registerLazy('nk-image-compare', () => import('../components/image-compare/image-compare'));
for (const tag of ['nk-variant-picker', 'nk-product-form', 'nk-gallery', 'nk-sticky-buy']) {
  registerLazy(tag, () => import('./product'));
}
installLazyLoader();

// Desktop "View" cursor + magnetic buttons (GSAP), only where the page uses them.
function maybeInstallCursor(root: ParentNode = document): void {
  if (root.querySelector?.('[data-cursor], [data-magnetic], nk-magnetic')) {
    void import('../components/motion/cursor').then((module) => module.installCursor()).catch(console.error);
  }
}

maybeInstallCursor();
document.addEventListener('shopify:section:load', (event) => maybeInstallCursor(event.target as ParentNode));
document.addEventListener('nk:section:replaced', (event) => maybeInstallCursor(event.target as ParentNode));
document.addEventListener('nk:motion:changed', () => maybeInstallCursor());
