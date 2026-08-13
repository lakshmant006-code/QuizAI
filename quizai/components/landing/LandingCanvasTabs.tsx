"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

const VIDEOS = [
  { src: "/PDF%20Upload.mp4", label: "Uploading a PDF" },
  { src: "/quiz%20generation.mp4", label: "Generating a quiz" },
  { src: "/task%20tracking.mp4", label: "Tracking your tasks" },
];

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The study-cycle band's video showcase: the raw uploaded clips, no frame or
 * captions, with side arrows that slide between them (Motion transition).
 */
export function LandingCanvasTabs() {
  const reduce = useReducedMotion();
  const [[index, dir], setState] = useState<[number, number]>([0, 0]);
  const go = (d: number) => setState(([cur]) => [(cur + d + VIDEOS.length) % VIDEOS.length, d]);
  const jump = (n: number) => setState(([cur]) => [n, n >= cur ? 1 : -1]);
  const current = VIDEOS[index];
  const shift = reduce ? 0 : 64;

  return (
    <div style={{ marginTop: 34, width: "100%", maxWidth: 940, marginLeft: "auto", marginRight: "auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Arrow side="left" onClick={() => go(-1)} />

        <div style={{ position: "relative", flex: 1, minWidth: 0, borderRadius: 16, overflow: "hidden", boxShadow: "0 30px 70px rgba(0,0,0,0.28)" }}>
          <AnimatePresence mode="popLayout" custom={dir} initial={false}>
            <motion.div
              key={current.src}
              custom={dir}
              variants={{
                enter: (d: number) => ({ x: d >= 0 ? shift : -shift, opacity: 0 }),
                center: { x: 0, opacity: 1 },
                exit: (d: number) => ({ x: d >= 0 ? -shift : shift, opacity: 0 }),
              }}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: reduce ? 0.2 : 0.45, ease: EASE }}
              style={{ width: "100%" }}
            >
              <video
                src={current.src}
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                aria-label={current.label}
                style={{ display: "block", width: "100%", height: "auto", background: "#000" }}
              />
            </motion.div>
          </AnimatePresence>
        </div>

        <Arrow side="right" onClick={() => go(1)} />
      </div>

      {/* Position dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 18 }}>
        {VIDEOS.map((v, n) => (
          <button
            key={v.src}
            onClick={() => jump(n)}
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
