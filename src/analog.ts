// Canvas renderer for the analog clock face (CLK-005), themed from user
// settings (CLK-004): digit color for face, numbers and hands over the
// app background.

import { handAngles, secondHandSeconds, type SecondHandMode } from "./core/analog";

export interface AnalogTheme {
  digitColor: string;
  fontFamily: string;
  /** Second hand motion: continuous sweep or per-second tick (CLK-006). */
  secondHand: SecondHandMode;
}

function hand(
  ctx: CanvasRenderingContext2D,
  angle: number,
  length: number,
  width: number,
  color: string,
): void {
  ctx.beginPath();
  ctx.lineWidth = width;
  ctx.lineCap = "round";
  ctx.strokeStyle = color;
  ctx.moveTo(0, 0);
  ctx.lineTo(Math.sin(angle) * length, -Math.cos(angle) * length);
  ctx.stroke();
}

/** Draw the full face for `date` on a square canvas (backing size in px). */
export function drawAnalogClock(canvas: HTMLCanvasElement, date: Date, theme: AnalogTheme): void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const r = canvas.width / 2;
  const cr = r * 0.96; // face radius inside the canvas
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.translate(r, r);

  // Face ring and minute ticks
  ctx.beginPath();
  ctx.arc(0, 0, cr, 0, 2 * Math.PI);
  ctx.strokeStyle = theme.digitColor;
  ctx.lineWidth = cr * 0.03;
  ctx.stroke();
  for (let tick = 0; tick < 60; tick++) {
    const ang = (tick * Math.PI) / 30;
    const major = tick % 5 === 0;
    const inner = major ? 0.88 : 0.93;
    ctx.beginPath();
    ctx.lineWidth = cr * (major ? 0.02 : 0.008);
    ctx.moveTo(Math.sin(ang) * cr * inner, -Math.cos(ang) * cr * inner);
    ctx.lineTo(Math.sin(ang) * cr * 0.96, -Math.cos(ang) * cr * 0.96);
    ctx.stroke();
  }

  // Numbers 1-12
  ctx.fillStyle = theme.digitColor;
  ctx.font = `${cr * 0.16}px ${theme.fontFamily}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  for (let num = 1; num <= 12; num++) {
    const ang = (num * Math.PI) / 6;
    ctx.fillText(String(num), Math.sin(ang) * cr * 0.74, -Math.cos(ang) * cr * 0.74);
  }

  // Hands: sweep keeps fractional seconds, tick steps once per second (CLK-006)
  const a = handAngles(
    date.getHours(),
    date.getMinutes(),
    secondHandSeconds(date.getSeconds() + date.getMilliseconds() / 1000, theme.secondHand),
  );
  hand(ctx, a.hour, cr * 0.5, cr * 0.05, theme.digitColor);
  hand(ctx, a.minute, cr * 0.72, cr * 0.035, theme.digitColor);
  hand(ctx, a.second, cr * 0.82, cr * 0.012, theme.digitColor);

  // Hub
  ctx.beginPath();
  ctx.arc(0, 0, cr * 0.035, 0, 2 * Math.PI);
  ctx.fill();
}
