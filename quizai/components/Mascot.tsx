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
 * Floating octopus mascot — transparent (no bubble around it), autoplays and
 * sweeps ~50px side to side, with an encouragement bubble that pops on top of
 * the video. Dismissible.
 */
export function Mascot({
  href = "/quizzes",
  messages = DEFAULT_MESSAGES,
  size = 92,
}: {
  href?: string;
  messages?: string[];
  size?: number;
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
        right: 40,
        bottom: 22,
        zIndex: 60,
        width: size,
        height: size,
        pointerEvents: "none",
      }}
    >
      {/* Message bubble pops on top of the video */}
      <div
        key={i}
        className="mascot-msg"
        style={{
          position: "absolute",
          bottom: size - 8,
          left: "50%",
          transform: "translateX(-50%)",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        {messages[i]}
      </div>

      {/* Bare video — transparent, no circle/border, sweeps side to side */}
      <button
        onClick={() => router.push(href)}
        title="Take a quiz"
        aria-label="QuizAI mascot — take a quiz"
        style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "block", pointerEvents: "auto" }}
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
          style={{ width: size, height: size, objectFit: "contain", background: "transparent", display: "block", filter: "drop-shadow(0 6px 10px rgba(0,0,0,0.18))" }}
        />
      </button>

      <button
        onClick={() => setHidden(true)}
        aria-label="Hide mascot"
        style={{
          position: "absolute",
          top: -4,
          right: -4,
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

      <style>{`
        @keyframes mascot-sweep {
          0%   { transform: translateX(-25px) rotate(-3deg); }
          50%  { transform: translateX(25px)  rotate(3deg); }
          100% { transform: translateX(-25px) rotate(-3deg); }
        }
        .mascot-video{ animation: mascot-sweep 3.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce){ .mascot-video{ animation: none; } }

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
