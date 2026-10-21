// Loaded on every page: core services + header, menu drawer, cart drawer, accordions.
// Section-level components load on demand (own chunk + CSS) when their tag is on the page.
import '../styles/global.css';

import { define } from '../core/define';
import { installLazyLoader, registerLazy } from '../core/lazy';
import { NkCartDrawer } from '../components/cart/cart-drawer';
import { NkCartItems } from '../components/cart/cart-items';
import { NkDisclosure } from '../components/disclosure/disclosure';
import { NkHeader } from '../components/header/header';
import { installModalTriggers, NkModal } from '../components/modal/modal';
import { NkNavDrawer } from '../components/nav-drawer/nav-drawer';
import { installCartRenderer } from '../services/cart-render';
import { installEditorAdapter } from '../services/editor';

installEditorAdapter();
installCartRenderer();
installModalTriggers();

define('nk-header', NkHeader);
define('nk-modal', NkModal);
define('nk-nav-drawer', NkNavDrawer);
define('nk-cart-drawer', NkCartDrawer);
define('nk-cart-items', NkCartItems);
define('nk-disclosure', NkDisclosure);

// Rewrites of the supplied example components (master-plan/05).
registerLazy('nk-reveal', () => import('../components/reveal/reveal'));
registerLazy('nk-marquee', () => import('../components/marquee/marquee'));
registerLazy('nk-tabs', () => import('../components/tabs/tabs'));
registerLazy('nk-expand-media', () => import('../components/expand-media/expand-media'));
registerLazy('nk-elastic-line', () => import('../components/elastic-line/elastic-line'));
registerLazy('nk-search-pill', () => import('../components/search-pill/search-pill'));
installLazyLoader();
