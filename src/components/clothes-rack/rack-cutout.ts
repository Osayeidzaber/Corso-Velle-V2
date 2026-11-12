/**
 * Turns a studio photo on white into a real cut-out, in the browser, so garments can occlude each
 * other and cast shadows. Multiply can do neither. Anything that fails (no CORS, a photo that isn't
 * on white) resolves to null and the rack carries on with the multiply knock-out.
 */

export interface MaskResult {
  /** 0..255 per pixel. */
  alpha: Uint8ClampedArray;
  /** Share of the image that is garment, 0..1. */
  coverage: number;
  box: { left: number; top: number; right: number; bottom: number };
}

/**
 * Flood-fills white inward from the image edges, so a white logo or a white tee's interior is kept:
 * only white connected to the outside counts as background. The rim is softened and pulled in a
 * pixel or two, or the garment wears a white fringe against anything darker than white.
 */
export function maskFromWhite(data: ArrayLike<number>, width: number, height: number, tolerance = 4): MaskResult {
  const count = width * height;
  const background = new Uint8Array(count);
  const floor = 255 - tolerance;
  const isWhite = (i: number) => data[i * 4]! >= floor && data[i * 4 + 1]! >= floor && data[i * 4 + 2]! >= floor;
  const stack: number[] = [];
  const seed = (i: number) => {
    if (!background[i] && isWhite(i)) {
      background[i] = 1;
      stack.push(i);
    }
  };
  for (let x = 0; x < width; x++) {
    seed(x);
    seed(count - 1 - x);
  }
  for (let y = 0; y < height; y++) {
    seed(y * width);
    seed(y * width + width - 1);
  }
  while (stack.length) {
    const i = stack.pop()!;
    const x = i % width;
    if (x > 0) seed(i - 1);
    if (x < width - 1) seed(i + 1);
    if (i >= width) seed(i - width);
    if (i < count - width) seed(i + width);
  }

  const alpha = new Uint8ClampedArray(count);
  let kept = 0;
  let left = width;
  let right = 0;
  let top = height;
  let bottom = 0;
  const touches = (i: number, reach: number) => {
    const x = i % width;
    const y = Math.floor(i / width);
    for (let dy = -reach; dy <= reach; dy++) {
      for (let dx = -reach; dx <= reach; dx++) {
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < width && ny < height && background[ny * width + nx]) return true;
      }
    }
    return false;
  };
  for (let i = 0; i < count; i++) {
    if (background[i]) continue;
    alpha[i] = touches(i, 1) ? 90 : touches(i, 2) ? 215 : 255;
    kept++;
    const x = i % width;
    const y = Math.floor(i / width);
    if (x < left) left = x;
    if (x > right) right = x;
    if (y < top) top = y;
    if (y > bottom) bottom = y;
  }
  return { alpha, coverage: kept / count, box: { left, top, right, bottom } };
}

/** Too little kept means the fill leaked into pale cloth; too much means the photo isn't on white. */
export function usableCoverage(coverage: number): boolean {
  return coverage > 0.08 && coverage < 0.85;
}

export interface CutoutOptions {
  /** 0..1, how much cloth shading to bake in. */
  shading: number;
  /** 0..1, how dark the baked shadow is. */
  shadow: number;
  /** 0..1, how soft and how far the shadow falls; 0.5 is the default look. */
  blur: number;
  distance: number;
  /** How far from pure white still counts as background. */
  tolerance: number;
}

const cache = new Map<string, Promise<string | null>>();

/** The outline a transparent photo already carries, in the same shape maskFromWhite returns. */
export function maskFromAlpha(data: Uint8ClampedArray, width: number, height: number): { alpha: Uint8ClampedArray; coverage: number; box: { left: number; top: number; right: number; bottom: number } } {
  const count = width * height;
  const alpha = new Uint8ClampedArray(count);
  let kept = 0;
  let left = width;
  let top = height;
  let right = 0;
  let bottom = 0;
  for (let i = 0; i < count; i++) {
    const value = data[i * 4 + 3]!;
    alpha[i] = value;
    if (value < 128) continue;
    kept++;
    const x = i % width;
    const y = (i / width) | 0;
    if (x < left) left = x;
    if (x > right) right = x;
    if (y < top) top = y;
    if (y > bottom) bottom = y;
  }
  return { alpha, coverage: kept / count, box: { left, top, right, bottom } };
}

/** Waits for a quiet moment, so cutting out never lands on top of a scroll or an animation. */
const idle = () =>
  new Promise<void>((resolve) => {
    const request = (window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number }).requestIdleCallback;
    if (request) request(() => resolve(), { timeout: 900 });
    else setTimeout(resolve, 60);
  });

/** One at a time: phones must not decode and encode seven photos at once. */
let queue: Promise<unknown> = Promise.resolve();

export function cutout(src: string, options: CutoutOptions): Promise<string | null> {
  const key = `${src}|${options.shading}|${options.shadow}|${options.blur}|${options.distance}|${options.tolerance}`;
  let job = cache.get(key);
  if (!job) {
    job = queue.then(() => process(src, options)).catch(() => null);
    queue = job;
    cache.set(key, job);
  }
  return job;
}

async function process(src: string, { shading, shadow, blur, distance, tolerance }: CutoutOptions): Promise<string | null> {
  await idle();
  const photo = new Image();
  photo.crossOrigin = 'anonymous';
  photo.src = src;
  await photo.decode();
  const width = photo.naturalWidth;
  const height = photo.naturalHeight;
  if (!width || !height) return null;

  const cloth = document.createElement('canvas');
  cloth.width = width;
  cloth.height = height;
  const ctx = cloth.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;
  ctx.drawImage(photo, 0, 0);
  const pixels = ctx.getImageData(0, 0, width, height);
  // A photo that is already cut out keeps its own outline: flood-filling white would eat a white garment.
  const { alpha, coverage, box } = pixels.data[3]! < 128 ? maskFromAlpha(pixels.data, width, height) : maskFromWhite(pixels.data, width, height, tolerance);
  if (!usableCoverage(coverage)) return null;
  for (let i = 0; i < alpha.length; i++) pixels.data[i * 4 + 3] = alpha[i]!;
  ctx.putImageData(pixels, 0, 0);

  if (shading > 0) shade(ctx, box, shading);

  // The shadow is baked in, so it costs nothing per frame, phones included.
  const out = document.createElement('canvas');
  out.width = width;
  out.height = height;
  const final = out.getContext('2d');
  if (!final) return null;
  if (shadow > 0) {
    final.shadowColor = `rgba(20, 16, 12, ${Math.min(1, shadow * 1.3)})`;
    final.shadowBlur = width * 0.06 * blur;
    final.shadowOffsetX = width * 0.024 * distance;
    final.shadowOffsetY = width * 0.04 * distance;
  }
  final.drawImage(cloth, 0, 0);

  const blob = await new Promise<Blob | null>((resolve) => out.toBlob(resolve, 'image/webp', 0.9));
  return blob ? URL.createObjectURL(blob) : null;
}

/** Light from upper left: cloth curving away at the sides, gathering at the hem, a few soft folds. */
function shade(ctx: CanvasRenderingContext2D, box: MaskResult['box'], amount: number): void {
  const w = box.right - box.left;
  const h = box.bottom - box.top;
  ctx.save();
  ctx.globalCompositeOperation = 'source-atop';

  const volume = ctx.createLinearGradient(box.left, 0, box.right, 0);
  volume.addColorStop(0, `rgba(0,0,0,${0.3 * amount})`);
  volume.addColorStop(0.16, `rgba(0,0,0,${0.08 * amount})`);
  volume.addColorStop(0.4, `rgba(255,255,255,${0.09 * amount})`);
  volume.addColorStop(0.62, 'rgba(255,255,255,0)');
  volume.addColorStop(0.86, `rgba(0,0,0,${0.12 * amount})`);
  volume.addColorStop(1, `rgba(0,0,0,${0.36 * amount})`);
  ctx.fillStyle = volume;
  ctx.fillRect(box.left, box.top, w, h);

  const drape = ctx.createLinearGradient(0, box.top, 0, box.bottom);
  drape.addColorStop(0, `rgba(255,255,255,${0.1 * amount})`);
  drape.addColorStop(0.25, 'rgba(255,255,255,0)');
  drape.addColorStop(0.75, 'rgba(0,0,0,0)');
  drape.addColorStop(1, `rgba(0,0,0,${0.2 * amount})`);
  ctx.fillStyle = drape;
  ctx.fillRect(box.left, box.top, w, h);

  // Folds fall from the shoulders, fading in and out along their length so none has a hard end.
  const canvas = ctx.canvas;
  const fold = document.createElement('canvas');
  fold.width = canvas.width;
  fold.height = canvas.height;
  const folds = fold.getContext('2d');
  if (folds) {
    for (const [at, size] of [[0.26, 0.06], [0.39, 0.04], [0.62, 0.045], [0.75, 0.065]] as const) {
      const x = box.left + w * at;
      const band = folds.createLinearGradient(x - w * size, 0, x + w * size, 0);
      band.addColorStop(0, 'rgba(0,0,0,0)');
      band.addColorStop(0.42, `rgba(0,0,0,${0.1 * amount})`);
      band.addColorStop(0.58, `rgba(255,255,255,${0.07 * amount})`);
      band.addColorStop(1, 'rgba(255,255,255,0)');
      folds.fillStyle = band;
      folds.fillRect(x - w * size, box.top, w * size * 2, h);
    }
    folds.globalCompositeOperation = 'destination-in';
    const along = folds.createLinearGradient(0, box.top + h * 0.2, 0, box.bottom);
    along.addColorStop(0, 'rgba(0,0,0,0)');
    along.addColorStop(0.5, 'rgba(0,0,0,1)');
    along.addColorStop(1, 'rgba(0,0,0,0.65)');
    folds.fillStyle = along;
    folds.fillRect(0, 0, fold.width, fold.height);
    ctx.drawImage(fold, 0, 0);
  }
  ctx.restore();
}
