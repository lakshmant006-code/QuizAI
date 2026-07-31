"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/* ---- Brand mark ---- */
function Brand({ size = 20 }: { size?: number }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 9, fontWeight: 700, fontSize: size, letterSpacing: "-0.02em", color: "var(--asu-maroon)" }}>
      <span
        aria-hidden
        style={{ width: size * 1.5, height: size * 1.5, borderRadius: 9, background: "var(--surface-maroon-tint)", color: "var(--asu-maroon)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.82 }}
      >
        <i className="fa-solid fa-brain" />
      </span>
      QuizAI
    </span>
  );
}

/* ---- Neural synapse canvas (cursor-reactive; click fires a pulse) ---- */
function NeuralCanvas() {
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

/* ---- Magnetic wrapper: children drift toward the cursor ---- */
function Magnetic({ children, strength = 0.35, style }: { children: React.ReactNode; strength?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const rc = ref.current!.getBoundingClientRect();
    gsap.to(ref.current, { x: (e.clientX - rc.left - rc.width / 2) * strength, y: (e.clientY - rc.top - rc.height / 2) * strength, duration: 0.3, ease: "power2.out" });
  };
  const onLeave = () => gsap.to(ref.current, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" });
  return <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={style}>{children}</div>;
}

/* ---- 3D tilt card ---- */
function TiltCard({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const onMove = (e: React.MouseEvent) => {
    const rc = ref.current!.getBoundingClientRect();
    const px = (e.clientX - rc.left) / rc.width - 0.5, py = (e.clientY - rc.top) / rc.height - 0.5;
    gsap.to(ref.current, { rotateY: px * 10, rotateX: -py * 10, scale: 1.02, boxShadow: "var(--shadow-elevated)", duration: 0.3, ease: "power2.out", transformPerspective: 700 });
  };
  const onLeave = () => gsap.to(ref.current, { rotateY: 0, rotateX: 0, scale: 1, boxShadow: "0 0 0 rgba(0,0,0,0)", duration: 0.5, ease: "power3.out" });
  return <div ref={ref} onMouseMove={onMove} onMouseLeave={onLeave} style={{ ...style, willChange: "transform" }}>{children}</div>;
}

/* ---- Chat demo: types itself when scrolled into view ---- */
function ChatDemo() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [typed, setTyped] = useState("");
  const [phase, setPhase] = useState(0);
  const msg = "Turn Electromagnet.pdf into an 8-question quiz";
  const started = useRef(false);
  useEffect(() => {
    const el = rootRef.current!;
    let timers: ReturnType<typeof setTimeout>[] = [];
    const run = () => {
      setPhase(1);
      msg.split("").forEach((_, i) => timers.push(setTimeout(() => setTyped(msg.slice(0, i + 1)), 350 + i * 32)));
      timers.push(setTimeout(() => setPhase(2), 350 + msg.length * 32 + 250));
      timers.push(setTimeout(() => setPhase(3), 350 + msg.length * 32 + 1500));
    };
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) { started.current = true; run(); io.disconnect(); }
    }, { threshold: 0.4 });
    io.observe(el);
    return () => { io.disconnect(); timers.forEach(clearTimeout); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (phase === 3 && rootRef.current) {
      const card = rootRef.current.querySelector("[data-answer]")!;
      gsap.fromTo(card, { y: 18, opacity: 0, scale: 0.97 }, { y: 0, opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.6)" });
      gsap.fromTo(card.querySelectorAll("[data-chip]"), { y: 8, opacity: 0 }, { y: 0, opacity: 1, duration: 0.3, stagger: 0.09, delay: 0.25, ease: "power2.out" });
    }
  }, [phase]);
  return (
    <div ref={rootRef} style={{ background: "#FBFBFD", border: "1px solid rgba(0,0,0,0.07)", borderRadius: 20, padding: 28, display: "flex", flexDirection: "column", gap: 14, minHeight: 300, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(0,0,0,0.05)", color: "var(--gray-1)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 13 }}><i className="fa-solid fa-brain" /></span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--gray-1)" }}>QuizAI</span>
        <span style={{ font: "var(--text-small)", color: "var(--gray-3)" }}>Your study operator</span>
      </div>
      {phase >= 1 && (
        <div style={{ alignSelf: "flex-end", background: "var(--gray-1)", color: "#fff", fontFamily: "var(--font-sans)", fontSize: 14.5, letterSpacing: "-0.01em", padding: "12px 18px", borderRadius: "18px 18px 5px 18px", maxWidth: 420, minHeight: 21 }}>
          {typed}<span style={{ opacity: phase === 1 ? 1 : 0, borderRight: "2px solid #fff", marginLeft: 1 }}>&#8203;</span>
        </div>
      )}
      {phase === 2 && (
        <div style={{ alignSelf: "flex-start", background: "#fff", border: "1px solid rgba(0,0,0,0.07)", padding: "14px 18px", borderRadius: "18px 18px 18px 5px", font: "var(--text-small)", color: "var(--gray-3)" }}>
          <i className="fa-solid fa-wand-magic-sparkles fa-fade" style={{ marginRight: 8 }} />Reading Electromagnet.pdf…
        </div>
      )}
      {phase === 3 && (
        <div data-answer style={{ alignSelf: "flex-start", background: "#fff", border: "1px solid rgba(0,0,0,0.07)", padding: "18px 20px", borderRadius: "18px 18px 18px 5px", maxWidth: 470, display: "flex", flexDirection: "column", gap: 10, boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
          <span style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--gray-1)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--asu-maroon)" }} />Quiz ready — 8 questions
          </span>
          <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, color: "var(--gray-2)", lineHeight: 1.6 }}>Multiple choice · difficulty: medium · covers magnetic flux, induction, and Faraday&apos;s law</span>
          <div style={{ display: "flex", gap: 8 }}>
            {["MCQs", "Flashcards", "Short answers"].map((c) => (
              <span data-chip key={c} style={{ background: "rgba(0,0,0,0.045)", color: "var(--gray-2)", fontFamily: "var(--font-sans)", fontSize: 12.5, padding: "5px 12px", borderRadius: 8 }}>{c}</span>
            ))}
          </div>
        </div>
      )}
      <span style={{ font: "var(--text-small)", color: "var(--text-muted)", textAlign: "center", marginTop: "auto" }}>No re-reading. No highlighting rituals. Just say what you need.</span>
    </div>
  );
}

const btnPrimary: React.CSSProperties = { width: "100%", padding: "12px 22px", background: "var(--asu-maroon)", color: "#fff", border: "none", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em", boxShadow: "var(--shadow-button)" };
const btnSecondary: React.CSSProperties = { width: "100%", padding: "12px 22px", background: "#fff", color: "var(--gray-1)", border: "1px solid var(--gray-5)", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: 15, letterSpacing: "-0.01em" };

export default function Landing() {
  const router = useRouter();
  const heroRef = useRef<HTMLElement>(null);
  const go = () => router.push("/login");

  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    if (heroRef.current) {
      gsap.fromTo(heroRef.current.querySelectorAll("[data-hero]"), { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.12, ease: "power3.out" });
    }
    document.querySelectorAll("[data-reveal]").forEach((el) => {
      gsap.fromTo(el, { y: 32, opacity: 0 }, { y: 0, opacity: 1, duration: 0.6, ease: "power2.out", scrollTrigger: { trigger: el, start: "top 85%" } });
    });
    return () => ScrollTrigger.getAll().forEach((s) => s.kill());
  }, []);

  const sectionH: React.CSSProperties = { font: "var(--text-h1)", color: "var(--text-heading)", margin: "0 0 12px", textAlign: "center" };
  const featureCard: React.CSSProperties = { flex: 1, background: "var(--white)", border: "1px solid var(--gray-6)", borderRadius: 14, padding: 28 };

  return (
    <div style={{ background: "var(--white)", minHeight: "100vh", fontFamily: "var(--font-sans)" }}>
      <nav className="ql-nav" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 40px", borderBottom: "1px solid var(--gray-6)", position: "sticky", top: 0, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", zIndex: 10 }}>
        <Brand />
        <div className="ql-nav-links" style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <a href="#features" style={{ font: "var(--text-label)", color: "var(--gray-2)" }}>Features</a>
          <a href="#how" style={{ font: "var(--text-label)", color: "var(--gray-2)" }}>How It Works</a>
          <button onClick={go} style={{ ...btnSecondary, width: 100, padding: "8px 14px", fontSize: 13 }}>Sign In</button>
          <button onClick={go} style={{ ...btnPrimary, width: 130, padding: "8px 14px", fontSize: 13 }}>Get Started</button>
        </div>
      </nav>

      <header ref={heroRef} className="ql-hero" style={{ position: "relative", overflow: "hidden", padding: "96px 40px 110px", textAlign: "center", cursor: "crosshair" }}>
        <NeuralCanvas />
        <div style={{ position: "relative", maxWidth: 760, margin: "0 auto", display: "flex", flexDirection: "column", alignItems: "center", gap: 20 }}>
          <span data-hero style={{ font: "var(--text-label)", color: "var(--asu-maroon)", background: "var(--surface-gold-tint)", border: "1px solid var(--border-gold-tint)", padding: "6px 16px", borderRadius: 999 }}>
            <i className="fa-solid fa-brain" style={{ marginRight: 8 }} />Study companion
          </span>
          <h1 data-hero style={{ font: "var(--text-display)", fontSize: 56, color: "var(--text-heading)", margin: 0, letterSpacing: "-1px" }}>Read it once. Remember it properly.</h1>
          <p data-hero style={{ font: "var(--text-body)", fontSize: 18, color: "var(--gray-2)", maxWidth: 560, margin: 0 }}>Bring your notes, readings, and slides. Get quizzes, flashcards, and summaries built from them — and a clear view of what stuck.</p>
          <div data-hero style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <Magnetic style={{ width: 190 }}><button onClick={go} style={btnPrimary}>Sign In to QuizAI</button></Magnetic>
            <Magnetic style={{ width: 170 }}><button onClick={go} style={btnSecondary}>Create Account</button></Magnetic>
          </div>
        </div>
      </header>

      <section data-reveal style={{ maxWidth: 880, margin: "0 auto", padding: "0 40px 90px" }}>
        <ChatDemo />
      </section>

      <section id="features" data-reveal style={{ maxWidth: 1120, margin: "0 auto", padding: "0 40px 90px" }}>
        <h2 style={sectionH}>Built around how memory works</h2>
        <p style={{ font: "var(--text-body)", color: "var(--gray-2)", textAlign: "center", margin: "0 0 40px" }}>Three tools, one loop: encode, test, reinforce.</p>
        <div className="ql-row" style={{ display: "flex", gap: 20 }}>
          {[
            { icon: "fa-solid fa-circle-question", title: "Quizzes", body: "Paste text, upload a document, or drop a link. Choose MCQs, flashcards, or short answers and set your difficulty." },
            { icon: "fa-regular fa-file-lines", title: "Summaries", body: "Long readings, condensed — with the key terms pulled out and flashcards to match." },
            { icon: "fa-solid fa-chart-simple", title: "Progress", body: "See which topics are solid and which ones need another pass." },
          ].map((f) => (
            <TiltCard key={f.title} style={featureCard}>
              <i className={f.icon} style={{ fontSize: 26, color: "var(--asu-maroon)" }} />
              <h3 style={{ font: "var(--text-h3)", color: "var(--text-heading)", margin: "14px 0 8px" }}>{f.title}</h3>
              <p style={{ font: "var(--text-body)", color: "var(--gray-2)", margin: 0 }}>{f.body}</p>
            </TiltCard>
          ))}
        </div>
      </section>

      <section id="how" data-reveal style={{ background: "var(--asu-maroon)", padding: "70px 40px" }}>
        <div className="ql-row" style={{ maxWidth: 1120, margin: "0 auto", display: "flex", gap: 20, textAlign: "center" }}>
          {[
            ["fa-solid fa-upload", "1. Add your material", "Notes, readings, slides, or a link."],
            ["fa-solid fa-bolt", "2. Get tested", "Choose the format, the length, and how hard it should be."],
            ["fa-solid fa-arrows-rotate", "3. Come back to it", "Revisit the weak spots and retake what you missed."],
          ].map(([icon, title, body]) => (
            <div key={title} style={{ flex: 1 }}>
              <i className={icon} style={{ fontSize: 26, color: "var(--asu-gold)" }} />
              <h3 style={{ font: "var(--text-h3)", color: "#fff", margin: "14px 0 8px" }}>{title}</h3>
              <p style={{ font: "var(--text-body)", color: "rgba(255,255,255,0.85)", margin: 0 }}>{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section data-reveal style={{ textAlign: "center", padding: "90px 40px" }}>
        <h2 style={sectionH}>Ready when your brain is</h2>
        <p style={{ font: "var(--text-body)", color: "var(--gray-2)", margin: "0 0 28px" }}>Sign in and turn today&apos;s reading into tomorrow&apos;s recall.</p>
        <Magnetic style={{ width: 220, margin: "0 auto" }}><button onClick={go} style={btnPrimary}>Sign In to QuizAI</button></Magnetic>
      </section>

      <footer style={{ borderTop: "1px solid var(--gray-6)", padding: "24px 40px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
        <Brand size={16} />
        <span style={{ font: "var(--text-small)", color: "var(--text-muted)" }}>QuizAI — study smarter, remember longer.</span>
      </footer>

      <style>{`
        @media (max-width: 700px){
          .ql-nav{padding:14px 18px!important}
          .ql-nav-links a{display:none!important}
          .ql-hero{padding:64px 18px 72px!important}
          .ql-hero h1{font-size:34px!important}
          .ql-row{flex-direction:column!important}
        }
      `}</style>
    </div>
  );
}
