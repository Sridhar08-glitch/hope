"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, FileText, Users, Activity, AlertTriangle, Database, History } from "lucide-react";
import { motion } from "framer-motion";
import { BRAND, Spinner } from "@holora/ui";
import type { ApiClient } from "@holora/api-client";
import {
  PageHeader, TabBar, DataTable, TR, TD, Modal, ConfirmDialog,
  EmptyState, StatCard, StatusBadge, SimplePagination,
  PrimaryButton, GhostButton, FormField, inputStyle, fadeUp, cardStyle,
} from "@/components/shared";

interface ViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
}

type Tab = "logs" | "userActions" | "segments" | "bulk" | "violations" | "search";

const ENTITIES = [
  { id: "users", label: "Users" },
  { id: "trainers", label: "Trainers" },
  { id: "applications", label: "Applications" },
  { id: "bookings", label: "Bookings" },
];

export default function AuditView({ api, showToast }: ViewProps) {
  const [tab, setTab] = useState<Tab>("logs");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [segData, setSegData] = useState<{ predefined: Record<string, any>; custom: any[] }>({ predefined: {}, custom: [] });
  const [segUsers, setSegUsers] = useState<any[] | null>(null);
  const [segViewId, setSegViewId] = useState<string | null>(null);
  const [searchEntity, setSearchEntity] = useState("users");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);

  /* ── Segment modals ─────────────────────────────── */
  const [createSegModal, setCreateSegModal] = useState(false);
  const [editSegModal, setEditSegModal] = useState<string | null>(null);
  const [deleteSegConfirm, setDeleteSegConfirm] = useState<string | null>(null);
  const [segForm, setSegForm] = useState({ name: "", criteria: "" });

  /* ── Bulk modal ─────────────────────────────────── */
  const [bulkModal, setBulkModal] = useState(false);
  const [bulkForm, setBulkForm] = useState({ action: "", user_ids: "" });

  /* ── Dashboard stats ────────────────────────────── */
  useEffect(() => {
    api.get<any>("/admin/dashboard/stats/").then(r => setStats(r)).catch(() => {});
  }, [api]);

  /* ── Load data ──────────────────────────────────── */
  const loadData = useCallback(async (url?: string) => {
    setLoading(true);
    try {
      let res: any;
      if (url) {
        res = await api.get<any>(url);
      } else if (tab === "logs") res = await api.get<any>("/admin/audit-logs/");
      else if (tab === "userActions") res = await api.get<any>("/admin/user-actions/");
      else if (tab === "segments") {
        res = await api.get<any>("/admin/segments/");
        const pre = res?.predefined_segments || {};
        const cust = res?.custom_segments || res?.results || (Array.isArray(res) ? res : []);
        setSegData({ predefined: pre, custom: cust });
        setItems(cust);
        setNextUrl(res?.next || null); setPrevUrl(res?.previous || null);
        setLoading(false); return;
      }
      else if (tab === "bulk") res = await api.get<any>("/admin/bulk-operations/history/");
      else if (tab === "violations") res = await api.get<any>("/admin/violations/");
      else if (tab === "search") { setLoading(false); return; }
      const list = res?.logs || res?.violations || res?.results || (Array.isArray(res) ? res : []);
      setItems(list);
      setNextUrl(res?.next || null); setPrevUrl(res?.previous || null);
    } catch (err) { showToast(err instanceof Error ? err.message : "Failed to load data", "error"); }
    setLoading(false);
  }, [tab, api, showToast]);

  useEffect(() => { setSegUsers(null); setSegViewId(null); setSearchResults([]); loadData(); }, [loadData]);

  /* ── Segment actions ────────────────────────────── */
  const handleCreateSegment = async () => {
    try {
      await api.post("/admin/segments/", { name: segForm.name, criteria: JSON.parse(segForm.criteria) });
      showToast("Segment created", "success");
      setCreateSegModal(false); setSegForm({ name: "", criteria: "" }); loadData();
    } catch (err) { showToast(err instanceof Error ? err.message : "Create failed", "error"); }
  };

  const handleDeleteSegment = async (id: string) => {
    try { await api.del(`/admin/segments/${id}/`); showToast("Segment deleted", "success"); setDeleteSegConfirm(null); loadData(); }
    catch (err) { showToast(err instanceof Error ? err.message : "Delete failed", "error"); }
  };

  const handleUpdateSegment = async () => {
    if (!editSegModal) return;
    try { await api.put(`/admin/segments/${editSegModal}/`, { name: segForm.name }); showToast("Segment updated", "success"); setEditSegModal(null); loadData(); }
    catch (err) { showToast(err instanceof Error ? err.message : "Update failed", "error"); }
  };

  const handleViewSegUsers = async (id: string) => {
    try { const r = await api.get<any>(`/admin/segments/${id}/users/`); setSegUsers(r?.results || r?.users || (Array.isArray(r) ? r : [])); setSegViewId(id); }
    catch (err) { showToast(err instanceof Error ? err.message : "Failed to load users", "error"); }
  };

  /* ── Bulk action ────────────────────────────────── */
  const handleBulkAction = async () => {
    try {
      await api.post("/admin/bulk-action/", { action: bulkForm.action, user_ids: bulkForm.user_ids.split(",").map(s => s.trim()) });
      showToast("Bulk action executed", "success"); setBulkModal(false); setBulkForm({ action: "", user_ids: "" }); loadData();
    } catch (err) { showToast(err instanceof Error ? err.message : "Bulk action failed", "error"); }
  };

  /* ── Search ─────────────────────────────────────── */
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const r = await api.get<any>(`/admin/search/${searchEntity}/`, { query: searchQuery.trim() });
      setSearchResults(r?.results || (Array.isArray(r) ? r : []));
    } catch (err) { showToast(err instanceof Error ? err.message : "Search failed", "error"); }
    setLoading(false);
  };

  const selectClass = "rounded-lg px-3 py-1.5 text-[12px] outline-none";

  return (
    <div className="space-y-4">
      <PageHeader title="Audit & Compliance" subtitle="Audit logs, segments, bulk operations and search" />

      {/* ── Dashboard stats ────────────────────────── */}
      {stats && (
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <StatCard label="Total Users" value={stats.users?.total} color={BRAND.info} />
          <StatCard label="Active (7d)" value={stats.users?.active_7_days} color={BRAND.success} />
          <StatCard label="New (30d)" value={stats.users?.new_30_days} color={BRAND.accent} />
          <StatCard label="Trainers" value={stats.trainers?.total} color={BRAND.primary} />
          <StatCard label="Verified Trainers" value={stats.trainers?.verified} color={BRAND.success} />
          <StatCard label="Pending Apps" value={stats.applications?.pending} color={BRAND.warning} />
          <StatCard label="Approved Apps" value={stats.applications?.approved} color={BRAND.success} />
          <StatCard label="Total Bookings" value={stats.bookings?.total} color={BRAND.info} />
          <StatCard label="Pending Bookings" value={stats.bookings?.pending} color={BRAND.warning} />
          <StatCard label="Revenue" value={stats.bookings?.total_revenue != null ? `$${stats.bookings.total_revenue}` : "--"} color={BRAND.accent} />
        </motion.div>
      )}

      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
        <TabBar<Tab>
          tabs={[
            { key: "logs", label: "Audit Logs", icon: FileText },
            { key: "userActions", label: "User Actions", icon: Users },
            { key: "segments", label: "Segments", icon: Database },
            { key: "bulk", label: "Bulk History", icon: History },
            { key: "violations", label: "Violations", icon: AlertTriangle },
            { key: "search", label: "Advanced Search", icon: Search },
          ]}
          active={tab}
          onChange={setTab}
        />
      </motion.div>

      {loading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">

          {/* ── Audit Logs ───────────────────────────── */}
          {tab === "logs" && (
            items.length === 0 ? <EmptyState icon={FileText} message="No audit logs found" /> : (
              <>
                <DataTable cols={["Timestamp", "Admin", "Action", "Target"]}>
                  {items.map((r: any, i: number) => (
                    <TR key={r.id || i}>
                      <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{r.timestamp}</span></TD>
                      <TD>{r.admin}</TD>
                      <TD><span className="text-[12px] font-medium" style={{ color: BRAND.accent }}>{r.action}</span></TD>
                      <TD>{r.target}</TD>
                    </TR>
                  ))}
                </DataTable>
                <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl!)} onNext={() => loadData(nextUrl!)} count={items.length} />
              </>
            )
          )}

          {/* ── User Actions ─────────────────────────── */}
          {tab === "userActions" && (
            items.length === 0 ? <EmptyState icon={Users} message="No user actions found" /> : (
              <>
                <DataTable cols={["Timestamp", "User", "Action", "Details"]}>
                  {items.map((r: any, i: number) => (
                    <TR key={r.id || i}>
                      <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{r.timestamp}</span></TD>
                      <TD>{r.user}</TD>
                      <TD><span className="text-[12px] font-medium" style={{ color: BRAND.accent }}>{r.action}</span></TD>
                      <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{r.details}</span></TD>
                    </TR>
                  ))}
                </DataTable>
                <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl!)} onNext={() => loadData(nextUrl!)} count={items.length} />
              </>
            )
          )}

          {/* ── Violations ───────────────────────────── */}
          {tab === "violations" && (
            items.length === 0 ? <EmptyState icon={AlertTriangle} message="No violations found" /> : (
              <>
                <DataTable cols={["Timestamp", "User", "Type", "Details"]}>
                  {items.map((r: any, i: number) => (
                    <TR key={r.id || i}>
                      <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{r.timestamp}</span></TD>
                      <TD>{r.user}</TD>
                      <TD><span className="text-[12px] font-medium" style={{ color: BRAND.error }}>{r.type}</span></TD>
                      <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{r.details}</span></TD>
                    </TR>
                  ))}
                </DataTable>
                <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl!)} onNext={() => loadData(nextUrl!)} count={items.length} />
              </>
            )
          )}

          {/* ── Segments ─────────────────────────────── */}
          {tab === "segments" && (
            <>
              {Object.keys(segData.predefined).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {Object.entries(segData.predefined).map(([k, s]: [string, any]) => (
                    <button key={k} onClick={() => handleViewSegUsers(k)} className="rounded-lg p-2.5 text-left transition hover:opacity-90" style={cardStyle}>
                      <span className="text-[10px] uppercase tracking-wider" style={{ color: BRAND.textDim }}>{s.icon} {s.name}</span>
                      <p className="text-[16px] font-bold mt-1" style={{ color: s.color || BRAND.accent }}>{s.count}</p>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex justify-end mb-3">
                <PrimaryButton onClick={() => { setSegForm({ name: "", criteria: "" }); setCreateSegModal(true); }}>Create Segment</PrimaryButton>
              </div>

              {segData.custom.length === 0 ? <EmptyState icon={Database} message="No custom segments" /> : (
                <DataTable cols={["Name", "Criteria", "Count", "Actions"]}>
                  {segData.custom.map((r: any, i: number) => (
                    <TR key={r.id || i}>
                      <TD><span className="text-[12px] font-medium">{r.name}</span></TD>
                      <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{typeof r.criteria === "object" ? JSON.stringify(r.criteria) : r.criteria}</span></TD>
                      <TD><span className="text-[12px] font-semibold" style={{ color: BRAND.accent }}>{r.user_count}</span></TD>
                      <TD>
                        <div className="flex gap-1">
                          <GhostButton onClick={() => handleViewSegUsers(r.id)}>Users</GhostButton>
                          <GhostButton onClick={() => { setSegForm({ name: r.name, criteria: "" }); setEditSegModal(r.id); }}>Edit</GhostButton>
                          <GhostButton onClick={() => setDeleteSegConfirm(r.id)}><span style={{ color: BRAND.error }}>Delete</span></GhostButton>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </DataTable>
              )}

              {segViewId && segUsers && (
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-semibold" style={{ color: BRAND.textMain }}>Users in segment: {segViewId}</span>
                    <GhostButton onClick={() => { setSegUsers(null); setSegViewId(null); }}>Close</GhostButton>
                  </div>
                  {segUsers.length === 0 ? <EmptyState icon={Users} message="No users in this segment" /> : (
                    <DataTable cols={["ID", "Name", "Email"]}>
                      {segUsers.map((u: any, i: number) => (
                        <TR key={u.id || i}>
                          <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{u.id}</span></TD>
                          <TD>{u.name || u.username}</TD>
                          <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{u.email}</span></TD>
                        </TR>
                      ))}
                    </DataTable>
                  )}
                </div>
              )}

              <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl!)} onNext={() => loadData(nextUrl!)} count={items.length} />
            </>
          )}

          {/* ── Bulk History ─────────────────────────── */}
          {tab === "bulk" && (
            <>
              <div className="flex justify-end mb-3">
                <PrimaryButton onClick={() => { setBulkForm({ action: "", user_ids: "" }); setBulkModal(true); }}>Execute Bulk Action</PrimaryButton>
              </div>
              {items.length === 0 ? <EmptyState icon={History} message="No bulk history" /> : (
                <>
                  <DataTable cols={["Operation", "Status", "Affected Count", "Date"]}>
                    {items.map((r: any, i: number) => (
                      <TR key={r.id || i}>
                        <TD>{r.operation}</TD>
                        <TD><StatusBadge status={r.status || "pending"} /></TD>
                        <TD><span className="text-[12px] font-semibold" style={{ color: BRAND.accent }}>{r.affected_count}</span></TD>
                        <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{r.date}</span></TD>
                      </TR>
                    ))}
                  </DataTable>
                  <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl!)} onNext={() => loadData(nextUrl!)} count={items.length} />
                </>
              )}
            </>
          )}

          {/* ── Advanced Search ──────────────────────── */}
          {tab === "search" && (
            <>
              <div className="flex gap-3 flex-wrap items-end mb-4">
                <FormField label="Entity">
                  <select value={searchEntity} onChange={e => setSearchEntity(e.target.value)} className={selectClass} style={inputStyle}>
                    {ENTITIES.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                  </select>
                </FormField>
                <div className="flex-1 min-w-[200px]">
                  <FormField label="Search">
                    <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch()}
                      placeholder="Search..." className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none placeholder:text-[11px]" style={inputStyle} />
                  </FormField>
                </div>
                <PrimaryButton onClick={handleSearch}>Search</PrimaryButton>
              </div>
              {searchResults.length === 0 ? <EmptyState icon={Search} message="No results -- search for users, trainers, applications or bookings" /> : (
                <DataTable cols={["ID", "Name", "Email / Info", "Status"]}>
                  {searchResults.map((r: any, i: number) => (
                    <TR key={r.id || i}>
                      <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{r.id}</span></TD>
                      <TD>{r.name || r.username || r.title || "--"}</TD>
                      <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{r.email || r.phone || r.description || "--"}</span></TD>
                      <TD><StatusBadge status={r.status || "draft"} /></TD>
                    </TR>
                  ))}
                </DataTable>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* ── Create Segment Modal ──────────────────── */}
      {createSegModal && (
        <Modal title="Create Segment" onClose={() => setCreateSegModal(false)}>
          <div className="space-y-3">
            <FormField label="Segment Name">
              <input value={segForm.name} onChange={e => setSegForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none" style={inputStyle} />
            </FormField>
            <FormField label="Criteria (JSON)">
              <textarea value={segForm.criteria} onChange={e => setSegForm(f => ({ ...f, criteria: e.target.value }))} rows={4}
                className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none resize-none font-mono" style={inputStyle} placeholder='{"key": "value"}' />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <GhostButton onClick={() => setCreateSegModal(false)}>Cancel</GhostButton>
              <PrimaryButton onClick={handleCreateSegment}>Create</PrimaryButton>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Edit Segment Modal ────────────────────── */}
      {editSegModal && (
        <Modal title="Edit Segment" onClose={() => setEditSegModal(null)}>
          <div className="space-y-3">
            <FormField label="Segment Name">
              <input value={segForm.name} onChange={e => setSegForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none" style={inputStyle} />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <GhostButton onClick={() => setEditSegModal(null)}>Cancel</GhostButton>
              <PrimaryButton onClick={handleUpdateSegment}>Save</PrimaryButton>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Segment Confirm ────────────────── */}
      {deleteSegConfirm && (
        <ConfirmDialog
          message="Delete this segment?"
          confirmLabel="Delete"
          onConfirm={() => handleDeleteSegment(deleteSegConfirm)}
          onCancel={() => setDeleteSegConfirm(null)}
        />
      )}

      {/* ── Bulk Action Modal ─────────────────────── */}
      {bulkModal && (
        <Modal title="Execute Bulk Action" onClose={() => setBulkModal(false)}>
          <div className="space-y-3">
            <FormField label="Action Type">
              <input value={bulkForm.action} onChange={e => setBulkForm(f => ({ ...f, action: e.target.value }))} className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none" style={inputStyle} placeholder="e.g. notify, deactivate" />
            </FormField>
            <FormField label="User IDs (comma-separated)">
              <textarea value={bulkForm.user_ids} onChange={e => setBulkForm(f => ({ ...f, user_ids: e.target.value }))} rows={3}
                className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none resize-none" style={inputStyle} placeholder="uuid1, uuid2, ..." />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <GhostButton onClick={() => setBulkModal(false)}>Cancel</GhostButton>
              <PrimaryButton onClick={handleBulkAction}>Execute</PrimaryButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
