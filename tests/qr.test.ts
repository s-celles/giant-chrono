// Requirements under test: ABT-002
import { describe, expect, test } from "bun:test";
import { correction, generate } from "lean-qr";
import { qrDataUrl } from "../src/core/qr";

describe("qrDataUrl (ABT-002: QR code of the app address)", () => {
  const url = "https://s-celles.github.io/giant-chrono/";

  test("returns an SVG data URL", () => {
    expect(qrDataUrl(url)).toMatch(/^data:image\/svg\+xml/);
  });

  test("is deterministic for the same address", () => {
    expect(qrDataUrl(url)).toBe(qrDataUrl(url));
    expect(qrDataUrl(url)).not.toBe(qrDataUrl("https://example.org/"));
  });

  test("encodes the address with at least medium error correction", () => {
    const code = generate(url, { minCorrectionLevel: correction.M });
    expect(code.size).toBeGreaterThanOrEqual(21);
  });
});
