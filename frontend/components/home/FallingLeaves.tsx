"use client";

import { useEffect, useRef } from "react";

/**
 * Autumn leaves drifting down over the homepage.
 *
 * One fixed canvas above the page that never takes a click (pointer-events:
 * none) and is hidden from screen readers. Deliberately sparse: a dozen leaves
 * on a desktop, half that on a phone, so it reads as a seasonal touch rather
 * than weather over the products. It does not run at all for visitors who ask
 * their system for reduced motion, and it pauses while the tab is hidden.
 *
 * Written in-house rather than pulled from npm: it is a few dozen lines, and a
 * dependency here would be third-party code running on every homepage visit.
 */

const COLORS = ["#c2410c", "#d9480f", "#e8590c", "#b45309", "#a61e4d", "#ca8a04"];

// A maple leaf, drawn in a unit box centred on 0,0 (stem pointing down).
// Kept as path strings: Path2D only exists in the browser, so the shapes are
// built inside the effect, never while the page renders on the server.
const MAPLE =
  "M0,-1 L0.15,-0.6 L0.35,-0.75 L0.3,-0.35 L0.75,-0.55 L0.62,-0.25 L0.95,-0.1 L0.55,0.1 L0.62,0.3 L0.25,0.25 L0.06,0.45 L0.04,1 L-0.04,1 L-0.06,0.45 L-0.25,0.25 L-0.62,0.3 L-0.55,0.1 L-0.95,-0.1 L-0.62,-0.25 L-0.75,-0.55 L-0.3,-0.35 L-0.35,-0.75 L-0.15,-0.6 Z";
// A plain oval leaf, for variety.
const OVAL = "M0,-1 C0.7,-0.55 0.6,0.5 0,0.85 C-0.6,0.5 -0.7,-0.55 0,-1 Z";

type Leaf = {
  x: number;
  y: number;
  size: number;
  speed: number;
  sway: number;
  phase: number;
  rotation: number;
  spin: number;
  flip: number;
  color: string;
  shape: Path2D;
};

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function makeLeaf(shapes: Path2D[], width: number, height: number, anywhere: boolean): Leaf {
  const size = rand(10, 20);
  return {
    x: Math.random() * width,
    y: anywhere ? Math.random() * height : -size * 2,
    size,
    speed: rand(0.35, 0.9),
    sway: rand(0.4, 1.2),
    phase: Math.random() * Math.PI * 2,
    rotation: Math.random() * Math.PI * 2,
    spin: rand(-0.02, 0.02),
    flip: rand(0.6, 1.6),
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    shape: Math.random() < 0.7 ? shapes[0] : shapes[1],
  };
}

export function FallingLeaves({ count = 12 }: { count?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const shapes = [new Path2D(MAPLE), new Path2D(OVAL)];
    let width = 0;
    let height = 0;
    const resize = () => {
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    };
    resize();

    const total = width < 640 ? Math.ceil(count / 2) : count;
    const leaves = Array.from({ length: total }, () => makeLeaf(shapes, width, height, true));

    let frame = 0;
    let last = 0;
    const tick = (now: number) => {
      // Frame-rate independent: one step is one 60fps frame.
      const step = last ? Math.min((now - last) / 16.7, 3) : 1;
      last = now;
      ctx.clearRect(0, 0, width, height);
      for (const leaf of leaves) {
        leaf.phase += 0.02 * step;
        leaf.y += leaf.speed * step;
        leaf.x += Math.sin(leaf.phase) * leaf.sway * step;
        leaf.rotation += leaf.spin * step;
        if (leaf.y > height + leaf.size * 2) Object.assign(leaf, makeLeaf(shapes, width, height, false));

        ctx.save();
        ctx.translate(leaf.x, leaf.y);
        ctx.rotate(leaf.rotation);
        // Squashing one axis with a cosine reads as the leaf tumbling.
        ctx.scale(leaf.size, leaf.size * Math.cos(leaf.phase * leaf.flip));
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = leaf.color;
        ctx.fill(leaf.shape);
        ctx.restore();
      }
      frame = requestAnimationFrame(tick);
    };

    const onVisibility = () => {
      cancelAnimationFrame(frame);
      last = 0;
      if (!document.hidden) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [count]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 40 }}
    />
  );
}
