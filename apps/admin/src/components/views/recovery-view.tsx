"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, Plus, Edit, Trash2, RefreshCw, Heart, Moon, Zap, Battery, Activity, Smartphone, ListChecks, BarChart3 } from "lucide-react";
import { BRAND, Spinner } from "@holora/ui";
import type { ApiClient } from "@holora/api-client";
import {
  fadeUp, cardStyle, subtleBorder,
  PageHeader, TabBar, Modal, ConfirmDialog, EmptyState,
  DataTable, TR, TD, StatCard, StatusBadge, SimplePagination,
  PrimaryButton, GhostButton, FormField, inputStyle,
} from "@/components/shared";

interface ViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
}

type Tab = "sessions" | "wellness" | "scores" | "types" | "mobileUsage" | "stats";

const TABS: { key: Tab; label: string; icon: typeof Heart }[] = [
  { key: "sessions", label: "Sessions", icon: Activity },
  { key: "wellness", label: "Wellness", icon: Heart },
  { key: "scores", label: "Scores", icon: Zap },
  { key: "types", label: "Types", icon: ListChecks },
  { key: "mobileUsage", label: "Mobile Usage", icon: Smartphone },
  { key: "stats", label: "Stats", icon: BarChart3 },
];

const TAB_ENDPOINTS: Record<string, string> = {
  sessions: "/admin/recovery/sessions/",
  wellness: "/admin/recovery/wellness/",
  scores: "/admin/recovery/scores/",
  mobileUsage: "/admin/recovery/mobile-usage/",
  types: "/admin/recovery/types/",
};

export default function RecoveryView({ api, showToast }: ViewProps) {
  const [tab, setTab] = useState<Tab>("sessions");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editItem, setEditItem] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [stats, setStats] = useState<any>(null);
  const [filterOptions, setFilterOptions] = useState<Record<string, any[]>>({});
  const [filters, setFilters] = useState<Record<string, string | undefined>>({});

  /* ── Data loading ──────────────────────────────── */

  const load = useCallback(async (url: string | null = null) => {
    setLoading(true);
    try {
      const endpoint = TAB_ENDPOINTS[tab];
      if (!endpoint) { setLoading(false); return; }
      const res = url ? await api.get<any>(url) : await api.get<any>(endpoint);
      setItems(res?.results || []);
      setNextUrl(res?.next || null);
      setPrevUrl(res?.previous || null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [api, tab, showToast]);

  useEffect(() => { load(); setSelectedIds([]); }, [load]);

  useEffect(() => {
    api.get<any>("/admin/recovery/filter-options/").then(r => setFilterOptions(r || {})).catch(() => {});
  }, [api]);

  useEffect(() => {
    if (tab === "stats") api.get<any>("/admin/recovery/stats/").then(setStats).catch(() => {});
  }, [tab, api]);

  /* ── Actions ───────────────────────────────────── */

  function toggleSelect(id: string) {
    setSelectedIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  async function doDelete(id: string) {
    try {
      const endpoint = TAB_ENDPOINTS[tab];
      await api.del(`${endpoint}${id}/`);
      showToast("Deleted", "success");
      setConfirmDel(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  }

  async function saveItem() {
    try {
      const endpoint = TAB_ENDPOINTS[tab];
      if (editItem) {
        await api.put(`${endpoint}${editItem.id}/`, form);
        showToast("Updated", "success");
      } else {
        await api.post(endpoint, form);
        showToast("Created", "success");
      }
      setEditItem(null);
      setShowCreate(false);
      setForm({});
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Save failed", "error");
    }
  }

  async function recalculate(id: string) {
    try {
      await api.post(`/admin/recovery/scores/${id}/recalculate/`);
      showToast("Score recalculated", "success");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Recalculation failed", "error");
    }
  }

  async function bulkTypeAction(action: string) {
    if (!selectedIds.length) return;
    try {
      await api.post("/admin/recovery/types/bulk-action/", { ids: selectedIds, action });
      showToast("Done", "success");
      setSelectedIds([]);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Bulk action failed", "error");
    }
  }

  async function bulkDeleteSessions() {
    if (!selectedIds.length) return;
    try {
      await api.post("/admin/recovery/sessions/bulk-delete/", { ids: selectedIds });
      showToast("Deleted", "success");
      setSelectedIds([]);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Bulk delete failed", "error");
    }
  }

  async function saveMobileUsage() {
    try {
      await api.put(`/admin/recovery/mobile-usage/${editItem.id}/`, form);
      showToast("Updated", "success");
      setEditItem(null);
      setForm({});
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Save failed", "error");
    }
  }

  const closeModal = () => { setShowCreate(false); setEditItem(null); setForm({}); };
  const canCreate = ["sessions", "wellness", "types"].includes(tab);
  const canExport = tab === "sessions";
  const showFilters = ["sessions", "wellness"].includes(tab) && Object.keys(filterOptions).length > 0;

  /* ── Render ────────────────────────────────────── */

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader title="Recovery & Wellness" subtitle="Daily wellness scores, sleep logs, and recovery data.">
        {canExport && (
          <GhostButton onClick={() => {}}>
            <span className="flex items-center gap-1.5"><Download size={12} /> Export</span>
          </GhostButton>
        )}
        {canCreate && (
          <PrimaryButton onClick={() => { setForm({}); setShowCreate(true); }}>
            <span className="flex items-center gap-1.5"><Plus size={12} /> Add</span>
          </PrimaryButton>
        )}
      </PageHeader>

      {/* Tabs */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <TabBar tabs={TABS} active={tab} onChange={setTab} />
      </motion.div>

      {/* Bulk action bars */}
      {tab === "sessions" && selectedIds.length > 0 && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible"
          className="flex items-center gap-3 rounded-xl px-3 py-2"
          style={cardStyle}
        >
          <span className="text-[11px]" style={{ color: BRAND.textDim }}>{selectedIds.length} selected</span>
          <button onClick={bulkDeleteSessions}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition hover:opacity-90"
            style={{ backgroundColor: `${BRAND.error}18`, color: BRAND.error }}
          >
            <Trash2 size={10} /> Bulk Delete
          </button>
        </motion.div>
      )}

      {tab === "types" && selectedIds.length > 0 && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible"
          className="flex items-center gap-3 rounded-xl px-3 py-2"
          style={cardStyle}
        >
          <span className="text-[11px]" style={{ color: BRAND.textDim }}>{selectedIds.length} selected</span>
          <button onClick={() => bulkTypeAction("activate")}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition hover:opacity-90"
            style={{ backgroundColor: `${BRAND.success}18`, color: BRAND.success }}
          >
            Activate
          </button>
          <button onClick={() => bulkTypeAction("deactivate")}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition hover:opacity-90"
            style={{ backgroundColor: `${BRAND.warning}18`, color: BRAND.warning }}
          >
            Deactivate
          </button>
          <button onClick={() => bulkTypeAction("delete")}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition hover:opacity-90"
            style={{ backgroundColor: `${BRAND.error}18`, color: BRAND.error }}
          >
            Delete
          </button>
        </motion.div>
      )}

      {/* Filters */}
      {showFilters && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="flex gap-2 flex-wrap">
          {Object.keys(filterOptions).slice(0, 4).map(k => (
            <select
              key={k}
              value={filters[k] || ""}
              onChange={e => setFilters(f => ({ ...f, [k]: e.target.value || undefined }))}
              className="rounded-lg px-2.5 py-1.5 text-[11px] focus:outline-none"
              style={{ ...inputStyle, border: subtleBorder }}
            >
              <option value="">{k.replace(/_/g, " ")}</option>
              {(filterOptions[k] || []).map((o: any) => (
                <option key={o?.value ?? o} value={o?.value ?? o}>{o?.label ?? o}</option>
              ))}
            </select>
          ))}
          <GhostButton onClick={() => setFilters({})}>Clear</GhostButton>
        </motion.div>
      )}

      {/* ── Stats tab ─────────────────────────────── */}
      {tab === "stats" ? (
        stats ? (
          <div className="space-y-5">
            {/* Overall */}
            {stats.overall && (
              <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Overall</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(stats.overall).map(([k, v], i) => {
                    const colors = [BRAND.error, BRAND.info, BRAND.warning, BRAND.success];
                    return (
                      <motion.div key={k} custom={i + 3} variants={fadeUp} initial="hidden" animate="visible">
                        <StatCard label={k.replace(/_/g, " ")} value={String(v)} color={colors[i % colors.length]} />
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Today */}
            {stats.today && (
              <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Today</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(stats.today).map(([k, v], i) => (
                    <motion.div key={k} custom={i + 5} variants={fadeUp} initial="hidden" animate="visible">
                      <StatCard label={k.replace(/_/g, " ")} value={String(v)} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Recovery Scores */}
            {stats.scores && (
              <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Recovery Scores</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <StatCard label="average recovery score" value={String(stats.scores.average_recovery_score ?? "\u2014")} color={BRAND.accent} />
                  {stats.scores.distribution && Object.entries(stats.scores.distribution).map(([k, v], i) => (
                    <motion.div key={k} custom={i + 7} variants={fadeUp} initial="hidden" animate="visible">
                      <StatCard label={`${k} (distribution)`} value={String(v)} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Wellness Averages */}
            {stats.wellness_averages && (
              <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible">
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Wellness Averages</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(stats.wellness_averages).map(([k, v], i) => (
                    <motion.div key={k} custom={i + 9} variants={fadeUp} initial="hidden" animate="visible">
                      <StatCard label={k.replace(/_/g, " ")} value={String(v)} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Mobile Averages */}
            {stats.mobile_averages && (
              <motion.div custom={10} variants={fadeUp} initial="hidden" animate="visible">
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Mobile Averages</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(stats.mobile_averages).map(([k, v], i) => (
                    <motion.div key={k} custom={i + 11} variants={fadeUp} initial="hidden" animate="visible">
                      <StatCard label={k.replace(/_/g, " ")} value={String(v)} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Weekly Trend table */}
            {stats.weekly_trend?.length > 0 && (
              <motion.div custom={12} variants={fadeUp} initial="hidden" animate="visible">
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Weekly Trend</p>
                <DataTable cols={["Date", "Sessions", "Coins"]}>
                  {stats.weekly_trend.map((t: any, i: number) => (
                    <TR key={i}>
                      <TD>{t.date || "\u2014"}</TD>
                      <TD>{t.sessions ?? "\u2014"}</TD>
                      <TD>{t.coins ?? "\u2014"}</TD>
                    </TR>
                  ))}
                </DataTable>
              </motion.div>
            )}

            {/* Popular Recovery Types table */}
            {stats.popular_recovery_types?.length > 0 && (
              <motion.div custom={13} variants={fadeUp} initial="hidden" animate="visible">
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Popular Recovery Types</p>
                <DataTable cols={["Type", "Sessions"]}>
                  {stats.popular_recovery_types.map((t: any, i: number) => (
                    <TR key={i}>
                      <TD>{t.name || t.recovery_type_name || "\u2014"}</TD>
                      <TD>{t.session_count ?? t.count ?? "\u2014"}</TD>
                    </TR>
                  ))}
                </DataTable>
              </motion.div>
            )}

            {/* Top Users table */}
            {stats.top_users?.length > 0 && (
              <motion.div custom={14} variants={fadeUp} initial="hidden" animate="visible">
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Top Users</p>
                <DataTable cols={["User", "Sessions", "XP"]}>
                  {stats.top_users.map((u: any, i: number) => (
                    <TR key={i}>
                      <TD>{u.user_name || u.username || "\u2014"}</TD>
                      <TD>{u.total_sessions ?? "\u2014"}</TD>
                      <TD>{u.total_xp ?? "\u2014"}</TD>
                    </TR>
                  ))}
                </DataTable>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="flex justify-center py-12"><Spinner /></div>
        )

      /* ── Data tabs ─────────────────────────────── */
      ) : loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={Heart} message={`No ${tab === "mobileUsage" ? "mobile usage" : tab} data found.`} />
      ) : (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
          {/* Sessions table */}
          {tab === "sessions" && (
            <DataTable cols={["", "User", "Type", "Duration", "Date", "Actions"]}>
              {items.map(s => (
                <TR key={s.id}>
                  <TD><input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} /></TD>
                  <TD>{s.user_name || s.user || "\u2014"}</TD>
                  <TD>{s.recovery_type_name || s.recovery_type || "\u2014"}</TD>
                  <TD>{s.duration_minutes ? `${s.duration_minutes}m` : "\u2014"}</TD>
                  <TD>{s.date ? new Date(s.date).toLocaleDateString() : "\u2014"}</TD>
                  <TD>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditItem(s); setForm(s); }} className="p-1 rounded-md hover:bg-white/5 transition" aria-label="Edit">
                        <Edit size={12} style={{ color: BRAND.textMuted }} />
                      </button>
                      <button onClick={() => setConfirmDel(s.id)} className="p-1 rounded-md hover:bg-white/5 transition" aria-label="Delete">
                        <Trash2 size={12} style={{ color: BRAND.error }} />
                      </button>
                    </div>
                  </TD>
                </TR>
              ))}
            </DataTable>
          )}

          {/* Wellness table */}
          {tab === "wellness" && (
            <DataTable cols={["User", "Date", "Sleep (h)", "Stress", "Energy", "Actions"]}>
              {items.map(w => (
                <TR key={w.id}>
                  <TD>{w.user_name || w.user || "\u2014"}</TD>
                  <TD>{w.date ? new Date(w.date).toLocaleDateString() : "\u2014"}</TD>
                  <TD>{w.sleep_hours ?? "\u2014"}</TD>
                  <TD>{w.stress_level ?? "\u2014"}</TD>
                  <TD>{w.energy_level ?? "\u2014"}</TD>
                  <TD>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditItem(w); setForm(w); }} className="p-1 rounded-md hover:bg-white/5 transition" aria-label="Edit">
                        <Edit size={12} style={{ color: BRAND.textMuted }} />
                      </button>
                      <button onClick={() => setConfirmDel(w.id)} className="p-1 rounded-md hover:bg-white/5 transition" aria-label="Delete">
                        <Trash2 size={12} style={{ color: BRAND.error }} />
                      </button>
                    </div>
                  </TD>
                </TR>
              ))}
            </DataTable>
          )}

          {/* Scores table */}
          {tab === "scores" && (
            <DataTable cols={["User", "Date", "Score", "Actions"]}>
              {items.map(s => (
                <TR key={s.id}>
                  <TD>{s.user_name || s.user || "\u2014"}</TD>
                  <TD>{s.date ? new Date(s.date).toLocaleDateString() : "\u2014"}</TD>
                  <TD>
                    <StatusBadge
                      status={String(s.score ?? "\u2014")}
                      color={s.score >= 70 ? BRAND.success : s.score >= 40 ? BRAND.warning : BRAND.error}
                    />
                  </TD>
                  <TD>
                    <button onClick={() => recalculate(s.id)} className="p-1 rounded-md hover:bg-white/5 transition" aria-label="Recalculate">
                      <RefreshCw size={12} style={{ color: BRAND.info }} />
                    </button>
                  </TD>
                </TR>
              ))}
            </DataTable>
          )}

          {/* Types table */}
          {tab === "types" && (
            <DataTable cols={["", "Name", "Category", "Active", "Actions"]}>
              {items.map(t => (
                <TR key={t.id}>
                  <TD><input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => toggleSelect(t.id)} /></TD>
                  <TD><span className="text-[12px] font-medium" style={{ color: BRAND.textMain }}>{t.name}</span></TD>
                  <TD>{t.category || "\u2014"}</TD>
                  <TD>
                    <StatusBadge
                      status={t.is_active ? "active" : "inactive"}
                    />
                  </TD>
                  <TD>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditItem(t); setForm(t); }} className="p-1 rounded-md hover:bg-white/5 transition" aria-label="Edit">
                        <Edit size={12} style={{ color: BRAND.textMuted }} />
                      </button>
                      <button onClick={() => setConfirmDel(t.id)} className="p-1 rounded-md hover:bg-white/5 transition" aria-label="Delete">
                        <Trash2 size={12} style={{ color: BRAND.error }} />
                      </button>
                    </div>
                  </TD>
                </TR>
              ))}
            </DataTable>
          )}

          {/* Mobile Usage table */}
          {tab === "mobileUsage" && (
            <DataTable cols={["User", "Date", "Screen Time (min)", "App Opens", "Actions"]}>
              {items.map(m => (
                <TR key={m.id}>
                  <TD>{m.user_name || m.user || "\u2014"}</TD>
                  <TD>{m.date ? new Date(m.date).toLocaleDateString() : "\u2014"}</TD>
                  <TD>{m.screen_time_minutes ?? m.screen_time ?? "\u2014"}</TD>
                  <TD>{m.app_opens ?? "\u2014"}</TD>
                  <TD>
                    <button onClick={() => {
                      setEditItem(m);
                      setForm({ screen_time_minutes: m.screen_time_minutes ?? m.screen_time ?? "", app_opens: m.app_opens ?? "", date: m.date ?? "" });
                    }} className="p-1 rounded-md hover:bg-white/5 transition" aria-label="Edit">
                      <Edit size={12} style={{ color: BRAND.textMuted }} />
                    </button>
                  </TD>
                </TR>
              ))}
            </DataTable>
          )}

          <SimplePagination
            prevUrl={prevUrl}
            nextUrl={nextUrl}
            onPrev={() => load(prevUrl)}
            onNext={() => load(nextUrl)}
            count={items.length}
          />
        </motion.div>
      )}

      {/* ── Create / Edit Modal ───────────────────── */}
      {(showCreate || editItem) && (
        <Modal title={editItem ? "Edit" : "New"} onClose={closeModal}>
          <div className="space-y-3">
            {/* Sessions form */}
            {tab === "sessions" && (
              <>
                {["user_id", "recovery_type_id", "session_date", "duration_minutes", "feeling_before", "feeling_after", "notes"].map(k => (
                  <FormField key={k} label={k.replace(/_/g, " ")}>
                    <input value={form[k] || ""} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-[12px] focus:outline-none" style={{ ...inputStyle, border: subtleBorder }} />
                  </FormField>
                ))}
              </>
            )}

            {/* Wellness form */}
            {tab === "wellness" && (
              <>
                {["user_id", "wellness_date", "mood", "stress_level", "sleep_hours", "sleep_quality", "energy_level", "soreness_level", "hydration_level", "notes"].map(k => (
                  <FormField key={k} label={k.replace(/_/g, " ")}>
                    <input value={form[k] || ""} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-[12px] focus:outline-none" style={{ ...inputStyle, border: subtleBorder }} />
                  </FormField>
                ))}
              </>
            )}

            {/* Types form */}
            {tab === "types" && (
              <>
                {["name", "description", "icon", "color", "estimated_duration_minutes"].map(k => (
                  <FormField key={k} label={k.replace(/_/g, " ")}>
                    <input value={form[k] || ""} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-[12px] focus:outline-none" style={{ ...inputStyle, border: subtleBorder }} />
                  </FormField>
                ))}
              </>
            )}

            {/* Mobile Usage form */}
            {tab === "mobileUsage" && (
              <>
                {["screen_time_minutes", "app_opens", "date"].map(k => (
                  <FormField key={k} label={k.replace(/_/g, " ")}>
                    <input value={form[k] || ""} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-[12px] focus:outline-none" style={{ ...inputStyle, border: subtleBorder }} />
                  </FormField>
                ))}
              </>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <GhostButton onClick={closeModal}>Cancel</GhostButton>
              <PrimaryButton onClick={tab === "mobileUsage" ? saveMobileUsage : saveItem}>
                {editItem ? "Update" : "Create"}
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete confirmation */}
      {confirmDel && (
        <ConfirmDialog
          message="Delete this item?"
          confirmLabel="Delete"
          onConfirm={() => doDelete(confirmDel)}
          onCancel={() => setConfirmDel(null)}
        />
      )}
    </div>
  );
}
