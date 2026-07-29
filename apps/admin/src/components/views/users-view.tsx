"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Search, Plus, Edit, Trash2, Filter, X, Eye, ChevronLeft, ChevronRight, Download, RefreshCw, MoreHorizontal } from "lucide-react";
import { BRAND, Spinner, Button, Input } from "@holora/ui";
import type { ApiClient } from "@holora/api-client";

/* ── Hooks ──────────────────────────────────────── */

function useDebouncedValue(value: string, delay = 400): string {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ── Types ──────────────────────────────────────── */

interface User {
  id: number;
  user_id: string;
  email: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  full_name?: string;
  display_name?: string;
  role: string;
  tier?: string;
  is_active: boolean;
  total_xp?: number;
  streak_days?: number;
  coin_balance?: number;
  fitness_goal?: string;
  fitness_level?: string;
  date_joined?: string;
  last_login?: string;
  profile_photo_url?: string;
}

interface FilterOptions {
  roles?: { value: string; label: string }[];
  fitness_goals?: { value: string; label: string }[];
  fitness_levels?: { value: string; label: string }[];
}

interface UsersViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
  onSelectUser?: (id: string) => void;
}

/* ── Animations ─────────────────────────────────── */

const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];
const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.04, duration: 0.35, ease } }),
};

/* ── Helpers ────────────────────────────────────── */

function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getUserName(u: User): string {
  return u.display_name || u.full_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username || u.email.split("@")[0];
}

function RoleBadge({ role }: { role: string }) {
  const colors: Record<string, string> = {
    super_admin: BRAND.error,
    admin: BRAND.warning,
    trainer: BRAND.primary,
    user: BRAND.info,
  };
  const color = colors[role] || BRAND.textDim;
  return (
    <span
      className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
      style={{ color, backgroundColor: `${color}12` }}
    >
      {role.replace(/_/g, " ")}
    </span>
  );
}

function StatusDot({ active }: { active: boolean }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full inline-block"
      style={{ backgroundColor: active ? BRAND.success : BRAND.error }}
    />
  );
}

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
          <button onClick={onClose} className="p-1 rounded-md hover:bg-white/5 transition" aria-label="Close">
            <X size={16} style={{ color: BRAND.textMuted }} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </motion.div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────── */

export default function UsersView({ api, showToast, onSelectUser }: UsersViewProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({});
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ first_name: "", last_name: "", email: "", role: "user", password: "" });
  const [editUser, setEditUser] = useState<User | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  /* ── Data Loading ─────────────────────────────── */

  const load = useCallback(async (url: string | null = null) => {
    setLoading(true);
    try {
      const params: Record<string, string> = { ...filters };
      if (debouncedSearch) params.search = debouncedSearch;
      const res = url ? await api.get<any>(url) : await api.get<any>("/admin/users/", params);
      setUsers(res?.results || []);
      setNextUrl(res?.next_cursor || res?.next || null);
      setPrevUrl(res?.prev_cursor || res?.previous || null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }, [api, debouncedSearch, filters, showToast]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    api.get<FilterOptions>("/admin/users/filter-options/").then(r => setFilterOptions(r || {})).catch(() => {});
  }, [api]);

  /* ── Actions ──────────────────────────────────── */

  function toggleSelect(id: string) {
    setSelectedIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  function toggleSelectAll() {
    if (selectedIds.length === users.length) setSelectedIds([]);
    else setSelectedIds(users.map(u => String(u.id)));
  }

  async function handleDelete(id: string) {
    try {
      await api.del(`/admin/users-detail/${id}/`);
      showToast("User deleted", "success");
      setConfirmDel(null);
      load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  }

  async function handleBulkDelete() {
    if (!selectedIds.length) return;
    try {
      await api.post("/admin/users/bulk-delete/", { user_ids: selectedIds });
      showToast(`Deleted ${selectedIds.length} users`, "success");
      setSelectedIds([]);
      load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Bulk delete failed", "error");
    }
  }

  async function handleCreate() {
    setActionLoading(true);
    try {
      await api.post("/admin/users/create/", createForm);
      showToast("User created", "success");
      setShowCreate(false);
      setCreateForm({ first_name: "", last_name: "", email: "", role: "user", password: "" });
      load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Create failed", "error");
    } finally {
      setActionLoading(false);
    }
  }

  async function handleResetPassword(id: string) {
    try {
      await api.post(`/admin/users/${id}/reset-password/`, {});
      showToast("Password reset email sent", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Reset failed", "error");
    }
  }

  /* ── Render ───────────────────────────────────── */

  return (
    <div className="space-y-4">
      {/* Header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: BRAND.textMain }}>Users</h1>
          <p className="text-[12px] mt-0.5" style={{ color: BRAND.textDim }}>Manage platform users, roles, and access</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.open("/admin/users/export/", "_blank")}
            className="px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition hover:bg-white/5"
            style={{ color: BRAND.textMuted, border: `1px solid rgba(126,34,206,0.12)` }}
            aria-label="Export users"
          >
            <Download size={13} /> Export
          </button>
          <button
            onClick={() => setShowCreate(true)}
            className="px-3 py-1.5 rounded-lg text-[12px] font-semibold flex items-center gap-1.5 transition hover:opacity-90"
            style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}
          >
            <Plus size={13} /> New User
          </button>
        </div>
      </motion.div>

      {/* Search + Filters */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textDim }} />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-[12px] outline-none border"
            style={{ backgroundColor: BRAND.input, color: BRAND.textMain, borderColor: "transparent" }}
            onFocus={e => { e.currentTarget.style.borderColor = `rgba(126,34,206,0.3)`; }}
            onBlur={e => { e.currentTarget.style.borderColor = "transparent"; }}
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-3 py-2 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition hover:bg-white/5"
          style={{ color: showFilters ? BRAND.accent : BRAND.textMuted, border: `1px solid rgba(126,34,206,0.12)` }}
        >
          <Filter size={13} /> Filters
        </button>
      </motion.div>

      {/* Filter Panel */}
      {showFilters && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex flex-wrap gap-2 p-3 rounded-lg" style={{ backgroundColor: `${BRAND.surface}` }}>
          {filterOptions.roles && (
            <select
              value={filters.role || ""}
              onChange={e => setFilters(f => ({ ...f, role: e.target.value || "" }))}
              className="px-2.5 py-1.5 rounded-md text-[11px] outline-none"
              style={{ backgroundColor: BRAND.input, color: BRAND.textMain, border: `1px solid rgba(126,34,206,0.1)` }}
            >
              <option value="">All Roles</option>
              {filterOptions.roles.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          )}
          {filterOptions.fitness_goals && (
            <select
              value={filters.fitness_goal || ""}
              onChange={e => setFilters(f => ({ ...f, fitness_goal: e.target.value || "" }))}
              className="px-2.5 py-1.5 rounded-md text-[11px] outline-none"
              style={{ backgroundColor: BRAND.input, color: BRAND.textMain, border: `1px solid rgba(126,34,206,0.1)` }}
            >
              <option value="">All Goals</option>
              {filterOptions.fitness_goals.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
            </select>
          )}
          {filterOptions.fitness_levels && (
            <select
              value={filters.fitness_level || ""}
              onChange={e => setFilters(f => ({ ...f, fitness_level: e.target.value || "" }))}
              className="px-2.5 py-1.5 rounded-md text-[11px] outline-none"
              style={{ backgroundColor: BRAND.input, color: BRAND.textMain, border: `1px solid rgba(126,34,206,0.1)` }}
            >
              <option value="">All Levels</option>
              {filterOptions.fitness_levels.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          )}
          <button onClick={() => setFilters({})} className="text-[11px] px-2 py-1 rounded-md hover:bg-white/5 transition" style={{ color: BRAND.textDim }}>
            Clear all
          </button>
        </motion.div>
      )}

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ backgroundColor: `${BRAND.primary}10`, border: `1px solid ${BRAND.primary}20` }}>
          <span className="text-[11px] font-medium" style={{ color: BRAND.accent }}>{selectedIds.length} selected</span>
          <button onClick={handleBulkDelete} className="text-[11px] font-medium px-2 py-1 rounded-md transition hover:bg-red-500/10" style={{ color: BRAND.error }}>Delete</button>
          <button onClick={() => setSelectedIds([])} className="text-[11px] ml-auto" style={{ color: BRAND.textDim }}>Clear</button>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <UsersSkeleton />
      ) : users.length === 0 ? (
        <div className="text-center py-12 rounded-xl" style={{ backgroundColor: BRAND.surface }}>
          <p className="text-[13px]" style={{ color: BRAND.textDim }}>No users found</p>
        </div>
      ) : (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          <div className="overflow-x-auto rounded-xl" style={{ border: `1px solid rgba(126,34,206,0.08)` }}>
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ backgroundColor: BRAND.surface }}>
                  <th className="w-8 px-3 py-2.5">
                    <input type="checkbox" checked={selectedIds.length === users.length && users.length > 0} onChange={toggleSelectAll} className="accent-purple-500 w-3.5 h-3.5" />
                  </th>
                  <th className="text-left px-3 py-2.5 font-medium" style={{ color: BRAND.textDim }}>User</th>
                  <th className="text-left px-3 py-2.5 font-medium" style={{ color: BRAND.textDim }}>Role</th>
                  <th className="text-left px-3 py-2.5 font-medium hidden md:table-cell" style={{ color: BRAND.textDim }}>Status</th>
                  <th className="text-left px-3 py-2.5 font-medium hidden lg:table-cell" style={{ color: BRAND.textDim }}>XP / Streak</th>
                  <th className="text-left px-3 py-2.5 font-medium hidden lg:table-cell" style={{ color: BRAND.textDim }}>Joined</th>
                  <th className="text-right px-3 py-2.5 font-medium" style={{ color: BRAND.textDim }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="transition hover:bg-white/[0.015]"
                    style={{ borderTop: `1px solid rgba(126,34,206,0.05)` }}
                  >
                    <td className="px-3 py-2.5">
                      <input type="checkbox" checked={selectedIds.includes(String(u.id))} onChange={() => toggleSelect(String(u.id))} className="accent-purple-500 w-3.5 h-3.5" />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold shrink-0"
                          style={{
                            backgroundColor: u.profile_photo_url ? undefined : `${BRAND.accent}15`,
                            color: BRAND.accent,
                            backgroundImage: u.profile_photo_url ? `url(${u.profile_photo_url})` : undefined,
                            backgroundSize: "cover",
                          }}
                        >
                          {!u.profile_photo_url && getUserName(u)[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium truncate" style={{ color: BRAND.textMain }}>{getUserName(u)}</p>
                          <p className="text-[10px] truncate" style={{ color: BRAND.textDim }}>{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5"><RoleBadge role={u.role} /></td>
                    <td className="px-3 py-2.5 hidden md:table-cell">
                      <div className="flex items-center gap-1.5">
                        <StatusDot active={u.is_active} />
                        <span className="text-[11px]" style={{ color: u.is_active ? BRAND.success : BRAND.error }}>
                          {u.is_active ? "Active" : "Inactive"}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 hidden lg:table-cell">
                      <span style={{ color: BRAND.textMuted }}>{u.total_xp ?? 0} XP</span>
                      <span className="mx-1" style={{ color: BRAND.textDim }}>/</span>
                      <span style={{ color: BRAND.accent }}>{u.streak_days ?? 0}d</span>
                    </td>
                    <td className="px-3 py-2.5 hidden lg:table-cell" style={{ color: BRAND.textDim }}>
                      {formatDate(u.date_joined)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onSelectUser?.(u.user_id || String(u.id))} title="View details" aria-label={`View ${getUserName(u)}`} className="p-1.5 rounded-md hover:bg-white/5 transition">
                          <Eye size={13} style={{ color: BRAND.textMuted }} />
                        </button>
                        <button onClick={() => setEditUser(u)} title="Edit" aria-label={`Edit ${getUserName(u)}`} className="p-1.5 rounded-md hover:bg-white/5 transition">
                          <Edit size={13} style={{ color: BRAND.textMuted }} />
                        </button>
                        <button onClick={() => setConfirmDel(String(u.id))} title="Delete" aria-label={`Delete ${getUserName(u)}`} className="p-1.5 rounded-md hover:bg-red-500/5 transition">
                          <Trash2 size={13} style={{ color: BRAND.error }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-3">
            <span className="text-[11px]" style={{ color: BRAND.textDim }}>{users.length} users shown</span>
            <div className="flex items-center gap-1">
              <button
                onClick={() => load(prevUrl)}
                disabled={!prevUrl}
                className="p-1.5 rounded-md transition disabled:opacity-30 hover:bg-white/5"
                aria-label="Previous page"
              >
                <ChevronLeft size={14} style={{ color: BRAND.textMuted }} />
              </button>
              <button
                onClick={() => load(nextUrl)}
                disabled={!nextUrl}
                className="p-1.5 rounded-md transition disabled:opacity-30 hover:bg-white/5"
                aria-label="Next page"
              >
                <ChevronRight size={14} style={{ color: BRAND.textMuted }} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Create User Modal ──────────────────── */}
      {showCreate && (
        <Modal title="New User" onClose={() => setShowCreate(false)}>
          <div className="space-y-3">
            {(["first_name", "last_name", "email", "password"] as const).map(k => (
              <div key={k}>
                <label className="block text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: BRAND.textDim }}>
                  {k.replace(/_/g, " ")}
                </label>
                <input
                  type={k === "password" ? "password" : k === "email" ? "email" : "text"}
                  value={createForm[k]}
                  onChange={e => setCreateForm(f => ({ ...f, [k]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-[12px] outline-none border"
                  style={{ backgroundColor: BRAND.input, color: BRAND.textMain, borderColor: "transparent" }}
                />
              </div>
            ))}
            <div>
              <label className="block text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: BRAND.textDim }}>Role</label>
              <select
                value={createForm.role}
                onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                style={{ backgroundColor: BRAND.input, color: BRAND.textMain }}
              >
                <option value="user">User</option>
                <option value="trainer">Trainer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 rounded-lg text-[12px]" style={{ color: BRAND.textMuted }}>Cancel</button>
              <button onClick={handleCreate} disabled={actionLoading} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold" style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}>
                {actionLoading ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit User Modal ────────────────────── */}
      {editUser && (
        <Modal title={`Edit: ${getUserName(editUser)}`} onClose={() => setEditUser(null)}>
          <EditUserForm
            user={editUser}
            api={api}
            showToast={showToast}
            onClose={() => { setEditUser(null); load(); }}
          />
        </Modal>
      )}

      {/* ── Delete Confirm ─────────────────────── */}
      {confirmDel && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}>
          <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="rounded-xl p-5 w-full max-w-xs" style={{ backgroundColor: BRAND.surface, border: `1px solid rgba(126,34,206,0.1)` }}>
            <p className="text-[13px] mb-4" style={{ color: BRAND.textMain }}>Delete this user permanently?</p>
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

/* ── Edit User Form ─────────────────────────────── */

function EditUserForm({ user, api, showToast, onClose }: { user: User; api: ApiClient; showToast: (m: string, t: "success" | "error") => void; onClose: () => void }) {
  const [form, setForm] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email,
    role: user.role,
    is_active: user.is_active,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await api.put(`/admin/users-detail/${user.user_id || user.id}/`, form);
      showToast("User updated", "success");
      onClose();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Update failed", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3">
      {(["first_name", "last_name", "email"] as const).map(k => (
        <div key={k}>
          <label className="block text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: BRAND.textDim }}>
            {k.replace(/_/g, " ")}
          </label>
          <input
            type={k === "email" ? "email" : "text"}
            value={form[k]}
            onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
            className="w-full px-3 py-2 rounded-lg text-[12px] outline-none border"
            style={{ backgroundColor: BRAND.input, color: BRAND.textMain, borderColor: "transparent" }}
          />
        </div>
      ))}
      <div>
        <label className="block text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: BRAND.textDim }}>Role</label>
        <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={{ backgroundColor: BRAND.input, color: BRAND.textMain }}>
          <option value="user">User</option>
          <option value="trainer">Trainer</option>
          <option value="admin">Admin</option>
          <option value="super_admin">Super Admin</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        <input type="checkbox" id="edit_active" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-purple-500" />
        <label htmlFor="edit_active" className="text-[12px]" style={{ color: BRAND.textMuted }}>Active</label>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button onClick={onClose} className="px-3 py-1.5 rounded-lg text-[12px]" style={{ color: BRAND.textMuted }}>Cancel</button>
        <button onClick={save} disabled={saving} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold" style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}>
          {saving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}

/* ── Skeleton ───────────────────────────────────── */

function UsersSkeleton() {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid rgba(126,34,206,0.08)` }}>
      <div className="px-3 py-2.5" style={{ backgroundColor: BRAND.surface }}>
        <div className="h-3 w-48 rounded animate-pulse" style={{ backgroundColor: BRAND.panelLight + "20" }} />
      </div>
      {[1, 2, 3, 4, 5, 6].map(i => (
        <div key={i} className="flex items-center gap-3 px-3 py-3" style={{ borderTop: `1px solid rgba(126,34,206,0.05)` }}>
          <div className="w-7 h-7 rounded-md animate-pulse" style={{ backgroundColor: BRAND.panelLight + "20" }} />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 w-32 rounded animate-pulse" style={{ backgroundColor: BRAND.panelLight + "20" }} />
            <div className="h-2 w-44 rounded animate-pulse" style={{ backgroundColor: BRAND.panelLight + "12" }} />
          </div>
          <div className="h-4 w-12 rounded animate-pulse" style={{ backgroundColor: BRAND.panelLight + "15" }} />
        </div>
      ))}
    </div>
  );
}
