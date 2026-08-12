"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DeleteButton } from "@/components/DeleteButton";
import type { Document, Folder } from "@/lib/types";

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: "numeric", day: "numeric", year: "numeric" });
}

function statusStyle(status: Document["status"]): React.CSSProperties {
  const ready = status === "ready";
  const failed = status === "failed";
  return {
    font: "var(--text-label)", fontSize: 11, padding: "3px 9px", borderRadius: 999,
    background: ready ? "var(--success-bg)" : failed ? "var(--danger-bg)" : "var(--surface-gold-tint)",
    color: ready ? "var(--success)" : failed ? "var(--danger)" : "var(--asu-maroon)",
  };
}

const tile: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: 12, padding: 16,
  background: "var(--bg-surface)", border: "1px solid var(--border-subtle)",
  borderRadius: 16, transition: "transform .15s ease, box-shadow .15s ease, border-color .15s ease",
};

export function FilesGrid({
  documents,
  folders,
  userId,
}: {
  documents: Document[];
  folders: Folder[];
  userId: string;
}) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null); // tile currently hovered as a drop target
  const [openId, setOpenId] = useState<string | null>(null); // opened folder
  const [busy, setBusy] = useState(false);

  const loose = documents.filter((d) => !d.folder_id);
  const byFolder = (fid: string) => documents.filter((d) => d.folder_id === fid);
  const openFolder = folders.find((f) => f.id === openId) ?? null;

  async function run(fn: () => Promise<void>) {
    setBusy(true);
    try {
      await fn();
    } finally {
      setBusy(false);
      setDragId(null);
      setOverId(null);
      router.refresh();
    }
  }

  // Drop file A onto file B → new folder with both (iOS style).
  function makeFolderWith(aId: string, bId: string) {
    if (aId === bId) return;
    const name = (typeof window !== "undefined" && window.prompt("Name your folder", "New Folder")) || "New Folder";
    run(async () => {
      const { data: folder, error } = await supabase
        .from("folders")
        .insert({ user_id: userId, name })
        .select()
        .single();
      if (error || !folder) return;
      await supabase.from("documents").update({ folder_id: folder.id }).in("id", [aId, bId]);
    });
  }

  function moveInto(fileId: string, folderId: string) {
    run(async () => {
      await supabase.from("documents").update({ folder_id: folderId }).eq("id", fileId);
    });
  }

  // Move a file out; if that empties the folder, remove the folder too (iOS style).
  function moveOut(fileId: string, folderId: string) {
    run(async () => {
      await supabase.from("documents").update({ folder_id: null }).eq("id", fileId);
      const remaining = byFolder(folderId).filter((d) => d.id !== fileId).length;
      if (remaining === 0) {
        await supabase.from("folders").delete().eq("id", folderId);
        setOpenId(null);
      }
    });
  }

  function renameFolder(folder: Folder) {
    const name = window.prompt("Rename folder", folder.name);
    if (!name || name === folder.name) return;
    run(async () => {
      await supabase.from("folders").update({ name }).eq("id", folder.id);
    });
  }

  function deleteFolder(folderId: string) {
    if (!window.confirm("Delete this folder? The files inside move back out (they're not deleted).")) return;
    run(async () => {
      await supabase.from("documents").update({ folder_id: null }).eq("folder_id", folderId);
      await supabase.from("folders").delete().eq("id", folderId);
      setOpenId(null);
    });
  }

  /* ---------- draggable file tile ---------- */
  function FileTile({ doc, inFolder }: { doc: Document; inFolder?: string }) {
    const isOver = overId === doc.id && dragId !== doc.id;
    return (
      <div
        draggable={!busy}
        onDragStart={(e) => { setDragId(doc.id); e.dataTransfer.effectAllowed = "move"; }}
        onDragEnd={() => { setDragId(null); setOverId(null); }}
        onDragOver={(e) => { if (dragId && dragId !== doc.id) { e.preventDefault(); setOverId(doc.id); } }}
        onDragLeave={() => setOverId((cur) => (cur === doc.id ? null : cur))}
        onDrop={(e) => {
          e.preventDefault();
          if (dragId && dragId !== doc.id) makeFolderWith(dragId, doc.id);
        }}
        style={{
          ...tile,
          cursor: busy ? "default" : "grab",
          borderColor: isOver ? "var(--asu-maroon)" : "var(--border-subtle)",
          boxShadow: isOver ? "0 0 0 3px var(--surface-maroon-tint)" : "none",
          opacity: dragId === doc.id ? 0.5 : 1,
        }}
        title="Drag onto another file to make a folder"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--surface-maroon-tint)", color: "var(--asu-maroon)", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <i className="ph ph-file-pdf" />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--gray-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{doc.title}</div>
            <div style={{ font: "var(--text-small)", color: "var(--gray-3)" }}>{fmtDate(doc.created_at)}{doc.page_count ? ` · ${doc.page_count} pp` : ""}</div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <span style={statusStyle(doc.status)}>{doc.status}</span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {inFolder && (
              <button onClick={() => moveOut(doc.id, inFolder)} disabled={busy} title="Move out of folder"
                style={{ border: "none", background: "transparent", color: "var(--gray-4)", cursor: "pointer", padding: 6 }}>
                <i className="ph ph-arrow-square-out" />
              </button>
            )}
            <DeleteButton kind="document" id={doc.id} storagePath={doc.storage_path} />
          </div>
        </div>
      </div>
    );
  }

  /* ---------- folder tile (drop target) ---------- */
  function FolderTile({ folder }: { folder: Folder }) {
    const items = byFolder(folder.id);
    const isOver = overId === folder.id && dragId !== null;
    return (
      <button
        onClick={() => setOpenId(folder.id)}
        onDragOver={(e) => { if (dragId) { e.preventDefault(); setOverId(folder.id); } }}
        onDragLeave={() => setOverId((cur) => (cur === folder.id ? null : cur))}
        onDrop={(e) => { e.preventDefault(); if (dragId) moveInto(dragId, folder.id); }}
        style={{
          ...tile, textAlign: "left", cursor: "pointer",
          borderColor: isOver ? "var(--asu-maroon)" : "var(--border-subtle)",
          boxShadow: isOver ? "0 0 0 3px var(--surface-maroon-tint)" : "none",
          background: isOver ? "var(--surface-maroon-tint)" : "var(--bg-surface)",
        }}
        title="Open folder — or drop a file here to add it"
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {/* mini 2x2 preview like an iOS folder */}
          <span style={{ width: 40, height: 40, borderRadius: 12, background: "var(--surface-panel)", border: "1px solid var(--border-subtle)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, padding: 5, flexShrink: 0 }}>
            {[0, 1, 2, 3].map((i) => (
              <span key={i} style={{ borderRadius: 3, background: i < items.length ? "var(--asu-maroon)" : "var(--gray-6)", opacity: i < items.length ? 0.85 : 1 }} />
            ))}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.01em", color: "var(--gray-1)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              <i className="ph ph-folder-simple" style={{ marginRight: 6, color: "var(--asu-maroon)" }} />{folder.name}
            </div>
            <div style={{ font: "var(--text-small)", color: "var(--gray-3)" }}>{items.length} {items.length === 1 ? "file" : "files"}</div>
          </div>
        </div>
      </button>
    );
  }

  return (
    <div style={{ gridColumn: "1 / -1" }}>
      <div className="dash-decks" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))", gap: 14, opacity: busy ? 0.6 : 1, pointerEvents: busy ? "none" : "auto", transition: "opacity .15s ease" }}>
        {folders.map((f) => <FolderTile key={f.id} folder={f} />)}
        {loose.map((d) => <FileTile key={d.id} doc={d} />)}
      </div>

      <p style={{ font: "var(--text-small)", color: "var(--text-muted)", margin: "10px 0 0" }}>
        Tip: drag one file onto another to make a folder. Drop a file on a folder to add it.
      </p>

      {/* Folder contents popup */}
      {openFolder && (
        <div role="dialog" aria-modal="true" onClick={() => setOpenId(null)} style={overlay}>
          <div className="qa-fade-up" onClick={(e) => e.stopPropagation()} style={panel}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 16 }}>
              <h3 style={{ font: "var(--text-h3)", color: "var(--gray-1)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                <i className="ph ph-folder-simple" style={{ marginRight: 8, color: "var(--asu-maroon)" }} />{openFolder.name}
              </h3>
              <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                <button onClick={() => renameFolder(openFolder)} disabled={busy} style={miniBtn} title="Rename"><i className="ph ph-pencil-simple" /></button>
                <button onClick={() => deleteFolder(openFolder.id)} disabled={busy} style={miniBtn} title="Delete folder"><i className="ph ph-trash" /></button>
                <button onClick={() => setOpenId(null)} aria-label="Close" style={miniBtn}><i className="ph ph-x" /></button>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 12 }}>
              {byFolder(openFolder.id).map((d) => <FileTile key={d.id} doc={d} inFolder={openFolder.id} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const miniBtn: React.CSSProperties = {
  border: "1px solid var(--border-subtle)", background: "var(--bg-surface)", color: "var(--gray-2)",
  borderRadius: "var(--radius-sm)", padding: "6px 9px", cursor: "pointer", fontSize: 15, lineHeight: 1,
};
const overlay: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 100, background: "rgba(20,10,14,0.5)",
  backdropFilter: "blur(3px)", display: "grid", placeItems: "center", padding: 20,
};
const panel: React.CSSProperties = {
  width: "100%", maxWidth: 640, maxHeight: "85vh", overflowY: "auto",
  background: "var(--white)", border: "1px solid var(--hairline)", borderRadius: 18,
  padding: 22, boxShadow: "var(--shadow-elevated)",
};
