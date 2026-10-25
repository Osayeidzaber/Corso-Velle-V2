/**
 * Runtime configuration rendered by snippets/nk-config.liquid. Routes always come from Liquid's
 * `routes` object so locale prefixes and markets are respected; JS never hardcodes "/cart".
 */
export interface ThemeConfig {
  routes: {
    root: string;
    cart: string;
    cartAdd: string;
    cartChange: string;
    cartUpdate: string;
    predictiveSearch: string;
    productRecommendations: string;
    search: string;
  };
  motion: 'off' | 'minimal' | 'standard';
  motionOptions: {
    tempo: 'relaxed' | 'balanced' | 'brisk';
    stagger: 'none' | 'short' | 'medium' | 'long';
    scrollEffects: boolean;
    smoothScroll?: boolean;
    smoothStrength?: 'subtle' | 'balanced' | 'silky';
    mobile: 'simple' | 'full' | 'off';
  };
  cart: {
    afterAdd: 'drawer' | 'notification' | 'page';
    sections: string[];
    /** Theme settings > Cart > Add-to-cart animation (fly-to-cart.ts). */
    flyAnimation?: boolean;
  };
  /** Theme settings > Promotions (docs/PROMOTIONS.md). Codes themselves live in Shopify admin. */
  promotions?: {
    conflictRule: 'keep' | 'priority';
  };
  strings: Record<string, string>;
}

let cached: ThemeConfig | null = null;

const fallback: ThemeConfig = {
  routes: {
    root: '/',
    cart: '/cart',
    cartAdd: '/cart/add',
    cartChange: '/cart/change',
    cartUpdate: '/cart/update',
    predictiveSearch: '/search/suggest',
    productRecommendations: '/recommendations/products',
    search: '/search',
  },
  motion: 'standard',
  motionOptions: { tempo: 'balanced', stagger: 'medium', scrollEffects: true, mobile: 'simple' },
  cart: { afterAdd: 'drawer', sections: [] },
  promotions: { conflictRule: 'keep' },
  strings: {},
};

export function config(): ThemeConfig {
  if (cached) return cached;
  const node = document.getElementById('nk-config');
  if (!node?.textContent) {
    // Only reached in unit tests or if the layout snippet is missing.
    cached = fallback;
    return cached;
  }
  try {
    const value = JSON.parse(node.textContent) as Partial<ThemeConfig> | null;
    if (!value || typeof value !== 'object') throw new Error('Invalid theme configuration');
    cached = {
      ...fallback,
      ...value,
      routes: { ...fallback.routes, ...value.routes },
      cart: { ...fallback.cart, ...value.cart },
      promotions: { ...fallback.promotions!, ...value.promotions },
      motionOptions: { ...fallback.motionOptions, ...value.motionOptions },
      strings: { ...fallback.strings, ...value.strings },
    };
  } catch (error) {
    console.error('Could not read nk-config', error);
    const root = window.Shopify?.routes?.root ?? '/';
    cached = {
      ...fallback,
      routes: Object.fromEntries(Object.entries(fallback.routes).map(([key, path]) => [key, key === 'root' ? root : `${root}${path.slice(1)}`])) as ThemeConfig['routes'],
    };
  }
  return cached;
}

/** Translated string from locales via nk-config; falls back to the key so gaps are visible. */
export function t(key: string, replacements: Record<string, string | number> = {}): string {
  // Liquid's `t` filter HTML-escapes (e.g. "can&#39;t"); strings here are only used as text.
  let value = decodeEntities(config().strings[key] ?? key);
  for (const [name, replacement] of Object.entries(replacements)) {
    value = value.replaceAll(`[${name}]`, String(replacement));
  }
  return value;
}

const ENTITIES: Record<string, string> = { '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'", '&#x27;': "'" };

function decodeEntities(value: string): string {
  return value.replace(/&(?:amp|lt|gt|quot|#39|#x27);/g, (entity) => ENTITIES[entity] ?? entity);
}

/** Test hook. */
export function setConfigForTests(value: (Omit<ThemeConfig, 'motionOptions'> & Partial<Pick<ThemeConfig, 'motionOptions'>>) | null): void {
  cached = value ? { ...value, motionOptions: { ...fallback.motionOptions, ...value.motionOptions } } : null;
}
