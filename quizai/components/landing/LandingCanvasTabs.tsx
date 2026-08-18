"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const VIDEOS = [
  { src: "/PDF%20Upload.mp4", tab: "Upload", icon: "ph-file-arrow-up", label: "Uploading a PDF" },
  { src: "/quiz%20generation.mp4", tab: "Generate", icon: "ph-magic-wand", label: "Generating a quiz" },
  { src: "/task%20tracking.mp4", tab: "Track", icon: "ph-chart-bar", label: "Tracking your tasks" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Study-cycle band video showcase. All clips stay mounted in a sliding track,
 * so the arrows just translate between them — the videos never reload or
 * restart. Raw video, no frame or captions; a small tab names the screen.
 */
export function LandingCanvasTabs() {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const go = (d: number) => setIndex((i) => (i + d + VIDEOS.length) % VIDEOS.length);
  const current = VIDEOS[index];

  return (
    <div style={{ marginTop: 34, width: "100%", maxWidth: 940, marginLeft: "auto", marginRight: "auto" }}>
      {/* Small tab: which screen this clip shows */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <AnimatePresence mode="wait">
          <motion.span
            key={current.tab}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: EASE }}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 16px",
              borderRadius: 999, background: "#fff", color: "var(--asu-maroon)",
              fontSize: 13.5, fontWeight: 700, boxShadow: "0 6px 20px rgba(0,0,0,0.18)",
            }}
          >
            <i className={`ph ${current.icon}`} aria-hidden style={{ fontSize: 14 }} />
            {current.tab}
          </motion.span>
        </AnimatePresence>
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Arrow side="left" onClick={() => go(-1)} />

        {/* Viewport — the track slides inside it; every video stays mounted. */}
        <div style={{ position: "relative", flex: 1, minWidth: 0, borderRadius: 16, overflow: "hidden", boxShadow: "0 30px 70px rgba(0,0,0,0.28)" }}>
          <motion.div
            style={{ display: "flex" }}
            animate={{ x: `-${index * 100}%` }}
            transition={{ duration: reduce ? 0 : 0.5, ease: EASE }}
          >
            {VIDEOS.map((v) => (
              <div key={v.src} style={{ flex: "0 0 100%", width: "100%" }}>
                <video
                  src={v.src}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="auto"
                  aria-label={v.label}
                  style={{ display: "block", width: "100%", height: "auto", background: "#000" }}
                />
              </div>
            ))}
          </motion.div>
        </div>

        <Arrow side="right" onClick={() => go(1)} />
      </div>

      {/* Position dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 18 }}>
        {VIDEOS.map((v, n) => (
          <button
            key={v.src}
            onClick={() => setIndex(n)}
            aria-label={`Show ${v.label}`}
            style={{
              width: n === index ? 24 : 8, height: 8, borderRadius: 999, border: "none", cursor: "pointer",
              background: n === index ? "#fff" : "rgba(255,255,255,0.45)",
              transition: "width .3s ease, background .3s ease",
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Arrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-label={side === "left" ? "Previous video" : "Next video"}
      style={{
        flexShrink: 0, width: 46, height: 46,
        margin: side === "left" ? "0 16px 0 0" : "0 0 0 16px",
        borderRadius: "50%", border: "1px solid rgba(255,255,255,0.55)",
        background: "rgba(255,255,255,0.16)", backdropFilter: "blur(6px)",
        color: "#fff", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center",
        fontSize: 20, transition: "background .18s ease",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.3)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.16)"; }}
    >
      <i className={`ph ${side === "left" ? "ph-caret-left" : "ph-caret-right"}`} aria-hidden />
    </button>
  );
}
