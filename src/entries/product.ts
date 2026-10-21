// Product page (and anywhere a product form renders, e.g. featured product).
import '../styles/product.css';

import { define } from '../core/define';
import { NkGallery } from '../components/product/gallery';
import { NkProductForm } from '../components/product/product-form';
import { NkVariantPicker } from '../components/product/variant-picker';

define('nk-variant-picker', NkVariantPicker);
define('nk-product-form', NkProductForm);
define('nk-gallery', NkGallery);
