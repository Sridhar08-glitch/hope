import { useState, useEffect, useCallback } from "react";
import adminApi from "../../services/adminApi";
import BRAND from "../../constants/brand";

const TABS = [
  { id: "engine", label: "Engine Status" },
  { id: "tiers", label: "Tiers" },
  { id: "countries", label: "Countries" },
  { id: "founderPasses", label: "Founder Passes" },
  { id: "campaigns", label: "Campaigns" },
  { id: "coinPackages", label: "Coin Packages" },
  { id: "germany", label: "Germany Pricing" },
  { id: "launchDiscounts", label: "Launch Discounts" },
  { id: "founderCampaigns", label: "Founder Campaigns" },
  { id: "coinConfig", label: "Coin Config" },
];

const SINGULAR = { engine: false, germany: true, coinConfig: true };

const btnStyle = (bg, fg = "#fff") => ({ backgroundColor: bg, color: fg });
const cellStyle = (c) => ({ color: c });
const badgeStyle = (c) => ({ backgroundColor: c + "20", color: c });
const cardStyle = { backgroundColor: BRAND.card, border: `1px solid ${BRAND.panelLight}` };
const inputStyle = { backgroundColor: BRAND.panel, color: BRAND.textMain, border: `1px solid ${BRAND.panelLight}` };

/* ── reusable edit modal ─────────────────────────────────── */
function EditModal({ title, data, onSave, onClose, fields }) {
  const [form, setForm] = useState(data || {});
  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="rounded-2xl p-6 w-full max-w-lg" style={cardStyle}>
        <h3 className="text-lg font-bold mb-4" style={cellStyle(BRAND.textMain)}>{title}</h3>
        {(fields || Object.keys(form)).map((k) => (
          <label key={k} className="block mb-3">
            <span className="text-xs font-medium" style={cellStyle(BRAND.textMuted)}>{k.replace(/_/g, " ").toUpperCase()}</span>
            <input className="w-full mt-1 px-3 py-2 rounded-xl text-sm" style={inputStyle}
              value={form[k] ?? ""} onChange={(e) => set(k, e.target.value)} />
          </label>
        ))}
        <div className="flex gap-3 mt-4 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-sm" style={btnStyle(BRAND.panel, BRAND.textMuted)}>Cancel</button>
          <button onClick={() => onSave(form)} className="px-4 py-2 rounded-xl text-sm font-medium" style={btnStyle(BRAND.primary)}>Save</button>
        </div>
      </div>
    </div>
  );
}

export default function PricingView({ token, showToast }) {
  const [tab, setTab] = useState("engine");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [singleData, setSingleData] = useState(null);
  const [editing, setEditing] = useState(null); // { type, id, data, fields }
  const [previewForm, setPreviewForm] = useState({});
  const [previewResult, setPreviewResult] = useState(null);

  const loadData = useCallback(async (url) => {
    setLoading(true);
    setPreviewResult(null);
    try {
      let res;
      if (url) {
        res = await adminApi.fetchUrl(token, url);
      } else if (SINGULAR[tab]) {
        const s = tab === "engine" ? await adminApi.pricing.engineStatus(token)
          : tab === "germany" ? await adminApi.pricing.germany.get(token)
          : await adminApi.pricing.coinConfig.get(token);
        setSingleData(s);
        setLoading(false);
        return;
      } else if (tab === "tiers") res = await adminApi.pricing.tiers.list(token);
      else if (tab === "countries") res = await adminApi.pricing.countries.list(token);
      else if (tab === "founderPasses") res = await adminApi.pricing.founderPasses.list(token);
      else if (tab === "campaigns") res = await adminApi.pricing.campaigns.list(token);
      else if (tab === "coinPackages") res = await adminApi.pricing.coinPackages.list(token);
      else if (tab === "launchDiscounts") res = await adminApi.pricing.launchDiscounts.list(token);
      else if (tab === "founderCampaigns") res = await adminApi.pricing.founderCampaigns.list(token);
      setItems(res?.results || res || []);
      setNextUrl(res?.next || null);
      setPrevUrl(res?.previous || null);
    } catch (err) {
      showToast(err.message, "error");
      setSingleData(null);
      setItems([]);
    }
    setLoading(false);
  }, [tab, token, showToast]);

  useEffect(() => { setSingleData(null); setItems([]); loadData(); }, [loadData]);

  /* ── CRUD helpers ──────────────────────────────────────── */
  const handleDelete = async (ns, id, label) => {
    try { await ns.delete(token, id); showToast(`${label} deleted`, "success"); loadData(); }
    catch (err) { showToast(err.message, "error"); }
  };

  const openEdit = async (ns, id, fields, label) => {
    try {
      const data = await ns.detail(token, id);
      setEditing({ ns, id, data, fields, label });
    } catch (err) { showToast(err.message, "error"); }
  };

  const saveEdit = async (form) => {
    try {
      await editing.ns.update(token, editing.id, form);
      showToast(`${editing.label} updated`, "success");
      setEditing(null);
      loadData();
    } catch (err) { showToast(err.message, "error"); }
  };

  const handlePreview = async (endpoint, data) => {
    try { setPreviewResult(await endpoint(token, data)); }
    catch (err) { showToast(err.message, "error"); }
  };

  /* ── Pagination ────────────────────────────────────────── */
  const Pagination = () => (nextUrl || prevUrl) ? (
    <div className="flex gap-3 mt-4">
      {prevUrl && <button onClick={() => loadData(prevUrl)} className="px-4 py-2 rounded-xl text-sm" style={{ ...btnStyle(BRAND.panel, BRAND.textMuted), border: `1px solid ${BRAND.panelLight}` }}>Previous</button>}
      {nextUrl && <button onClick={() => loadData(nextUrl)} className="px-4 py-2 rounded-xl text-sm" style={btnStyle(BRAND.primary)}>Next</button>}
    </div>
  ) : null;

  /* ── Table helper ──────────────────────────────────────── */
  const Table = ({ cols, rows, actions }) => (
    <>
      <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: BRAND.panelLight }}>
        <table className="w-full text-sm">
          <thead><tr style={{ backgroundColor: BRAND.panelLight }}>
            {cols.map((c) => <th key={c.key} className="text-left px-4 py-3 font-semibold" style={cellStyle(BRAND.textMuted)}>{c.label}</th>)}
            {actions && <th className="text-left px-4 py-3 font-semibold" style={cellStyle(BRAND.textMuted)}>Actions</th>}
          </tr></thead>
          <tbody>{rows.length ? rows.map((r, i) => (
            <tr key={r.id || i} className="border-t" style={{ borderColor: BRAND.panelLight }}>
              {cols.map((c) => <td key={c.key} className="px-4 py-3" style={cellStyle(c.color || BRAND.textMain)}>
                {c.badge ? <span className="px-2 py-1 rounded-lg text-xs font-bold" style={badgeStyle(c.badge(r))}>{c.render ? c.render(r) : String(r[c.key] ?? "")}</span>
                  : c.render ? c.render(r) : String(r[c.key] ?? "")}
              </td>)}
              {actions && <td className="px-4 py-3 flex gap-2">{actions(r)}</td>}
            </tr>
          )) : <tr><td colSpan={cols.length + (actions ? 1 : 0)} className="text-center px-4 py-8" style={cellStyle(BRAND.textMuted)}>No records found</td></tr>}</tbody>
        </table>
      </div>
      <Pagination />
    </>
  );

  /* ── Key-value card grid for singular endpoints ────────── */
  const KVGrid = ({ data, onEdit }) => (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="rounded-2xl p-5" style={cardStyle}>
            <p className="text-xs font-medium mb-1" style={cellStyle(BRAND.textMuted)}>{key.replace(/_/g, " ").toUpperCase()}</p>
            <p className="text-2xl font-bold" style={cellStyle(BRAND.textMain)}>
              {typeof value === "boolean" ? (value ? "Active" : "Inactive") : typeof value === "number" ? value.toLocaleString() : String(value ?? "-")}
            </p>
          </div>
        ))}
      </div>
      {onEdit && <button onClick={() => onEdit(data)} className="mt-4 px-4 py-2 rounded-xl text-sm font-medium" style={btnStyle(BRAND.primary)}>Edit</button>}
    </div>
  );

  /* ── Preview form ──────────────────────────────────────── */
  const PreviewSection = ({ fields, endpoint, label }) => (
    <div className="mt-6 rounded-2xl p-5" style={cardStyle}>
      <h4 className="text-sm font-bold mb-3" style={cellStyle(BRAND.textMain)}>{label}</h4>
      <div className="flex flex-wrap gap-3 items-end">
        {fields.map((f) => (
          <label key={f} className="block">
            <span className="text-xs" style={cellStyle(BRAND.textMuted)}>{f.replace(/_/g, " ")}</span>
            <input className="block mt-1 px-3 py-2 rounded-xl text-sm w-40" style={inputStyle}
              value={previewForm[f] ?? ""} onChange={(e) => setPreviewForm((p) => ({ ...p, [f]: e.target.value }))} />
          </label>
        ))}
        <button onClick={() => handlePreview(endpoint, previewForm)} className="px-4 py-2 rounded-xl text-sm font-medium" style={btnStyle(BRAND.info)}>Preview</button>
      </div>
      {previewResult && (
        <pre className="mt-3 p-3 rounded-xl text-xs overflow-auto" style={{ ...inputStyle, color: BRAND.accent, maxHeight: 200 }}>
          {JSON.stringify(previewResult, null, 2)}
        </pre>
      )}
    </div>
  );

  /* ── Render content per tab ────────────────────────────── */
  const renderTab = () => {
    /* Engine Status */
    if (tab === "engine") return singleData ? (
      <>
        <KVGrid data={singleData} />
        <PreviewSection fields={["tier_code", "country_code", "plan_id"]} endpoint={adminApi.pricing.preview} label="Price Preview" />
      </>
    ) : null;

    /* Tiers */
    if (tab === "tiers") return <Table cols={[
      { key: "code", label: "Code", color: BRAND.accent },
      { key: "name", label: "Name" },
      { key: "multiplier", label: "Multiplier" },
    ]} rows={items} />;

    /* Countries */
    if (tab === "countries") return <Table cols={[
      { key: "country", label: "Country" },
      { key: "tier", label: "Tier" },
      { key: "currency", label: "Currency", color: BRAND.textMuted },
    ]} rows={items} actions={(r) => (
      <button onClick={() => openEdit(adminApi.pricing.countries, r.code || r.country_code, ["country", "tier", "currency"], "Country")}
        className="px-3 py-1 rounded-lg text-xs font-medium" style={btnStyle(BRAND.info)}>Edit</button>
    )} />;

    /* Founder Passes */
    if (tab === "founderPasses") return <Table cols={[
      { key: "user", label: "User" },
      { key: "plan", label: "Plan" },
      { key: "status", label: "Status", badge: (r) => r.status === "active" ? BRAND.success : r.status === "pending" ? BRAND.warning : BRAND.error },
    ]} rows={items} actions={(r) => (<>
      <button onClick={() => openEdit(adminApi.pricing.founderPasses, r.id, ["user", "plan", "status"], "Founder Pass")}
        className="px-3 py-1 rounded-lg text-xs font-medium" style={btnStyle(BRAND.info)}>Edit</button>
      <button onClick={() => handleDelete(adminApi.pricing.founderPasses, r.id, "Founder pass")}
        className="px-3 py-1 rounded-lg text-xs font-medium" style={btnStyle(BRAND.error)}>Delete</button>
    </>)} />;

    /* Campaigns */
    if (tab === "campaigns") return <Table cols={[
      { key: "name", label: "Name" },
      { key: "discount", label: "Discount", color: BRAND.accent, render: (r) => `${r.discount}%` },
      { key: "dates", label: "Dates", color: BRAND.textMuted, render: (r) => `${r.start_date} - ${r.end_date}` },
      { key: "active", label: "Active", badge: (r) => r.active ? BRAND.success : BRAND.error, render: (r) => r.active ? "Active" : "Inactive" },
    ]} rows={items} actions={(r) => (<>
      <button onClick={() => openEdit(adminApi.pricing.campaigns, r.id, ["name", "discount", "start_date", "end_date", "active"], "Campaign")}
        className="px-3 py-1 rounded-lg text-xs font-medium" style={btnStyle(BRAND.info)}>Edit</button>
      <button onClick={() => handleDelete(adminApi.pricing.campaigns, r.id, "Campaign")}
        className="px-3 py-1 rounded-lg text-xs font-medium" style={btnStyle(BRAND.error)}>Delete</button>
    </>)} />;

    /* Coin Packages */
    if (tab === "coinPackages") return <Table cols={[
      { key: "name", label: "Name" },
      { key: "coins", label: "Coins", color: BRAND.accent },
      { key: "price", label: "Price" },
    ]} rows={items} />;

    /* Germany Pricing */
    if (tab === "germany") return singleData ? (
      <>
        <KVGrid data={singleData} onEdit={(d) => setEditing({ ns: null, id: null, data: d, fields: Object.keys(d), label: "Germany Pricing" })} />
        <PreviewSection fields={["plan_id", "price"]} endpoint={adminApi.pricing.germany.preview} label="Germany Price Preview" />
      </>
    ) : null;

    /* Launch Discounts */
    if (tab === "launchDiscounts") return <Table cols={[
      { key: "id", label: "ID", color: BRAND.textMuted },
      { key: "name", label: "Name" },
      { key: "discount_percent", label: "Discount %", color: BRAND.accent },
      { key: "active", label: "Active", badge: (r) => r.active ? BRAND.success : BRAND.error, render: (r) => r.active ? "Yes" : "No" },
    ]} rows={items} actions={(r) => (
      <button onClick={() => handleDelete(adminApi.pricing.launchDiscounts, r.id, "Launch discount")}
        className="px-3 py-1 rounded-lg text-xs font-medium" style={btnStyle(BRAND.error)}>Delete</button>
    )} />;

    /* Founder Campaigns */
    if (tab === "founderCampaigns") return <Table cols={[
      { key: "id", label: "ID", color: BRAND.textMuted },
      { key: "name", label: "Name" },
      { key: "discount", label: "Discount", color: BRAND.accent },
      { key: "active", label: "Active", badge: (r) => r.active ? BRAND.success : BRAND.error, render: (r) => r.active ? "Yes" : "No" },
    ]} rows={items} actions={(r) => (
      <button onClick={() => handleDelete(adminApi.pricing.founderCampaigns, r.id, "Founder campaign")}
        className="px-3 py-1 rounded-lg text-xs font-medium" style={btnStyle(BRAND.error)}>Delete</button>
    )} />;

    /* Coin Config */
    if (tab === "coinConfig") return singleData ? (
      <KVGrid data={singleData} onEdit={(d) => setEditing({ ns: null, id: null, data: d, fields: Object.keys(d), label: "Coin Config" })} />
    ) : null;

    return null;
  };

  /* ── save handler for singular (germany / coinConfig) edits */
  const saveSingular = async (form) => {
    try {
      const updater = tab === "germany" ? adminApi.pricing.germany.update : adminApi.pricing.coinConfig.update;
      await updater(token, form);
      showToast(`${editing.label} updated`, "success");
      setEditing(null);
      loadData();
    } catch (err) { showToast(err.message, "error"); }
  };

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-6">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ backgroundColor: tab === t.id ? BRAND.primary : BRAND.panel, color: tab === t.id ? "#fff" : BRAND.textMuted, border: `1px solid ${BRAND.panelLight}` }}>
            {t.label}
          </button>
        ))}
      </div>
      {loading ? <div className="text-center py-12" style={cellStyle(BRAND.textMuted)}>Loading...</div> : renderTab()}
      {editing && (
        <EditModal title={`Edit ${editing.label}`} data={editing.data} fields={editing.fields}
          onClose={() => setEditing(null)}
          onSave={editing.ns ? saveEdit : saveSingular} />
      )}
    </div>
  );
}
