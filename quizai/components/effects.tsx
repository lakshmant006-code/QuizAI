"use client";

import { useEffect, useRef } from "react";

/** Cursor-reactive neural-synapse canvas used on the landing + login. */
export function NeuralCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current!;
    const host = canvas.parentElement!;
    const ctx = canvas.getContext("2d")!;
    let w = 0, h = 0, raf = 0;
    const N = 70;
    const nodes: { x: number; y: number; vx: number; vy: number; r: number; gold: boolean; pulse: number; excite: number }[] = [];
    const mouse = { x: -1, y: -1 };
    const pulses: { x: number; y: number; r: number }[] = [];
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
    const onMove = (e: MouseEvent) => {
      const rc = host.getBoundingClientRect();
      mouse.x = e.clientX - rc.left; mouse.y = e.clientY - rc.top;
    };
    const onLeave = () => { mouse.x = -1; mouse.y = -1; };
    const onClick = (e: MouseEvent) => {
      const rc = host.getBoundingClientRect();
      pulses.push({ x: e.clientX - rc.left, y: e.clientY - rc.top, r: 0 });
    };
    host.addEventListener("mousemove", onMove);
    host.addEventListener("mouseleave", onLeave);
    host.addEventListener("click", onClick);
    function tick(t: number) {
      ctx.clearRect(0, 0, w, h);
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > 1) n.vx *= -1;
        if (n.y < 0 || n.y > 1) n.vy *= -1;
        n.excite *= 0.94;
      }
      for (let p = pulses.length - 1; p >= 0; p--) {
        const pu = pulses[p];
        pu.r += 7;
        ctx.strokeStyle = `rgba(255,198,39,${Math.max(0, 0.7 - pu.r / 320)})`;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(pu.x, pu.y, pu.r, 0, Math.PI * 2); ctx.stroke();
        for (const n of nodes) {
          const d = Math.hypot(n.x * w - pu.x, n.y * h - pu.y);
          if (Math.abs(d - pu.r) < 22) n.excite = 1;
        }
        if (pu.r > 340) pulses.splice(p, 1);
      }
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
      if (mouse.x >= 0) {
        for (const n of nodes) {
          const dx = n.x * w - mouse.x, dy = n.y * h - mouse.y;
          const d = Math.sqrt(dx * dx + dy * dy);
          if (d < 170) {
            ctx.strokeStyle = `rgba(140,29,64,${(1 - d / 170) * 0.5})`;
            ctx.lineWidth = 1.2;
            ctx.beginPath(); ctx.moveTo(n.x * w, n.y * h); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
            n.x += (dx > 0 ? -1 : 1) * 0.00003 * (170 - d);
            n.y += (dy > 0 ? -1 : 1) * 0.00003 * (170 - d);
          }
        }
        ctx.fillStyle = "rgba(255,198,39,0.9)";
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = "rgba(140,29,64,0.35)";
        ctx.beginPath(); ctx.arc(mouse.x, mouse.y, 10 + 3 * Math.sin(t * 0.004), 0, Math.PI * 2); ctx.stroke();
      }
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
      host.removeEventListener("mouseleave", onLeave);
      host.removeEventListener("click", onClick);
    };
  }, []);
  return <canvas ref={ref} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", pointerEvents: "none" }} aria-hidden="true" />;
}
