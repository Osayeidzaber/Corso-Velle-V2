/** Fit the requested number of naturally proportioned products into the flatter central run.
 * The middle aspect avoids an unusually wide/tall product shrinking the entire collection.
 */
export function centerCardHeight(width: number, height: number, aspects: number[], gap: number, count: number): number {
  const sorted = aspects.filter(aspect => Number.isFinite(aspect) && aspect > 0).sort((a, b) => a - b);
  const aspect = sorted[Math.floor(sorted.length / 2)] ?? .8;
  const visible = Math.max(3, Math.min(6, Math.round(count) || 4));
  return Math.max(24, Math.min(height * .5, (width * .76 - (visible - 1) * gap) / visible / aspect));
}
