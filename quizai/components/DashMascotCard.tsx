"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";

const MESSAGES = [
  "Take a quiz to boost your score!",
  "Knock out a study task today!",
  "Turn a PDF into a quick summary!",
  "Keep your streak going! 🐙",
];

const CONFETTI = ["🎉", "✨", "🎊", "⭐", "💫", "🐙"];

interface Particle {
  id: string;
  emoji: string;
  x: number;
  y: number;
  r: number;
  d: number;
}

/**
 * The octopus mascot living inside a dashboard card. It types study reminders,
 * and when a quiz finishes generating it announces "Quiz generated!" and bursts
 * confetti (motion.dev). The cue comes from UploadCard via a window event +
 * sessionStorage flag (so it survives a router.refresh).
 */
export function DashMascotCard() {
  const router = useRouter();
  const [msgIdx, setMsgIdx] = useState(0);
  const [text, setText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);

  // Typewriter — paused while celebrating so the announcement stays put.
  useEffect(() => {
    if (celebrating) return;
    const full = MESSAGES[msgIdx];
    let t: ReturnType<typeof setTimeout>;
    if (!deleting && text.length < full.length) {
      t = setTimeout(() => setText(full.slice(0, text.length + 1)), 45);
    } else if (!deleting && text.length === full.length) {
      t = setTimeout(() => setDeleting(true), 1600);
    } else if (deleting && text.length > 0) {
      t = setTimeout(() => setText(full.slice(0, text.length - 1)), 22);
    } else {
      t = setTimeout(() => {
        setDeleting(false);
        setMsgIdx((v) => (v + 1) % MESSAGES.length);
      }, 250);
    }
    return () => clearTimeout(t);
  }, [text, deleting, msgIdx, celebrating]);

  // Celebration trigger: live event + a sessionStorage flag left by UploadCard.
  useEffect(() => {
    let reset: ReturnType<typeof setTimeout>;

    const celebrate = () => {
      setParticles(
        Array.from({ length: 18 }, (_, i) => ({
          id: `${i}-${Date.now()}`,
          emoji: CONFETTI[i % CONFETTI.length],
          x: (Math.random() * 2 - 1) * 170,
          y: -40 - Math.random() * 150,
          r: (Math.random() * 2 - 1) * 240,
          d: 0.9 + Math.random() * 0.7,
        })),
      );
      setCelebrating(true);
      clearTimeout(reset);
      reset = setTimeout(() => {
        setCelebrating(false);
        setParticles([]);
        setText("");
        setDeleting(false);
      }, 4200);
    };

    const onEvent = () => celebrate();
    window.addEventListener("quizai:quiz-ready", onEvent);

    // Fired during a prior render / just before refresh?
    try {
      const ts = Number(sessionStorage.getItem("quizai:justGenerated") || 0);
      if (ts && Date.now() - ts < 15000) {
        sessionStorage.removeItem("quizai:justGenerated");
        celebrate();
      }
    } catch {
      /* no-op */
    }

    return () => {
      window.removeEventListener("quizai:quiz-ready", onEvent);
      clearTimeout(reset);
    };
  }, []);

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
        minHeight: 360,
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

      {/* Confetti burst */}
      {particles.map((p) => (
        <motion.span
          key={p.id}
          initial={{ opacity: 1, x: 0, y: 0, scale: 0.5, rotate: 0 }}
          animate={{ opacity: 0, x: p.x, y: p.y, scale: 1.2, rotate: p.r }}
          transition={{ duration: p.d, ease: "easeOut" }}
          style={{
            position: "absolute",
            top: "42%",
            left: "50%",
            zIndex: 2,
            fontSize: 22,
            pointerEvents: "none",
          }}
        >
          {p.emoji}
        </motion.span>
      ))}

      {/* Octopus + bubble */}
      <div className="dash-group" style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 14, marginBottom: 20 }}>
        <motion.div
          className={`dash-bubble${celebrating ? " celebrate" : ""}`}
          aria-live="polite"
          animate={celebrating ? { scale: [1, 1.22, 1] } : { scale: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          {celebrating ? (
            "Quiz generated! 🎉"
          ) : (
            <>
              {text}
              <span className="dash-caret">▋</span>
            </>
          )}
        </motion.div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <motion.img
          className="dash-octo"
          src="/octopus.apng"
          alt="QuizAI octopus mascot"
          onClick={() => router.push("/quizzes")}
          animate={celebrating ? { rotate: [0, -6, 6, -4, 4, 0], y: [0, -10, 0] } : {}}
          transition={{ duration: 0.7, ease: "easeInOut" }}
          style={{
            width: 320,
            maxWidth: "100%",
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
        .dash-bubble.celebrate{ background: var(--asu-gold, #FFC627); color: var(--gray-1, #191919); font-weight: 700; }
        .dash-bubble::after{
          content: "";
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 7px solid transparent;
          border-top-color: var(--asu-maroon);
        }
        .dash-bubble.celebrate::after{ border-top-color: var(--asu-gold, #FFC627); }
        .dash-caret{ margin-left: 1px; animation: dash-blink 1s steps(1) infinite; }
        @keyframes dash-blink{ 50%{ opacity: 0; } }
      `}</style>
    </div>
  );
}
