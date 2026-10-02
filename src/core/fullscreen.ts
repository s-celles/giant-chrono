// Full screen mode (DSP-012): hide the browser chrome so the digits get the
// whole screen. Standard Fullscreen API with the WebKit-prefixed fallback
// (older Safari / iPad); unsupported where neither exists (iPhone Safari),
// in which case the button is hidden and an installed PWA is the way to go.

/** The subset of `Document` used here, so the logic is testable without a DOM. */
export interface FullscreenDocument {
  fullscreenEnabled?: boolean;
  fullscreenElement?: Element | null;
  exitFullscreen?: () => Promise<void>;
  webkitFullscreenEnabled?: boolean;
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => void;
  documentElement: {
    requestFullscreen?: () => Promise<void>;
    webkitRequestFullscreen?: () => void;
  };
}

export function fullscreenSupported(doc: FullscreenDocument): boolean {
  return !!(
    (doc.fullscreenEnabled && doc.documentElement.requestFullscreen) ||
    (doc.webkitFullscreenEnabled && doc.documentElement.webkitRequestFullscreen)
  );
}

export function isFullscreen(doc: FullscreenDocument): boolean {
  return !!(doc.fullscreenElement ?? doc.webkitFullscreenElement);
}

/** Enter full screen, or leave it if already active. Never throws. */
export async function toggleFullscreen(doc: FullscreenDocument): Promise<void> {
  try {
    if (isFullscreen(doc)) {
      if (doc.exitFullscreen) await doc.exitFullscreen();
      else doc.webkitExitFullscreen?.();
    } else {
      const root = doc.documentElement;
      if (root.requestFullscreen) await root.requestFullscreen();
      else root.webkitRequestFullscreen?.();
    }
  } catch {
    // Refused (no user gesture, permissions policy): stay as is.
  }
}
