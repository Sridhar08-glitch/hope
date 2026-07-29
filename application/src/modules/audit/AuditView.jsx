import { useState, useEffect, useCallback } from "react";
import adminApi from "../../services/adminApi";

const B = { bg:'#150926', panel:'#281247', card:'#281247', panelLight:'#3b0866', primary:'#7E22CE', accent:'#F4BE69', textMain:'#F8FAFC', textMuted:'#cbd5e1', success:'#10b981', error:'#ef4444', warning:'#f59e0b', info:'#3b82f6' };

const TABS = [
  { id: "logs", label: "Audit Logs" },
  { id: "userActions", label: "User Actions" },
  { id: "segments", label: "Segments" },
  { id: "bulk", label: "Bulk History" },
  { id: "violations", label: "Violations" },
  { id: "search", label: "Advanced Search" },
];

const ENTITIES = [
  { id: "users", label: "Users" },
  { id: "trainers", label: "Trainers" },
  { id: "applications", label: "Applications" },
  { id: "bookings", label: "Bookings" },
];

const StatCard = ({ label, value, color }) => (
  <div className="rounded-2xl p-4 flex flex-col gap-1" style={{ backgroundColor: B.card, border: `1px solid ${B.panelLight}` }}>
    <span className="text-xs font-medium" style={{ color: B.textMuted }}>{label}</span>
    <span className="text-xl font-bold" style={{ color: color || B.textMain }}>{value ?? "--"}</span>
  </div>
);

const TH = ({ children }) => <th className="text-left px-4 py-3 font-semibold" style={{ color: B.textMuted }}>{children}</th>;
const TD = ({ children, color }) => <td className="px-4 py-3" style={{ color: color || B.textMuted }}>{children}</td>;
const Empty = ({ cols }) => <tr><td colSpan={cols} className="text-center px-4 py-8" style={{ color: B.textMuted }}>No records found</td></tr>;

const Btn = ({ onClick, label, color, small }) => (
  <button onClick={onClick} className={`px-${small ? 3 : 4} py-${small ? 1 : 2} rounded-xl text-${small ? 'xs' : 'sm'} font-medium`}
    style={{ backgroundColor: color || B.primary, color: '#fff' }}>{label}</button>
);
const BtnGhost = ({ onClick, label, color }) => (
  <button onClick={onClick} className="px-3 py-1 rounded-xl text-xs font-medium"
    style={{ backgroundColor: (color || B.primary) + '20', color: color || B.primary }}>{label}</button>
);

const Table = ({ heads, children }) => (
  <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: B.panelLight }}>
    <table className="w-full text-sm">
      <thead><tr style={{ backgroundColor: B.panelLight }}>{heads.map(h => <TH key={h}>{h}</TH>)}</tr></thead>
      <tbody>{children}</tbody>
    </table>
  </div>
);

export default function AuditView({ token, showToast }) {
  const [tab, setTab] = useState("logs");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [stats, setStats] = useState(null);
  // segments
  const [segData, setSegData] = useState({ predefined: {}, custom: [] });
  const [segUsers, setSegUsers] = useState(null);
  const [segViewId, setSegViewId] = useState(null);
  // search
  const [searchEntity, setSearchEntity] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  // dashboard stats
  useEffect(() => {
    (async () => {
      try { const r = await adminApi.audit.dashboardStats(token); setStats(r); } catch {}
    })();
  }, [token]);

  const loadData = useCallback(async (url) => {
    setLoading(true);
    try {
      let res;
      if (url) { res = await adminApi.fetchUrl?.(token, url) || await fetch(url).then(r => r.json()); }
      else if (tab === "logs") res = await adminApi.audit.logs(token);
      else if (tab === "userActions") res = await adminApi.audit.userActions(token);
      else if (tab === "segments") {
        res = await adminApi.segments.list(token);
        const pre = res?.predefined_segments || {};
        const cust = res?.custom_segments || res?.results || (Array.isArray(res) ? res : []);
        setSegData({ predefined: pre, custom: cust });
        setItems(cust);
        setNextUrl(res?.next || null); setPrevUrl(res?.previous || null);
        setLoading(false); return;
      }
      else if (tab === "bulk") res = await adminApi.bulk.history(token);
      else if (tab === "violations") res = await adminApi.audit.violations(token);
      else if (tab === "search") { setLoading(false); return; }
      const list = res?.logs || res?.violations || res?.results || (Array.isArray(res) ? res : []);
      setItems(list);
      setNextUrl(res?.next || null); setPrevUrl(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    setLoading(false);
  }, [tab, token, showToast]);

  useEffect(() => { setSegUsers(null); setSegViewId(null); setSearchResults([]); loadData(); }, [loadData]);

  const Pagination = () => (nextUrl || prevUrl) ? (
    <div className="flex gap-3 mt-4">
      {prevUrl && <button onClick={() => loadData(prevUrl)} className="px-4 py-2 rounded-xl text-sm" style={{ backgroundColor: B.panel, color: B.textMuted, border: `1px solid ${B.panelLight}` }}>Previous</button>}
      {nextUrl && <button onClick={() => loadData(nextUrl)} className="px-4 py-2 rounded-xl text-sm" style={{ backgroundColor: B.primary, color: '#fff' }}>Next</button>}
    </div>
  ) : null;

  // segment actions
  const handleCreateSegment = async () => {
    const name = prompt("Segment name:"); if (!name) return;
    const criteria = prompt("Criteria (JSON):"); if (!criteria) return;
    try { await adminApi.segments.create(token, { name, criteria: JSON.parse(criteria) }); showToast("Segment created", "success"); loadData(); }
    catch (err) { showToast(err.message, "error"); }
  };
  const handleDeleteSegment = async (id) => {
    if (!window.confirm("Delete this segment?")) return;
    try { await adminApi.segments.delete(token, id); showToast("Segment deleted", "success"); loadData(); }
    catch (err) { showToast(err.message, "error"); }
  };
  const handleUpdateSegment = async (id) => {
    const name = prompt("New name:"); if (!name) return;
    try { await adminApi.segments.update(token, id, { name }); showToast("Segment updated", "success"); loadData(); }
    catch (err) { showToast(err.message, "error"); }
  };
  const handleViewSegUsers = async (id) => {
    try { const r = await adminApi.segments.users(token, id); setSegUsers(r?.results || r?.users || (Array.isArray(r) ? r : [])); setSegViewId(id); }
    catch (err) { showToast(err.message, "error"); }
  };
  // bulk action
  const handleBulkAction = async () => {
    const action = prompt("Action type (e.g. notify, deactivate):"); if (!action) return;
    const ids = prompt("User IDs (comma separated):"); if (!ids) return;
    try { await adminApi.bulk.action(token, { action, user_ids: ids.split(",").map(s => s.trim()) }); showToast("Bulk action executed", "success"); loadData(); }
    catch (err) { showToast(err.message, "error"); }
  };
  // search
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const fn = adminApi.search[searchEntity];
      const r = await fn(token, { query: searchQuery.trim() });
      setSearchResults(r?.results || (Array.isArray(r) ? r : []));
    } catch (err) { showToast(err.message, "error"); }
    setLoading(false);
  };

  const Row = ({ children, id, i }) => <tr key={id || i} className="border-t" style={{ borderColor: B.panelLight }}>{children}</tr>;

  const renderDashboard = () => {
    if (!stats) return null;
    const { users, trainers, applications, bookings } = stats;
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard label="Total Users" value={users?.total} color={B.info} />
        <StatCard label="Active (7d)" value={users?.active_7_days} color={B.success} />
        <StatCard label="New (30d)" value={users?.new_30_days} color={B.accent} />
        <StatCard label="Trainers" value={trainers?.total} color={B.primary} />
        <StatCard label="Verified Trainers" value={trainers?.verified} color={B.success} />
        <StatCard label="Pending Apps" value={applications?.pending} color={B.warning} />
        <StatCard label="Approved Apps" value={applications?.approved} color={B.success} />
        <StatCard label="Total Bookings" value={bookings?.total} color={B.info} />
        <StatCard label="Pending Bookings" value={bookings?.pending} color={B.warning} />
        <StatCard label="Revenue" value={bookings?.total_revenue != null ? `$${bookings.total_revenue}` : "--"} color={B.accent} />
      </div>
    );
  };

  const renderContent = () => {
    if (tab === "logs") return (
      <><Table heads={["Timestamp", "Admin", "Action", "Target"]}>
        {items.length ? items.map((r, i) => <Row key={r.id || i}><TD>{r.timestamp}</TD><TD color={B.textMain}>{r.admin}</TD><TD color={B.accent}>{r.action}</TD><TD color={B.textMain}>{r.target}</TD></Row>)
        : <Empty cols={4} />}
      </Table><Pagination /></>
    );

    if (tab === "userActions") return (
      <><Table heads={["Timestamp", "User", "Action", "Details"]}>
        {items.length ? items.map((r, i) => <Row key={r.id || i}><TD>{r.timestamp}</TD><TD color={B.textMain}>{r.user}</TD><TD color={B.accent}>{r.action}</TD><TD>{r.details}</TD></Row>)
        : <Empty cols={4} />}
      </Table><Pagination /></>
    );

    if (tab === "violations") return (
      <><Table heads={["Timestamp", "User", "Type", "Details"]}>
        {items.length ? items.map((r, i) => <Row key={r.id || i}><TD>{r.timestamp}</TD><TD color={B.textMain}>{r.user}</TD><TD color={B.error}>{r.type}</TD><TD>{r.details}</TD></Row>)
        : <Empty cols={4} />}
      </Table><Pagination /></>
    );

    if (tab === "segments") {
      const preKeys = Object.keys(segData.predefined);
      return (
        <>
          {preKeys.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {preKeys.map(k => { const s = segData.predefined[k]; return (
                <div key={k} className="rounded-2xl p-3 cursor-pointer" style={{ backgroundColor: B.card, border: `1px solid ${B.panelLight}` }} onClick={() => handleViewSegUsers(k)}>
                  <span className="text-xs" style={{ color: B.textMuted }}>{s.icon} {s.name}</span>
                  <div className="text-lg font-bold mt-1" style={{ color: s.color || B.accent }}>{s.count}</div>
                </div>
              );})}
            </div>
          )}
          <div className="flex justify-end mb-4"><Btn onClick={handleCreateSegment} label="Create Segment" /></div>
          <Table heads={["Name", "Criteria", "Count", "Actions"]}>
            {segData.custom.length ? segData.custom.map((r, i) => (
              <Row key={r.id || i}>
                <TD color={B.textMain}>{r.name}</TD>
                <TD>{typeof r.criteria === 'object' ? JSON.stringify(r.criteria) : r.criteria}</TD>
                <TD color={B.accent}>{r.user_count}</TD>
                <TD>
                  <div className="flex gap-2">
                    <BtnGhost onClick={() => handleViewSegUsers(r.id)} label="Users" color={B.info} />
                    <BtnGhost onClick={() => handleUpdateSegment(r.id)} label="Edit" color={B.accent} />
                    <BtnGhost onClick={() => handleDeleteSegment(r.id)} label="Delete" color={B.error} />
                  </div>
                </TD>
              </Row>
            )) : <Empty cols={4} />}
          </Table>
          {segViewId && segUsers && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold" style={{ color: B.textMain }}>Users in segment: {segViewId}</span>
                <BtnGhost onClick={() => { setSegUsers(null); setSegViewId(null); }} label="Close" color={B.error} />
              </div>
              <Table heads={["ID", "Name", "Email"]}>
                {segUsers.length ? segUsers.map((u, i) => <Row key={u.id || i}><TD color={B.textMain}>{u.id}</TD><TD color={B.textMain}>{u.name || u.username}</TD><TD>{u.email}</TD></Row>)
                : <Empty cols={3} />}
              </Table>
            </div>
          )}
          <Pagination />
        </>
      );
    }

    if (tab === "bulk") return (
      <>
        <div className="flex justify-end mb-4"><Btn onClick={handleBulkAction} label="Execute Bulk Action" /></div>
        <Table heads={["Operation", "Status", "Affected Count", "Date"]}>
          {items.length ? items.map((r, i) => (
            <Row key={r.id || i}>
              <TD color={B.textMain}>{r.operation}</TD>
              <TD><span className="px-2 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: (r.status === 'active' ? B.success : r.status === 'pending' ? B.warning : B.error) + '20', color: r.status === 'active' ? B.success : r.status === 'pending' ? B.warning : B.error }}>{r.status}</span></TD>
              <TD color={B.accent}>{r.affected_count}</TD>
              <TD>{r.date}</TD>
            </Row>
          )) : <Empty cols={4} />}
        </Table><Pagination />
      </>
    );

    if (tab === "search") return (
      <>
        <div className="flex gap-3 mb-4 flex-wrap items-end">
          <div className="flex flex-col gap-1">
            <span className="text-xs" style={{ color: B.textMuted }}>Entity</span>
            <select value={searchEntity} onChange={e => setSearchEntity(e.target.value)}
              className="px-3 py-2 rounded-xl text-sm" style={{ backgroundColor: B.panel, color: B.textMain, border: `1px solid ${B.panelLight}` }}>
              {ENTITIES.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
            <span className="text-xs" style={{ color: B.textMuted }}>Search</span>
            <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search..." className="px-3 py-2 rounded-xl text-sm" style={{ backgroundColor: B.panel, color: B.textMain, border: `1px solid ${B.panelLight}` }} />
          </div>
          <Btn onClick={handleSearch} label="Search" />
        </div>
        <Table heads={["ID", "Name", "Email / Info", "Status"]}>
          {searchResults.length ? searchResults.map((r, i) => (
            <Row key={r.id || i}>
              <TD color={B.textMain}>{r.id}</TD>
              <TD color={B.textMain}>{r.name || r.username || r.title || "--"}</TD>
              <TD>{r.email || r.phone || r.description || "--"}</TD>
              <TD><span className="px-2 py-1 rounded-lg text-xs font-bold" style={{ backgroundColor: (r.status === 'active' || r.status === 'approved' ? B.success : r.status === 'pending' ? B.warning : B.info) + '20', color: r.status === 'active' || r.status === 'approved' ? B.success : r.status === 'pending' ? B.warning : B.info }}>{r.status || "--"}</span></TD>
            </Row>
          )) : <Empty cols={4} />}
        </Table>
      </>
    );

    return null;
  };

  return (
    <div>
      {renderDashboard()}
      <div className="flex gap-2 flex-wrap mb-6">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ backgroundColor: tab === t.id ? B.primary : B.panel, color: tab === t.id ? '#fff' : B.textMuted, border: `1px solid ${B.panelLight}` }}>
            {t.label}
          </button>
        ))}
      </div>
      {loading ? <div className="text-center py-12" style={{ color: B.textMuted }}>Loading...</div> : renderContent()}
    </div>
  );
}
