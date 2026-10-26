/**
 * Purchase data for the carousel's size selector and single Add to cart button, rendered by
 * snippets/carousel-product-data.liquid. Shopify stays authoritative for stock at add time.
 */
export interface CarouselVariant {
  id: number;
  available: boolean;
  options: string[];
  min: number;
}

export interface CarouselProduct {
  id: number;
  title: string;
  url: string;
  available: boolean;
  sellingPlan: boolean;
  /** Zero-based option position offered as the size choice; -1 for a default-variant product. */
  option: number;
  optionName: string;
  values: string[];
  options: string[];
  preferred: number | null;
  variantCount?: number;
  variants: CarouselVariant[];
}

export interface SizeChoice {
  value: string;
  variant: CarouselVariant | null;
}

export function readProduct(slide: Element): CarouselProduct | null {
  const node = slide.querySelector('script[data-carousel-product]');
  if (!node?.textContent) return null;
  try {
    const data = JSON.parse(node.textContent) as CarouselProduct;
    if (!Number.isSafeInteger(data.id) || !Array.isArray(data.variants) || !Array.isArray(data.values)) return null;
    data.variants = data.variants.filter((variant) => Number.isSafeInteger(variant.id) && Array.isArray(variant.options));
    if (typeof data.variantCount === 'number' && data.variantCount > data.variants.length) return null;
    return data;
  } catch {
    return null;
  }
}

/**
 * One choice per size value. Other options (e.g. colour) stay at the product's preferred variant;
 * a size is only offered in a different colour when the product has no real second choice.
 */
export function sizeChoices(product: CarouselProduct): { choices: SizeChoice[]; context: Array<{ name: string; value: string }> } {
  const preferred = product.variants.find((variant) => variant.id === product.preferred) ?? product.variants[0];
  if (product.option < 0 || !preferred) {
    return { choices: preferred ? [{ value: '', variant: preferred.available ? preferred : null }] : [], context: [] };
  }
  const others = product.options
    .map((name, position) => ({ name, position }))
    .filter(({ position }) => position !== product.option
      && new Set(product.variants.map((variant) => variant.options[position])).size > 1);
  const choices = product.values.map((value) => {
    const sized = product.variants.filter((variant) => variant.options[product.option] === value);
    const exact = sized.find((variant) => others.every(({ position }) => variant.options[position] === preferred.options[position]));
    const variant = exact?.available ? exact : others.length ? null : sized.find((candidate) => candidate.available) ?? null;
    return { value, variant };
  });
  return { choices, context: others.map(({ name, position }) => ({ name, value: preferred.options[position] ?? '' })) };
}
