import { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { X, Search, Check } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { cn } from "@/app/components/ui/utils";
import {
  LUXIA_DIALOG_CLOSE_ON_DARK_CLASS,
  STRUCTURED_MODAL_DARK_CHROME_STYLE,
} from "@/app/features/shared/structuredModalChrome";
import { LX } from "@/app/features/active-data-tables/tokens";

export function LuxiaDialog({ open, onClose, title, children, footer }: {
  open: boolean; onClose: () => void;
  title: string; children: React.ReactNode; footer: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return ReactDOM.createPortal(
    <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.40)" }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="flex w-full max-w-md max-h-[85vh] flex-col overflow-hidden"
        style={{ background: "white", borderRadius: 16, boxShadow: "0 12px 32px rgba(15,23,42,0.14)" }}>
        <div
          className="flex flex-shrink-0 items-center justify-between px-7 pt-5 pb-4"
          style={STRUCTURED_MODAL_DARK_CHROME_STYLE}
        >
          <h2 className="luxia-type-title-modal text-[var(--luxia-text-inverse)]">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-[8px] outline-none transition-opacity",
              LUXIA_DIALOG_CLOSE_ON_DARK_CLASS,
            )}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical px-7 pb-2">{children}</div>
        <div className="flex flex-shrink-0 items-center justify-end gap-3 px-7 py-5" style={{ borderTop: `1px solid ${LX.border}` }}>
          {footer}
        </div>
      </div>
    </div>,
    document.body
  );
}

const DEMO_USERS = [
  { id: "u1", name: "Alice Martin", email: "alice@luxia.ai" },
  { id: "u2", name: "Ben Torres", email: "ben@luxia.ai" },
  { id: "u3", name: "Clara Huang", email: "clara@luxia.ai" },
  { id: "u4", name: "David Kim", email: "david@luxia.ai" },
];

export function ShareDialog({ open, chatLabel, sharedUsers, onClose, onShare }: {
  open: boolean; chatLabel: string; sharedUsers: string[];
  onClose: () => void; onShare: (ids: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);
  const [done, setDone] = useState(false);
  useEffect(() => { if (open) { setSelected([...sharedUsers]); setQuery(""); setDone(false); } }, [open]);
  const filtered = DEMO_USERS.filter(u =>
    !sharedUsers.includes(u.id) &&
    (u.name.toLowerCase().includes(query.toLowerCase()) || u.email.toLowerCase().includes(query.toLowerCase()))
  );
  function toggle(id: string) {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  }
  if (done) return (
    <LuxiaDialog open={open} onClose={onClose} title={`Share ${chatLabel}`}
      footer={<Button type="button" variant="primary" onClick={onClose}>Done</Button>}>
      <div className="py-6 text-center">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3" style={{ background: "rgba(142,99,235,0.1)" }}>
          <Check size={22} style={{ color: LX.secondary }} />
        </div>
        <p className="luxia-type-body-small-strong" style={{ color: LX.primary }}>Chat shared successfully</p>
      </div>
    </LuxiaDialog>
  );
  return (
    <LuxiaDialog open={open} onClose={onClose} title={`Share ${chatLabel}`}
      footer={<>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="button" variant="primary" onClick={() => { onShare(selected); setDone(true); }} disabled={selected.length === 0}>
          Share
        </Button>
      </>}>
      <div className="flex items-center gap-2 px-3 h-[38px] rounded-[10px] mb-3" style={{ border: `1px solid ${LX.border}` }}>
        <Search size={13} style={{ color: LX.textMuted }} />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search users…"
          className="flex-1 bg-transparent luxia-type-body-dense outline-none" style={{ color: LX.primary }} />
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-3">
          {selected.map(id => {
            const u = DEMO_USERS.find(x => x.id === id);
            if (!u) return null;
            return (
              <span key={id} className="flex items-center gap-1 px-2.5 py-1 rounded-full luxia-type-metadata"
                style={{ background: "rgba(142,99,235,0.08)", color: LX.secondary }}>
                {u.name}
                <button onClick={() => toggle(id)} className="outline-none ml-0.5"><X size={10} /></button>
              </span>
            );
          })}
        </div>
      )}
      <div className="space-y-0.5 max-h-48 overflow-y-auto luxia-scrollbar luxia-scrollbar-light luxia-scrollbar-vertical">
        {filtered.map(u => (
          <button key={u.id} onClick={() => toggle(u.id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-left transition-colors outline-none"
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = LX.borderSubtle; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}>
            <div className="w-7 h-7 rounded-full flex items-center justify-center luxia-type-caption flex-shrink-0"
              style={{ background: "rgba(142,99,235,0.12)", color: LX.secondary }}>{u.name[0]}</div>
            <div className="flex-1 min-w-0">
              <p className="luxia-type-body-dense-strong truncate" style={{ color: LX.primary }}>{u.name}</p>
              <p className="luxia-type-caption truncate" style={{ color: LX.textMuted }}>{u.email}</p>
            </div>
            {selected.includes(u.id) && <Check size={13} style={{ color: LX.secondary }} />}
          </button>
        ))}
        {filtered.length === 0 && <p className="luxia-type-body-dense py-4 text-center" style={{ color: LX.textMuted }}>No users found</p>}
      </div>
    </LuxiaDialog>
  );
}

export function ShareListDialog({ open, sharedUsers, onClose }: {
  open: boolean; sharedUsers: string[]; onClose: () => void;
}) {
  const users = DEMO_USERS.filter(u => sharedUsers.includes(u.id));
  return (
    <LuxiaDialog open={open} onClose={onClose} title="Who Has Access"
      footer={<Button type="button" variant="primary" onClick={onClose}>Close</Button>}>
      {users.length === 0
        ? <p className="py-6 luxia-type-body-small text-center" style={{ color: LX.textMuted }}>No users currently have access to this chat.</p>
        : <div className="space-y-1 py-1">
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3 px-3 py-2.5 rounded-[8px]"
                style={{ border: `1px solid ${LX.borderSubtle}` }}>
                <div className="w-7 h-7 rounded-full flex items-center justify-center luxia-type-caption flex-shrink-0"
                  style={{ background: "rgba(142,99,235,0.12)", color: LX.secondary }}>{u.name[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="luxia-type-body-dense-strong" style={{ color: LX.primary }}>{u.name}</p>
                  <p className="luxia-type-caption" style={{ color: LX.textMuted }}>{u.email}</p>
                </div>
              </div>
            ))}
          </div>
      }
    </LuxiaDialog>
  );
}

export function GenerateReportDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [scope, setScope] = useState("entire");
  const [content, setContent] = useState("transcript_charts");
  const [instructions, setInstructions] = useState("");
  return (
    <LuxiaDialog open={open} onClose={onClose} title="Generate Report"
      footer={<>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="button" variant="primary" onClick={onClose}>Generate and open in editor</Button>
      </>}>
      <div className="space-y-5 py-1">
        <div>
          <p className="luxia-type-overline-form mb-2" style={{ color: LX.textMuted }}>Include</p>
          {[{ id: "entire", label: "Entire conversation" }, { id: "selected", label: "Selected interactions" }].map(opt => (
            <label key={opt.id} className="flex items-center gap-2.5 py-1.5 cursor-pointer">
              <input type="radio" name="scope" value={opt.id} checked={scope === opt.id} onChange={() => setScope(opt.id)}
                className="accent-purple-600" />
              <span className="luxia-type-body-small" style={{ color: LX.primary }}>{opt.label}</span>
            </label>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${LX.borderSubtle}`, paddingTop: 16 }}>
          <p className="luxia-type-overline-form mb-2" style={{ color: LX.textMuted }}>Report content</p>
          {[
            { id: "transcript_charts", label: "Transcript with charts" },
            { id: "summary", label: "Summary only" },
            { id: "transcript_summary", label: "Transcript and summary" },
          ].map(opt => (
            <label key={opt.id} className="flex items-center gap-2.5 py-1.5 cursor-pointer">
              <input type="radio" name="content" value={opt.id} checked={content === opt.id} onChange={() => setContent(opt.id)}
                className="accent-purple-600" />
              <span className="luxia-type-body-small" style={{ color: LX.primary }}>{opt.label}</span>
            </label>
          ))}
        </div>
        <div style={{ borderTop: `1px solid ${LX.borderSubtle}`, paddingTop: 16 }}>
          <p className="luxia-type-overline-form mb-2" style={{ color: LX.textMuted }}>Custom instructions (optional)</p>
          <textarea value={instructions} onChange={(e) => setInstructions(e.target.value)}
            placeholder="Add any specific instructions for this report…"
            rows={3}
            className="w-full px-3 py-2.5 rounded-[10px] luxia-type-body-dense resize-none outline-none"
            style={{ border: `1px solid ${LX.border}`, color: LX.primary }} />
        </div>
      </div>
    </LuxiaDialog>
  );
}

export function DeleteChatDialog({ open, onClose, onDelete, entityName, entityType = "Chat" }: {
  open: boolean; onClose: () => void; onDelete: () => void;
  entityName: string;
  entityType?: string;
}) {
  return (
    <LuxiaDialog open={open} onClose={onClose} title={`Delete ${entityName}?`}
      footer={<>
        <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
        <Button type="button" variant="destructive" onClick={() => { onDelete(); onClose(); }}>
          {`Delete ${entityType}`}
        </Button>
      </>}>
      <p className="py-4 luxia-type-body-small" style={{ color: LX.textSecondary }}>
        This will permanently remove {entityName} and all its messages. This action cannot be undone.
      </p>
    </LuxiaDialog>
  );
}
