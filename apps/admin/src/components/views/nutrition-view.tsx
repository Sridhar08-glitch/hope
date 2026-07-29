"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Download, Plus, Edit, Trash2, Database, RefreshCw, Search, Utensils, Flame, Droplets, Apple, CalendarDays, ClipboardList, BarChart3 } from "lucide-react";
import { BRAND, Spinner } from "@holora/ui";
import type { ApiClient } from "@holora/api-client";
import {
  fadeUp, cardStyle, subtleBorder,
  PageHeader, TabBar, Modal, ConfirmDialog, EmptyState,
  DataTable, TR, TD, StatCard, SimplePagination,
  PrimaryButton, GhostButton, FormField, inputStyle,
} from "@/components/shared";

interface ViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
}

type Tab = "meals" | "dailyProgress" | "weeklyPlans" | "stats" | "cache";

const TABS: { key: Tab; label: string; icon: typeof Utensils }[] = [
  { key: "meals", label: "Meals", icon: Utensils },
  { key: "dailyProgress", label: "Daily Progress", icon: CalendarDays },
  { key: "weeklyPlans", label: "Weekly Plans", icon: ClipboardList },
  { key: "stats", label: "Stats", icon: BarChart3 },
  { key: "cache", label: "Cache", icon: Database },
];

const TAB_ENDPOINTS: Record<string, string> = {
  meals: "/admin/nutrition/meals/",
  dailyProgress: "/admin/nutrition/daily-progress/",
  weeklyPlans: "/admin/nutrition/weekly-plans/",
};

export default function NutritionView({ api, showToast }: ViewProps) {
  const [tab, setTab] = useState<Tab>("meals");
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
  const [cacheMetrics, setCacheMetrics] = useState<any>(null);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [debugQuery, setDebugQuery] = useState("");
  const [debugResult, setDebugResult] = useState<any>(null);

  /* ── Data loading ──────────────────────────────── */

  const load = useCallback(async (url: string | null = null) => {
    const endpoint = TAB_ENDPOINTS[tab];
    if (!endpoint) return;
    setLoading(true);
    try {
      const res = url
        ? await api.get<any>(url)
        : await api.get<any>(endpoint, (tab === "meals" ? filters : {}) as Record<string, string>);
      setItems(res?.results || []);
      setNextUrl(res?.next || null);
      setPrevUrl(res?.previous || null);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load data", "error");
    } finally {
      setLoading(false);
    }
  }, [api, tab, filters, showToast]);

  useEffect(() => { load(); setSelectedIds([]); }, [load]);

  useEffect(() => {
    api.get<any>("/admin/nutrition/filter-options/").then(r => setFilterOptions(r || {})).catch(() => {});
  }, [api]);

  useEffect(() => {
    if (tab === "stats") api.get<any>("/admin/nutrition/stats/").then(setStats).catch(() => {});
    if (tab === "cache") {
      setCacheLoading(true);
      api.get<any>("/admin/nutrition/cache-metrics/")
        .then(setCacheMetrics)
        .catch((e) => showToast(e instanceof Error ? e.message : "Failed to load cache", "error"))
        .finally(() => setCacheLoading(false));
    }
  }, [tab, api, showToast]);

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

  async function bulkDelete() {
    if (!selectedIds.length) return;
    try {
      await api.post(`${TAB_ENDPOINTS[tab]}bulk-delete/`, { ids: selectedIds });
      showToast(`Deleted ${selectedIds.length}`, "success");
      setSelectedIds([]);
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Bulk delete failed", "error");
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

  async function runDebug() {
    if (!debugQuery) return;
    try {
      const result = await api.post<any>("/admin/nutrition/food-lookup-debug/", { query: debugQuery });
      setDebugResult(result);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Debug lookup failed", "error");
    }
  }

  const closeModal = () => { setShowCreate(false); setEditItem(null); setForm({}); };

  /* ── Render ────────────────────────────────────── */

  return (
    <div className="space-y-5">
      {/* Header */}
      <PageHeader title="Nutrition & Meals" subtitle="Daily progress and meal plan tracking.">
        {tab === "meals" && (
          <GhostButton onClick={() => {}}>
            <span className="flex items-center gap-1.5"><Download size={12} /> Export</span>
          </GhostButton>
        )}
        <PrimaryButton onClick={() => { setForm({}); setShowCreate(true); }}>
          <span className="flex items-center gap-1.5"><Plus size={12} /> Add</span>
        </PrimaryButton>
      </PageHeader>

      {/* Tabs */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <TabBar tabs={TABS} active={tab} onChange={setTab} />
      </motion.div>

      {/* Bulk selection bar */}
      {selectedIds.length > 0 && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible"
          className="flex items-center gap-3 rounded-xl px-3 py-2"
          style={cardStyle}
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

      {/* Filters (meals only) */}
      {tab === "meals" && Object.keys(filterOptions).length > 0 && (
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(stats.overall).map(([k, v], i) => {
                    const colors = [BRAND.accent, BRAND.error, BRAND.success, BRAND.info];
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
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(stats.today).map(([k, v], i) => (
                    <motion.div key={k} custom={i + 5} variants={fadeUp} initial="hidden" animate="visible">
                      <StatCard label={k.replace(/_/g, " ")} value={String(v)} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Weekly */}
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

            {/* Meal Distribution table */}
            {stats.meal_distribution?.length > 0 && (
              <motion.div custom={8} variants={fadeUp} initial="hidden" animate="visible">
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Meal Distribution</p>
                <DataTable cols={["Meal Type", "Count", "Total Calories"]}>
                  {stats.meal_distribution.map((m: any, i: number) => (
                    <TR key={i}>
                      <TD><span className="capitalize">{m.meal_type || m.type || "\u2014"}</span></TD>
                      <TD>{m.count ?? "\u2014"}</TD>
                      <TD>{m.total_calories ?? m.avg_calories ?? "\u2014"}</TD>
                    </TR>
                  ))}
                </DataTable>
              </motion.div>
            )}

            {/* Top Users table */}
            {stats.top_users?.length > 0 && (
              <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible">
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Top Users</p>
                <DataTable cols={["User", "Meals", "Calories"]}>
                  {stats.top_users.map((u: any, i: number) => (
                    <TR key={i}>
                      <TD>{u.user_name || u.username || "\u2014"}</TD>
                      <TD>{u.total_meals ?? "\u2014"}</TD>
                      <TD>{u.total_calories ?? "\u2014"}</TD>
                    </TR>
                  ))}
                </DataTable>
              </motion.div>
            )}

            {/* Daily Average table */}
            {stats.daily_average?.length > 0 && (
              <motion.div custom={10} variants={fadeUp} initial="hidden" animate="visible">
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Daily Average</p>
                <DataTable cols={["Date", "Calories", "Protein"]}>
                  {stats.daily_average.map((d: any, i: number) => (
                    <TR key={i}>
                      <TD>{d.date || "\u2014"}</TD>
                      <TD>{d.avg_calories ?? d.total_calories ?? "\u2014"}</TD>
                      <TD>{d.avg_protein ?? d.total_protein ?? "\u2014"}</TD>
                    </TR>
                  ))}
                </DataTable>
              </motion.div>
            )}
          </div>
        ) : (
          <div className="flex justify-center py-12"><Spinner /></div>
        )

      /* ── Cache tab ──────────────────────────────── */
      ) : tab === "cache" ? (
        cacheLoading ? (
          <div className="flex justify-center py-12"><Spinner /></div>
        ) : cacheMetrics ? (
          <div className="space-y-5">
            {/* Cache header */}
            <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible"
              className="flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <Database size={14} style={{ color: BRAND.accent }} />
                <span className="text-[13px] font-semibold" style={{ color: BRAND.textMain }}>Food Cache Optimization</span>
              </div>
              <PrimaryButton onClick={async () => {
                try {
                  await api.post("/admin/nutrition/bulk-cache/", {});
                  showToast("Bulk cache started", "success");
                } catch (e) {
                  showToast(e instanceof Error ? e.message : "Bulk cache failed", "error");
                }
              }}>
                <span className="flex items-center gap-1.5"><RefreshCw size={12} /> Bulk Cache</span>
              </PrimaryButton>
            </motion.div>

            {/* Cache Performance */}
            {cacheMetrics.cache_metrics && (
              <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Cache Performance</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(cacheMetrics.cache_metrics).map(([k, v], i) => (
                    <motion.div key={k} custom={i + 4} variants={fadeUp} initial="hidden" animate="visible">
                      <StatCard label={k.replace(/_/g, " ")} value={String(v)} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Database Status */}
            {cacheMetrics.database_status && (
              <motion.div custom={5} variants={fadeUp} initial="hidden" animate="visible">
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Database Status</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(cacheMetrics.database_status).map(([k, v], i) => (
                    <motion.div key={k} custom={i + 6} variants={fadeUp} initial="hidden" animate="visible">
                      <StatCard label={k.replace(/_/g, " ")} value={String(v)} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Usage Stats */}
            {cacheMetrics.usage_stats && (
              <motion.div custom={7} variants={fadeUp} initial="hidden" animate="visible">
                <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Usage Stats</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(cacheMetrics.usage_stats).map(([k, v], i) => (
                    <motion.div key={k} custom={i + 8} variants={fadeUp} initial="hidden" animate="visible">
                      <StatCard label={k.replace(/_/g, " ")} value={String(v)} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Food Lookup Debug */}
            <motion.div custom={9} variants={fadeUp} initial="hidden" animate="visible">
              <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Food Lookup Debug</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMuted }} />
                  <input
                    value={debugQuery}
                    onChange={e => setDebugQuery(e.target.value)}
                    placeholder="Search food name to debug..."
                    className="w-full pl-8 pr-3 py-2 rounded-lg text-[12px] focus:outline-none"
                    style={{ ...inputStyle, border: subtleBorder }}
                    onKeyDown={e => { if (e.key === "Enter") runDebug(); }}
                  />
                </div>
                <PrimaryButton onClick={runDebug}>Debug</PrimaryButton>
              </div>
              {debugResult && (
                <pre className="mt-3 p-3 rounded-lg text-[11px] overflow-auto max-h-60" style={{ ...cardStyle, color: BRAND.textMain }}>
                  {JSON.stringify(debugResult, null, 2)}
                </pre>
              )}
            </motion.div>
          </div>
        ) : (
          <EmptyState icon={Database} message="No cache data available." />
        )

      /* ── Data tabs (meals / dailyProgress / weeklyPlans) */
      ) : loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={Utensils} message={`No ${tab === "dailyProgress" ? "daily progress" : tab === "weeklyPlans" ? "weekly plans" : "meals"} found.`} />
      ) : (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
          {/* Meals table */}
          {tab === "meals" && (
            <DataTable cols={["", "Name", "User", "Calories", "Protein", "Carbs", "Date", "Actions"]}>
              {items.map(m => (
                <TR key={m.id}>
                  <TD><input type="checkbox" checked={selectedIds.includes(m.id)} onChange={() => toggleSelect(m.id)} /></TD>
                  <TD><span className="text-[12px] font-medium" style={{ color: BRAND.textMain }}>{m.name || m.meal_name || "\u2014"}</span></TD>
                  <TD>{m.user_name || m.user || "\u2014"}</TD>
                  <TD>{m.calories ?? "\u2014"}</TD>
                  <TD>{m.protein ?? "\u2014"}</TD>
                  <TD>{m.carbs ?? "\u2014"}</TD>
                  <TD>{m.date ? new Date(m.date).toLocaleDateString() : "\u2014"}</TD>
                  <TD>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditItem(m); setForm(m); }} className="p-1 rounded-md hover:bg-white/5 transition" aria-label="Edit">
                        <Edit size={12} style={{ color: BRAND.textMuted }} />
                      </button>
                      <button onClick={() => setConfirmDel(m.id)} className="p-1 rounded-md hover:bg-white/5 transition" aria-label="Delete">
                        <Trash2 size={12} style={{ color: BRAND.error }} />
                      </button>
                    </div>
                  </TD>
                </TR>
              ))}
            </DataTable>
          )}

          {/* Daily Progress table */}
          {tab === "dailyProgress" && (
            <DataTable cols={["User", "Date", "Calories Goal", "Calories Actual", "Actions"]}>
              {items.map(d => (
                <TR key={d.id}>
                  <TD>{d.user_name || d.user || "\u2014"}</TD>
                  <TD>{d.date ? new Date(d.date).toLocaleDateString() : "\u2014"}</TD>
                  <TD>{d.target_calories ?? "\u2014"}</TD>
                  <TD>{d.consumed_calories ?? "\u2014"}</TD>
                  <TD>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditItem(d); setForm(d); }} className="p-1 rounded-md hover:bg-white/5 transition" aria-label="Edit">
                        <Edit size={12} style={{ color: BRAND.textMuted }} />
                      </button>
                      <button onClick={() => setConfirmDel(d.id)} className="p-1 rounded-md hover:bg-white/5 transition" aria-label="Delete">
                        <Trash2 size={12} style={{ color: BRAND.error }} />
                      </button>
                    </div>
                  </TD>
                </TR>
              ))}
            </DataTable>
          )}

          {/* Weekly Plans table */}
          {tab === "weeklyPlans" && (
            <DataTable cols={["", "Name", "User", "Week", "Actions"]}>
              {items.map(p => (
                <TR key={p.id}>
                  <TD><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} /></TD>
                  <TD><span className="text-[12px] font-medium" style={{ color: BRAND.textMain }}>{p.name || p.plan_name || `Plan #${p.id}`}</span></TD>
                  <TD>{p.user_name || p.user || "\u2014"}</TD>
                  <TD>{p.week_start_date ? new Date(p.week_start_date).toLocaleDateString() : "\u2014"}</TD>
                  <TD>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditItem(p); setForm(p); }} className="p-1 rounded-md hover:bg-white/5 transition" aria-label="Edit">
                        <Edit size={12} style={{ color: BRAND.textMuted }} />
                      </button>
                      <button onClick={() => setConfirmDel(p.id)} className="p-1 rounded-md hover:bg-white/5 transition" aria-label="Delete">
                        <Trash2 size={12} style={{ color: BRAND.error }} />
                      </button>
                    </div>
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
      {(showCreate || editItem) && tab !== "stats" && tab !== "cache" && (
        <Modal title={editItem ? "Edit" : "New"} onClose={closeModal} wide>
          <div className="space-y-3">
            {/* Meals form */}
            {tab === "meals" && (
              <>
                <FormField label="User ID">
                  <input value={form.user_id || ""} onChange={e => setForm(f => ({ ...f, user_id: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-[12px] focus:outline-none" style={{ ...inputStyle, border: subtleBorder }} required />
                </FormField>
                <FormField label="Food Name">
                  <input value={form.meal_name || ""} onChange={e => setForm(f => ({ ...f, meal_name: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-[12px] focus:outline-none" style={{ ...inputStyle, border: subtleBorder }} required />
                </FormField>
                <FormField label="Meal Type">
                  <select value={form.meal_type || ""} onChange={e => setForm(f => ({ ...f, meal_type: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-[12px] focus:outline-none" style={{ ...inputStyle, border: subtleBorder }}>
                    <option value="">Select meal type</option>
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                    <option value="pre_workout">Pre Workout</option>
                    <option value="post_workout">Post Workout</option>
                  </select>
                </FormField>
                <FormField label="Portion Size (grams)">
                  <input value={form.portion_size_g || ""} onChange={e => setForm(f => ({ ...f, portion_size_g: e.target.value }))}
                    type="number" className="w-full rounded-lg px-3 py-2 text-[12px] focus:outline-none" style={{ ...inputStyle, border: subtleBorder }} required />
                </FormField>
                <FormField label="Meal Date">
                  <input value={form.meal_date || new Date().toISOString().split("T")[0]} onChange={e => setForm(f => ({ ...f, meal_date: e.target.value }))}
                    type="date" className="w-full rounded-lg px-3 py-2 text-[12px] focus:outline-none" style={{ ...inputStyle, border: subtleBorder }} required />
                </FormField>
                <FormField label="Source">
                  <select value={form.source || "manual"} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                    className="w-full rounded-lg px-3 py-2 text-[12px] focus:outline-none" style={{ ...inputStyle, border: subtleBorder }}>
                    <option value="manual">Manual Entry</option>
                    <option value="voice">Voice Command</option>
                    <option value="barcode">Barcode Scan</option>
                    <option value="photo">Photo Recognition</option>
                  </select>
                </FormField>

                <p className="text-[10px] uppercase tracking-wider font-medium pt-3 mt-1" style={{ color: BRAND.textDim, borderTop: subtleBorder }}>
                  Nutrition (auto-calculated by AI, or enter manually)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {["total_calories", "total_protein", "total_carbs", "total_fats", "total_fiber", "total_sugar"].map(k => (
                    <FormField key={k} label={k.replace(/total_/, "").replace(/_/g, " ") + (k.includes("calories") ? "" : " (g)")}>
                      <input value={form[k] || ""} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                        type="number" className="w-full rounded-lg px-3 py-2 text-[12px] focus:outline-none" style={{ ...inputStyle, border: subtleBorder }} />
                    </FormField>
                  ))}
                </div>
                <FormField label="Total Sodium (mg)">
                  <input value={form.total_sodium || ""} onChange={e => setForm(f => ({ ...f, total_sodium: e.target.value }))}
                    type="number" className="w-full rounded-lg px-3 py-2 text-[12px] focus:outline-none" style={{ ...inputStyle, border: subtleBorder }} />
                </FormField>
                <FormField label="Notes">
                  <textarea value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                    placeholder="Optional notes about the meal..."
                    className="w-full rounded-lg px-3 py-2 text-[12px] focus:outline-none resize-none" style={{ ...inputStyle, border: subtleBorder }} />
                </FormField>
                <div className="flex items-center gap-2">
                  <input type="checkbox" checked={!!form.estimated} onChange={e => setForm(f => ({ ...f, estimated: e.target.checked }))} id="meal_estimated" />
                  <label htmlFor="meal_estimated" className="text-[11px]" style={{ color: BRAND.textDim }}>Portion size is estimated</label>
                </div>
              </>
            )}

            {/* Daily Progress form */}
            {tab === "dailyProgress" && (
              <>
                {["user_id", "progress_date", "target_calories", "consumed_calories", "target_protein", "consumed_protein", "target_carbs", "consumed_carbs", "target_fat", "consumed_fat", "water_intake_liters", "meals_logged"].map(k => (
                  <FormField key={k} label={k.replace(/_/g, " ")}>
                    <input value={form[k] || ""} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-[12px] focus:outline-none" style={{ ...inputStyle, border: subtleBorder }} />
                  </FormField>
                ))}
              </>
            )}

            {/* Weekly Plans form */}
            {tab === "weeklyPlans" && (
              <>
                {["user_id", "plan_name", "week_start_date", "description", "target_calories", "target_protein", "target_carbs", "target_fat"].map(k => (
                  <FormField key={k} label={k.replace(/_/g, " ")}>
                    <input value={form[k] || ""} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                      className="w-full rounded-lg px-3 py-2 text-[12px] focus:outline-none" style={{ ...inputStyle, border: subtleBorder }} />
                  </FormField>
                ))}
              </>
            )}

            <div className="flex gap-2 justify-end pt-2">
              <GhostButton onClick={closeModal}>Cancel</GhostButton>
              <PrimaryButton onClick={saveItem}>{editItem ? "Update" : "Create"}</PrimaryButton>
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
