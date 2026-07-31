"use client";

import React from "react";

/* ---------------- Logo ---------------- */
export function Logo({ size = 20 }: { size?: number }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        fontWeight: 700,
        fontSize: size,
        letterSpacing: "-0.02em",
        color: "var(--asu-maroon)",
      }}
    >
      <span
        aria-hidden
        style={{
          width: size * 1.35,
          height: size * 1.35,
          borderRadius: 8,
          background: "var(--asu-maroon)",
          color: "#fff",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: size * 0.8,
        }}
      >
        Q
      </span>
      QuizAI
    </span>
  );
}

/* ---------------- Button ---------------- */
type ButtonProps = {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md";
  loading?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const pad = size === "sm" ? "8px 16px" : "11px 20px";
  const fs = size === "sm" ? "var(--fs-sm)" : "var(--fs-base)";
  const base: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    width: "100%",
    padding: pad,
    fontFamily: "var(--font-sans)",
    fontWeight: 700,
    fontSize: fs,
    letterSpacing: "-0.01em",
    borderRadius: "var(--radius-md)",
    border: "1px solid transparent",
    cursor: disabled || loading ? "not-allowed" : "pointer",
    opacity: disabled || loading ? 0.6 : 1,
    transition: "background .2s var(--ease-standard), transform .1s",
  };
  const variants: Record<string, React.CSSProperties> = {
    primary: { background: "var(--asu-maroon)", color: "#fff", boxShadow: "var(--shadow-button)" },
    secondary: { background: "#fff", color: "var(--gray-1)", border: "1px solid var(--gray-5)" },
    ghost: { background: "transparent", color: "var(--gray-2)" },
    danger: { background: "var(--danger)", color: "#fff" },
  };
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      style={{ ...base, ...variants[variant], ...style }}
    >
      {loading && <span className="qa-spin" aria-hidden>◠</span>}
      {children}
    </button>
  );
}

/* ---------------- Card ---------------- */
export function Card({
  children,
  style,
  ...rest
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...rest}
      style={{
        background: "var(--white)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--radius-lg)",
        boxShadow: "var(--shadow-card)",
        padding: 22,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ---------------- StatTile ---------------- */
export function StatTile({
  label,
  value,
  hint,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: string;
}) {
  return (
    <Card style={{ padding: 18 }}>
      <div style={{ font: "var(--text-small)", color: "var(--text-muted)" }}>{label}</div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 700,
          letterSpacing: "-0.02em",
          color: accent ?? "var(--gray-1)",
          margin: "6px 0 2px",
        }}
      >
        {value}
      </div>
      {hint && <div style={{ font: "var(--text-small)", color: "var(--text-muted)" }}>{hint}</div>}
    </Card>
  );
}

/* ---------------- Badge ---------------- */
export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "gold" | "success" | "danger";
}) {
  const tones: Record<string, React.CSSProperties> = {
    neutral: { background: "var(--surface-chip)", color: "var(--gray-2)" },
    gold: { background: "var(--surface-gold-tint)", color: "var(--asu-maroon)" },
    success: { background: "var(--success-bg)", color: "var(--success)" },
    danger: { background: "var(--danger-bg)", color: "var(--danger)" },
  };
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: "var(--radius-pill)",
        font: "var(--text-label)",
        fontSize: 12,
        ...tones[tone],
      }}
    >
      {children}
    </span>
  );
}

/* ---------------- Avatar ---------------- */
export function Avatar({ initials, size = 38 }: { initials: string; size?: number }) {
  return (
    <span
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--surface-maroon-tint)",
        color: "var(--asu-maroon)",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontWeight: 700,
        fontSize: size * 0.38,
        flexShrink: 0,
      }}
    >
      {initials}
    </span>
  );
}

/* ---------------- Spinner ---------------- */
export function Spinner({ label }: { label?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--gray-3)" }}>
      <span
        className="qa-spin"
        style={{
          width: 16,
          height: 16,
          border: "2px solid var(--gray-5)",
          borderTopColor: "var(--asu-maroon)",
          borderRadius: "50%",
        }}
        aria-hidden
      />
      {label}
    </span>
  );
}

/* ---------------- Input ---------------- */
export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(function Input({ style, ...rest }, ref) {
  return (
    <input
      ref={ref}
      {...rest}
      style={{
        width: "100%",
        padding: "11px 14px",
        fontSize: "var(--fs-base)",
        fontFamily: "var(--font-sans)",
        color: "var(--gray-1)",
        background: "#fff",
        border: "1px solid var(--gray-5)",
        borderRadius: "var(--radius-md)",
        outline: "none",
        ...style,
      }}
    />
  );
});
