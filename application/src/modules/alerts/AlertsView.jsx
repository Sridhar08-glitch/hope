import { useState, useEffect, useCallback } from "react";
import adminApi from "../../services/adminApi";

const B = { bg:'#150926', panel:'#281247', card:'#281247', panelLight:'#3b0866', primary:'#7E22CE', accent:'#F4BE69', textMain:'#F8FAFC', textMuted:'#cbd5e1', success:'#10b981', error:'#ef4444', warning:'#f59e0b', info:'#3b82f6' };
const TABS = [
  { id: "alerts", label: "Alerts" },
  { id: "configs", label: "Alert Configs" },
  { id: "approvals", label: "Approvals" },
  { id: "banAppeals", label: "Ban Appeals" },
  { id: "sessionAppeals", label: "Session Appeals" },
];
const SEV_CLR = { critical: B.error, high: B.warning, medium: B.info, low: B.success };
const STATUS_CLR = s => s === 'approved' || s === 'active' ? B.success : s === 'pending' ? B.warning : B.error;
const EMPTY_CFG = { name: '', alert_type: '', threshold: '', is_active: true };
const EMPTY_APPROVAL = { action_type: '', target_id: '', reason: '' };

const Badge = ({ text, color }) => (
  <span className="px-2 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: color + '20', color }}>{text}</span>
);
const Btn = ({ onClick, label, color = B.primary, outline }) => (
  <button onClick={onClick} className="px-3 py-1 rounded-lg text-xs font-medium" style={outline ? { backgroundColor: B.panel, color: B.textMuted, border: `1px solid ${B.panelLight}` } : { backgroundColor: color, color: '#fff' }}>{label}</button>
);
const StatCard = ({ label, value, color = B.textMain }) => (
  <div className="rounded-xl p-4 flex-1 min-w-[120px]" style={{ backgroundColor: B.card, border: `1px solid ${B.panelLight}` }}>
    <div className="text-xs font-medium mb-1" style={{ color: B.textMuted }}>{label}</div>
    <div className="text-xl font-bold" style={{ color }}>{value ?? 0}</div>
  </div>
);
const TH = ({ children }) => <th className="text-left px-4 py-3 font-semibold" style={{ color: B.textMuted }}>{children}</th>;
const TD = ({ children, muted }) => <td className="px-4 py-3" style={{ color: muted ? B.textMuted : B.textMain }}>{children}</td>;
const EmptyRow = ({ cols }) => <tr><td colSpan={cols} className="text-center px-4 py-8" style={{ color: B.textMuted }}>No records found</td></tr>;

const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose}>
    <div className="rounded-2xl p-6 w-full max-w-lg" style={{ backgroundColor: B.panel, border: `1px solid ${B.panelLight}` }} onClick={e => e.stopPropagation()}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold" style={{ color: B.textMain }}>{title}</h3>
        <button onClick={onClose} className="text-xl leading-none" style={{ color: B.textMuted }}>&times;</button>
      </div>
      {children}
    </div>
  </div>
);

const Field = ({ label, value, onChange, type = 'text', options }) => (
  <div className="mb-3">
    <label className="block text-xs font-medium mb-1" style={{ color: B.textMuted }}>{label}</label>
    {type === 'select' ? (
      <select value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: B.bg, color: B.textMain, border: `1px solid ${B.panelLight}` }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ) : type === 'checkbox' ? (
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} />
    ) : (
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={{ backgroundColor: B.bg, color: B.textMain, border: `1px solid ${B.panelLight}` }} />
    )}
  </div>
);

export default function AlertsView({ token, showToast }) {
  const [tab, setTab] = useState("alerts");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [summary, setSummary] = useState(null);
  const [approvalStats, setApprovalStats] = useState(null);
  const [approvalSections, setApprovalSections] = useState({ pending: [], my: [], history: [] });
  const [modal, setModal] = useState(null); // { type, data }
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [detailData, setDetailData] = useState(null);

  const loadData = useCallback(async (url) => {
    setLoading(true);
    try {
      let res;
      if (url) { res = await adminApi.fetchUrl(token, url); }
      else if (tab === "alerts") {
        res = await adminApi.alerts.list(token);
        if (res?.summary) setSummary(res.summary);
        setItems(res?.alerts || res?.results || []);
        setNextUrl(res?.next || null); setPrevUrl(res?.previous || null);
        setLoading(false); return;
      } else if (tab === "configs") { res = await adminApi.alerts.configs.list(token); }
      else if (tab === "approvals") {
        res = await adminApi.approvals.list(token);
        setApprovalSections({ pending: res?.pending_approvals || [], my: res?.my_requests || [], history: res?.recent_history || [] });
        setItems(res?.pending_approvals || res?.results || []);
        try { const st = await adminApi.approvals.stats(token); setApprovalStats(st); } catch {}
        setNextUrl(res?.next || null); setPrevUrl(res?.previous || null);
        setLoading(false); return;
      } else if (tab === "banAppeals") { res = await adminApi.moderation.banAppeals.list(token); }
      else if (tab === "sessionAppeals") { res = await adminApi.trainers.sessionAppeals.list(token); }
      setItems(res?.results || res || []);
      setNextUrl(res?.next || null); setPrevUrl(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    setLoading(false);
  }, [tab, token, showToast]);

  useEffect(() => { setSummary(null); setApprovalStats(null); setApprovalSections({ pending: [], my: [], history: [] }); loadData(); }, [loadData]);

  const handleAlertAction = async (id, action) => {
    try { await adminApi.alerts.action(token, id, { action }); showToast(`Alert ${action}d`, "success"); loadData(); } catch (err) { showToast(err.message, "error"); }
  };
  const handleCheckAlerts = async () => {
    try { await adminApi.alerts.check(token); showToast("Alert check triggered", "success"); loadData(); } catch (err) { showToast(err.message, "error"); }
  };
  const handleApproval = async (id, action) => {
    try { await adminApi.approvals.action(token, id, { action }); showToast(`Request ${action}d`, "success"); loadData(); } catch (err) { showToast(err.message, "error"); }
  };
  const handleBanAppeal = async (id, action) => {
    try { await adminApi.moderation.banAppeals.review(token, id, { action }); showToast(`Appeal ${action}d`, "success"); loadData(); } catch (err) { showToast(err.message, "error"); }
  };
  const handleSessionAppeal = async (id, action) => {
    try { await adminApi.trainers.sessionAppeals.action(token, id, { action }); showToast(`Session appeal ${action}d`, "success"); loadData(); } catch (err) { showToast(err.message, "error"); }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      if (form.id) await adminApi.alerts.configs.update(token, form.id, form);
      else await adminApi.alerts.configs.create(token, form);
      showToast(form.id ? "Config updated" : "Config created", "success");
      setModal(null); loadData();
    } catch (err) { showToast(err.message, "error"); }
    setSaving(false);
  };
  const deleteConfig = async (id) => {
    if (!window.confirm("Delete this config?")) return;
    try { await adminApi.alerts.configs.delete(token, id); showToast("Config deleted", "success"); loadData(); } catch (err) { showToast(err.message, "error"); }
  };
  const saveApproval = async () => {
    setSaving(true);
    try { await adminApi.approvals.create(token, form); showToast("Approval request created", "success"); setModal(null); loadData(); } catch (err) { showToast(err.message, "error"); }
    setSaving(false);
  };
  const loadSessionDetail = async (id) => {
    try { const d = await adminApi.trainers.sessionAppeals.detail(token, id); setDetailData(d); setModal({ type: 'sessionDetail' }); } catch (err) { showToast(err.message, "error"); }
  };

  const Pagination = () => (nextUrl || prevUrl) ? (
    <div className="flex gap-3 mt-4">
      {prevUrl && <Btn onClick={() => loadData(prevUrl)} label="Previous" outline />}
      {nextUrl && <Btn onClick={() => loadData(nextUrl)} label="Next" />}
    </div>
  ) : null;

  const ApprovalTable = ({ rows, title }) => (
    <>
      {title && <h4 className="text-sm font-semibold mt-4 mb-2" style={{ color: B.accent }}>{title}</h4>}
      <div className="overflow-x-auto rounded-2xl border mb-4" style={{ borderColor: B.panelLight }}>
        <table className="w-full text-sm">
          <thead><tr style={{ backgroundColor: B.panelLight }}><TH>Type</TH><TH>Requester</TH><TH>Status</TH><TH>Actions</TH></tr></thead>
          <tbody>{rows.length ? rows.map((item, i) => (
            <tr key={item.id || i} className="border-t" style={{ borderColor: B.panelLight }}>
              <TD>{item.type || item.action_type}</TD><TD>{item.requester}</TD>
              <TD><Badge text={item.status} color={STATUS_CLR(item.status)} /></TD>
              <TD>{item.status === 'pending' && <div className="flex gap-2"><Btn onClick={() => handleApproval(item.id, 'approve')} label="Approve" color={B.success} /><Btn onClick={() => handleApproval(item.id, 'reject')} label="Reject" color={B.error} /></div>}</TD>
            </tr>
          )) : <EmptyRow cols={4} />}</tbody>
        </table>
      </div>
    </>
  );

  const renderContent = () => {
    if (tab === "alerts") return (
      <>
        {summary && (
          <div className="flex gap-3 flex-wrap mb-4">
            <StatCard label="Total" value={summary.total} />
            <StatCard label="Critical" value={summary.by_severity?.critical} color={SEV_CLR.critical} />
            <StatCard label="High" value={summary.by_severity?.high} color={SEV_CLR.high} />
            <StatCard label="Medium" value={summary.by_severity?.medium} color={SEV_CLR.medium} />
            <StatCard label="Low" value={summary.by_severity?.low} color={SEV_CLR.low} />
          </div>
        )}
        <div className="flex justify-end mb-4">
          <button onClick={handleCheckAlerts} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ backgroundColor: B.info, color: '#fff' }}>Check Alerts</button>
        </div>
        <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: B.panelLight }}>
          <table className="w-full text-sm">
            <thead><tr style={{ backgroundColor: B.panelLight }}><TH>Severity</TH><TH>Message</TH><TH>Timestamp</TH><TH>Actions</TH></tr></thead>
            <tbody>{items.length ? items.map((item, i) => (
              <tr key={item.id || i} className="border-t" style={{ borderColor: B.panelLight }}>
                <TD><Badge text={item.severity} color={SEV_CLR[item.severity] || B.info} /></TD>
                <TD>{item.message}</TD>
                <TD muted>{item.timestamp}</TD>
                <TD><div className="flex gap-2"><Btn onClick={() => handleAlertAction(item.id, 'acknowledge')} label="Acknowledge" /><Btn onClick={() => handleAlertAction(item.id, 'dismiss')} label="Dismiss" outline /></div></TD>
              </tr>
            )) : <EmptyRow cols={4} />}</tbody>
          </table>
        </div>
        <Pagination />
      </>
    );

    if (tab === "configs") return (
      <>
        <div className="flex justify-end mb-4">
          <button onClick={() => { setForm({ ...EMPTY_CFG }); setModal({ type: 'config' }); }} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ backgroundColor: B.primary, color: '#fff' }}>+ New Config</button>
        </div>
        <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: B.panelLight }}>
          <table className="w-full text-sm">
            <thead><tr style={{ backgroundColor: B.panelLight }}><TH>Name</TH><TH>Type</TH><TH>Threshold</TH><TH>Active</TH><TH>Actions</TH></tr></thead>
            <tbody>{items.length ? items.map((item, i) => (
              <tr key={item.id || i} className="border-t" style={{ borderColor: B.panelLight }}>
                <TD>{item.name}</TD><TD muted>{item.alert_type || item.type}</TD>
                <td className="px-4 py-3" style={{ color: B.accent }}>{item.threshold}</td>
                <TD><Badge text={item.is_active || item.active ? 'Active' : 'Inactive'} color={item.is_active || item.active ? B.success : B.error} /></TD>
                <TD>
                  <div className="flex gap-2">
                    <Btn onClick={() => { setForm({ id: item.id, name: item.name, alert_type: item.alert_type || item.type, threshold: item.threshold, is_active: item.is_active ?? item.active }); setModal({ type: 'config' }); }} label="Edit" />
                    <Btn onClick={() => deleteConfig(item.id)} label="Delete" color={B.error} />
                  </div>
                </TD>
              </tr>
            )) : <EmptyRow cols={5} />}</tbody>
          </table>
        </div>
        <Pagination />
      </>
    );

    if (tab === "approvals") return (
      <>
        {approvalStats && (
          <div className="flex gap-3 flex-wrap mb-4">
            <StatCard label="Pending" value={approvalStats.pending} color={B.warning} />
            <StatCard label="Approved" value={approvalStats.approved} color={B.success} />
            <StatCard label="Rejected" value={approvalStats.rejected} color={B.error} />
            <StatCard label="Expired" value={approvalStats.expired} color={B.textMuted} />
          </div>
        )}
        <div className="flex justify-end mb-4">
          <button onClick={() => { setForm({ ...EMPTY_APPROVAL }); setModal({ type: 'approval' }); }} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ backgroundColor: B.primary, color: '#fff' }}>+ New Approval</button>
        </div>
        <ApprovalTable rows={approvalSections.pending} title="Pending Approvals" />
        <ApprovalTable rows={approvalSections.my} title="My Requests" />
        <ApprovalTable rows={approvalSections.history} title="Recent History" />
        <Pagination />
      </>
    );

    if (tab === "banAppeals") return (
      <>
        <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: B.panelLight }}>
          <table className="w-full text-sm">
            <thead><tr style={{ backgroundColor: B.panelLight }}><TH>User</TH><TH>Reason</TH><TH>Status</TH><TH>Actions</TH></tr></thead>
            <tbody>{items.length ? items.map((item, i) => (
              <tr key={item.id || i} className="border-t" style={{ borderColor: B.panelLight }}>
                <TD>{item.user}</TD><TD muted>{item.reason}</TD>
                <TD><Badge text={item.status} color={STATUS_CLR(item.status)} /></TD>
                <TD>{item.status === 'pending' && <Btn onClick={() => handleBanAppeal(item.id, 'approve')} label="Review" />}</TD>
              </tr>
            )) : <EmptyRow cols={4} />}</tbody>
          </table>
        </div>
        <Pagination />
      </>
    );

    if (tab === "sessionAppeals") return (
      <>
        <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: B.panelLight }}>
          <table className="w-full text-sm">
            <thead><tr style={{ backgroundColor: B.panelLight }}><TH>Client</TH><TH>Trainer</TH><TH>Reason</TH><TH>Status</TH><TH>Actions</TH></tr></thead>
            <tbody>{items.length ? items.map((item, i) => (
              <tr key={item.id || i} className="border-t" style={{ borderColor: B.panelLight }}>
                <TD>{item.client}</TD><TD>{item.trainer}</TD><TD muted>{item.reason}</TD>
                <TD><Badge text={item.status} color={STATUS_CLR(item.status)} /></TD>
                <TD>
                  <div className="flex gap-2">
                    <Btn onClick={() => loadSessionDetail(item.id)} label="View" color={B.info} />
                    {item.status === 'pending' && <>
                      <Btn onClick={() => handleSessionAppeal(item.id, 'approve')} label="Approve" color={B.success} />
                      <Btn onClick={() => handleSessionAppeal(item.id, 'refund')} label="Refund" color={B.warning} />
                      <Btn onClick={() => handleSessionAppeal(item.id, 'reject')} label="Reject" color={B.error} />
                    </>}
                  </div>
                </TD>
              </tr>
            )) : <EmptyRow cols={5} />}</tbody>
          </table>
        </div>
        <Pagination />
      </>
    );
    return null;
  };

  return (
    <div>
      <div className="flex gap-2 flex-wrap mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ backgroundColor: tab === t.id ? B.primary : B.panel, color: tab === t.id ? '#fff' : B.textMuted, border: `1px solid ${B.panelLight}` }}>
            {t.label}
          </button>
        ))}
      </div>
      {loading ? <div className="text-center py-12" style={{ color: B.textMuted }}>Loading...</div> : renderContent()}

      {modal?.type === 'config' && (
        <Modal title={form.id ? "Edit Config" : "New Config"} onClose={() => setModal(null)}>
          <Field label="Name" value={form.name} onChange={v => setForm(f => ({ ...f, name: v }))} />
          <Field label="Alert Type" value={form.alert_type} onChange={v => setForm(f => ({ ...f, alert_type: v }))} />
          <Field label="Threshold" value={form.threshold} onChange={v => setForm(f => ({ ...f, threshold: v }))} type="number" />
          <div className="mb-3 flex items-center gap-2">
            <Field label="Active" value={form.is_active} onChange={v => setForm(f => ({ ...f, is_active: v }))} type="checkbox" />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Btn onClick={() => setModal(null)} label="Cancel" outline />
            <button onClick={saveConfig} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ backgroundColor: B.primary, color: '#fff', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </Modal>
      )}

      {modal?.type === 'approval' && (
        <Modal title="New Approval Request" onClose={() => setModal(null)}>
          <Field label="Action Type" value={form.action_type} onChange={v => setForm(f => ({ ...f, action_type: v }))} />
          <Field label="Target ID" value={form.target_id} onChange={v => setForm(f => ({ ...f, target_id: v }))} />
          <Field label="Reason" value={form.reason} onChange={v => setForm(f => ({ ...f, reason: v }))} />
          <div className="flex justify-end gap-2 mt-4">
            <Btn onClick={() => setModal(null)} label="Cancel" outline />
            <button onClick={saveApproval} disabled={saving} className="px-4 py-2 rounded-xl text-sm font-medium" style={{ backgroundColor: B.primary, color: '#fff', opacity: saving ? 0.6 : 1 }}>{saving ? 'Saving...' : 'Submit'}</button>
          </div>
        </Modal>
      )}

      {modal?.type === 'sessionDetail' && detailData && (
        <Modal title="Session Appeal Detail" onClose={() => { setModal(null); setDetailData(null); }}>
          {Object.entries(detailData).map(([k, v]) => (
            <div key={k} className="flex justify-between py-2 border-b" style={{ borderColor: B.panelLight }}>
              <span className="text-xs font-medium" style={{ color: B.textMuted }}>{k.replace(/_/g, ' ')}</span>
              <span className="text-sm" style={{ color: B.textMain }}>{typeof v === 'object' ? JSON.stringify(v) : String(v ?? '-')}</span>
            </div>
          ))}
          <div className="flex justify-end mt-4"><Btn onClick={() => { setModal(null); setDetailData(null); }} label="Close" outline /></div>
        </Modal>
      )}
    </div>
  );
}
