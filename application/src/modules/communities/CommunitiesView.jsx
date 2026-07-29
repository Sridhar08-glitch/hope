import { useState, useEffect, useCallback } from "react";
import { Edit, Trash2, Filter } from "lucide-react";
import BRAND from "../../constants/brand";
import { LoadingSpinner, Btn, Modal, ConfirmModal, InputField } from "../../components/ui";
import adminApi from "../../services/adminApi";
import CommunityDetailView from "./CommunityDetailView";

function CommunitiesView({ token, showToast }) {
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [confirmDel, setConfirmDel] = useState(null);

  const load = useCallback(async (url = null) => {
    setLoading(true);
    try {
      const res = url ? await adminApi.communities.listUrl(token, url) : await adminApi.communities.list(token);
      setCommunities(res?.results || []);
      setNextUrl(res?.next || null);
      setPrevUrl(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    finally { setLoading(false); }
  }, [token, showToast]);

  useEffect(() => { load(); }, [load]);

  async function saveCommunity() {
    try {
      await adminApi.communities.update(token, editItem.id, editForm);
      showToast("Community updated", "success");
      setEditItem(null); setEditForm({});
      load();
    } catch (err) { showToast(err.message, "error"); }
  }
  async function deleteCommunity(id) {
    try {
      await adminApi.communities.delete(token, id);
      showToast("Community deleted", "success");
      setConfirmDel(null);
      load();
    } catch (err) { showToast(err.message, "error"); }
  }

  if (selectedId) return <CommunityDetailView token={token} showToast={showToast} communityId={selectedId} onBack={() => setSelectedId(null)} />;

  return (
    <div className="space-y-6 flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Community Groups</h1>
          <p className="mt-1 text-sm" style={{ color: BRAND.textMuted }}>Manage public and private communities across the platform.</p>
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
        {loading ? (
          <div className="flex-1 flex items-center justify-center p-8"><LoadingSpinner /></div>
        ) : (
          <>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-sm uppercase tracking-wider" style={{ backgroundColor: BRAND.panelLight, color: BRAND.textMuted }}>
                    <th className="p-4 font-medium">Community Name</th>
                    <th className="p-4 font-medium">Privacy</th>
                    <th className="p-4 font-medium">Members</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-white/5">
                  {communities.map(c => (
                    <tr key={c.id} className="hover:bg-black/20 transition group">
                      <td className="p-4">
                        <p className="font-bold text-white text-base">{c.name}</p>
                        {c.description && <p className="text-xs mt-0.5" style={{ color: BRAND.textMuted }}>{c.description.substring(0, 60)}{c.description.length > 60 ? "…" : ""}</p>}
                      </td>
                      <td className="p-4">
                        <span className="text-gray-300 capitalize">{c.privacy_level || c.privacy || "public"}</span>
                      </td>
                      <td className="p-4">
                        <span className="font-bold" style={{ color: BRAND.accent }}>{c.member_count != null ? c.member_count.toLocaleString() : "—"}</span>
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${c.is_active ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
                          {c.is_active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setSelectedId(c.id)}
                            className="px-4 py-2 text-sm font-bold rounded-lg border hover:bg-white/10 transition"
                            style={{ borderColor: BRAND.panelLight, color: BRAND.accent }}>
                            Manage
                          </button>
                          <button onClick={() => { setEditItem(c); setEditForm({ name: c.name, description: c.description || "", is_active: c.is_active }); }}
                            className="p-2 hover:bg-white/10 rounded-lg transition" style={{ color: BRAND.textMuted }}>
                            <Edit size={15} />
                          </button>
                          <button onClick={() => setConfirmDel(c.id)}
                            className="p-2 hover:bg-red-500/20 rounded-lg transition text-red-400">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 border-t flex justify-between items-center text-sm" style={{ borderColor: BRAND.panelLight, color: BRAND.textMuted }}>
              <span>Showing {communities.length} entries</span>
              <div className="flex gap-2">
                <button onClick={() => load(prevUrl)} disabled={!prevUrl}
                  className="px-3 py-1 rounded-lg bg-black/30 hover:bg-black/50 transition text-white disabled:opacity-40">Previous</button>
                <button onClick={() => load(nextUrl)} disabled={!nextUrl}
                  className="px-3 py-1 rounded-lg bg-black/30 hover:bg-black/50 transition text-white disabled:opacity-40">Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {editItem && (
        <Modal title="Edit Community" onClose={() => { setEditItem(null); setEditForm({}); }}>
          <InputField label="Name" value={editForm.name || ""} onChange={v => setEditForm(f => ({ ...f, name: v }))} />
          <div className="mb-4">
            <label className="block text-slate-400 text-sm mb-1">Description</label>
            <textarea value={editForm.description || ""} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))} rows={3}
              className="w-full border border-purple-800/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" style={{ backgroundColor: BRAND.panelLight }} />
          </div>
          <div className="mb-4 flex items-center gap-3">
            <input type="checkbox" checked={!!editForm.is_active} onChange={e => setEditForm(f => ({ ...f, is_active: e.target.checked }))} id="comm_active" />
            <label htmlFor="comm_active" className="text-slate-400 text-sm">Active</label>
          </div>
          <div className="flex gap-3 justify-end">
            <Btn onClick={() => setEditItem(null)} color="gray">Cancel</Btn>
            <Btn onClick={saveCommunity}>Save</Btn>
          </div>
        </Modal>
      )}
      {confirmDel && <ConfirmModal message="Delete this community permanently?" onConfirm={() => deleteCommunity(confirmDel)} onCancel={() => setConfirmDel(null)} />}
    </div>
  );
}

export default CommunitiesView;
