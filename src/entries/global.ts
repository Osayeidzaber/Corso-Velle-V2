// Loaded on every page: core services + header, menu drawer, cart drawer, accordions.
import '../styles/global.css';

import { define } from '../core/define';
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
