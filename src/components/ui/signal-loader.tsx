"use client";

import { useEffect, useRef } from "react";

interface SignalLoaderProps {
  size?: number;
  className?: string;
}

const CURVES = [
  { start: [4, 16], cp1: [6, 16], cp2: [7.5, 13], end: [9, 13] },
  { start: [9, 13], cp1: [10.5, 13], cp2: [11, 17], end: [12.5, 17] },
  { start: [12.5, 17], cp1: [14, 17], cp2: [14, 9], end: [16, 9] },
  { start: [16, 9], cp1: [18, 9], cp2: [16.5, 19], end: [18.5, 19] },
  { start: [18.5, 19], cp1: [20, 19], cp2: [19.5, 13], end: [21, 13] },
  { start: [21, 13], cp1: [22.5, 13], cp2: [23, 16], end: [26, 16] },
];

function cubicBezier(t: number, p0: number, p1: number, p2: number, p3: number) {
  const mt = 1 - t;
  return mt * mt * mt * p0 + 3 * mt * mt * t * p1 + 3 * mt * t * t * p2 + t * t * t * p3;
}

function buildPath(canvasSize: number) {
  const scale = canvasSize / 32;
  const samplesPerCurve = 60;
  const points: { x: number; y: number }[] = [];

  for (const c of CURVES) {
    for (let i = 0; i <= samplesPerCurve; i++) {
      if (points.length > 0 && i === 0) continue;
      const t = i / samplesPerCurve;
      points.push({
        x: cubicBezier(t, c.start[0], c.cp1[0], c.cp2[0], c.end[0]) * scale,
        y: cubicBezier(t, c.start[1], c.cp1[1], c.cp2[1], c.end[1]) * scale,
      });
    }
  }

  const arcLengths = [0];
  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    arcLengths.push(arcLengths[i - 1] + Math.sqrt(dx * dx + dy * dy));
  }

  return { points, arcLengths, totalLength: arcLengths[arcLengths.length - 1] };
}

function getPointAtLength(
  len: number,
  points: { x: number; y: number }[],
  arcLengths: number[],
  totalLength: number
) {
  if (len <= 0) return points[0];
  if (len >= totalLength) return points[points.length - 1];
  let lo = 0;
  let hi = arcLengths.length - 1;
  while (lo < hi - 1) {
    const mid = (lo + hi) >> 1;
    if (arcLengths[mid] < len) lo = mid;
    else hi = mid;
  }
  const segLen = arcLengths[hi] - arcLengths[lo];
  const frac = segLen > 0 ? (len - arcLengths[lo]) / segLen : 0;
  return {
    x: points[lo].x + (points[hi].x - points[lo].x) * frac,
    y: points[lo].y + (points[hi].y - points[lo].y) * frac,
  };
}

export function SignalLoader({ size = 56, className }: SignalLoaderProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pathRef = useRef<ReturnType<typeof buildPath> | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;
    const px = size * dpr;
    canvas.width = px;
    canvas.height = px;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);

    pathRef.current = buildPath(size);
    const { points, arcLengths, totalLength } = pathRef.current;

    const duration = 1800;
    const tailLength = totalLength * 0.45;
    const segments = 80;
    const lineWidth = 2 * (size / 56);
    const r = size / 2;
    let startTime: number | null = null;
    let frameId: number;

    function draw(timestamp: number) {
      if (!startTime) startTime = timestamp;
      const t = ((timestamp - startTime) % duration) / duration;
      const headDist = t * (totalLength + tailLength * 0.3);

      ctx!.clearRect(0, 0, size, size);

      // Black circle
      ctx!.beginPath();
      ctx!.arc(r, r, r, 0, Math.PI * 2);
      ctx!.fillStyle = "#4D4D4D";
      ctx!.fill();

      // Dim base wave
      ctx!.beginPath();
      ctx!.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx!.lineTo(points[i].x, points[i].y);
      }
      ctx!.strokeStyle = "rgba(255, 255, 255, 0.08)";
      ctx!.lineWidth = lineWidth;
      ctx!.lineCap = "round";
      ctx!.lineJoin = "round";
      ctx!.stroke();

      // Sweep with fading tail
      for (let i = 0; i < segments; i++) {
        const frac = i / segments;
        const nextFrac = (i + 1) / segments;
        const segStartDist = headDist - tailLength * (1 - frac);
        const segEndDist = headDist - tailLength * (1 - nextFrac);

        if (segEndDist < 0 || segStartDist > totalLength) continue;

        const clampedStart = Math.max(0, Math.min(totalLength, segStartDist));
        const clampedEnd = Math.max(0, Math.min(totalLength, segEndDist));
        if (clampedEnd - clampedStart < 0.1) continue;

        const p1 = getPointAtLength(clampedStart, points, arcLengths, totalLength);
        const p2 = getPointAtLength(clampedEnd, points, arcLengths, totalLength);
        const alpha = nextFrac * nextFrac;

        ctx!.beginPath();
        ctx!.moveTo(p1.x, p1.y);
        ctx!.lineTo(p2.x, p2.y);
        ctx!.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx!.lineWidth = lineWidth;
        ctx!.lineCap = "round";
        ctx!.lineJoin = "round";
        ctx!.stroke();
      }

      frameId = requestAnimationFrame(draw);
    }

    frameId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frameId);
  }, [size]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ borderRadius: "50%" }}
    />
  );
}
