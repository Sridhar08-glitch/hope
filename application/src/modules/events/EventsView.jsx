import { useState, useEffect, useCallback } from "react";
import { Eye, Check, X, Edit, Trash2, Filter } from "lucide-react";
import BRAND from "../../constants/brand";
import { LoadingSpinner, Btn, Modal, ConfirmModal, InputField } from "../../components/ui";
import adminApi from "../../services/adminApi";
import EventDetailView from "./EventDetailView";

function EventsView({ token, showToast }) {
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedIds, setSelectedIds] = useState([]);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmDel, setConfirmDel] = useState(null);
  const [editEvent, setEditEvent] = useState(null);
  const [editForm, setEditForm] = useState({});

  const load = useCallback(async (url = null) => {
    setLoading(true);
    try {
      const res = url ? await adminApi.events.listUrl(token, url) : await adminApi.events.list(token, statusFilter ? { status: statusFilter } : {});
      setEvents(res?.results || []);
      setNextUrl(res?.next || null);
      setPrevUrl(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    finally { setLoading(false); }
  }, [token, statusFilter, showToast]);

  useEffect(() => { load(); }, [load]);

  function toggleSelect(id) { setSelectedIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); }
  async function approve(id) {
    try { await adminApi.events.approve(token, id); showToast("Event approved", "success"); load(); }
    catch (err) { showToast(err.message, "error"); }
  }
  async function doReject() {
    try { await adminApi.events.reject(token, rejectModal, rejectReason); showToast("Event rejected", "success"); setRejectModal(null); setRejectReason(""); load(); }
    catch (err) { showToast(err.message, "error"); }
  }
  async function doDelete(id) {
    try { await adminApi.events.delete(token, id); showToast("Event deleted", "success"); setConfirmDel(null); load(); }
    catch (err) { showToast(err.message, "error"); }
  }
  async function bulkAction(action) {
    if (!selectedIds.length) return;
    try { await adminApi.events.bulkAction(token, selectedIds, action); showToast(`Bulk ${action} done`, "success"); setSelectedIds([]); load(); }
    catch (err) { showToast(err.message, "error"); }
  }
  async function saveEvent() {
    try {
      await adminApi.events.update(token, editEvent.id, editForm);
      showToast("Event updated", "success");
      setEditEvent(null); setEditForm({});
      load();
    } catch (err) { showToast(err.message, "error"); }
  }

  const statusTabs = [["", "All"], ["pending", "Pending"], ["approved", "Approved"], ["rejected", "Rejected"]];
  if (selectedEventId) return <EventDetailView token={token} showToast={showToast} eventId={selectedEventId} onBack={() => setSelectedEventId(null)} />;

  return (
    <div className="space-y-6 flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Events Management</h1>
          <p className="mt-1 text-sm" style={{ color: BRAND.textMuted }}>Approve and monitor platform events.</p>
        </div>
        <div className="flex gap-3">
          <button style={{ backgroundColor: BRAND.panelLight, color: BRAND.textMain }}
            className="px-4 py-2 flex items-center rounded-lg hover:opacity-80 transition shadow-lg">
            <Filter size={16} className="mr-2" /> Filters
          </button>
          <button style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}
            className="px-4 py-2 font-bold rounded-lg hover:opacity-90 transition shadow-lg">
            Export CSV
          </button>
        </div>
      </div>

      {/* Table Panel */}
      <div className="rounded-2xl border border-white/5 flex-1 overflow-hidden flex flex-col shadow-xl" style={{ backgroundColor: BRAND.panel }}>
        {/* Tab Bar */}
        <div className="flex border-b" style={{ borderColor: BRAND.panelLight }}>
          {statusTabs.map(([v, l]) => (
            <button key={v} onClick={() => setStatusFilter(v)}
              className="px-6 py-4 text-sm font-bold uppercase tracking-wider transition"
              style={{ color: statusFilter === v ? BRAND.accent : BRAND.textMuted, borderBottom: statusFilter === v ? `2px solid ${BRAND.accent}` : "2px solid transparent", backgroundColor: statusFilter === v ? "rgba(255,255,255,0.05)" : "transparent" }}>
              {l}
            </button>
          ))}
        </div>

        {selectedIds.length > 0 && (
          <div className="px-4 py-3 border-b flex gap-3 items-center" style={{ borderColor: BRAND.panelLight, backgroundColor: "rgba(0,0,0,0.2)" }}>
            <span className="text-slate-400 text-sm">{selectedIds.length} selected</span>
            <Btn onClick={() => bulkAction("approve")} color="green" small>Approve All</Btn>
            <Btn onClick={() => bulkAction("reject")} color="red" small>Reject All</Btn>
            <Btn onClick={() => bulkAction("delete")} color="red" small>Delete All</Btn>
          </div>
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8"><LoadingSpinner /></div>
        ) : (
          <>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-xs uppercase tracking-wider" style={{ backgroundColor: BRAND.panelLight, color: BRAND.textMuted }}>
                    <th className="p-4 font-medium w-10"><input type="checkbox" onChange={e => setSelectedIds(e.target.checked ? events.map(ev => ev.id) : [])} checked={selectedIds.length === events.length && events.length > 0} /></th>
                    <th className="p-4 font-medium">Date</th>
                    <th className="p-4 font-medium">Title</th>
                    <th className="p-4 font-medium">Organizer</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-white/5">
                  {events.map(e => (
                    <tr key={e.id} className="hover:bg-black/20 transition group">
                      <td className="p-4"><input type="checkbox" checked={selectedIds.includes(e.id)} onChange={() => toggleSelect(e.id)} /></td>
                      <td className="p-4 text-gray-300">{e.event_date ? new Date(e.event_date).toLocaleDateString() : "—"}</td>
                      <td className="p-4"><span className="font-bold text-white">{e.title}</span></td>
                      <td className="p-4 text-gray-300">{e.organizer_name || e.organizer || "—"}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          e.status === "approved" ? "bg-green-500/20 text-green-400" :
                          e.status === "rejected" ? "bg-red-500/20 text-red-400" :
                          "bg-yellow-500/20 text-yellow-400"
                        }`}>{e.status}</span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => setSelectedEventId(e.id)} className="p-2 hover:bg-white/10 rounded-lg transition" style={{ color: BRAND.accent }} title="View"><Eye size={15} /></button>
                          {e.status === "pending" && <button onClick={() => approve(e.id)} className="p-2 hover:bg-green-500/20 rounded-lg transition text-green-400" title="Approve"><Check size={15} /></button>}
                          {e.status === "pending" && <button onClick={() => setRejectModal(e.id)} className="p-2 hover:bg-red-500/20 rounded-lg transition text-red-400" title="Reject"><X size={15} /></button>}
                          <button onClick={() => { setEditEvent(e); setEditForm({ title: e.title, description: e.description || "", event_date: e.event_date || "" }); }} className="p-2 hover:bg-white/10 rounded-lg transition" style={{ color: BRAND.textMuted }} title="Edit"><Edit size={15} /></button>
                          <button onClick={() => setConfirmDel(e.id)} className="p-2 hover:bg-red-500/20 rounded-lg transition text-red-400" title="Delete"><Trash2 size={15} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t flex justify-between items-center text-sm" style={{ borderColor: BRAND.panelLight, color: BRAND.textMuted }}>
              <span>Showing {events.length} entries</span>
              <div className="flex gap-2">
                <button onClick={() => load(prevUrl)} disabled={!prevUrl} className="px-3 py-1 rounded-lg bg-black/30 hover:bg-black/50 transition text-white disabled:opacity-40">Previous</button>
                <button onClick={() => load(nextUrl)} disabled={!nextUrl} className="px-3 py-1 rounded-lg bg-black/30 hover:bg-black/50 transition text-white disabled:opacity-40">Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {editEvent && (
        <Modal title="Edit Event" onClose={() => { setEditEvent(null); setEditForm({}); }}>
          <InputField label="Title" value={editForm.title || ""} onChange={v => setEditForm(f => ({ ...f, title: v }))} />
          <InputField label="Event Date" value={editForm.event_date || ""} onChange={v => setEditForm(f => ({ ...f, event_date: v }))} type="date" />
          <div className="mb-4">
            <label className="block text-slate-400 text-sm mb-1">Description</label>
            <textarea value={editForm.description || ""} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={3}
              className="w-full border border-purple-800/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" style={{ backgroundColor: BRAND.panelLight }} />
          </div>
          <div className="flex gap-3 justify-end">
            <Btn onClick={() => setEditEvent(null)} color="gray">Cancel</Btn>
            <Btn onClick={saveEvent}>Save</Btn>
          </div>
        </Modal>
      )}
      {rejectModal && (
        <Modal title="Reject Event" onClose={() => { setRejectModal(null); setRejectReason(""); }}>
          <div className="mb-4">
            <label className="block text-slate-400 text-sm mb-1">Reason</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              className="w-full border border-purple-800/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none h-24 resize-none" style={{ backgroundColor: BRAND.cardLight }} />
          </div>
          <div className="flex gap-3 justify-end">
            <Btn onClick={() => setRejectModal(null)} color="gray">Cancel</Btn>
            <Btn onClick={doReject} color="red">Reject</Btn>
          </div>
        </Modal>
      )}
      {confirmDel && <ConfirmModal message="Delete this event?" onConfirm={() => doDelete(confirmDel)} onCancel={() => setConfirmDel(null)} />}
    </div>
  );
}

export default EventsView;
