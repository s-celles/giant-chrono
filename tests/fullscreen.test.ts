// Requirements under test: DSP-012 (full screen mode)
import { describe, expect, test } from "bun:test";
import {
  type FullscreenDocument,
  fullscreenSupported,
  isFullscreen,
  toggleFullscreen,
} from "../src/core/fullscreen";

const element = {} as Element;

function standardDoc(): FullscreenDocument & { calls: string[] } {
  const calls: string[] = [];
  const doc = {
    calls,
    fullscreenEnabled: true,
    fullscreenElement: null as Element | null,
    exitFullscreen: async () => {
      calls.push("exit");
      doc.fullscreenElement = null;
    },
    documentElement: {
      requestFullscreen: async () => {
        calls.push("request");
        doc.fullscreenElement = element;
      },
    },
  };
  return doc;
}

describe("full screen mode (DSP-012)", () => {
  test("toggles in and out with the standard API", async () => {
    const doc = standardDoc();
    expect(fullscreenSupported(doc)).toBe(true);
    expect(isFullscreen(doc)).toBe(false);
    await toggleFullscreen(doc);
    expect(isFullscreen(doc)).toBe(true);
    await toggleFullscreen(doc);
    expect(isFullscreen(doc)).toBe(false);
    expect(doc.calls).toEqual(["request", "exit"]);
  });

  test("falls back to the WebKit-prefixed API", async () => {
    const calls: string[] = [];
    const doc: FullscreenDocument = {
      webkitFullscreenEnabled: true,
      webkitFullscreenElement: null,
      webkitExitFullscreen: () => {
        calls.push("exit");
        doc.webkitFullscreenElement = null;
      },
      documentElement: {
        webkitRequestFullscreen: () => {
          calls.push("request");
          doc.webkitFullscreenElement = element;
        },
      },
    };
    expect(fullscreenSupported(doc)).toBe(true);
    await toggleFullscreen(doc);
    expect(isFullscreen(doc)).toBe(true);
    await toggleFullscreen(doc);
    expect(calls).toEqual(["request", "exit"]);
  });

  test("is unsupported without the API or when disabled", () => {
    expect(fullscreenSupported({ documentElement: {} })).toBe(false);
    const doc = standardDoc();
    doc.fullscreenEnabled = false;
    expect(fullscreenSupported(doc)).toBe(false);
  });

  test("a refused request does not throw", async () => {
    const doc = standardDoc();
    doc.documentElement.requestFullscreen = () => Promise.reject(new TypeError("denied"));
    await toggleFullscreen(doc);
    expect(isFullscreen(doc)).toBe(false);
  });
});
