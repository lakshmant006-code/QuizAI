"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Kind = "document" | "quiz" | "summary";

export function DeleteButton({
  kind,
  id,
  storagePath,
  label,
}: {
  kind: Kind;
  id: string;
  storagePath?: string | null;
  label?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onDelete(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const what =
      kind === "document" ? "this document (and its quiz + summary)" : `this ${kind}`;
    if (!window.confirm(`Delete ${what}? This can't be undone.`)) return;

    setBusy(true);
    const supabase = createClient();
    if (kind === "document") {
      // Remove dependent quizzes (FK is set-null), then the doc (cascades summaries).
      await supabase.from("quizzes").delete().eq("document_id", id);
      await supabase.from("documents").delete().eq("id", id);
      if (storagePath) await supabase.storage.from("pdfs").remove([storagePath]);
    } else if (kind === "quiz") {
      await supabase.from("quizzes").delete().eq("id", id);
    } else {
      await supabase.from("summaries").delete().eq("id", id);
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <button
      onClick={onDelete}
      disabled={busy}
      title="Delete"
      aria-label={`Delete ${kind}`}
      className="qa-del"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        background: "transparent",
        border: label ? "1px solid var(--gray-5)" : "none",
        borderRadius: "var(--radius-sm)",
        padding: label ? "6px 12px" : 6,
        cursor: busy ? "not-allowed" : "pointer",
        color: "var(--gray-4)",
        font: "var(--text-label)",
        opacity: busy ? 0.5 : 1,
      }}
    >
      <i className="fa-regular fa-trash-can" />
      {label && <span>{label}</span>}
      <style>{`.qa-del:hover{ color: var(--danger) !important; }`}</style>
    </button>
  );
}
