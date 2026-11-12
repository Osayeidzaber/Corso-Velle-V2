/**
 * A quiet studio credit in the browser console: only people who open DevTools see it.
 * Printed once per page load, never in the theme editor.
 */
const ART = String.raw`
   ██████╗ ███████╗
  ██╔═══██╗╚══███╔╝
  ██║   ██║  ███╔╝
  ██║   ██║ ███╔╝
  ╚██████╔╝███████╗
   ╚═════╝ ╚══════╝  STUDIOS`;

export function installStudioCredit(): void {
  if (window.Shopify?.designMode) return;
  const year = new Date().getFullYear();
  const page = `${location.origin}/?view=oz`;
  try {
    console.log(
      `%c${ART}\n\n%cDesigned & built by OZ Studios, ${year}.%c\n${page}\nhttps://www.instagram.com/oz.studio._/`,
      'font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 11px; line-height: 1.15; color: #a8805f;',
      'font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; font-weight: 600;',
      'font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 11px; color: #8a8a8a;',
    );
  } catch {
    // A locked-down console is no reason to break the page.
  }
}
