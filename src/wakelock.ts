// Screen wake lock (WAK-001..WAK-003). Absence of the API or a rejected
// request degrades silently; the app keeps working (CTR-003, WAK-003).

export class WakeLockManager {
  private sentinel: WakeLockSentinel | null = null;
  private wanted = false;

  constructor() {
    // The lock is released by the platform when the page is hidden; reacquire
    // on return to the foreground if still wanted.
    document.addEventListener("visibilitychange", () => {
      if (this.wanted && document.visibilityState === "visible") {
        void this.acquire();
      }
    });
  }

  static get supported(): boolean {
    return "wakeLock" in navigator;
  }

  /** Keep the screen awake while `active` is true (WAK-001, WAK-002). */
  async update(active: boolean): Promise<void> {
    this.wanted = active;
    if (active) {
      await this.acquire();
    } else {
      await this.release();
    }
  }

  private async acquire(): Promise<void> {
    if (!WakeLockManager.supported || this.sentinel !== null) return;
    try {
      this.sentinel = await navigator.wakeLock.request("screen");
      this.sentinel.addEventListener("release", () => {
        this.sentinel = null;
      });
    } catch {
      // Denied (battery saver, permissions): degrade silently (WAK-003).
      this.sentinel = null;
    }
  }

  private async release(): Promise<void> {
    try {
      await this.sentinel?.release();
    } catch {
      // Ignore: releasing an already-released sentinel is harmless.
    }
    this.sentinel = null;
  }
}
