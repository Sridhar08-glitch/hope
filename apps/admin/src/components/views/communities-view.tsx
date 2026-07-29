"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Edit, Trash2, Eye, Users, Globe, Lock, ChevronLeft, ChevronRight, X } from "lucide-react";
import { BRAND, Spinner, Pagination } from "@holora/ui";
import type { ApiClient } from "@holora/api-client";

/* ── Types ──────────────────────────────────────── */

interface Community {
  id: string;
  name: string;
  description?: string;
  community_type?: string;
  member_count?: number;
  active_members_count?: number;
  is_active: boolean;
  created_at?: string;
  profile_photo?: string;
  created_by?: { display_name?: string };
}

interface ViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
  onSelectCommunity?: (id: string) => void;
}

/* ── Animations ─────────────────────────────────── */

const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.35, ease } }),
};

/* ── Modal ──────────────────────────────────────── */

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="rounded-xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden"
        style={{ backgroundColor: BRAND.surface, border: `1px solid rgba(126,34,206,0.1)` }}
      >
        <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: `1px solid rgba(126,34,206,0.08)` }}>
          <h3 className="text-[14px] font-semibold" style={{ color: BRAND.textMain }}>{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-white/5 transition" aria-label="Close"><X size={16} style={{ color: BRAND.textMuted }} /></button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </motion.div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────── */

export default function CommunitiesView({ api, showToast, onSelectCommunity }: ViewProps) {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [editItem, setEditItem] = useState<Community | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", is_active: true });
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const load = useCallback(async (url: string | null = null) => {
    setLoading(true);
    try {
      const res = url ? await api.get<any>(url) : await api.get<any>("/admin/communities/");
      setCommunities(res?.results || (Array.isArray(res) ? res : []));
      setNextUrl(res?.next || null);
      setPrevUrl(res?.previous || null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to load communities", "error");
    } finally {
      setLoading(false);
    }
  }, [api, showToast]);

  useEffect(() => { load(); }, [load]);

  async function handleUpdate() {
    if (!editItem) return;
    try {
      await api.put(`/admin/communities/${editItem.id}/`, editForm);
      showToast("Community updated", "success");
      setEditItem(null);
      load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Update failed", "error");
    }
  }

  async function handleDelete(id: string) {
    try {
      await api.del(`/admin/communities/${id}/`);
      showToast("Community deleted", "success");
      setConfirmDel(null);
      load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible">
        <h1 className="text-xl font-semibold" style={{ color: BRAND.textMain }}>Communities</h1>
        <p className="text-[12px] mt-0.5" style={{ color: BRAND.textDim }}>Manage community groups, members, and settings</p>
      </motion.div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : communities.length === 0 ? (
        <div className="text-center py-12 rounded-xl" style={{ backgroundColor: BRAND.surface }}>
          <Globe size={28} className="mx-auto mb-2" style={{ color: BRAND.textDim }} />
          <p className="text-[13px]" style={{ color: BRAND.textDim }}>No communities yet</p>
        </div>
      ) : (
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {communities.map((c, i) => (
            <motion.div
              key={c.id}
              custom={i + 2}
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              className="rounded-xl p-4 transition-all hover:border-white/10 group"
              style={{ backgroundColor: BRAND.surface, border: `1px solid rgba(126,34,206,0.08)` }}
            >
              <div className="flex items-start gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-[14px] font-bold"
                  style={{
                    backgroundColor: c.profile_photo ? undefined : `${BRAND.primary}15`,
                    color: BRAND.accent,
                    backgroundImage: c.profile_photo ? `url(${c.profile_photo})` : undefined,
                    backgroundSize: "cover",
                  }}
                >
                  {!c.profile_photo && (c.name?.[0] || "C")}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: BRAND.textMain }}>{c.name}</p>
                  <p className="text-[11px] mt-0.5 line-clamp-2" style={{ color: BRAND.textDim }}>
                    {c.description?.slice(0, 80) || "No description"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-3">
                <span className="text-[10px] flex items-center gap-1" style={{ color: BRAND.textMuted }}>
                  <Users size={11} /> {c.member_count ?? 0} members
                </span>
                <span className="text-[10px] flex items-center gap-1" style={{ color: BRAND.textMuted }}>
                  {c.community_type === "private" ? <Lock size={11} /> : <Globe size={11} />}
                  {c.community_type || "public"}
                </span>
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded ml-auto"
                  style={{
                    color: c.is_active ? BRAND.success : BRAND.error,
                    backgroundColor: c.is_active ? `${BRAND.success}10` : `${BRAND.error}10`,
                  }}
                >
                  {c.is_active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="flex items-center gap-1.5 pt-2" style={{ borderTop: `1px solid rgba(126,34,206,0.06)` }}>
                <button
                  onClick={() => onSelectCommunity?.(c.id)}
                  className="flex-1 py-1.5 rounded-md text-[11px] font-medium text-center transition hover:bg-white/5"
                  style={{ color: BRAND.textMuted }}
                >
                  Manage
                </button>
                <button
                  onClick={() => { setEditItem(c); setEditForm({ name: c.name, description: c.description || "", is_active: c.is_active }); }}
                  className="p-1.5 rounded-md hover:bg-white/5 transition"
                  aria-label={`Edit ${c.name}`}
                >
                  <Edit size={13} style={{ color: BRAND.textMuted }} />
                </button>
                <button
                  onClick={() => setConfirmDel(c.id)}
                  className="p-1.5 rounded-md hover:bg-red-500/5 transition"
                  aria-label={`Delete ${c.name}`}
                >
                  <Trash2 size={13} style={{ color: BRAND.error }} />
                </button>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {(nextUrl || prevUrl) && (
        <div className="flex items-center justify-end gap-1 mt-2">
          <button onClick={() => load(prevUrl)} disabled={!prevUrl} className="p-1.5 rounded-md transition disabled:opacity-30 hover:bg-white/5"><ChevronLeft size={14} style={{ color: BRAND.textMuted }} /></button>
          <button onClick={() => load(nextUrl)} disabled={!nextUrl} className="p-1.5 rounded-md transition disabled:opacity-30 hover:bg-white/5"><ChevronRight size={14} style={{ color: BRAND.textMuted }} /></button>
        </div>
      )}

      {/* Edit Modal */}
      {editItem && (
        <Modal title={`Edit: ${editItem.name}`} onClose={() => setEditItem(null)}>
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: BRAND.textDim }}>Name</label>
              <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={{ backgroundColor: BRAND.input, color: BRAND.textMain }} />
            </div>
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: BRAND.textDim }}>Description</label>
              <textarea value={editForm.description} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none resize-none" style={{ backgroundColor: BRAND.input, color: BRAND.textMain }} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="comm_active" checked={editForm.is_active} onChange={e => setEditForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-purple-500" />
              <label htmlFor="comm_active" className="text-[12px]" style={{ color: BRAND.textMuted }}>Active</label>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setEditItem(null)} className="px-3 py-1.5 rounded-lg text-[12px]" style={{ color: BRAND.textMuted }}>Cancel</button>
              <button onClick={handleUpdate} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold" style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}>Save</button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirm */}
      {confirmDel && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl p-5 w-full max-w-xs" style={{ backgroundColor: BRAND.surface, border: `1px solid rgba(126,34,206,0.1)` }}>
            <p className="text-[13px] mb-4" style={{ color: BRAND.textMain }}>Delete this community permanently?</p>
            <div className="flex gap-2 justify-end">
              <button onClick={() => setConfirmDel(null)} className="px-3 py-1.5 rounded-lg text-[12px]" style={{ color: BRAND.textMuted }}>Cancel</button>
              <button onClick={() => handleDelete(confirmDel)} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold" style={{ backgroundColor: BRAND.error, color: "#fff" }}>Delete</button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
