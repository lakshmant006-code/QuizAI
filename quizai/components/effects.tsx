"use client";

import { useEffect, useRef } from "react";

/**
 * Neural-network canvas with a ripple interaction: moving or clicking sends
 * expanding rings that briefly light up nearby nodes. No cursor attraction.
 */
export function NeuralCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const host = canvas.parentElement!;
    const ctx = canvas.getContext("2d")!;
    let w = 0, h = 0, raf = 0;
    const N = 38;
    const nodes: { x: number; y: number; vx: number; vy: number; r: number; gold: boolean; pulse: number; excite: number }[] = [];
    const pulses: { x: number; y: number; r: number }[] = [];
    let lastRx = -999, lastRy = -999;

    function resize() {
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = w * devicePixelRatio; canvas.height = h * devicePixelRatio;
      ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }
    resize();
    for (let i = 0; i < N; i++) nodes.push({
      x: Math.random(), y: Math.random(),
      vx: (Math.random() - 0.5) * 0.0004, vy: (Math.random() - 0.5) * 0.0004,
      r: 1.5 + Math.random() * 2.5, gold: Math.random() < 0.18,
      pulse: Math.random() * Math.PI * 2, excite: 0,
    });

    function ripple(x: number, y: number) {
      if (pulses.length < 24) pulses.push({ x, y, r: 0 });
    }
    const onMove = (e: MouseEvent) => {
      const rc = host.getBoundingClientRect();
      const x = e.clientX - rc.left, y = e.clientY - rc.top;
      // Throttle by distance so movement leaves a gentle trail of ripples.
      if (Math.hypot(x - lastRx, y - lastRy) > 70) { ripple(x, y); lastRx = x; lastRy = y; }
    };
    const onClick = (e: MouseEvent) => {
      const rc = host.getBoundingClientRect();
      ripple(e.clientX - rc.left, e.clientY - rc.top);
    };
    host.addEventListener("mousemove", onMove);
    host.addEventListener("click", onClick);

    function tick(t: number) {
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > 1) n.vx *= -1;
        if (n.y < 0 || n.y > 1) n.vy *= -1;
        n.excite *= 0.94;
      }

      // Ripples: expanding rings that excite the nodes they wash over.
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pu = pulses[p];
        pu.r += 6;
        ctx.strokeStyle = `rgba(255,198,39,${Math.max(0, 0.6 - pu.r / 340)})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(pu.x, pu.y, pu.r, 0, Math.PI * 2); ctx.stroke();
        for (const n of nodes) {
          const d = Math.hypot(n.x * w - pu.x, n.y * h - pu.y);
          if (Math.abs(d - pu.r) < 22) n.excite = 1;
        }
        if (pu.r > 360) pulses.splice(p, 1);
      }

      // Connections between nearby nodes.
      for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
        const a = nodes[i], b = nodes[j];
        const dx = (a.x - b.x) * w, dy = (a.y - b.y) * h;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < 130) {
          const ex = Math.max(a.excite, b.excite);
          ctx.strokeStyle = ex > 0.15 ? `rgba(255,198,39,${(1 - d / 130) * (0.25 + ex * 0.6)})` : `rgba(140,29,64,${(1 - d / 130) * 0.22})`;
          ctx.lineWidth = 1 + ex;
          ctx.beginPath(); ctx.moveTo(a.x * w, a.y * h); ctx.lineTo(b.x * w, b.y * h); ctx.stroke();
        }
      }

      // Nodes.
      for (const n of nodes) {
        const glow = 0.55 + 0.45 * Math.sin(t * 0.001 + n.pulse);
        const ex = n.excite;
        ctx.fillStyle = n.gold || ex > 0.3 ? `rgba(255,198,39,${0.5 + Math.max(glow * 0.5, ex)})` : `rgba(140,29,64,${0.25 + glow * 0.45 + ex * 0.5})`;
        ctx.beginPath(); ctx.arc(n.x * w, n.y * h, n.r * (n.gold ? 1.4 : 1) * (1 + ex), 0, Math.PI * 2); ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf); window.removeEventListener("resize", resize);
      host.removeEventListener("mousemove", onMove);
      host.removeEventListener("click", onClick);
    };
  }, []);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} aria-hidden="true" />;
}
