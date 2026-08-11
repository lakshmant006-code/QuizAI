"use client";

import { useState } from "react";

type TabKey = "upload" | "generate" | "practice" | "track";

const TABS: { key: TabKey; icon: string; label: string; title: string; desc: string }[] = [
  { key: "upload", icon: "ph-file-arrow-up", label: "Upload", title: "Drop in the material", desc: "A syllabus, a lecture PDF, or a photo of your notes." },
  { key: "generate", icon: "ph-magic-wand", label: "Generate", title: "Generate a quiz", desc: "Pick length and difficulty; questions come back with page citations." },
  { key: "practice", icon: "ph-check-circle", label: "Practice", title: "Practice and review", desc: "Answer, check the source, and send missed items to flashcards." },
  { key: "track", icon: "ph-chart-bar", label: "Track", title: "Track what is sticking", desc: "Topic-level scores across attempts, so revision has a target." },
];

/**
 * The maroon "study cycle" band's interactive tabs. Switching a tab swaps the
 * panel header and a small faux QuizAI mock, so the landing shows the flow
 * without needing real screenshots.
 */
export function LandingCanvasTabs() {
  const [tab, setTab] = useState<TabKey>("upload");
  const active = TABS.find((t) => t.key === tab)!;

  return (
    <>
      {/* Tab buttons */}
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 34 }}>
        {TABS.map((t) => {
          const on = t.key === tab;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 16px",
                borderRadius: 9, border: "1px solid rgba(255,255,255,0.4)",
                background: on ? "rgba(255,255,255,0.26)" : "rgba(255,255,255,0.14)",
                color: "#fff", font: "inherit", fontSize: 13.5, cursor: "pointer",
                transition: "background .18s ease",
              }}
            >
              <i className={`ph ${t.icon}`} aria-hidden style={{ fontSize: 14 }} />
              {t.label}
              {on && <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--asu-gold)" }} />}
            </button>
          );
        })}
      </div>

      {/* Panel */}
      <div style={{ marginTop: 34, background: "#fff", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 14, overflow: "hidden", boxShadow: "0 30px 70px rgba(0,0,0,0.18)", textAlign: "left" }}>
        <div style={{ padding: "24px 24px 20px", borderBottom: "1px solid rgba(0,0,0,0.07)", background: "var(--surface-panel)" }}>
          <div style={{ fontSize: 19, fontWeight: 700, color: "var(--gray-1)" }}>{active.title}</div>
          <div style={{ marginTop: 6, fontSize: 14, color: "var(--gray-2)" }}>{active.desc}</div>
        </div>
        <div style={{ padding: 24, background: "var(--surface-app)", minHeight: 300 }}>
          <Mock tab={tab} />
        </div>
      </div>
    </>
  );
}

/* Small faux QuizAI UI per tab — pure markup, no images. */
function Mock({ tab }: { tab: TabKey }) {
  if (tab === "upload") {
    return (
      <div style={{ maxWidth: 460, margin: "0 auto", display: "grid", gap: 12 }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "34px 16px", border: "1.5px dashed var(--hairline-strong)", borderRadius: "var(--radius-lg)", background: "#fff", color: "var(--gray-2)" }}>
          <i className="ph ph-file-arrow-up" aria-hidden style={{ fontSize: 28, color: "var(--asu-maroon)" }} />
          <span style={{ font: "var(--text-body)" }}>Drop a PDF or click to choose</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", border: "1px solid var(--hairline)", borderRadius: 10, background: "#fff" }}>
          <i className="ph ph-file-pdf" aria-hidden style={{ color: "var(--asu-maroon)", fontSize: 16 }} />
          <span style={{ fontSize: 13, color: "var(--gray-1)", flex: 1 }}>BIO 181 — Lecture 7.pdf</span>
          <span style={{ fontSize: 11, color: "var(--gray-3)" }}>24 pages</span>
        </div>
      </div>
    );
  }
  if (tab === "generate") {
    return (
      <div style={{ maxWidth: 460, margin: "0 auto", display: "grid", gap: 16 }}>
        <Field label="Difficulty">
          {["Easy", "Medium", "Hard"].map((d, i) => (
            <Pill key={d} on={i === 1}>{d}</Pill>
          ))}
        </Field>
        <Field label="Questions">
          {["5", "10", "15", "20"].map((n, i) => (
            <Pill key={n} on={i === 1}>{n}</Pill>
          ))}
        </Field>
        <button style={{ marginTop: 4, padding: "12px 18px", borderRadius: 10, border: "none", background: "var(--asu-maroon)", color: "#fff", font: "var(--text-label)", cursor: "default", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <i className="ph ph-magic-wand" aria-hidden /> Generate quiz
        </button>
      </div>
    );
  }
  if (tab === "practice") {
    return (
      <div style={{ maxWidth: 460, margin: "0 auto", background: "#fff", border: "1px solid var(--hairline)", borderRadius: 12, padding: 18 }}>
        <div style={{ fontSize: 10.5, letterSpacing: "0.04em", textTransform: "uppercase", color: "var(--gray-3)" }}>Question 3 of 20</div>
        <div style={{ marginTop: 8, fontSize: 15, lineHeight: 1.4, color: "var(--gray-1)" }}>Which organelle produces most of the cell&apos;s ATP?</div>
        <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
          {[
            { t: "Ribosome", on: false },
            { t: "Mitochondrion", on: true },
            { t: "Golgi apparatus", on: false },
          ].map((o) => (
            <div key={o.t} style={{ padding: "9px 12px", borderRadius: 8, fontSize: 13, border: `1px solid ${o.on ? "var(--asu-maroon)" : "var(--gray-5)"}`, background: o.on ? "var(--surface-maroon-tint)" : "#fff", color: o.on ? "var(--asu-maroon)" : "var(--gray-2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              {o.t}{o.on && <i className="ph ph-check-circle" aria-hidden />}
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: "var(--gray-3)" }}>Source: p. 12 of your upload</div>
      </div>
    );
  }
  // track
  const bars = [
    { t: "Cell structure", v: 92 },
    { t: "Metabolism", v: 74 },
    { t: "Genetics", v: 58 },
    { t: "Ecology", v: 83 },
  ];
  return (
    <div style={{ maxWidth: 460, margin: "0 auto", background: "#fff", border: "1px solid var(--hairline)", borderRadius: 12, padding: 18, display: "grid", gap: 14 }}>
      {bars.map((b) => (
        <div key={b.t}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, color: "var(--gray-2)", marginBottom: 6 }}>
            <span>{b.t}</span><span style={{ fontWeight: 700, color: "var(--gray-1)" }}>{b.v}%</span>
          </div>
          <div style={{ height: 7, borderRadius: 4, background: "var(--gray-6)", overflow: "hidden" }}>
            <div style={{ width: `${b.v}%`, height: "100%", background: "var(--asu-maroon)" }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ font: "var(--text-label)", color: "var(--gray-2)", marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>{children}</div>
    </div>
  );
}

function Pill({ on, children }: { on: boolean; children: React.ReactNode }) {
  return (
    <span style={{ padding: "7px 14px", borderRadius: "var(--radius-sm)", border: `1px solid ${on ? "var(--asu-maroon)" : "var(--gray-5)"}`, background: on ? "var(--surface-maroon-tint)" : "#fff", color: on ? "var(--asu-maroon)" : "var(--gray-2)", font: "var(--text-label)" }}>
      {children}
    </span>
  );
}
