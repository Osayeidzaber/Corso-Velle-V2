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
  cart: {
    afterAdd: 'drawer' | 'notification' | 'page';
    sections: string[];
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
  cart: { afterAdd: 'drawer', sections: [] },
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
  let value = config().strings[key] ?? key;
  for (const [name, replacement] of Object.entries(replacements)) {
    value = value.replaceAll(`[${name}]`, String(replacement));
  }
  return value;
}

/** Test hook. */
export function setConfigForTests(value: ThemeConfig | null): void {
  cached = value;
}
