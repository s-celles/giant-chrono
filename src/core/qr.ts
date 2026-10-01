// QR code of the app's address for the About window (ABT-002), with the same
// library and rendering as Progressive Web Office and QRShare.

import { correction, generate } from "lean-qr";
import { toSvgDataURL } from "lean-qr/extras/svg";

/** A `data:` SVG URL of a QR code for `text`, black on white with a quiet zone. */
export function qrDataUrl(text: string): string {
  return toSvgDataURL(generate(text, { minCorrectionLevel: correction.M }), {
    on: "black",
    off: "white",
    padX: 4,
    padY: 4,
  });
}
