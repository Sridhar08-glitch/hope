import { useState } from "react";
import BRAND from "../../constants/brand";
import { Modal, InputField, Btn } from "../../components/ui";
import adminApi from "../../services/adminApi";

function EditUserModal({ token, user, onClose, onSaved, showToast }) {
  const [form, setForm] = useState({ first_name: user.first_name || "", last_name: user.last_name || "", email: user.email || "", role: user.role || "", is_active: user.is_active ?? true });
  const [loading, setLoading] = useState(false);
  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }
  async function save() {
    setLoading(true);
    try {
      await adminApi.users.update(token, user.id, form);
      showToast("User updated", "success");
      onSaved();
    } catch (err) { showToast(err.message, "error"); }
    finally { setLoading(false); }
  }
  return (
    <Modal title="Edit User" onClose={onClose}>
      <InputField label="First Name" value={form.first_name} onChange={v => set("first_name", v)} />
      <InputField label="Last Name" value={form.last_name} onChange={v => set("last_name", v)} />
      <InputField label="Email" value={form.email} onChange={v => set("email", v)} type="email" />
      <div className="mb-4">
        <label className="block text-slate-400 text-sm mb-1">Role</label>
        <select value={form.role} onChange={e => set("role", e.target.value)} className="w-full border border-purple-800/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none" style={{ backgroundColor: BRAND.cardLight }}>
          <option value="">—</option>
          {["user", "trainer", "admin"].map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>
      <div className="mb-4 flex items-center gap-3">
        <input type="checkbox" checked={form.is_active} onChange={e => set("is_active", e.target.checked)} id="is_active" />
        <label htmlFor="is_active" className="text-slate-400 text-sm">Active</label>
      </div>
      <div className="flex gap-3 justify-end">
        <Btn onClick={onClose} color="gray">Cancel</Btn>
        <Btn onClick={save} disabled={loading}>{loading ? "Saving…" : "Save"}</Btn>
      </div>
    </Modal>
  );
}

export default EditUserModal;
