"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui";

const NAV = [
  { href: "/dashboard", label: "Home", icon: "ph ph-house" },
  { href: "/summaries", label: "Summaries", icon: "ph ph-file-text" },
  { href: "/quizzes", label: "Quizzes", icon: "ph ph-question" },
  { href: "/tasks", label: "Tasks", icon: "ph ph-check-circle" },
  { href: "/profile", label: "Profile", icon: "ph ph-user" },
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
    <div className="qa-root">
      <div className="qa-shell">
        <aside className="qa-side">
          <div className="qa-brand">
            <span style={{ display: "inline-flex", alignItems: "center", gap: 8, fontWeight: 700, fontSize: 20, letterSpacing: "-0.02em", color: "var(--asu-maroon)" }}>
              <span aria-hidden style={{ width: 28, height: 28, borderRadius: 8, background: "var(--surface-maroon-tint)", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 15 }}><i className="ph ph-brain" /></span>
              QuizAI
            </span>
          </div>

          <Link href="/dashboard?upload=1" className="qa-new">
            <i className="ph ph-plus" /> <span className="qa-new-label">New upload</span>
          </Link>

          <nav className="qa-nav">
            {NAV.map((item) => {
              const active = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className={`qa-link${active ? " qa-link-active" : ""}`}>
                  <i className={item.icon} style={{ width: 16, textAlign: "center" }} aria-hidden />
                  <span className="qa-link-label">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="qa-foot">
            <div className="qa-user">
              <Avatar initials={initials} size={34} />
              <div style={{ minWidth: 0 }}>
                <div style={{ font: "var(--text-label)", color: "var(--gray-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{name}</div>
                <div style={{ font: "var(--text-small)", color: "var(--text-muted)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</div>
              </div>
            </div>
            <button onClick={signOut} className="qa-signout" title="Sign out">
              <i className="ph ph-sign-out" />
              <span className="qa-signout-label">Sign out</span>
            </button>
          </div>
        </aside>

        <main className="qa-main">
          <div className="qa-main-inner">{children}</div>
        </main>
      </div>

      <style>{`
        .qa-root{ min-height:100vh; background:var(--surface-app); padding:16px; }
        .qa-shell{
          display:flex; background:#fff; border-radius:var(--radius-xl); overflow:hidden;
          box-shadow:var(--shadow-elevated); min-height:calc(100vh - 32px);
          max-width:1600px; margin:0 auto;
        }
        .qa-side{
          width:230px; flex-shrink:0; border-right:1px solid var(--hairline);
          padding:16px; display:flex; flex-direction:column; gap:4px;
        }
        .qa-brand{ padding:6px 8px 14px; }
        .qa-new{
          display:flex; align-items:center; justify-content:center; gap:8px;
          padding:10px 12px; background:var(--asu-maroon); color:#fff;
          border-radius:var(--radius-md); font:var(--text-label); margin-bottom:8px;
          box-shadow:var(--shadow-button); white-space:nowrap;
        }
        .qa-nav{ display:flex; flex-direction:column; gap:4px; }
        .qa-link{
          display:flex; align-items:center; gap:12px; padding:9px 12px;
          border-radius:var(--radius-sm); font:var(--text-body); color:var(--gray-2);
          white-space:nowrap;
        }
        .qa-link-active{ font-weight:700; color:var(--asu-maroon); background:var(--surface-chip); }
        .qa-foot{ margin-top:auto; border-top:1px solid var(--hairline); padding-top:12px; }
        .qa-user{ display:flex; align-items:center; gap:10px; padding:4px 8px; }
        .qa-signout{
          width:100%; margin-top:8px; padding:8px 12px; background:transparent;
          border:1px solid var(--gray-5); border-radius:var(--radius-sm);
          color:var(--gray-2); font:var(--text-label);
          display:flex; align-items:center; justify-content:center; gap:8px;
        }
        .qa-main{ flex:1; min-width:0; padding:32px; background:var(--surface-panel); overflow:auto; }
        .qa-main-inner{ max-width:1280px; margin:0 auto; width:100%; }

        /* Tablet */
        @media (max-width:1024px){
          .qa-side{ width:200px; }
          .qa-main{ padding:24px; }
        }

        /* Mobile: sidebar becomes a horizontal top bar */
        @media (max-width:760px){
          .qa-root{ padding:0; }
          .qa-shell{ flex-direction:column; border-radius:0; min-height:100vh; box-shadow:none; }
          .qa-side{
            width:100%; flex-direction:row; align-items:center; gap:8px;
            overflow-x:auto; border-right:none; border-bottom:1px solid var(--hairline);
            padding:10px 12px; position:sticky; top:0; background:rgba(255,255,255,0.96);
            backdrop-filter:blur(8px); z-index:20;
          }
          .qa-brand{ padding:0 4px 0 0; flex-shrink:0; }
          .qa-new{ margin-bottom:0; padding:9px 12px; flex-shrink:0; }
          .qa-new-label{ display:none; }
          .qa-nav{ flex-direction:row; gap:4px; flex-shrink:0; }
          .qa-link{ padding:8px 12px; }
          .qa-foot{ margin-top:0; margin-left:auto; border-top:none; padding-top:0; flex-shrink:0; display:flex; align-items:center; gap:8px; }
          .qa-user{ display:none; }
          .qa-signout{ width:auto; margin-top:0; padding:8px 10px; }
          .qa-signout-label{ display:none; }
          .qa-main{ padding:16px; }
        }
        @media (max-width:400px){
          .qa-link-label{ display:none; }   /* icons only on very small screens */
          .qa-main{ padding:12px; }
        }
      `}</style>
    </div>
  );
}
