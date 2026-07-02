// Giant digit auto-fit (DSP-001, DSP-002): compute the largest font size at
// which a text template fits its container, using canvas text measurement.

const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

const REFERENCE_PX = 100;

interface FitCache {
  key: string;
  fontSize: number;
}

const caches = new WeakMap<HTMLElement, FitCache>();

/**
 * Size `el`'s font so `template` fills `container`.
 * `sizeFactor` scales the maximum fit (DSP-005), `spacingEm` accounts for
 * user letter spacing. Cached per element until geometry or template change.
 */
export function fitDigits(
  el: HTMLElement,
  container: HTMLElement,
  template: string,
  sizeFactor: number,
  spacingEm: number,
  fontFamily: string,
  heightShare = 1,
): void {
  const width = container.clientWidth;
  const height = container.clientHeight * heightShare;
  if (width <= 0 || height <= 0) return;

  const key = `${width}x${height}|${template.length}|${sizeFactor}|${spacingEm}|${fontFamily}`;
  const cached = caches.get(el);
  if (cached?.key === key) return;

  let fontSize = height * 0.9;
  if (ctx) {
    ctx.font = `${REFERENCE_PX}px ${fontFamily}`;
    const textWidth =
      ctx.measureText(template).width + template.length * spacingEm * REFERENCE_PX;
    if (textWidth > 0) {
      const widthBound = (width * 0.96 * REFERENCE_PX) / textWidth;
      fontSize = Math.min(widthBound, height * 0.9);
    }
  }
  fontSize = Math.max(8, fontSize * sizeFactor);
  el.style.fontSize = `${fontSize}px`;
  caches.set(el, { key, fontSize });
}

/** Template with the widest digit so the fit is stable while counting. */
export function widthTemplate(text: string): string {
  return text.replace(/\d/g, "0");
}
