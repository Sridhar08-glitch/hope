"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, Plus, Edit, Trash2, Activity, Footprints, Flame, Timer, Dumbbell, BarChart3, ListChecks } from "lucide-react";
import { BRAND, Spinner } from "@holora/ui";
import type { ApiClient } from "@holora/api-client";
import {
  fadeUp, useDebouncedValue, cardStyle, subtleBorder,
  PageHeader, TabBar, Modal, ConfirmDialog, EmptyState,
  DataTable, TR, TD, StatCard, StatusBadge, SimplePagination,
  PrimaryButton, GhostButton, FormField, inputStyle,
} from "@/components/shared";

interface ViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
}

type Tab = "records" | "sessions" | "stats";

const TABS: { key: Tab; label: string; icon: typeof Activity }[] = [
  { key: "records", label: "Records", icon: ListChecks },
  { key: "sessions", label: "Sessions", icon: Dumbbell },
  { key: "stats", label: "Stats", icon: BarChart3 },
];

export default function FitnessView({ api, showToast }: ViewProps) {
  const [tab, setTab] = useState<Tab>("records");
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
  const [importFile, setImportFile] = useState<File | null>(null);

  /* ── Data loading ──────────────────────────────── */

  const load = useCallback(async (url: string | null = null) => {
    setLoading(true);
    try {
      const endpoint = tab === "records" ? "/admin/fitness/records/" : "/admin/fitness/sessions/";
      const res = url
        ? await api.get<any>(url)
        : await api.get<any>(endpoint, (tab === "records" ? filters : {}) as Record<string, string>);
      setItems(res?.results || []);
      setNextUrl(res?.next || null);
      setPrevUrl(res?.previous || null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [api, tab, filters, showToast]);

  useEffect(() => { if (tab !== "stats") load(); setSelectedIds([]); }, [load, tab]);

  useEffect(() => {
    api.get<any>("/admin/fitness/filter-options/").then(r => setFilterOptions(r || {})).catch(() => {});
  }, [api]);

  useEffect(() => {
    if (tab === "stats") api.get<any>("/admin/fitness/stats/").then(setStats).catch(() => {});
  }, [tab, api]);

  /* ── Actions ───────────────────────────────────── */

  function toggleSelect(id: string) {
    setSelectedIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  async function doDelete(id: string) {
    try {
      await api.del(tab === "records" ? `/admin/fitness/records/${id}/` : `/admin/fitness/sessions/${id}/`);
      showToast("Deleted", "success");
      setConfirmDel(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  }

  async function bulkDelete() {
    if (!selectedIds.length) return;
    try {
      await api.post("/admin/fitness/records/bulk-delete/", { ids: selectedIds });
      showToast(`Deleted ${selectedIds.length}`, "success");
      setSelectedIds([]);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Bulk delete failed", "error");
    }
  }

  async function saveRecord() {
    try {
      if (editItem) {
        await api.put(`/admin/fitness/records/${editItem.id}/`, form);
        showToast("Updated", "success");
      } else {
        await api.post("/admin/fitness/records/", form);
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

  async function bulkImport() {
    if (!importFile) return;
    try {
      const fd = new FormData();
      fd.append("file", importFile);
      await api.postFormData("/admin/fitness/records/bulk-import/", fd);
      showToast("Import successful", "success");
      setImportFile(null);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Import failed", "error");
    }
  }

  function openEdit(item: any) {
    setEditItem(item);
    setForm({
      user_id: item.user_id || item.user || "",
      date: item.date || "",
      steps: item.steps || "",
      distance_km: item.distance_km || "",
      calories: item.calories || "",
      active_minutes: item.active_minutes || "",
    });
  }

  const filterKeys = Object.keys(filterOptions).slice(0, 4);

  /* ── Render ────────────────────────────────────── */

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader title="Fitness Records" subtitle="Global activity sessions and workout tracking.">
        {tab === "records" && (
          <>
            <GhostButton onClick={() => {}}>
              <span className="flex items-center gap-1.5"><Download size={12} /> Export</span>
            </GhostButton>
            <label className="cursor-pointer">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] transition hover:bg-white/5" style={{ color: BRAND.textMuted }}>
                <Download size={12} /> Import CSV
              </span>
              <input type="file" accept=".csv" className="hidden" onChange={e => setImportFile(e.target.files?.[0] || null)} />
            </label>
            {importFile && (
              <PrimaryButton onClick={bulkImport}>Upload: {importFile.name}</PrimaryButton>
            )}
            <PrimaryButton onClick={() => { setForm({}); setShowCreate(true); }}>
              <span className="flex items-center gap-1.5"><Plus size={12} /> Add Record</span>
            </PrimaryButton>
          </>
        )}
      </PageHeader>

      {/* Tabs */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <TabBar tabs={TABS} active={tab} onChange={setTab} />
      </motion.div>

      {/* Filters (records only) */}
      {tab === "records" && filterKeys.length > 0 && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="flex gap-2 flex-wrap">
          {filterKeys.map(k => (
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

      {/* Bulk selection bar */}
      {tab === "records" && selectedIds.length > 0 && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible"
          className="flex items-center gap-3 rounded-xl px-3 py-2"
          style={{ ...cardStyle }}
        >
          <span className="text-[11px]" style={{ color: BRAND.textDim }}>{selectedIds.length} selected</span>
          <button
            onClick={bulkDelete}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold transition hover:opacity-90"
            style={{ backgroundColor: `${BRAND.error}18`, color: BRAND.error }}
          >
            Bulk Delete
          </button>
        </motion.div>
      )}

      {/* Stats tab */}
      {tab === "stats" ? (
        stats ? (
          <div className="space-y-5">
            {/* Overall stats */}
            {stats.overall && (
              <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Overall</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(stats.overall).map(([k, v], i) => {
                    const colors = [BRAND.info, BRAND.error, BRAND.warning, BRAND.success];
                    return (
                      <motion.div key={k} custom={i + 3} variants={fadeUp} initial="hidden" animate="visible">
                        <StatCard label={k.replace(/_/g, " ")} value={String(v)} color={colors[i % colors.length]} />
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Today stats */}
            {stats.today && (
              <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Today</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(stats.today).map(([k, v], i) => (
                    <motion.div key={k} custom={i + 5} variants={fadeUp} initial="hidden" animate="visible">
                      <StatCard label={k.replace(/_/g, " ")} value={String(v)} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Weekly stats */}
            {stats.weekly && (
              <motion.div custom={6} variants={fadeUp} initial="hidden" animate="visible">
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>This Week</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(stats.weekly).map(([k, v], i) => (
                    <motion.div key={k} custom={i + 7} variants={fadeUp} initial="hidden" animate="visible">
                      <StatCard label={k.replace(/_/g, " ")} value={String(v)} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Monthly stats */}
            {stats.monthly && (
              <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible">
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>This Month</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(stats.monthly).map(([k, v], i) => (
                    <motion.div key={k} custom={i + 9} variants={fadeUp} initial="hidden" animate="visible">
                      <StatCard label={k.replace(/_/g, " ")} value={String(v)} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Top Users table */}
            {stats.top_users?.length > 0 && (
              <motion.div custom={10} variants={fadeUp} initial="hidden" animate="visible">
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Top Users</p>
                <DataTable cols={["User", "Steps", "Calories", "Records"]}>
                  {stats.top_users.map((u: any, i: number) => (
                    <TR key={i}>
                      <TD>{u.user_name || u.username || "\u2014"}</TD>
                      <TD>{u.total_steps ?? "\u2014"}</TD>
                      <TD>{u.total_calories ?? "\u2014"}</TD>
                      <TD>{u.total_records ?? "\u2014"}</TD>
                    </TR>
                  ))}
                </DataTable>
              </motion.div>
            )}

            {/* Daily Average table */}
            {stats.daily_average?.length > 0 && (
              <motion.div custom={11} variants={fadeUp} initial="hidden" animate="visible">
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Daily Average</p>
                <DataTable cols={["Date", "Steps", "Calories"]}>
                  {stats.daily_average.map((d: any, i: number) => (
                    <TR key={i}>
                      <TD>{d.date || "\u2014"}</TD>
                      <TD>{d.avg_steps ?? d.total_steps ?? "\u2014"}</TD>
                      <TD>{d.avg_calories ?? d.total_calories ?? "\u2014"}</TD>
                    </TR>
                  ))}
                </DataTable>
              </motion.div>
            )}

            {/* Activity Distribution table */}
            {stats.activity_distribution?.length > 0 && (
              <motion.div custom={12} variants={fadeUp} initial="hidden" animate="visible">
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Activity Distribution</p>
                <DataTable cols={["Activity", "Count"]}>
                  {stats.activity_distribution.map((a: any, i: number) => (
                    <TR key={i}>
                      <TD>{a.activity_type || a.type || a.name || "\u2014"}</TD>
                      <TD>{a.count ?? "\u2014"}</TD>
                    </TR>
                  ))}
                </DataTable>
              </motion.div>
            )}
          </div>
        ) : <FitnessSkeleton />
      ) : loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={Activity} message={`No ${tab} found.`} />
      ) : (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
          {/* Records table */}
          {tab === "records" && (
            <DataTable cols={["", "User", "Steps", "Distance (km)", "Calories", "Active Min", "Date", "Actions"]}>
              {items.map(r => (
                <TR key={r.id}>
                  <TD>
                    <input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelect(r.id)} />
                  </TD>
                  <TD>{r.user_name || r.user || "\u2014"}</TD>
                  <TD>{r.steps ?? "\u2014"}</TD>
                  <TD>{r.distance_km ?? "\u2014"}</TD>
                  <TD>{r.calories ?? "\u2014"}</TD>
                  <TD>{r.active_minutes ?? "\u2014"}</TD>
                  <TD>{r.date ? new Date(r.date).toLocaleDateString() : "\u2014"}</TD>
                  <TD>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(r)} className="p-1 rounded-md hover:bg-white/5 transition" aria-label="Edit">
                        <Edit size={12} style={{ color: BRAND.textMuted }} />
                      </button>
                      <button onClick={() => setConfirmDel(r.id)} className="p-1 rounded-md hover:bg-white/5 transition" aria-label="Delete">
                        <Trash2 size={12} style={{ color: BRAND.error }} />
                      </button>
                    </div>
                  </TD>
                </TR>
              ))}
            </DataTable>
          )}

          {/* Sessions table */}
          {tab === "sessions" && (
            <DataTable cols={["User", "Activity", "Duration", "Calories", "Date", "Actions"]}>
              {items.map(s => (
                <TR key={s.id}>
                  <TD>{s.user_name || s.user || "\u2014"}</TD>
                  <TD>{s.activity_type || s.activity || "\u2014"}</TD>
                  <TD>{s.duration_minutes ? `${s.duration_minutes}m` : "\u2014"}</TD>
                  <TD>{s.calories_burned ?? "\u2014"}</TD>
                  <TD>{s.date ? new Date(s.date).toLocaleDateString() : "\u2014"}</TD>
                  <TD>
                    <button onClick={() => setConfirmDel(s.id)} className="p-1 rounded-md hover:bg-white/5 transition" aria-label="Delete">
                      <Trash2 size={12} style={{ color: BRAND.error }} />
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

      {/* Create / Edit Modal */}
      {(showCreate || editItem) && (
        <Modal title={editItem ? "Edit Record" : "New Record"} onClose={() => { setShowCreate(false); setEditItem(null); setForm({}); }}>
          <div className="space-y-3">
            {["user_id", "date", "steps", "distance_km", "calories", "active_minutes"].map(k => (
              <FormField key={k} label={k.replace(/_/g, " ")}>
                <input
                  value={form[k] || ""}
                  onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-[12px] focus:outline-none"
                  style={{ ...inputStyle, border: subtleBorder }}
                />
              </FormField>
            ))}
            <div className="flex gap-2 justify-end pt-2">
              <GhostButton onClick={() => { setShowCreate(false); setEditItem(null); setForm({}); }}>Cancel</GhostButton>
              <PrimaryButton onClick={saveRecord}>{editItem ? "Update" : "Create"}</PrimaryButton>
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

/* ── Skeleton loader for stats ───────────────────── */

function FitnessSkeleton() {
  return (
    <div className="space-y-5">
      {[0, 1].map(row => (
        <div key={row} className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="rounded-lg p-2.5 animate-pulse" style={cardStyle}>
              <div className="h-3 w-16 rounded mb-2" style={{ backgroundColor: `${BRAND.textDim}20` }} />
              <div className="h-5 w-10 rounded" style={{ backgroundColor: `${BRAND.textDim}20` }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
