"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

/** Bento layout primitives ported from the QuizAI design system. */

const TILE: React.CSSProperties = {
  borderRadius: 20,
  padding: 20,
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};

export function Tile({
  fill,
  children,
  style,
  span,
  onClick,
  hover,
}: {
  fill?: "maroon" | "ink" | "tint";
  children: React.ReactNode;
  style?: React.CSSProperties;
  span?: number;
  onClick?: () => void;
  hover?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const bg = fill === "maroon" ? "var(--asu-maroon)" : fill === "ink" ? "#2A1017" : fill === "tint" ? "#F4E9ED" : "#fff";
  return (
    <div
      ref={ref}
      onClick={onClick}
      onMouseEnter={() => hover && gsap.to(ref.current, { y: -3, boxShadow: "0 12px 30px rgba(0,0,0,0.09)", duration: 0.28, ease: "power2.out" })}
      onMouseLeave={() => hover && gsap.to(ref.current, { y: 0, boxShadow: "0 1px 2px rgba(0,0,0,0.04)", duration: 0.32, ease: "power2.out" })}
      style={{
        ...TILE,
        background: bg,
        border: fill ? "1px solid transparent" : "1px solid rgba(0,0,0,0.07)",
        gridColumn: span ? `span ${span}` : undefined,
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export function TileLabel({ children, on }: { children: React.ReactNode; on?: "dark" }) {
  return <div style={{ fontFamily: "var(--font-sans)", fontSize: 13, color: on === "dark" ? "rgba(255,255,255,0.62)" : "var(--gray-3)" }}>{children}</div>;
}

export function BigNum({ children, on, size = 38 }: { children: React.ReactNode; on?: "dark"; size?: number }) {
  return <div style={{ fontFamily: "var(--font-sans)", fontSize: size, fontWeight: 700, letterSpacing: "-0.035em", lineHeight: 1.05, color: on === "dark" ? "#fff" : "var(--gray-1)" }}>{children}</div>;
}

export function TrendPill({ children, on }: { children: React.ReactNode; on?: "dark" }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, alignSelf: "flex-start", background: on === "dark" ? "rgba(255,255,255,0.16)" : "rgba(0,0,0,0.05)", color: on === "dark" ? "#fff" : "var(--gray-2)", fontFamily: "var(--font-sans)", fontSize: 12, fontWeight: 700, padding: "5px 11px", borderRadius: 999 }}>
      <i className="fa-solid fa-arrow-trend-up" style={{ fontSize: 10 }} />
      {children}
    </span>
  );
}

export function MiniBars({ data }: { data: number[] }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      gsap.fromTo(ref.current.querySelectorAll("[data-b] > span"), { scaleY: 0, transformOrigin: "50% 100%" }, { scaleY: 1, duration: 0.7, stagger: 0.05, ease: "power3.out", delay: 0.2 });
    }
  }, []);
  const max = Math.max(...data, 1);
  return (
    <div ref={ref} style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 76 }}>
      {data.map((v, i) => (
        <div data-b key={i} style={{ flex: 1, height: "100%", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          <span style={{ display: "block", height: `${(v / max) * 100}%`, minHeight: 3, background: i === data.length - 1 ? "var(--asu-maroon)" : "rgba(140,29,64,0.22)", borderRadius: 5 }} />
        </div>
      ))}
    </div>
  );
}

export function ListRow({
  icon,
  title,
  meta,
  value,
  href,
  last,
}: {
  icon: string;
  title: string;
  meta: string;
  value?: string;
  href?: string;
  last?: boolean;
}) {
  const inner = (
    <>
      <span style={{ width: 34, height: 34, borderRadius: 11, background: "rgba(0,0,0,0.045)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: "var(--asu-maroon)" }}>
        <i className={icon} style={{ fontSize: 13 }} />
      </span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--gray-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
        <div style={{ font: "var(--text-small)", color: "var(--gray-3)" }}>{meta}</div>
      </div>
      {value && <span style={{ fontFamily: "var(--font-sans)", fontSize: 14, fontWeight: 700, color: "var(--gray-1)", flexShrink: 0 }}>{value}</span>}
    </>
  );
  const style: React.CSSProperties = { display: "flex", alignItems: "center", gap: 13, padding: "13px 0", borderBottom: last ? "none" : "1px solid rgba(0,0,0,0.06)", cursor: href ? "pointer" : "default", color: "inherit" };
  if (href) return <a href={href} style={style}>{inner}</a>;
  return <div style={style}>{inner}</div>;
}

export function BandHead({ children, action, href }: { children: React.ReactNode; action?: string; href?: string }) {
  return (
    <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "baseline", justifyContent: "space-between", marginTop: 6 }}>
      <h2 style={{ fontFamily: "var(--font-sans)", fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--gray-1)", margin: 0 }}>{children}</h2>
      {action && href && <a href={href} style={{ fontFamily: "var(--font-sans)", fontSize: 13, fontWeight: 700, color: "var(--asu-maroon)" }}>{action}</a>}
    </div>
  );
}
