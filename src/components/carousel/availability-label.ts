/** One small translated badge texture per carousel, shared by all sold-out photographs.
 * Drawn into the card before the lens pass so it follows the curve and never floats off its image.
 */
export function availabilityLabel(root: HTMLElement, text: string): HTMLCanvasElement | null {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 96;
  const context = canvas.getContext('2d');
  if (!context) return null;
  const style = getComputedStyle(root);
  context.fillStyle = style.getPropertyValue('--nk-color-accent').trim() || style.color;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = style.getPropertyValue('--nk-color-accent-text').trim() || style.backgroundColor;
  context.font = `600 36px ${style.getPropertyValue('--nk-font-spec').trim() || style.fontFamily}`;
  context.textAlign = 'center'; context.textBaseline = 'middle';
  context.fillText(text.toLocaleUpperCase(), canvas.width / 2, canvas.height / 2, canvas.width - 48);
  return canvas;
}
