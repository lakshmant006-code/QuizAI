"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_MESSAGES = [
  "Ready for a quiz? 🐙",
  "Turn a PDF into a summary!",
  "Keep your study streak going!",
  "Let's test what you learned!",
];

/**
 * Floating octopus mascot. Autoplays (muted) and sways side to side, shows
 * rotating encouragement, and links to quizzes/summaries. Dismissible.
 */
export function Mascot({
  href = "/quizzes",
  messages = DEFAULT_MESSAGES,
  size = 78,
}: {
  href?: string;
  messages?: string[];
  size?: number;
}) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % messages.length), 3800);
    return () => clearInterval(t);
  }, [messages.length]);

  if (hidden) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 18,
        bottom: 18,
        zIndex: 60,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      <div key={i} className="mascot-bubble">{messages[i]}</div>

      <div style={{ position: "relative", pointerEvents: "auto" }}>
        <button
          onClick={() => router.push(href)}
          title="Take a quiz"
          aria-label="QuizAI mascot — take a quiz"
          style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "block" }}
        >
          {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
          <video
            className="mascot-video"
            src="/octopus.mp4"
            autoPlay
            loop
            muted
            playsInline
            width={size}
            height={size}
            style={{
              width: size,
              height: size,
              borderRadius: "50%",
              objectFit: "cover",
              background: "#fff",
              border: "2px solid var(--asu-gold)",
              boxShadow: "var(--shadow-raised)",
              display: "block",
            }}
          />
        </button>
        <button
          onClick={() => setHidden(true)}
          aria-label="Hide mascot"
          style={{
            position: "absolute",
            top: -6,
            right: -6,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "var(--gray-1)",
            color: "#fff",
            border: "2px solid #fff",
            cursor: "pointer",
            fontSize: 11,
            lineHeight: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      <style>{`
        @keyframes mascot-sway {
          0%   { transform: translateX(-7px) rotate(-5deg); }
          50%  { transform: translateX(7px)  rotate(5deg); }
          100% { transform: translateX(-7px) rotate(-5deg); }
        }
        .mascot-video{ animation: mascot-sway 3s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce){ .mascot-video{ animation: none; } }

        @keyframes mascot-pop { from{ opacity:0; transform:translateY(6px);} to{ opacity:1; transform:none; } }
        .mascot-bubble{
          pointer-events:auto; max-width:210px; background:#fff; color:var(--gray-1);
          border:1px solid var(--hairline); box-shadow:var(--shadow-raised);
          border-radius:14px 14px 4px 14px; padding:9px 13px;
          font:var(--text-small); font-weight:600; animation: mascot-pop .4s ease;
        }
        @media (max-width:640px){
          .mascot-bubble{ max-width:150px; font-size:12px; }
        }
      `}</style>
    </div>
  );
}
