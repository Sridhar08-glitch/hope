import { useState, useEffect, useCallback } from "react";
import { Search, Download, Plus, Edit, Trash2, RefreshCw, Filter } from "lucide-react";
import BRAND from "../../constants/brand";
import { LoadingSpinner, Btn, Modal, ConfirmModal, InputField } from "../../components/ui";
import { downloadExport } from "../../utils/downloadExport";
import adminApi from "../../services/adminApi";
import EditUserModal from "./EditUserModal";

function UsersView({ token, showToast, onSelectUser }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [search, setSearch] = useState("");
  const [filterOptions, setFilterOptions] = useState({});
  const [filters, setFilters] = useState({});
  const [selectedIds, setSelectedIds] = useState([]);
  const [editUser, setEditUser] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);
  const [bulkRole, setBulkRole] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ first_name: "", last_name: "", email: "", role: "user", password: "" });

  const load = useCallback(async (url = null) => {
    setLoading(true);
    try {
      const res = url
        ? await adminApi.users.listUrl(token, url)
        : await adminApi.users.list(token, { search, ...filters });
      setUsers(res?.results || res?.users || []);
      setNextUrl(res?.next || null);
      setPrevUrl(res?.previous || null);
    } catch (err) {
      if (err.status === 401) throw err;
      showToast(err.message, "error");
    } finally { setLoading(false); }
  }, [token, search, filters, showToast]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    adminApi.users.filterOptions(token).then(r => setFilterOptions(r || {})).catch(() => { });
  }, [token]);

  function toggleSelect(id) {
    setSelectedIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }
  async function doDelete(id) {
    try {
      await adminApi.users.delete(token, id);
      showToast("User deleted", "success");
      load();
    } catch (err) { showToast(err.message, "error"); }
    setConfirmDel(null);
  }
  async function bulkDelete() {
    if (!selectedIds.length) return;
    try {
      await adminApi.users.bulkDelete(token, selectedIds);
      showToast(`Deleted ${selectedIds.length} users`, "success");
      setSelectedIds([]);
      load();
    } catch (err) { showToast(err.message, "error"); }
  }
  async function doBulkRole() {
    if (!selectedIds.length || !bulkRole) return;
    try {
      await adminApi.users.bulkRoleUpdate(token, selectedIds, bulkRole);
      showToast(`Updated role for ${selectedIds.length} users`, "success");
      setSelectedIds([]);
      setBulkRole("");
      load();
    } catch (err) { showToast(err.message, "error"); }
  }
  async function resetPassword(id) {
    try {
      const res = await adminApi.users.resetPassword(token, id);
      showToast(res?.message || "Password reset email sent", "success");
    } catch (err) { showToast(err.message, "error"); }
  }
  async function createUser() {
    try {
      await adminApi.users.create(token, createForm);
      showToast("User created", "success");
      setShowCreate(false);
      setCreateForm({ first_name: "", last_name: "", email: "", role: "user", password: "" });
      load();
    } catch (err) { showToast(err.message, "error"); }
  }
  function setFilter(k, v) { setFilters(f => ({ ...f, [k]: v })); }

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">User Management</h1>
          <p className="mt-1 text-sm" style={{ color: BRAND.textMuted }}>Manage global user accounts, roles, and access.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowFilters(f => !f)}
            style={{ backgroundColor: BRAND.panelLight, color: BRAND.textMain }}
            className="px-4 py-2 flex items-center rounded-lg hover:opacity-80 transition shadow-lg">
            <Filter size={16} className="mr-2" /> Filters
          </button>
          <button onClick={() => downloadExport(token, adminApi.users.exportUrl(), 'users.csv').catch(e => showToast(e.message, "error"))}
            style={{ backgroundColor: BRAND.panelLight, color: BRAND.textMain }}
            className="px-4 py-2 flex items-center rounded-lg hover:opacity-80 transition shadow-lg">
            <Download size={16} className="mr-2" /> Export CSV
          </button>
          <button onClick={() => setShowCreate(true)}
            style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}
            className="px-4 py-2 font-bold rounded-lg hover:opacity-90 transition shadow-lg flex items-center gap-2">
            <Plus size={16} /> New User
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="rounded-xl p-4 grid grid-cols-2 md:grid-cols-4 gap-3 border border-white/5" style={{ backgroundColor: BRAND.card }}>
          {[["role", "Role", filterOptions.roles], ["fitness_goal", "Goal", filterOptions.fitness_goals], ["fitness_level", "Level", filterOptions.fitness_levels]].map(([k, label, opts]) => (
            <div key={k}>
              <label className="text-slate-400 text-xs mb-1 block">{label}</label>
              <select value={filters[k] || ""} onChange={e => setFilter(k, e.target.value)}
                className="w-full border border-purple-800/40 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none" style={{ backgroundColor: BRAND.cardLight }}>
                <option value="">All</option>
                {(opts || []).map(o => <option key={o?.value ?? o} value={o?.value ?? o}>{o?.label ?? o}</option>)}
              </select>
            </div>
          ))}
          <div className="flex items-end">
            <Btn onClick={() => setFilters({})} color="gray" small>Clear</Btn>
          </div>
        </div>
      )}

      {selectedIds.length > 0 && (
        <div className="rounded-xl p-3 flex flex-wrap gap-3 items-center border border-white/5" style={{ backgroundColor: BRAND.card }}>
          <span className="text-slate-400 text-sm">{selectedIds.length} selected</span>
          <Btn onClick={bulkDelete} color="red" small>Bulk Delete</Btn>
          <select value={bulkRole} onChange={e => setBulkRole(e.target.value)}
            className="border border-purple-800/40 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none" style={{ backgroundColor: BRAND.cardLight }}>
            <option value="">Set Role…</option>
            {["user", "trainer", "admin"].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          {bulkRole && <Btn onClick={doBulkRole} color="purple" small>Apply Role</Btn>}
        </div>
      )}

      {/* Table Panel */}
      <div className="rounded-2xl border border-white/5 flex-1 overflow-hidden flex flex-col shadow-xl" style={{ backgroundColor: BRAND.panel }}>
        {/* Search Bar */}
        <div className="p-4 border-b" style={{ borderColor: BRAND.panelLight }}>
          <div className="relative w-full md:w-96">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: BRAND.textMuted }} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by email, name, or ID..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-black/30 border focus:outline-none focus:ring-2 text-white text-sm"
              style={{ borderColor: BRAND.panelLight }} />
          </div>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center"><LoadingSpinner /></div>
        ) : (
          <>
            <div className="overflow-x-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-sm uppercase tracking-wider" style={{ backgroundColor: BRAND.panelLight, color: BRAND.textMuted }}>
                    <th className="p-4 font-medium w-10"><input type="checkbox" onChange={e => setSelectedIds(e.target.checked ? users.map(u => u.id) : [])} checked={selectedIds.length === users.length && users.length > 0} /></th>
                    <th className="p-4 font-medium">User</th>
                    <th className="p-4 font-medium">Role</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">XP / Streak</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="text-sm divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-black/20 transition group">
                      <td className="p-4">
                        <input type="checkbox" checked={selectedIds.includes(u.id)} onChange={() => toggleSelect(u.id)} />
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0"
                            style={{ backgroundColor: BRAND.primary, color: BRAND.accent }}>
                            {(u.first_name?.[0] || u.email?.[0] || "?").toUpperCase()}
                          </div>
                          <div>
                            <p className="font-bold text-white text-base">{u.full_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.email}</p>
                            <p className="text-xs" style={{ color: BRAND.textMuted }}>{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${
                          u.role === "admin" ? "bg-purple-500/20 text-purple-400 border-purple-500/30" :
                          u.role === "trainer" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" :
                          "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        }`}>{u.role}</span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${u.is_active ? "bg-emerald-500" : "bg-red-500"}`}></div>
                          <span style={{ color: BRAND.textMuted }}>{u.is_active ? "Active" : "Inactive"}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-white font-medium">{u.xp != null ? `${u.xp.toLocaleString()} XP` : "—"}</div>
                        <div className="text-xs" style={{ color: BRAND.accent }}>{u.streak != null ? `${u.streak} Days 🔥` : "—"}</div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => onSelectUser(u.id)}
                            className="px-4 py-2 text-sm font-bold rounded-lg border hover:bg-white/10 transition"
                            style={{ borderColor: BRAND.panelLight, color: BRAND.accent }}>
                            View
                          </button>
                          <button onClick={() => setEditUser(u)} className="p-2 hover:bg-white/10 rounded-lg transition" style={{ color: BRAND.textMuted }} title="Edit">
                            <Edit size={15} />
                          </button>
                          <button onClick={() => resetPassword(u.id)} className="p-2 hover:bg-white/10 rounded-lg transition" style={{ color: BRAND.textMuted }} title="Reset Password">
                            <RefreshCw size={15} />
                          </button>
                          <button onClick={() => setConfirmDel(u.id)} className="p-2 hover:bg-red-500/20 rounded-lg transition text-red-400" title="Delete">
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
              <span>Showing {users.length} entries</span>
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

      {editUser && <EditUserModal token={token} user={editUser} onClose={() => setEditUser(null)} onSaved={() => { setEditUser(null); load(); }} showToast={showToast} />}
      {confirmDel && <ConfirmModal message="Delete this user permanently?" onConfirm={() => doDelete(confirmDel)} onCancel={() => setConfirmDel(null)} />}
      {showCreate && (
        <Modal title="Create User" onClose={() => setShowCreate(false)}>
          <InputField label="First Name" value={createForm.first_name} onChange={v => setCreateForm(f => ({ ...f, first_name: v }))} />
          <InputField label="Last Name" value={createForm.last_name} onChange={v => setCreateForm(f => ({ ...f, last_name: v }))} />
          <InputField label="Email" value={createForm.email} onChange={v => setCreateForm(f => ({ ...f, email: v }))} type="email" required />
          <InputField label="Password" value={createForm.password} onChange={v => setCreateForm(f => ({ ...f, password: v }))} type="password" required />
          <div className="mb-4">
            <label className="block text-slate-400 text-sm mb-1">Role</label>
            <select value={createForm.role} onChange={e => setCreateForm(f => ({ ...f, role: e.target.value }))} className="w-full border border-purple-800/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" style={{ backgroundColor: BRAND.cardLight }}>
              {["user", "trainer", "admin"].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="flex gap-3 justify-end">
            <Btn onClick={() => setShowCreate(false)} color="gray">Cancel</Btn>
            <Btn onClick={createUser}>Create</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default UsersView;
