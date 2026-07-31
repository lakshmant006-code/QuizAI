"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Logo, Avatar } from "@/components/ui";

const NAV = [
  { href: "/dashboard", label: "Home", icon: "⌂" },
  { href: "/summaries", label: "Summaries", icon: "≡" },
  { href: "/quizzes", label: "Quizzes", icon: "?" },
  { href: "/tasks", label: "Tasks", icon: "✓" },
  { href: "/profile", label: "Profile", icon: "☺" },
];

export function AppShell({
  children,
  email,
  name,
}: {
  children: React.ReactNode;
  email: string;
  name: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const initials = name.slice(0, 2).toUpperCase();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", background: "var(--surface-app)", padding: 16 }}>
      <div
        className="qa-shell"
        style={{
          display: "flex",
          background: "#fff",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          boxShadow: "var(--shadow-elevated)",
          minHeight: "calc(100vh - 32px)",
        }}
      >
        <aside
          className="qa-side"
          style={{
            width: 220,
            borderRight: "1px solid var(--hairline)",
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            flexShrink: 0,
          }}
        >
          <div style={{ padding: "6px 8px 14px" }}>
            <Logo size={20} />
          </div>

          <Link
            href="/dashboard?upload=1"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              padding: "10px 12px",
              background: "var(--asu-maroon)",
              color: "#fff",
              borderRadius: "var(--radius-md)",
              font: "var(--text-label)",
              marginBottom: 8,
              boxShadow: "var(--shadow-button)",
            }}
          >
            + New upload
          </Link>

          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "9px 12px",
                  borderRadius: "var(--radius-sm)",
                  font: "var(--text-body)",
                  fontWeight: active ? 700 : 400,
                  color: active ? "var(--asu-maroon)" : "var(--gray-2)",
                  background: active ? "var(--surface-chip)" : "transparent",
                }}
              >
                <span aria-hidden style={{ width: 16, textAlign: "center" }}>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}

          <div style={{ marginTop: "auto", borderTop: "1px solid var(--hairline)", paddingTop: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 8px" }}>
              <Avatar initials={initials} size={34} />
              <div style={{ minWidth: 0 }}>
                <div style={{ font: "var(--text-label)", color: "var(--gray-1)" }}>{name}</div>
                <div
                  style={{
                    font: "var(--text-small)",
                    color: "var(--text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {email}
                </div>
              </div>
            </div>
            <button
              onClick={signOut}
              style={{
                width: "100%",
                marginTop: 8,
                padding: "8px 12px",
                background: "transparent",
                border: "1px solid var(--gray-5)",
                borderRadius: "var(--radius-sm)",
                color: "var(--gray-2)",
                font: "var(--text-label)",
              }}
            >
              Sign out
            </button>
          </div>
        </aside>

        <main
          className="qa-main"
          style={{ flex: 1, padding: "32px 32px 40px", background: "var(--surface-panel)", overflow: "auto" }}
        >
          {children}
        </main>
      </div>

      <style>{`
        @media (max-width: 640px){
          .qa-shell{flex-direction:column!important;min-height:0!important}
          .qa-side{width:100%!important;border-right:none!important;border-bottom:1px solid var(--hairline)!important}
          .qa-main{padding:20px 16px 28px!important}
        }
        @media (min-width:641px) and (max-width:1024px){
          .qa-side{width:190px!important}
        }
      `}</style>
    </div>
  );
}
