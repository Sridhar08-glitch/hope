import { useState, useEffect, useCallback } from "react";
import { Download, Plus, Edit, Trash2, RefreshCw } from "lucide-react";
import BRAND from "../../constants/brand";
import { LoadingSpinner, TableWrap, TR, TD, Badge, Btn, Pagination, Modal, ConfirmModal, InputField } from "../../components/ui";
import { downloadExport } from "../../utils/downloadExport";
import adminApi from "../../services/adminApi";

function RecoveryView({ token, showToast }) {
  const [tab, setTab] = useState("sessions");
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

  const load = useCallback(async (url = null) => {
    setLoading(true);
    try {
      const api = tab === "sessions" ? adminApi.recovery.sessions : tab === "wellness" ? adminApi.recovery.wellness : tab === "scores" ? adminApi.recovery.scores : tab === "mobileUsage" ? adminApi.recovery.mobileUsage : adminApi.recovery.types;
      const res = url ? await api.listUrl(token, url) : await api.list(token);
      setItems(res?.results || []);
      setNextUrl(res?.next || null);
      setPrevUrl(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    finally { setLoading(false); }
  }, [token, tab, showToast]);

  useEffect(() => { load(); setSelectedIds([]); }, [load]);

  useEffect(() => {
    adminApi.recovery.filterOptions(token).then(r => setFilterOptions(r || {})).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (tab === "stats") adminApi.recovery.stats(token).then(setStats).catch(() => {});
  }, [tab, token]);

  function toggleSelect(id) { setSelectedIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); }

  async function doDelete(id) {
    try {
      const api = tab === "sessions" ? adminApi.recovery.sessions : tab === "wellness" ? adminApi.recovery.wellness : adminApi.recovery.types;
      await api.delete(token, id); showToast("Deleted", "success"); setConfirmDel(null); load();
    } catch (err) { showToast(err.message, "error"); }
  }

  async function saveItem() {
    try {
      const api = tab === "sessions" ? adminApi.recovery.sessions : tab === "wellness" ? adminApi.recovery.wellness : adminApi.recovery.types;
      if (editItem) { await api.update(token, editItem.id, form); showToast("Updated", "success"); }
      else { await api.create(token, form); showToast("Created", "success"); }
      setEditItem(null); setShowCreate(false); setForm({}); load();
    } catch (err) { showToast(err.message, "error"); }
  }

  async function recalculate(id) {
    try { await adminApi.recovery.scores.recalculate(token, id); showToast("Score recalculated", "success"); load(); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function bulkTypeAction(action) {
    if (!selectedIds.length) return;
    try { await adminApi.recovery.types.bulkAction(token, selectedIds, action); showToast("Done", "success"); setSelectedIds([]); load(); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function bulkDeleteSessions() {
    if (!selectedIds.length) return;
    try { await adminApi.recovery.sessions.bulkDelete(token, selectedIds); showToast("Deleted", "success"); setSelectedIds([]); load(); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function saveMobileUsage() {
    try {
      await adminApi.recovery.mobileUsage.update(token, editItem.id, form);
      showToast("Updated", "success");
      setEditItem(null); setForm({}); load();
    } catch (err) { showToast(err.message, "error"); }
  }

  const canCreate = ["sessions", "wellness", "types"].includes(tab);
  const canExport = tab === "sessions";
  const showFilters = ["sessions", "wellness"].includes(tab) && Object.keys(filterOptions).length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Recovery &amp; Wellness</h1>
          <p className="mt-1 text-sm" style={{ color: BRAND.textMuted }}>Daily wellness scores, sleep logs, and recovery data.</p>
        </div>
        <div className="flex gap-3">
          {canExport && (
            <button onClick={() => downloadExport(token, adminApi.recovery.sessions.exportUrl(), 'recovery_sessions.csv').catch(e => showToast(e.message, "error"))}
              style={{ backgroundColor: BRAND.panelLight, color: BRAND.textMain }}
              className="px-4 py-2 flex items-center rounded-lg hover:opacity-80 transition shadow-lg text-sm">
              <Download size={14} className="mr-2" /> Export
            </button>
          )}
          {canCreate && (
            <button onClick={() => { setForm({}); setShowCreate(true); }}
              style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}
              className="px-4 py-2 font-bold rounded-lg hover:opacity-90 transition shadow-lg flex items-center gap-2 text-sm">
              <Plus size={14} /> Add
            </button>
          )}
        </div>
      </div>
      <div className="flex gap-0 border-b overflow-x-auto" style={{ borderColor: BRAND.panelLight }}>
        {[["sessions", "Sessions"], ["wellness", "Wellness"], ["scores", "Scores"], ["types", "Types"], ["mobileUsage", "Mobile Usage"], ["stats", "Stats"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className="px-5 py-3 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition"
            style={{ color: tab === v ? BRAND.accent : BRAND.textMuted, borderBottom: tab === v ? `2px solid ${BRAND.accent}` : "2px solid transparent" }}>{l}</button>
        ))}
      </div>
      {tab === "sessions" && selectedIds.length > 0 && (
        <div className="flex gap-2 rounded-xl p-3 items-center border border-purple-900/40" style={{ backgroundColor: BRAND.card }}>
          <span className="text-slate-400 text-sm">{selectedIds.length} selected</span>
          <Btn onClick={bulkDeleteSessions} color="red" small><Trash2 size={12} className="inline mr-1" />Bulk Delete</Btn>
        </div>
      )}
      {tab === "types" && selectedIds.length > 0 && (
        <div className="flex gap-2 rounded-xl p-3 border border-purple-900/40" style={{ backgroundColor: BRAND.card }}>
          <span className="text-slate-400 text-sm">{selectedIds.length} selected</span>
          <Btn onClick={() => bulkTypeAction("activate")} color="green" small>Activate</Btn>
          <Btn onClick={() => bulkTypeAction("deactivate")} color="yellow" small>Deactivate</Btn>
          <Btn onClick={() => bulkTypeAction("delete")} color="red" small>Delete</Btn>
        </div>
      )}
      {showFilters && (
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
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
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
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(stats.today).map(([k, v]) => (
                    <div key={k} className="rounded-xl p-4 border border-purple-900/40" style={{ backgroundColor: BRAND.card }}>
                      <p className="text-slate-400 text-xs mb-1">{k.replace(/_/g, " ")}</p>
                      <p className="text-white text-xl font-bold">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {stats.scores && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Recovery Scores</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  <div className="rounded-xl p-4 border border-purple-900/40" style={{ backgroundColor: BRAND.card }}>
                    <p className="text-slate-400 text-xs mb-1">average recovery score</p>
                    <p className="text-white text-xl font-bold">{String(stats.scores.average_recovery_score ?? "—")}</p>
                  </div>
                  {stats.scores.distribution && Object.entries(stats.scores.distribution).map(([k, v]) => (
                    <div key={k} className="rounded-xl p-4 border border-purple-900/40" style={{ backgroundColor: BRAND.card }}>
                      <p className="text-slate-400 text-xs mb-1">{k} (distribution)</p>
                      <p className="text-white text-xl font-bold">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {stats.wellness_averages && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Wellness Averages</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(stats.wellness_averages).map(([k, v]) => (
                    <div key={k} className="rounded-xl p-4 border border-purple-900/40" style={{ backgroundColor: BRAND.card }}>
                      <p className="text-slate-400 text-xs mb-1">{k.replace(/_/g, " ")}</p>
                      <p className="text-white text-xl font-bold">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {stats.mobile_averages && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Mobile Averages</p>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                  {Object.entries(stats.mobile_averages).map(([k, v]) => (
                    <div key={k} className="rounded-xl p-4 border border-purple-900/40" style={{ backgroundColor: BRAND.card }}>
                      <p className="text-slate-400 text-xs mb-1">{k.replace(/_/g, " ")}</p>
                      <p className="text-white text-xl font-bold">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {stats.weekly_trend?.length > 0 && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Weekly Trend</p>
                <TableWrap cols={["Date", "Sessions", "Coins"]}>
                  {stats.weekly_trend.map((t, i) => (
                    <TR key={i}>
                      <TD>{t.date || "—"}</TD>
                      <TD>{t.sessions ?? "—"}</TD>
                      <TD>{t.coins ?? "—"}</TD>
                    </TR>
                  ))}
                </TableWrap>
              </div>
            )}
            {stats.popular_recovery_types?.length > 0 && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Popular Recovery Types</p>
                <TableWrap cols={["Type", "Sessions"]}>
                  {stats.popular_recovery_types.map((t, i) => (
                    <TR key={i}>
                      <TD>{t.name || t.recovery_type_name || "—"}</TD>
                      <TD>{t.session_count ?? t.count ?? "—"}</TD>
                    </TR>
                  ))}
                </TableWrap>
              </div>
            )}
            {stats.top_users?.length > 0 && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Top Users</p>
                <TableWrap cols={["User", "Sessions", "XP"]}>
                  {stats.top_users.map((u, i) => (
                    <TR key={i}>
                      <TD>{u.user_name || u.username || "—"}</TD>
                      <TD>{u.total_sessions ?? "—"}</TD>
                      <TD>{u.total_xp ?? "—"}</TD>
                    </TR>
                  ))}
                </TableWrap>
              </div>
            )}
          </div>
        ) : <LoadingSpinner />
      ) : loading ? <LoadingSpinner /> : (
        <>
          {tab === "sessions" && (
            <TableWrap cols={["", "User", "Type", "Duration", "Date", "Actions"]}>
              {items.map(s => (
                <TR key={s.id}>
                  <TD><input type="checkbox" checked={selectedIds.includes(s.id)} onChange={() => toggleSelect(s.id)} /></TD>
                  <TD>{s.user_name || s.user || "—"}</TD>
                  <TD>{s.recovery_type_name || s.recovery_type || "—"}</TD>
                  <TD>{s.duration_minutes ? `${s.duration_minutes}m` : "—"}</TD>
                  <TD>{s.date ? new Date(s.date).toLocaleDateString() : "—"}</TD>
                  <TD>
                    <div className="flex gap-1">
                      <Btn onClick={() => { setEditItem(s); setForm(s); }} color="gray" small><Edit size={12} /></Btn>
                      <Btn onClick={() => setConfirmDel(s.id)} color="red" small><Trash2 size={12} /></Btn>
                    </div>
                  </TD>
                </TR>
              ))}
            </TableWrap>
          )}
          {tab === "wellness" && (
            <TableWrap cols={["User", "Date", "Sleep (h)", "Stress", "Energy", "Actions"]}>
              {items.map(w => (
                <TR key={w.id}>
                  <TD>{w.user_name || w.user || "—"}</TD>
                  <TD>{w.date ? new Date(w.date).toLocaleDateString() : "—"}</TD>
                  <TD>{w.sleep_hours ?? "—"}</TD>
                  <TD>{w.stress_level ?? "—"}</TD>
                  <TD>{w.energy_level ?? "—"}</TD>
                  <TD>
                    <div className="flex gap-1">
                      <Btn onClick={() => { setEditItem(w); setForm(w); }} color="gray" small><Edit size={12} /></Btn>
                      <Btn onClick={() => setConfirmDel(w.id)} color="red" small><Trash2 size={12} /></Btn>
                    </div>
                  </TD>
                </TR>
              ))}
            </TableWrap>
          )}
          {tab === "scores" && (
            <TableWrap cols={["User", "Date", "Score", "Actions"]}>
              {items.map(s => (
                <TR key={s.id}>
                  <TD>{s.user_name || s.user || "—"}</TD>
                  <TD>{s.date ? new Date(s.date).toLocaleDateString() : "—"}</TD>
                  <TD><Badge color={s.score >= 70 ? "green" : s.score >= 40 ? "yellow" : "red"}>{s.score ?? "—"}</Badge></TD>
                  <TD><Btn onClick={() => recalculate(s.id)} color="blue" small><RefreshCw size={12} /></Btn></TD>
                </TR>
              ))}
            </TableWrap>
          )}
          {tab === "types" && (
            <TableWrap cols={["", "Name", "Category", "Active", "Actions"]}>
              {items.map(t => (
                <TR key={t.id}>
                  <TD><input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => toggleSelect(t.id)} /></TD>
                  <TD><span className="text-white">{t.name}</span></TD>
                  <TD>{t.category || "—"}</TD>
                  <TD><Badge color={t.is_active ? "green" : "red"}>{t.is_active ? "Active" : "Inactive"}</Badge></TD>
                  <TD>
                    <div className="flex gap-1">
                      <Btn onClick={() => { setEditItem(t); setForm(t); }} color="gray" small><Edit size={12} /></Btn>
                      <Btn onClick={() => setConfirmDel(t.id)} color="red" small><Trash2 size={12} /></Btn>
                    </div>
                  </TD>
                </TR>
              ))}
            </TableWrap>
          )}
          {tab === "mobileUsage" && (
            <TableWrap cols={["User", "Date", "Screen Time (min)", "App Opens", "Actions"]}>
              {items.map(m => (
                <TR key={m.id}>
                  <TD>{m.user_name || m.user || "—"}</TD>
                  <TD>{m.date ? new Date(m.date).toLocaleDateString() : "—"}</TD>
                  <TD>{m.screen_time_minutes ?? m.screen_time ?? "—"}</TD>
                  <TD>{m.app_opens ?? "—"}</TD>
                  <TD><Btn onClick={() => { setEditItem(m); setForm({ screen_time_minutes: m.screen_time_minutes ?? m.screen_time ?? "", app_opens: m.app_opens ?? "", date: m.date ?? "" }); }} color="gray" small><Edit size={12} /></Btn></TD>
                </TR>
              ))}
            </TableWrap>
          )}
          <Pagination nextUrl={nextUrl} prevUrl={prevUrl} onNext={() => load(nextUrl)} onPrev={() => load(prevUrl)} />
        </>
      )}

      {(showCreate || editItem) && (
        <Modal title={editItem ? "Edit" : "New"} onClose={() => { setShowCreate(false); setEditItem(null); setForm({}); }}>
          {tab === "sessions" && ["user_id", "recovery_type_id", "session_date", "duration_minutes", "feeling_before", "feeling_after", "notes"].map(k => (
            <InputField key={k} label={k.replace(/_/g, " ")} value={form[k] || ""} onChange={v => setForm(f => ({ ...f, [k]: v }))} />
          ))}
          {tab === "wellness" && ["user_id", "wellness_date", "mood", "stress_level", "sleep_hours", "sleep_quality", "energy_level", "soreness_level", "hydration_level", "notes"].map(k => (
            <InputField key={k} label={k.replace(/_/g, " ")} value={form[k] || ""} onChange={v => setForm(f => ({ ...f, [k]: v }))} />
          ))}
          {tab === "types" && ["name", "description", "icon", "color", "estimated_duration_minutes"].map(k => (
            <InputField key={k} label={k.replace(/_/g, " ")} value={form[k] || ""} onChange={v => setForm(f => ({ ...f, [k]: v }))} />
          ))}
          {tab === "mobileUsage" && ["screen_time_minutes", "app_opens", "date"].map(k => (
            <InputField key={k} label={k.replace(/_/g, " ")} value={form[k] || ""} onChange={v => setForm(f => ({ ...f, [k]: v }))} />
          ))}
          <div className="flex gap-3 justify-end">
            <Btn onClick={() => { setShowCreate(false); setEditItem(null); setForm({}); }} color="gray">Cancel</Btn>
            <Btn onClick={tab === "mobileUsage" ? saveMobileUsage : saveItem}>{editItem ? "Update" : "Create"}</Btn>
          </div>
        </Modal>
      )}
      {confirmDel && <ConfirmModal message="Delete this item?" onConfirm={() => doDelete(confirmDel)} onCancel={() => setConfirmDel(null)} />}
    </div>
  );
}

export default RecoveryView;
