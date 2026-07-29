import { useState, useEffect, useCallback } from "react";
import { Download, Plus, Edit, Trash2, Database, RefreshCw, Search } from "lucide-react";
import BRAND from "../../constants/brand";
import { LoadingSpinner, TableWrap, TR, TD, Btn, Pagination, Modal, ConfirmModal, InputField } from "../../components/ui";
import { downloadExport } from "../../utils/downloadExport";
import adminApi from "../../services/adminApi";

function NutritionView({ token, showToast }) {
  const [tab, setTab] = useState("meals");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [editItem, setEditItem] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);
  const [form, setForm] = useState({});
  const [stats, setStats] = useState(null);
  const [filterOptions, setFilterOptions] = useState({});
  const [filters, setFilters] = useState({});
  const [cacheMetrics, setCacheMetrics] = useState(null);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [debugQuery, setDebugQuery] = useState("");
  const [debugResult, setDebugResult] = useState(null);

  const apis = {
    meals: adminApi.nutrition.meals,
    dailyProgress: adminApi.nutrition.dailyProgress,
    weeklyPlans: adminApi.nutrition.weeklyPlans,
  };
  const currentApi = apis[tab];

  const load = useCallback(async (url = null) => {
    if (!currentApi) return;
    setLoading(true);
    try {
      const res = url ? await currentApi.listUrl(token, url) : await currentApi.list(token, tab === "meals" ? filters : {});
      setItems(res?.results || []);
      setNextUrl(res?.next || null);
      setPrevUrl(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    finally { setLoading(false); }
  }, [token, tab, filters, showToast]); // eslint-disable-line

  useEffect(() => { load(); setSelectedIds([]); }, [load]);

  useEffect(() => {
    adminApi.nutrition.filterOptions(token).then(r => setFilterOptions(r || {})).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (tab === "stats") adminApi.nutrition.stats(token).then(setStats).catch(() => {});
    if (tab === "cache") {
      setCacheLoading(true);
      adminApi.nutrition.cacheMetrics(token).then(setCacheMetrics).catch(e => showToast(e.message, "error")).finally(() => setCacheLoading(false));
    }
  }, [tab, token, showToast]);

  function toggleSelect(id) { setSelectedIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); }

  async function doDelete(id) {
    try { await currentApi.delete(token, id); showToast("Deleted", "success"); setConfirmDel(null); load(); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function bulkDelete() {
    if (!selectedIds.length || !currentApi.bulkDelete) return;
    try { await currentApi.bulkDelete(token, selectedIds); showToast(`Deleted ${selectedIds.length}`, "success"); setSelectedIds([]); load(); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function saveItem() {
    try {
      if (editItem) { await currentApi.update(token, editItem.id, form); showToast("Updated", "success"); }
      else { await currentApi.create(token, form); showToast("Created", "success"); }
      setEditItem(null); setShowCreate(false); setForm({}); load();
    } catch (err) { showToast(err.message, "error"); }
  }

  const mealCols = ["", "Name", "User", "Calories", "Protein", "Carbs", "Date", "Actions"];
  const dpCols = ["User", "Date", "Calories Goal", "Calories Actual", "Actions"];
  const wpCols = ["", "Name", "User", "Week", "Actions"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Nutrition &amp; Meals</h1>
          <p className="mt-1 text-sm" style={{ color: BRAND.textMuted }}>Daily progress and meal plan tracking.</p>
        </div>
        <div className="flex gap-3">
          {tab === "meals" && (
            <button onClick={() => downloadExport(token, adminApi.nutrition.meals.exportUrl(), 'meals.csv').catch(e => showToast(e.message, "error"))}
              style={{ backgroundColor: BRAND.panelLight, color: BRAND.textMain }}
              className="px-4 py-2 flex items-center rounded-lg hover:opacity-80 transition shadow-lg text-sm">
              <Download size={14} className="mr-2" /> Export
            </button>
          )}
          <button onClick={() => { setForm({}); setShowCreate(true); }}
            style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}
            className="px-4 py-2 font-bold rounded-lg hover:opacity-90 transition shadow-lg flex items-center gap-2 text-sm">
            <Plus size={14} /> Add
          </button>
        </div>
      </div>
      <div className="flex gap-0 border-b" style={{ borderColor: BRAND.panelLight }}>
        {[["meals", "Meals"], ["dailyProgress", "Daily Progress"], ["weeklyPlans", "Weekly Plans"], ["stats", "Stats"], ["cache", "Cache"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className="px-6 py-3 text-sm font-bold uppercase tracking-wider transition"
            style={{ color: tab === v ? BRAND.accent : BRAND.textMuted, borderBottom: tab === v ? `2px solid ${BRAND.accent}` : "2px solid transparent" }}>{l}</button>
        ))}
      </div>
      {selectedIds.length > 0 && (
        <div className="flex gap-2 rounded-xl p-3 border border-purple-900/40" style={{ backgroundColor: BRAND.card }}>
          <span className="text-slate-400 text-sm">{selectedIds.length} selected</span>
          {currentApi.bulkDelete && <Btn onClick={bulkDelete} color="red" small>Bulk Delete</Btn>}
        </div>
      )}
      {tab === "meals" && Object.keys(filterOptions).length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {Object.keys(filterOptions).slice(0, 4).map(k => (
            <select key={k} value={filters[k] || ""} onChange={e => setFilters(f => ({ ...f, [k]: e.target.value || undefined }))}
              className="bg-white/5 border border-purple-900/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
              <option value="">{k.replace(/_/g, " ")}</option>
              {(filterOptions[k] || []).map(o => <option key={o?.value ?? o} value={o?.value ?? o}>{o?.label ?? o}</option>)}
            </select>
          ))}
          <Btn onClick={() => setFilters({})} color="gray" small>Clear</Btn>
        </div>
      )}
      {tab === "stats" ? (
        stats ? (
          <div className="space-y-5">
            {stats.overall && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Overall</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(stats.overall).map(([k, v]) => (
                    <div key={k} className="rounded-xl p-4 border border-purple-900/40" style={{ backgroundColor: BRAND.card }}>
                      <p className="text-slate-400 text-xs mb-1">{k.replace(/_/g, " ")}</p>
                      <p className="text-white text-xl font-bold">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {stats.today && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Today</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(stats.today).map(([k, v]) => (
                    <div key={k} className="rounded-xl p-4 border border-purple-900/40" style={{ backgroundColor: BRAND.card }}>
                      <p className="text-slate-400 text-xs mb-1">{k.replace(/_/g, " ")}</p>
                      <p className="text-white text-xl font-bold">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {stats.weekly && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">This Week</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(stats.weekly).map(([k, v]) => (
                    <div key={k} className="rounded-xl p-4 border border-purple-900/40" style={{ backgroundColor: BRAND.card }}>
                      <p className="text-slate-400 text-xs mb-1">{k.replace(/_/g, " ")}</p>
                      <p className="text-white text-xl font-bold">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {stats.meal_distribution?.length > 0 && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Meal Distribution</p>
                <TableWrap cols={["Meal Type", "Count", "Avg Calories"]}>
                  {stats.meal_distribution.map((m, i) => (
                    <TR key={i}>
                      <TD>{m.meal_type || m.type || "—"}</TD>
                      <TD>{m.count ?? "—"}</TD>
                      <TD>{m.avg_calories ?? "—"}</TD>
                    </TR>
                  ))}
                </TableWrap>
              </div>
            )}
            {stats.top_users?.length > 0 && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Top Users</p>
                <TableWrap cols={["User", "Meals", "Calories"]}>
                  {stats.top_users.map((u, i) => (
                    <TR key={i}>
                      <TD>{u.user_name || u.username || "—"}</TD>
                      <TD>{u.total_meals ?? "—"}</TD>
                      <TD>{u.total_calories ?? "—"}</TD>
                    </TR>
                  ))}
                </TableWrap>
              </div>
            )}
            {stats.daily_average?.length > 0 && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Daily Average</p>
                <TableWrap cols={["Date", "Calories", "Protein"]}>
                  {stats.daily_average.map((d, i) => (
                    <TR key={i}>
                      <TD>{d.date || "—"}</TD>
                      <TD>{d.avg_calories ?? d.total_calories ?? "—"}</TD>
                      <TD>{d.avg_protein ?? d.total_protein ?? "—"}</TD>
                    </TR>
                  ))}
                </TableWrap>
              </div>
            )}
          </div>
        ) : <LoadingSpinner />
      ) : loading ? <LoadingSpinner /> : (
        <>
          {tab === "meals" && (
            <TableWrap cols={mealCols}>
              {items.map(m => (
                <TR key={m.id}>
                  <TD><input type="checkbox" checked={selectedIds.includes(m.id)} onChange={() => toggleSelect(m.id)} /></TD>
                  <TD><span className="text-white">{m.name || m.meal_name || "—"}</span></TD>
                  <TD>{m.user_name || m.user || "—"}</TD>
                  <TD>{m.calories ?? "—"}</TD>
                  <TD>{m.protein ?? "—"}</TD>
                  <TD>{m.carbs ?? "—"}</TD>
                  <TD>{m.date ? new Date(m.date).toLocaleDateString() : "—"}</TD>
                  <TD>
                    <div className="flex gap-1">
                      <Btn onClick={() => { setEditItem(m); setForm(m); }} color="gray" small><Edit size={12} /></Btn>
                      <Btn onClick={() => setConfirmDel(m.id)} color="red" small><Trash2 size={12} /></Btn>
                    </div>
                  </TD>
                </TR>
              ))}
            </TableWrap>
          )}
          {tab === "dailyProgress" && (
            <TableWrap cols={dpCols}>
              {items.map(d => (
                <TR key={d.id}>
                  <TD>{d.user_name || d.user || "—"}</TD>
                  <TD>{d.date ? new Date(d.date).toLocaleDateString() : "—"}</TD>
                  <TD>{d.target_calories ?? "—"}</TD>
                  <TD>{d.consumed_calories ?? "—"}</TD>
                  <TD>
                    <div className="flex gap-1">
                      <Btn onClick={() => { setEditItem(d); setForm(d); }} color="gray" small><Edit size={12} /></Btn>
                      <Btn onClick={() => setConfirmDel(d.id)} color="red" small><Trash2 size={12} /></Btn>
                    </div>
                  </TD>
                </TR>
              ))}
            </TableWrap>
          )}
          {tab === "weeklyPlans" && (
            <TableWrap cols={wpCols}>
              {items.map(p => (
                <TR key={p.id}>
                  <TD><input type="checkbox" checked={selectedIds.includes(p.id)} onChange={() => toggleSelect(p.id)} /></TD>
                  <TD><span className="text-white">{p.name || p.plan_name || `Plan #${p.id}`}</span></TD>
                  <TD>{p.user_name || p.user || "—"}</TD>
                  <TD>{p.week_start_date ? new Date(p.week_start_date).toLocaleDateString() : "—"}</TD>
                  <TD>
                    <div className="flex gap-1">
                      <Btn onClick={() => { setEditItem(p); setForm(p); }} color="gray" small><Edit size={12} /></Btn>
                      <Btn onClick={() => setConfirmDel(p.id)} color="red" small><Trash2 size={12} /></Btn>
                    </div>
                  </TD>
                </TR>
              ))}
            </TableWrap>
          )}
          <Pagination nextUrl={nextUrl} prevUrl={prevUrl} onNext={() => load(nextUrl)} onPrev={() => load(prevUrl)} />
        </>
      )}

      {tab === "cache" && (
        cacheLoading ? <LoadingSpinner /> : cacheMetrics ? (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-white text-lg font-bold flex items-center gap-2"><Database size={20} style={{ color: BRAND.accent }} /> Food Cache Optimization</h3>
              <div className="flex gap-2">
                <button onClick={async () => { try { await adminApi.nutrition.bulkCache(token, {}); showToast("Bulk cache started", "success"); } catch (e) { showToast(e.message, "error"); } }}
                  className="px-4 py-2 flex items-center gap-2 rounded-lg text-sm font-bold hover:opacity-90 transition shadow-lg" style={{ backgroundColor: BRAND.primary, color: '#fff' }}>
                  <RefreshCw size={14} /> Bulk Cache
                </button>
              </div>
            </div>
            {cacheMetrics.cache_metrics && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Cache Performance</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(cacheMetrics.cache_metrics).map(([k, v]) => (
                    <div key={k} className="rounded-xl p-4 border border-purple-900/40" style={{ backgroundColor: BRAND.card }}>
                      <p className="text-slate-400 text-xs mb-1">{k.replace(/_/g, " ")}</p>
                      <p className="text-white text-xl font-bold">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {cacheMetrics.database_status && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Database Status</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(cacheMetrics.database_status).map(([k, v]) => (
                    <div key={k} className="rounded-xl p-4 border border-purple-900/40" style={{ backgroundColor: BRAND.card }}>
                      <p className="text-slate-400 text-xs mb-1">{k.replace(/_/g, " ")}</p>
                      <p className="text-white text-xl font-bold">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {cacheMetrics.usage_stats && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Usage Stats</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(cacheMetrics.usage_stats).map(([k, v]) => (
                    <div key={k} className="rounded-xl p-4 border border-purple-900/40" style={{ backgroundColor: BRAND.card }}>
                      <p className="text-slate-400 text-xs mb-1">{k.replace(/_/g, " ")}</p>
                      <p className="text-white text-xl font-bold">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Food Lookup Debug</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMuted }} />
                  <input value={debugQuery} onChange={e => setDebugQuery(e.target.value)} placeholder="Search food name to debug..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/30 border focus:outline-none text-white text-sm"
                    style={{ borderColor: BRAND.panelLight }}
                    onKeyDown={e => { if (e.key === 'Enter' && debugQuery) adminApi.nutrition.foodLookupDebug(token, { query: debugQuery }).then(setDebugResult).catch(err => showToast(err.message, "error")); }} />
                </div>
                <button onClick={() => { if (debugQuery) adminApi.nutrition.foodLookupDebug(token, { query: debugQuery }).then(setDebugResult).catch(err => showToast(err.message, "error")); }}
                  className="px-4 py-2 rounded-lg text-sm font-bold" style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}>Debug</button>
              </div>
              {debugResult && (
                <pre className="mt-3 p-4 rounded-xl text-xs overflow-auto max-h-60" style={{ backgroundColor: BRAND.panelLight, color: BRAND.textMain }}>
                  {JSON.stringify(debugResult, null, 2)}
                </pre>
              )}
            </div>
          </div>
        ) : <p className="text-center py-8" style={{ color: BRAND.textMuted }}>No cache data available</p>
      )}

      {(showCreate || editItem) && tab !== "stats" && tab !== "cache" && (
        <Modal title={editItem ? "Edit" : "New"} onClose={() => { setShowCreate(false); setEditItem(null); setForm({}); }}>
          {tab === "meals" && (
            <>
              <InputField label="User ID" value={form.user_id || ""} onChange={v => setForm(f => ({ ...f, user_id: v }))} required />
              <InputField label="Food Name" value={form.meal_name || ""} onChange={v => setForm(f => ({ ...f, meal_name: v }))} required />
              <div className="mb-4">
                <label className="block text-slate-400 text-sm mb-1">Meal Type <span className="text-red-400">*</span></label>
                <select value={form.meal_type || ""} onChange={e => setForm(f => ({ ...f, meal_type: e.target.value }))}
                  className="w-full border border-purple-800/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" style={{ backgroundColor: BRAND.panelLight }}>
                  <option value="">Select meal type</option>
                  <option value="breakfast">Breakfast</option>
                  <option value="lunch">Lunch</option>
                  <option value="dinner">Dinner</option>
                  <option value="snack">Snack</option>
                  <option value="pre_workout">Pre Workout</option>
                  <option value="post_workout">Post Workout</option>
                </select>
              </div>
              <InputField label="Portion Size (grams)" value={form.portion_size_g || ""} onChange={v => setForm(f => ({ ...f, portion_size_g: v }))} type="number" required />
              <InputField label="Meal Date" value={form.meal_date || new Date().toISOString().split('T')[0]} onChange={v => setForm(f => ({ ...f, meal_date: v }))} type="date" required />
              <div className="mb-4">
                <label className="block text-slate-400 text-sm mb-1">Source</label>
                <select value={form.source || "manual"} onChange={e => setForm(f => ({ ...f, source: e.target.value }))}
                  className="w-full border border-purple-800/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" style={{ backgroundColor: BRAND.panelLight }}>
                  <option value="manual">Manual Entry</option>
                  <option value="voice">Voice Command</option>
                  <option value="barcode">Barcode Scan</option>
                  <option value="photo">Photo Recognition</option>
                </select>
              </div>
              <p className="text-xs text-slate-500 mb-3 mt-4 uppercase tracking-widest font-bold border-t border-purple-800/40 pt-3">Nutrition (auto-calculated by AI, or enter manually)</p>
              <div className="grid grid-cols-2 gap-3">
                <InputField label="Total Calories" value={form.total_calories || ""} onChange={v => setForm(f => ({ ...f, total_calories: v }))} type="number" />
                <InputField label="Total Protein (g)" value={form.total_protein || ""} onChange={v => setForm(f => ({ ...f, total_protein: v }))} type="number" />
                <InputField label="Total Carbs (g)" value={form.total_carbs || ""} onChange={v => setForm(f => ({ ...f, total_carbs: v }))} type="number" />
                <InputField label="Total Fats (g)" value={form.total_fats || ""} onChange={v => setForm(f => ({ ...f, total_fats: v }))} type="number" />
                <InputField label="Total Fiber (g)" value={form.total_fiber || ""} onChange={v => setForm(f => ({ ...f, total_fiber: v }))} type="number" />
                <InputField label="Total Sugar (g)" value={form.total_sugar || ""} onChange={v => setForm(f => ({ ...f, total_sugar: v }))} type="number" />
              </div>
              <InputField label="Total Sodium (mg)" value={form.total_sodium || ""} onChange={v => setForm(f => ({ ...f, total_sodium: v }))} type="number" />
              <div className="mb-4">
                <label className="block text-slate-400 text-sm mb-1">Notes</label>
                <textarea value={form.notes || ""} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2}
                  className="w-full border border-purple-800/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" style={{ backgroundColor: BRAND.panelLight }}
                  placeholder="Optional notes about the meal..." />
              </div>
              <div className="mb-4 flex items-center gap-3">
                <input type="checkbox" checked={!!form.estimated} onChange={e => setForm(f => ({ ...f, estimated: e.target.checked }))} id="meal_estimated" />
                <label htmlFor="meal_estimated" className="text-slate-400 text-sm">Portion size is estimated</label>
              </div>
            </>
          )}
          {tab === "dailyProgress" && ["user_id", "progress_date", "target_calories", "consumed_calories", "target_protein", "consumed_protein", "target_carbs", "consumed_carbs", "target_fat", "consumed_fat", "water_intake_liters", "meals_logged"].map(k => (
            <InputField key={k} label={k.replace(/_/g, " ")} value={form[k] || ""} onChange={v => setForm(f => ({ ...f, [k]: v }))} />
          ))}
          {tab === "weeklyPlans" && ["user_id", "plan_name", "week_start_date", "description", "target_calories", "target_protein", "target_carbs", "target_fat"].map(k => (
            <InputField key={k} label={k.replace(/_/g, " ")} value={form[k] || ""} onChange={v => setForm(f => ({ ...f, [k]: v }))} />
          ))}
          <div className="flex gap-3 justify-end">
            <Btn onClick={() => { setShowCreate(false); setEditItem(null); }} color="gray">Cancel</Btn>
            <Btn onClick={saveItem}>{editItem ? "Update" : "Create"}</Btn>
          </div>
        </Modal>
      )}
      {confirmDel && <ConfirmModal message="Delete this item?" onConfirm={() => doDelete(confirmDel)} onCancel={() => setConfirmDel(null)} />}
    </div>
  );
}

export default NutritionView;
