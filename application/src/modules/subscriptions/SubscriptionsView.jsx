import { useState, useEffect, useCallback } from "react";
import adminApi from "../../services/adminApi";
import BRAND from "../../constants/brand";

const TABS = [
  { id: "plans", label: "Plans" },
  { id: "userSubs", label: "User Subs" },
  { id: "referrals", label: "Referrals" },
  { id: "coins", label: "Coins" },
  { id: "payments", label: "Payments" },
  { id: "reports", label: "Reports" },
  { id: "cycles", label: "Cycles" },
  { id: "refunds", label: "Refunds" },
  { id: "webhooks", label: "Webhooks" },
];

const B = BRAND;
const thStyle = { color: B.textMuted };
const tdMain = { color: B.textMain };
const tdMuted = { color: B.textMuted };
const headRow = { backgroundColor: B.panelLight };
const borderC = { borderColor: B.panelLight };
const badge = (s) => {
  const c = s === "active" || s === "approved" ? B.success : s === "pending" ? B.warning : B.error;
  return { backgroundColor: c + "20", color: c };
};
const btnPrimary = { backgroundColor: B.primary, color: "#fff" };
const btnSuccess = { backgroundColor: B.success, color: "#fff" };
const btnError = { backgroundColor: B.error, color: "#fff" };
const btnInfo = { backgroundColor: B.info, color: "#fff" };
const btnMuted = { backgroundColor: B.panel, color: B.textMuted, border: `1px solid ${B.panelLight}` };
const cardStyle = { backgroundColor: B.card, border: `1px solid ${B.panelLight}` };

const StatCard = ({ label, value }) => (
  <div className="rounded-2xl p-5" style={cardStyle}>
    <p className="text-xs font-medium mb-1" style={tdMuted}>{label.replace(/_/g, " ").toUpperCase()}</p>
    <p className="text-2xl font-bold" style={tdMain}>{typeof value === "number" ? value.toLocaleString() : String(value ?? "N/A")}</p>
  </div>
);

const Empty = ({ cols = 1 }) => (
  <tr><td colSpan={cols} className="text-center px-4 py-8" style={tdMuted}>No data available</td></tr>
);

export default function SubscriptionsView({ token, showToast }) {
  const [tab, setTab] = useState("plans");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [extra, setExtra] = useState({});
  const [modal, setModal] = useState(null);
  const [subTab, setSubTab] = useState("codes");

  const safe = async (fn, fallback = []) => {
    try { return await fn(); } catch (e) { showToast(e.message, "error"); return fallback; }
  };

  const loadData = useCallback(async (url) => {
    setLoading(true);
    setExtra({});
    try {
      let res;
      if (url) { res = await adminApi.fetchUrl(token, url); }
      else if (tab === "plans") res = await adminApi.subs.plans.list(token);
      else if (tab === "userSubs") res = await adminApi.subs.users.list(token);
      else if (tab === "referrals") {
        if (subTab === "codes") res = await adminApi.subs.referrals.codes(token);
        else if (subTab === "users") res = await adminApi.subs.referrals.users(token);
        else if (subTab === "distributions") res = await adminApi.subs.referrals.distributions(token);
        else if (subTab === "stats") { setExtra({ stats: await safe(() => adminApi.subs.referrals.stats(token), {}) }); setLoading(false); return; }
      }
      else if (tab === "coins") {
        res = await adminApi.subs.coins.adjustments(token);
        const [cfg, ana] = await Promise.all([
          safe(() => adminApi.subs.coins.distributionConfig(token), []),
          safe(() => adminApi.subs.coins.analytics(token), {}),
        ]);
        setExtra({ coinConfig: Array.isArray(cfg) ? cfg : cfg?.results || [], coinAnalytics: ana });
      }
      else if (tab === "payments") {
        res = await adminApi.subs.payments.list(token);
        setExtra({ payAnalytics: await safe(() => adminApi.subs.payments.analytics(token), {}) });
      }
      else if (tab === "reports") {
        const [health, revenue, churn, ltv, coinCost, analytics] = await Promise.all([
          safe(() => adminApi.subs.health(token), {}),
          safe(() => adminApi.subs.reports.revenue(token), {}),
          safe(() => adminApi.subs.reports.churn(token), {}),
          safe(() => adminApi.subs.reports.ltv(token), {}),
          safe(() => adminApi.subs.reports.coinCost(token), {}),
          safe(() => adminApi.subs.analytics(token), {}),
        ]);
        setExtra({ health, revenue, churn, ltv, coinCost, analytics });
        setLoading(false); return;
      }
      else if (tab === "cycles") res = await adminApi.subs.cycles(token);
      else if (tab === "refunds") res = await adminApi.subs.refunds.list(token);
      else if (tab === "webhooks") res = await adminApi.subs.webhooks.stripe(token);
      setItems(res?.results || (Array.isArray(res) ? res : []));
      setNextUrl(res?.next || null);
      setPrevUrl(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); setItems([]); }
    setLoading(false);
  }, [tab, subTab, token, showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleCancel = async (id) => {
    try { await adminApi.subs.users.cancel(token, id); showToast("Subscription cancelled", "success"); loadData(); }
    catch (e) { showToast(e.message, "error"); }
  };
  const handleApprove = async (id) => {
    try { await adminApi.subs.coins.approveAdjustment(token, id); showToast("Adjustment approved", "success"); loadData(); }
    catch (e) { showToast(e.message, "error"); }
  };
  const handleUpgrade = async (id) => {
    try { await adminApi.subs.users.upgrade(token, id, {}); showToast("Upgraded", "success"); loadData(); }
    catch (e) { showToast(e.message, "error"); }
  };
  const handleDowngrade = async (id) => {
    try { await adminApi.subs.users.downgrade(token, id, {}); showToast("Downgraded", "success"); loadData(); }
    catch (e) { showToast(e.message, "error"); }
  };
  const handleDetail = async (id, type = "user") => {
    try {
      const d = type === "payment" ? await adminApi.subs.payments.detail(token, id) : await adminApi.subs.users.detail(token, id);
      setModal(d);
    } catch (e) { showToast(e.message, "error"); }
  };
  const handleRefundApprove = async (id) => {
    try { await adminApi.subs.refunds.approve(token, id); showToast("Refund approved", "success"); loadData(); }
    catch (e) { showToast(e.message, "error"); }
  };
  const handleDistApprove = async (id) => {
    try { await adminApi.subs.referrals.approveDistribution(token, id); showToast("Distribution approved", "success"); loadData(); }
    catch (e) { showToast(e.message, "error"); }
  };
  const handleDeleteConfig = async (id) => {
    try { await adminApi.subs.coins.deleteConfig(token, id); showToast("Config deleted", "success"); loadData(); }
    catch (e) { showToast(e.message, "error"); }
  };

  const Pagination = () => (nextUrl || prevUrl) ? (
    <div className="flex gap-3 mt-4">
      {prevUrl && <button onClick={() => loadData(prevUrl)} className="px-4 py-2 rounded-xl text-sm" style={btnMuted}>Previous</button>}
      {nextUrl && <button onClick={() => loadData(nextUrl)} className="px-4 py-2 rounded-xl text-sm" style={btnPrimary}>Next</button>}
    </div>
  ) : null;

  const Table = ({ cols, children }) => (
    <div className="overflow-x-auto rounded-2xl border" style={borderC}>
      <table className="w-full text-sm">
        <thead><tr style={headRow}>{cols.map(c => <th key={c} className="text-left px-4 py-3 font-semibold" style={thStyle}>{c}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );

  const SubTabs = ({ tabs, current, onChange }) => (
    <div className="flex gap-2 mb-4">{tabs.map(t => (
      <button key={t.id} onClick={() => onChange(t.id)} className="px-3 py-1.5 rounded-lg text-xs font-medium"
        style={current === t.id ? btnPrimary : btnMuted}>{t.label}</button>
    ))}</div>
  );

  const StatsGrid = ({ data }) => {
    if (!data || typeof data !== "object") return <p style={tdMuted}>No data available</p>;
    const entries = Object.entries(data).filter(([, v]) => typeof v !== "object");
    return entries.length ? (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {entries.map(([k, v]) => <StatCard key={k} label={k} value={v} />)}
      </div>
    ) : <p style={tdMuted}>No data available</p>;
  };

  const renderContent = () => {
    if (tab === "plans") return (<><Table cols={["Name", "Price", "Interval"]}>
      {items.length ? items.map((r, i) => <tr key={r.id || i} className="border-t" style={borderC}>
        <td className="px-4 py-3" style={tdMain}>{r.name}</td>
        <td className="px-4 py-3" style={tdMain}>{r.price}</td>
        <td className="px-4 py-3" style={tdMain}>{r.interval}</td>
      </tr>) : <Empty cols={3} />}
    </Table><Pagination /></>);

    if (tab === "userSubs") return (<><Table cols={["User", "Plan", "Status", "Dates", "Actions"]}>
      {items.length ? items.map((r, i) => <tr key={r.id || i} className="border-t" style={borderC}>
        <td className="px-4 py-3" style={tdMain}>{r.user}</td>
        <td className="px-4 py-3" style={tdMain}>{r.plan}</td>
        <td className="px-4 py-3"><span className="px-2 py-1 rounded-lg text-xs font-bold" style={badge(r.status)}>{r.status}</span></td>
        <td className="px-4 py-3" style={tdMuted}>{r.start_date} - {r.end_date}</td>
        <td className="px-4 py-3 flex gap-1 flex-wrap">
          <button onClick={() => handleDetail(r.id)} className="px-3 py-1 rounded-lg text-xs font-medium" style={btnInfo}>Detail</button>
          {r.status === "active" && <>
            <button onClick={() => handleUpgrade(r.id)} className="px-3 py-1 rounded-lg text-xs font-medium" style={btnSuccess}>Upgrade</button>
            <button onClick={() => handleDowngrade(r.id)} className="px-3 py-1 rounded-lg text-xs font-medium" style={btnMuted}>Downgrade</button>
            <button onClick={() => handleCancel(r.id)} className="px-3 py-1 rounded-lg text-xs font-medium" style={btnError}>Cancel</button>
          </>}
        </td>
      </tr>) : <Empty cols={5} />}
    </Table><Pagination /></>);

    if (tab === "referrals") {
      const refTabs = [{ id: "codes", label: "Codes" }, { id: "users", label: "Users" }, { id: "distributions", label: "Distributions" }, { id: "stats", label: "Stats" }];
      return (<>
        <SubTabs tabs={refTabs} current={subTab} onChange={(v) => { setSubTab(v); }} />
        {subTab === "stats" ? <StatsGrid data={extra.stats} /> :
        subTab === "distributions" ? (<><Table cols={["ID", "User", "Amount", "Status", "Actions"]}>
          {items.length ? items.map((r, i) => <tr key={r.id || i} className="border-t" style={borderC}>
            <td className="px-4 py-3" style={tdMain}>{r.id}</td>
            <td className="px-4 py-3" style={tdMain}>{r.user}</td>
            <td className="px-4 py-3" style={tdMain}>{r.amount}</td>
            <td className="px-4 py-3"><span className="px-2 py-1 rounded-lg text-xs font-bold" style={badge(r.status)}>{r.status}</span></td>
            <td className="px-4 py-3">{r.status === "pending" && <button onClick={() => handleDistApprove(r.id)} className="px-3 py-1 rounded-lg text-xs font-medium" style={btnSuccess}>Approve</button>}</td>
          </tr>) : <Empty cols={5} />}
        </Table><Pagination /></>) :
        (<><Table cols={subTab === "codes" ? ["Code", "User", "Uses"] : ["ID", "User", "Referrer", "Status"]}>
          {items.length ? items.map((r, i) => <tr key={r.id || i} className="border-t" style={borderC}>
            {subTab === "codes" ? <>
              <td className="px-4 py-3" style={{ color: B.accent }}>{r.code}</td>
              <td className="px-4 py-3" style={tdMain}>{r.user}</td>
              <td className="px-4 py-3" style={tdMain}>{r.uses}</td>
            </> : <>
              <td className="px-4 py-3" style={tdMain}>{r.id}</td>
              <td className="px-4 py-3" style={tdMain}>{r.user}</td>
              <td className="px-4 py-3" style={tdMain}>{r.referrer}</td>
              <td className="px-4 py-3"><span className="px-2 py-1 rounded-lg text-xs font-bold" style={badge(r.status)}>{r.status}</span></td>
            </>}
          </tr>) : <Empty cols={subTab === "codes" ? 3 : 4} />}
        </Table><Pagination /></>)}
      </>);
    }

    if (tab === "coins") return (<>
      {extra.coinAnalytics && typeof extra.coinAnalytics === "object" && Object.keys(extra.coinAnalytics).length > 0 && (
        <div className="mb-6"><h3 className="text-sm font-semibold mb-3" style={tdMuted}>Coin Analytics</h3><StatsGrid data={extra.coinAnalytics} /></div>
      )}
      <h3 className="text-sm font-semibold mb-3" style={tdMuted}>Adjustments</h3>
      <Table cols={["User", "Amount", "Reason", "Status", "Actions"]}>
        {items.length ? items.map((r, i) => <tr key={r.id || i} className="border-t" style={borderC}>
          <td className="px-4 py-3" style={tdMain}>{r.user}</td>
          <td className="px-4 py-3" style={tdMain}>{r.amount}</td>
          <td className="px-4 py-3" style={tdMuted}>{r.reason}</td>
          <td className="px-4 py-3"><span className="px-2 py-1 rounded-lg text-xs font-bold" style={badge(r.status)}>{r.status}</span></td>
          <td className="px-4 py-3">{r.status === "pending" && <button onClick={() => handleApprove(r.id)} className="px-3 py-1 rounded-lg text-xs font-medium" style={btnSuccess}>Approve</button>}</td>
        </tr>) : <Empty cols={5} />}
      </Table>
      <Pagination />
      {extra.coinConfig && extra.coinConfig.length > 0 && (<div className="mt-6">
        <h3 className="text-sm font-semibold mb-3" style={tdMuted}>Distribution Config</h3>
        <Table cols={["ID", "Type", "Amount", "Actions"]}>
          {extra.coinConfig.map((r, i) => <tr key={r.id || i} className="border-t" style={borderC}>
            <td className="px-4 py-3" style={tdMain}>{r.id}</td>
            <td className="px-4 py-3" style={tdMain}>{r.type || r.name}</td>
            <td className="px-4 py-3" style={tdMain}>{r.amount || r.coins}</td>
            <td className="px-4 py-3"><button onClick={() => handleDeleteConfig(r.id)} className="px-3 py-1 rounded-lg text-xs font-medium" style={btnError}>Delete</button></td>
          </tr>)}
        </Table>
      </div>)}
    </>);

    if (tab === "payments") return (<>
      {extra.payAnalytics && typeof extra.payAnalytics === "object" && Object.keys(extra.payAnalytics).length > 0 && (
        <div className="mb-6"><h3 className="text-sm font-semibold mb-3" style={tdMuted}>Payment Analytics</h3><StatsGrid data={extra.payAnalytics} /></div>
      )}
      <Table cols={["User", "Amount", "Status", "Date", "Actions"]}>
        {items.length ? items.map((r, i) => <tr key={r.id || i} className="border-t" style={borderC}>
          <td className="px-4 py-3" style={tdMain}>{r.user}</td>
          <td className="px-4 py-3" style={tdMain}>{r.amount}</td>
          <td className="px-4 py-3"><span className="px-2 py-1 rounded-lg text-xs font-bold" style={badge(r.status)}>{r.status}</span></td>
          <td className="px-4 py-3" style={tdMuted}>{r.date}</td>
          <td className="px-4 py-3"><button onClick={() => handleDetail(r.id, "payment")} className="px-3 py-1 rounded-lg text-xs font-medium" style={btnInfo}>Detail</button></td>
        </tr>) : <Empty cols={5} />}
      </Table>
      <Pagination />
    </>);

    if (tab === "reports") return (<div className="space-y-6">
      {[["Health", extra.health], ["Revenue", extra.revenue], ["Churn", extra.churn], ["LTV", extra.ltv], ["Coin Cost", extra.coinCost], ["Analytics", extra.analytics]].map(([title, data]) => (
        <div key={title}><h3 className="text-sm font-semibold mb-3" style={tdMuted}>{title}</h3><StatsGrid data={data} /></div>
      ))}
    </div>);

    if (tab === "cycles") return (<><Table cols={["ID", "User", "Plan", "Start", "End", "Status"]}>
      {items.length ? items.map((r, i) => <tr key={r.id || i} className="border-t" style={borderC}>
        <td className="px-4 py-3" style={tdMain}>{r.id}</td>
        <td className="px-4 py-3" style={tdMain}>{r.user}</td>
        <td className="px-4 py-3" style={tdMain}>{r.plan}</td>
        <td className="px-4 py-3" style={tdMuted}>{r.start_date}</td>
        <td className="px-4 py-3" style={tdMuted}>{r.end_date}</td>
        <td className="px-4 py-3"><span className="px-2 py-1 rounded-lg text-xs font-bold" style={badge(r.status)}>{r.status}</span></td>
      </tr>) : <Empty cols={6} />}
    </Table><Pagination /></>);

    if (tab === "refunds") return (<><Table cols={["ID", "User", "Amount", "Reason", "Status", "Actions"]}>
      {items.length ? items.map((r, i) => <tr key={r.id || i} className="border-t" style={borderC}>
        <td className="px-4 py-3" style={tdMain}>{r.id}</td>
        <td className="px-4 py-3" style={tdMain}>{r.user}</td>
        <td className="px-4 py-3" style={tdMain}>{r.amount}</td>
        <td className="px-4 py-3" style={tdMuted}>{r.reason}</td>
        <td className="px-4 py-3"><span className="px-2 py-1 rounded-lg text-xs font-bold" style={badge(r.status)}>{r.status}</span></td>
        <td className="px-4 py-3">{(r.status === "pending") && <button onClick={() => handleRefundApprove(r.id)} className="px-3 py-1 rounded-lg text-xs font-medium" style={btnSuccess}>Approve</button>}</td>
      </tr>) : <Empty cols={6} />}
    </Table><Pagination /></>);

    if (tab === "webhooks") return (<><Table cols={["ID", "Event", "Status", "Created", "Payload"]}>
      {items.length ? items.map((r, i) => <tr key={r.id || i} className="border-t" style={borderC}>
        <td className="px-4 py-3" style={tdMain}>{r.id}</td>
        <td className="px-4 py-3" style={tdMain}>{r.event || r.event_type}</td>
        <td className="px-4 py-3"><span className="px-2 py-1 rounded-lg text-xs font-bold" style={badge(r.status === "processed" || r.status === "success" ? "active" : r.status)}>{r.status}</span></td>
        <td className="px-4 py-3" style={tdMuted}>{r.created_at || r.date}</td>
        <td className="px-4 py-3 max-w-xs truncate" style={tdMuted}>{typeof r.payload === "object" ? JSON.stringify(r.payload).slice(0, 80) : r.payload}</td>
      </tr>) : <Empty cols={5} />}
    </Table><Pagination /></>);

    return null;
  };

  return (
    <div>
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setModal(null)}>
          <div className="rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" style={{ backgroundColor: B.panel, border: `1px solid ${B.panelLight}` }} onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold" style={tdMain}>Detail</h3>
              <button onClick={() => setModal(null)} className="px-3 py-1 rounded-lg text-xs" style={btnMuted}>Close</button>
            </div>
            <div className="space-y-2">
              {Object.entries(modal).filter(([, v]) => typeof v !== "object").map(([k, v]) => (
                <div key={k} className="flex justify-between py-1 border-b" style={borderC}>
                  <span className="text-xs font-medium" style={tdMuted}>{k.replace(/_/g, " ")}</span>
                  <span className="text-sm" style={tdMain}>{String(v)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      <div className="flex gap-2 flex-wrap mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id === "referrals") setSubTab("codes"); }}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ backgroundColor: tab === t.id ? B.primary : B.panel, color: tab === t.id ? "#fff" : B.textMuted, border: `1px solid ${B.panelLight}` }}>
            {t.label}
          </button>
        ))}
      </div>
      {loading ? <div className="text-center py-12" style={tdMuted}>Loading...</div> : renderContent()}
    </div>
  );
}
