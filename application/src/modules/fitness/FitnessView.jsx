import { useState, useEffect, useCallback } from "react";
import { Download, Plus, Edit, Trash2 } from "lucide-react";
import BRAND from "../../constants/brand";
import { LoadingSpinner, TableWrap, TR, TD, Btn, Pagination, Modal, ConfirmModal, InputField } from "../../components/ui";
import { downloadExport } from "../../utils/downloadExport";
import adminApi from "../../services/adminApi";

function FitnessView({ token, showToast }) {
  const [tab, setTab] = useState("records");
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
  const [importFile, setImportFile] = useState(null);

  const load = useCallback(async (url = null) => {
    setLoading(true);
    try {
      const api = tab === "records" ? adminApi.fitness.records : adminApi.fitness.sessions;
      const res = url ? await api.listUrl(token, url) : await api.list(token, tab === "records" ? filters : {});
      setItems(res?.results || []);
      setNextUrl(res?.next || null);
      setPrevUrl(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    finally { setLoading(false); }
  }, [token, tab, filters, showToast]);

  useEffect(() => { if (tab !== "stats") load(); setSelectedIds([]); }, [load, tab]);

  useEffect(() => {
    adminApi.fitness.filterOptions(token).then(r => setFilterOptions(r || {})).catch(() => {});
  }, [token]);

  useEffect(() => {
    if (tab === "stats") {
      adminApi.fitness.stats(token).then(setStats).catch(() => {});
    }
  }, [tab, token]);

  function toggleSelect(id) { setSelectedIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); }

  async function doDelete(id) {
    try {
      if (tab === "records") await adminApi.fitness.records.delete(token, id);
      else await adminApi.fitness.sessions.delete(token, id);
      showToast("Deleted", "success"); setConfirmDel(null); load();
    } catch (err) { showToast(err.message, "error"); }
  }

  async function bulkDelete() {
    if (!selectedIds.length) return;
    try {
      await adminApi.fitness.records.bulkDelete(token, selectedIds);
      showToast(`Deleted ${selectedIds.length}`, "success"); setSelectedIds([]); load();
    } catch (err) { showToast(err.message, "error"); }
  }

  async function saveRecord() {
    try {
      if (editItem) { await adminApi.fitness.records.update(token, editItem.id, form); showToast("Updated", "success"); }
      else { await adminApi.fitness.records.create(token, form); showToast("Created", "success"); }
      setEditItem(null); setShowCreate(false); setForm({}); load();
    } catch (err) { showToast(err.message, "error"); }
  }

  async function bulkImport() {
    if (!importFile) return;
    try {
      await adminApi.fitness.records.bulkImport(token, importFile);
      showToast("Import successful", "success");
      setImportFile(null);
      load();
    } catch (err) { showToast(err.message, "error"); }
  }

  function openEdit(item) { setEditItem(item); setForm({ user_id: item.user_id || item.user || "", date: item.date || "", steps: item.steps || "", distance_km: item.distance_km || "", calories: item.calories || "", active_minutes: item.active_minutes || "" }); }

  const filterKeys = Object.keys(filterOptions).slice(0, 4);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Fitness Records</h1>
          <p className="mt-1 text-sm" style={{ color: BRAND.textMuted }}>Global activity sessions and workout tracking.</p>
        </div>
        {tab === "records" && (
          <div className="flex gap-2 items-center flex-wrap">
            <button onClick={() => downloadExport(token, adminApi.fitness.records.exportUrl(), 'fitness_records.csv').catch(e => showToast(e.message, "error"))}
              style={{ backgroundColor: BRAND.panelLight, color: BRAND.textMain }}
              className="px-4 py-2 flex items-center rounded-lg hover:opacity-80 transition shadow-lg text-sm">
              <Download size={14} className="mr-2" /> Export
            </button>
            <label className="cursor-pointer">
              <span className="px-4 py-2 text-sm bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors flex items-center gap-2"><Download size={14} />Import CSV</span>
              <input type="file" accept=".csv" className="hidden" onChange={e => { setImportFile(e.target.files[0]); }} />
            </label>
            {importFile && <Btn onClick={bulkImport} color="blue" small>Upload: {importFile.name}</Btn>}
            <button onClick={() => { setForm({}); setShowCreate(true); }}
              style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}
              className="px-4 py-2 font-bold rounded-lg hover:opacity-90 transition shadow-lg flex items-center gap-2 text-sm">
              <Plus size={14} /> Add Record
            </button>
          </div>
        )}
      </div>
      <div className="flex gap-0 border-b" style={{ borderColor: BRAND.panelLight }}>
        {["records", "sessions", "stats"].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="px-6 py-3 text-sm font-bold uppercase tracking-wider capitalize transition"
            style={{ color: tab === t ? BRAND.accent : BRAND.textMuted, borderBottom: tab === t ? `2px solid ${BRAND.accent}` : "2px solid transparent" }}>{t}</button>
        ))}
      </div>

      {tab === "records" && filterKeys.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {filterKeys.map(k => (
            <select key={k} value={filters[k] || ""} onChange={e => setFilters(f => ({ ...f, [k]: e.target.value || undefined }))}
              className="bg-white/5 border border-purple-900/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
              <option value="">{k.replace(/_/g, " ")}</option>
              {(filterOptions[k] || []).map(o => <option key={o?.value ?? o} value={o?.value ?? o}>{o?.label ?? o}</option>)}
            </select>
          ))}
          <Btn onClick={() => setFilters({})} color="gray" small>Clear</Btn>
        </div>
      )}

      {tab === "records" && selectedIds.length > 0 && (
        <div className="flex gap-2 rounded-xl p-3 border border-purple-900/40" style={{ backgroundColor: BRAND.card }}>
          <span className="text-slate-400 text-sm">{selectedIds.length} selected</span>
          <Btn onClick={bulkDelete} color="red" small>Bulk Delete</Btn>
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
            {stats.monthly && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">This Month</p>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  {Object.entries(stats.monthly).map(([k, v]) => (
                    <div key={k} className="rounded-xl p-4 border border-purple-900/40" style={{ backgroundColor: BRAND.card }}>
                      <p className="text-slate-400 text-xs mb-1">{k.replace(/_/g, " ")}</p>
                      <p className="text-white text-xl font-bold">{String(v)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {stats.top_users?.length > 0 && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Top Users</p>
                <TableWrap cols={["User", "Steps", "Calories", "Records"]}>
                  {stats.top_users.map((u, i) => (
                    <TR key={i}>
                      <TD>{u.user_name || u.username || "—"}</TD>
                      <TD>{u.total_steps ?? "—"}</TD>
                      <TD>{u.total_calories ?? "—"}</TD>
                      <TD>{u.total_records ?? "—"}</TD>
                    </TR>
                  ))}
                </TableWrap>
              </div>
            )}
            {stats.daily_average?.length > 0 && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Daily Average</p>
                <TableWrap cols={["Date", "Steps", "Calories"]}>
                  {stats.daily_average.map((d, i) => (
                    <TR key={i}>
                      <TD>{d.date || "—"}</TD>
                      <TD>{d.avg_steps ?? d.total_steps ?? "—"}</TD>
                      <TD>{d.avg_calories ?? d.total_calories ?? "—"}</TD>
                    </TR>
                  ))}
                </TableWrap>
              </div>
            )}
            {stats.activity_distribution?.length > 0 && (
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-widest mb-2">Activity Distribution</p>
                <TableWrap cols={["Activity", "Count"]}>
                  {stats.activity_distribution.map((a, i) => (
                    <TR key={i}>
                      <TD>{a.activity_type || a.type || a.name || "—"}</TD>
                      <TD>{a.count ?? "—"}</TD>
                    </TR>
                  ))}
                </TableWrap>
              </div>
            )}
          </div>
        ) : <LoadingSpinner />
      ) : loading ? <LoadingSpinner /> : (
        <>
          {tab === "records" && (
            <TableWrap cols={["", "User", "Steps", "Distance (km)", "Calories", "Active Min", "Date", "Actions"]}>
              {items.map(r => (
                <TR key={r.id}>
                  <TD><input type="checkbox" checked={selectedIds.includes(r.id)} onChange={() => toggleSelect(r.id)} /></TD>
                  <TD>{r.user_name || r.user || "—"}</TD>
                  <TD>{r.steps ?? "—"}</TD>
                  <TD>{r.distance_km ?? "—"}</TD>
                  <TD>{r.calories ?? "—"}</TD>
                  <TD>{r.active_minutes ?? "—"}</TD>
                  <TD>{r.date ? new Date(r.date).toLocaleDateString() : "—"}</TD>
                  <TD>
                    <div className="flex gap-1">
                      <Btn onClick={() => openEdit(r)} color="gray" small><Edit size={12} /></Btn>
                      <Btn onClick={() => setConfirmDel(r.id)} color="red" small><Trash2 size={12} /></Btn>
                    </div>
                  </TD>
                </TR>
              ))}
            </TableWrap>
          )}
          {tab === "sessions" && (
            <TableWrap cols={["User", "Activity", "Duration", "Calories", "Date", "Actions"]}>
              {items.map(s => (
                <TR key={s.id}>
                  <TD>{s.user_name || s.user || "—"}</TD>
                  <TD>{s.activity_type || s.activity || "—"}</TD>
                  <TD>{s.duration_minutes ? `${s.duration_minutes}m` : "—"}</TD>
                  <TD>{s.calories_burned ?? "—"}</TD>
                  <TD>{s.date ? new Date(s.date).toLocaleDateString() : "—"}</TD>
                  <TD><Btn onClick={() => setConfirmDel(s.id)} color="red" small><Trash2 size={12} /></Btn></TD>
                </TR>
              ))}
            </TableWrap>
          )}
          <Pagination nextUrl={nextUrl} prevUrl={prevUrl} onNext={() => load(nextUrl)} onPrev={() => load(prevUrl)} />
        </>
      )}

      {(showCreate || editItem) && (
        <Modal title={editItem ? "Edit Record" : "New Record"} onClose={() => { setShowCreate(false); setEditItem(null); setForm({}); }}>
          {["user_id", "date", "steps", "distance_km", "calories", "active_minutes"].map(k => (
            <InputField key={k} label={k.replace(/_/g, " ")} value={form[k] || ""} onChange={v => setForm(f => ({ ...f, [k]: v }))} />
          ))}
          <div className="flex gap-3 justify-end">
            <Btn onClick={() => { setShowCreate(false); setEditItem(null); }} color="gray">Cancel</Btn>
            <Btn onClick={saveRecord}>{editItem ? "Update" : "Create"}</Btn>
          </div>
        </Modal>
      )}
      {confirmDel && <ConfirmModal message="Delete this item?" onConfirm={() => doDelete(confirmDel)} onCancel={() => setConfirmDel(null)} />}
    </div>
  );
}

export default FitnessView;
