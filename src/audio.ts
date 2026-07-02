// Locally generated audio cues via the Web Audio API (AUD-001): no remote
// files. The context is created lazily on a user gesture (CTR-004) and every
// failure is reported so the UI can fall back to a visual cue (AUD-003).

export class Beeper {
  private context: AudioContext | null = null;
  private failed = false;

  /** Create/resume the audio context. Returns false when audio is unavailable. */
  private ensureContext(): boolean {
    if (this.failed) return false;
    try {
      this.context ??= new AudioContext();
      if (this.context.state === "suspended") {
        void this.context.resume();
      }
      return this.context.state !== "closed";
    } catch {
      this.failed = true;
      return false;
    }
  }

  /** Prime the context from a user gesture (autoplay policies, CTR-004). */
  unlock(): void {
    this.ensureContext();
  }

  /** Play a beep. Returns false when audio could not be produced (AUD-003). */
  beep(frequency: number, durationMs: number, volume = 0.5): boolean {
    if (!this.ensureContext() || !this.context) return false;
    try {
      const t0 = this.context.currentTime;
      const osc = this.context.createOscillator();
      const gain = this.context.createGain();
      osc.type = "square";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(volume, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + durationMs / 1000);
      osc.connect(gain).connect(this.context.destination);
      osc.start(t0);
      osc.stop(t0 + durationMs / 1000);
      return true;
    } catch {
      return false;
    }
  }

  /** Countdown cue (DLY-003): short tick for 3-2-1, long high tone at go. */
  countdownCue(remainingSeconds: number): boolean {
    return remainingSeconds > 0 ? this.beep(880, 120) : this.beep(1440, 500);
  }
}
