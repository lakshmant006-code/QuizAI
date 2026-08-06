"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const MESSAGES = [
  "Take a quiz to boost your score!",
  "Knock out a study task today!",
  "Turn a PDF into a quick summary!",
  "Keep your streak going! 🐙",
];

/**
 * The octopus mascot living inside a dashboard card, with a typewriter speech
 * bubble that cycles through study reminders (quizzes + tasks).
 */
export function DashMascotCard() {
  const router = useRouter();
  const [msgIdx, setMsgIdx] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const full = MESSAGES[msgIdx];
    let t: ReturnType<typeof setTimeout>;
    if (!deleting && text.length < full.length) {
      t = setTimeout(() => setText(full.slice(0, text.length + 1)), 45);
    } else if (!deleting && text.length === full.length) {
      t = setTimeout(() => setDeleting(true), 1600); // hold the full line
    } else if (deleting && text.length > 0) {
      t = setTimeout(() => setText(full.slice(0, text.length - 1)), 22);
    } else {
      t = setTimeout(() => {
        setDeleting(false);
        setMsgIdx((v) => (v + 1) % MESSAGES.length);
      }, 250);
    }
    return () => clearTimeout(t);
  }, [text, deleting, msgIdx]);

  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "flex-end",
        gap: 14,
        height: "100%",
        minHeight: 220,
        overflow: "hidden",
      }}
    >
      {/* Underwater scene background (waves at the bottom) */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/octopus-card.svg"
        alt=""
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center bottom",
          pointerEvents: "none",
        }}
      />

      {/* Octopus + bubble move together, gliding across the waves */}
      <div className="dash-group" style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 34 }}>
        <div className="dash-bubble" aria-live="polite">
          {text}
          <span className="dash-caret">▋</span>
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="dash-octo"
          src="/octopus.apng"
          alt="QuizAI octopus mascot"
          onClick={() => router.push("/quizzes")}
          style={{
            width: 160,
            height: "auto",
            display: "block",
            cursor: "pointer",
            filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.15))",
          }}
        />
      </div>

      <style>{`
        .dash-bubble{
          position: relative;
          background: var(--asu-maroon);
          color: #fff;
          font: var(--text-label);
          font-size: 13px;
          line-height: 1.35;
          padding: 9px 14px;
          border-radius: 14px;
          box-shadow: var(--shadow-raised);
          max-width: 240px;
          min-height: 19px;
          text-align: center;
        }
        .dash-bubble::after{
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 7px solid transparent;
          border-top-color: var(--asu-maroon);
        }
        .dash-caret{ margin-left: 1px; animation: dash-blink 1s steps(1) infinite; }
        @keyframes dash-blink{ 50%{ opacity: 0; } }

        /* Octopus + bubble glide together on the x-axis (no wiggle). */
        @keyframes dash-swim{
          0%   { transform: translateX(-18px); }
          50%  { transform: translateX(18px); }
          100% { transform: translateX(-18px); }
        }
        .dash-group{ animation: dash-swim 3.6s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce){ .dash-group{ animation: none; } }
      `}</style>
    </div>
  );
}
