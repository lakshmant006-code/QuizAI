"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const DEFAULT_MESSAGES = [
  "Quiz yourself! 🐙",
  "Turn a PDF into a summary!",
  "Keep your streak going!",
  "Test what you learned!",
];

/**
 * Floating octopus mascot — a transparent looping APNG (stitched from frames,
 * 0.2s each) with no background. Sweeps ~50px side to side and pops an
 * encouragement bubble on top. Dismissible.
 */
export function Mascot({
  href = "/quizzes",
  messages = DEFAULT_MESSAGES,
  width = 150,
}: {
  href?: string;
  messages?: string[];
  width?: number;
}) {
  const router = useRouter();
  const [i, setI] = useState(0);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % messages.length), 3600);
    return () => clearInterval(t);
  }, [messages.length]);

  if (hidden) return null;

  return (
    <div
      style={{
        position: "fixed",
        right: 32,
        bottom: 22,
        zIndex: 60,
        pointerEvents: "none",
      }}
    >
      <div className="mascot-group" style={{ position: "relative", display: "inline-block" }}>
        {/* Encouragement bubble pops on top of the octopus */}
        <div
          key={i}
          className="mascot-msg"
          style={{
            position: "absolute",
            bottom: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginBottom: 4,
            whiteSpace: "nowrap",
            pointerEvents: "none",
          }}
        >
          {messages[i]}
        </div>

        {/* Transparent animated octopus (no background) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="mascot-anim"
          src="/octopus.apng"
          alt="QuizAI octopus mascot"
          onClick={() => router.push(href)}
          style={{
            width,
            height: "auto",
            display: "block",
            cursor: "pointer",
            pointerEvents: "auto",
            filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.18))",
          }}
        />

        <button
          onClick={() => setHidden(true)}
          aria-label="Hide mascot"
          style={{
            position: "absolute",
            top: 2,
            right: 2,
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
            pointerEvents: "auto",
          }}
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </div>

      <style>{`
        @keyframes mascot-slide {
          0%   { transform: translateX(-25px); }
          50%  { transform: translateX(25px); }
          100% { transform: translateX(-25px); }
        }
        /* Move the whole group (octopus + bubble) horizontally, no wiggle. */
        .mascot-group{ animation: mascot-slide 3.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce){ .mascot-group{ animation: none; } }

        @keyframes mascot-pop {
          0%   { opacity:0; transform:translateX(-50%) translateY(6px) scale(0.8); }
          60%  { opacity:1; transform:translateX(-50%) translateY(0) scale(1.06); }
          100% { opacity:1; transform:translateX(-50%) translateY(0) scale(1); }
        }
        .mascot-msg{
          background:#fff; color:var(--gray-1); font:var(--text-label); font-size:12.5px;
          padding:7px 12px; border-radius:14px 14px 14px 3px;
          box-shadow:var(--shadow-raised); border:1px solid var(--hairline);
          animation: mascot-pop .45s cubic-bezier(.34,1.56,.64,1) both;
        }
      `}</style>
    </div>
  );
}
