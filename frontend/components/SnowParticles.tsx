"use client";

import { useEffect, useRef } from "react";

type SnowParticlesProps = {
  /** Target particle count on desktop; clamped to 30–50 (15–25 under 768px). */
  density?: number;
  /** Multiplier on fall speed. */
  speed?: number;
  /** Multiplier on each particle's own opacity. */
  opacity?: number;
  enabled?: boolean;
  /** Particle color — pick a tone that reads against this section's background. */
  color?: string;
  /** `fixed` spans the whole viewport; `absolute` (default) fills the nearest
   * `position: relative` ancestor, matching how `<Snowflakes>` is scoped to one section. */
  positioning?: "absolute" | "fixed";
};

type Particle = {
  x: number;
  y: number;
  size: number;
  baseOpacity: number;
  fallSpeed: number;
  driftAmplitude: number;
  driftFrequency: number;
  driftPhase: number;
  rotation: number;
  rotationSpeed: number;
  isSpark: boolean;
};

const MOBILE_BREAKPOINT = 768;
const DESKTOP_RANGE: [number, number] = [30, 50];
const MOBILE_RANGE: [number, number] = [15, 25];
const SPARK_RATIO = 0.1;

function clampDensity(requested: number, mobile: boolean): number {
  const [min, max] = mobile ? MOBILE_RANGE : DESKTOP_RANGE;
  return Math.round(Math.min(max, Math.max(min, requested)));
}

function createParticle(width: number, height: number, spawnAbove: boolean): Particle {
  return {
    x: Math.random() * width,
    y: spawnAbove ? -Math.random() * height * 0.3 - 10 : Math.random() * height,
    size: 1 + Math.random() * 2.2,
    baseOpacity: 0.14 + Math.random() * 0.4,
    fallSpeed: 0.25 + Math.random() * 0.55,
    driftAmplitude: 6 + Math.random() * 18,
    driftFrequency: 0.15 + Math.random() * 0.35,
    driftPhase: Math.random() * Math.PI * 2,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.006,
    isSpark: Math.random() < SPARK_RATIO,
  };
}

function drawSpark(ctx: CanvasRenderingContext2D, size: number) {
  const outer = size * 2.2;
  const inner = outer * 0.28;
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const radius = i % 2 === 0 ? outer : inner;
    const angle = (Math.PI / 4) * i;
    const px = Math.cos(angle) * radius;
    const py = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
}

/**
 * Premium, subtle falling-snow ambience for dark hero/banner sections.
 * Canvas-drawn (not one React node per flake), pauses off-screen and under
 * `prefers-reduced-motion: reduce`, and never intercepts clicks or scroll.
 */
export function SnowParticles({
  density = 40,
  speed = 1,
  opacity = 1,
  enabled = true,
  color = "#F7EEE5",
  positioning = "absolute",
}: SnowParticlesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!enabled) return;

    const canvas = canvasRef.current;
    const parent = canvas?.parentElement;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !parent || !ctx) return;

    const reduceMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduceMotionQuery.matches) return;

    let particles: Particle[] = [];
    let width = 0;
    let height = 0;
    let dpr = 1;
    let rafId = 0;
    let running = true;

    function resize() {
      if (!canvas || !parent || !ctx) return;
      const rect = parent.getBoundingClientRect();
      width = Math.max(1, Math.round(rect.width));
      height = Math.max(1, Math.round(rect.height));
      dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR so the canvas never balloons on hi-dpi screens
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target = clampDensity(density, width < MOBILE_BREAKPOINT);
      if (particles.length === 0) {
        particles = Array.from({ length: target }, () => createParticle(width, height, false));
      } else if (particles.length !== target) {
        particles =
          particles.length > target
            ? particles.slice(0, target)
            : [...particles, ...Array.from({ length: target - particles.length }, () => createParticle(width, height, false))];
      }
    }

    function tick() {
      if (!ctx) return;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = color;

      for (const p of particles) {
        p.y += p.fallSpeed * speed;
        p.rotation += p.rotationSpeed;
        const driftX = p.x + Math.sin(p.y * p.driftFrequency * 0.02 + p.driftPhase) * p.driftAmplitude * 0.02;

        if (p.y - p.size > height) {
          p.y = -p.size * 2;
          p.x = Math.random() * width;
        }

        ctx.globalAlpha = p.baseOpacity * opacity;
        if (p.isSpark) {
          ctx.save();
          ctx.translate(driftX, p.y);
          ctx.rotate(p.rotation);
          drawSpark(ctx, p.size);
          ctx.restore();
        } else {
          ctx.beginPath();
          ctx.arc(driftX, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      if (running) rafId = requestAnimationFrame(tick);
    }

    function handleVisibility() {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else if (running) {
        rafId = requestAnimationFrame(tick);
      }
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(parent);
    resize();
    rafId = requestAnimationFrame(tick);
    document.addEventListener("visibilitychange", handleVisibility);

    function handleReducedMotionChange(e: MediaQueryListEvent) {
      if (e.matches) {
        running = false;
        cancelAnimationFrame(rafId);
        ctx?.clearRect(0, 0, width, height);
      }
    }
    reduceMotionQuery.addEventListener("change", handleReducedMotionChange);

    return () => {
      running = false;
      cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      document.removeEventListener("visibilitychange", handleVisibility);
      reduceMotionQuery.removeEventListener("change", handleReducedMotionChange);
    };
  }, [density, speed, opacity, enabled, color]);

  if (!enabled) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: positioning,
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 2,
      }}
    />
  );
}
