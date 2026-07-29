"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Settings, ShieldCheck, Ban, MessageSquare } from "lucide-react";
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

type Tab = "alerts" | "configs" | "approvals" | "banAppeals" | "sessionAppeals";

const SEV_CLR: Record<string, string> = { critical: BRAND.error, high: BRAND.warning, medium: BRAND.info, low: BRAND.success };
const STATUS_CLR = (s: string) => s === "approved" || s === "active" ? BRAND.success : s === "pending" ? BRAND.warning : BRAND.error;
const EMPTY_CFG = { name: "", alert_type: "", threshold: "", is_active: true };
const EMPTY_APPROVAL = { action_type: "", target_id: "", reason: "" };

export default function AlertsView({ api, showToast }: ViewProps) {
  const [tab, setTab] = useState<Tab>("alerts");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [summary, setSummary] = useState<any>(null);
  const [approvalStats, setApprovalStats] = useState<any>(null);
  const [approvalSections, setApprovalSections] = useState<{ pending: any[]; my: any[]; history: any[] }>({ pending: [], my: [], history: [] });
  const [modal, setModal] = useState<{ type: string } | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [detailData, setDetailData] = useState<any>(null);
  const [deleteConfigConfirm, setDeleteConfigConfirm] = useState<string | null>(null);

  /* ── Load data ──────────────────────────────────── */
  const loadData = useCallback(async (url?: string) => {
    setLoading(true);
    try {
      let res: any;
      if (url) { res = await api.get<any>(url); }
      else if (tab === "alerts") {
        res = await api.get<any>("/admin/alerts/");
        if (res?.summary) setSummary(res.summary);
        setItems(res?.alerts || res?.results || []);
        setNextUrl(res?.next || null); setPrevUrl(res?.previous || null);
        setLoading(false); return;
      } else if (tab === "configs") { res = await api.get<any>("/admin/alerts/configs/"); }
      else if (tab === "approvals") {
        res = await api.get<any>("/admin/approvals/");
        setApprovalSections({ pending: res?.pending_approvals || [], my: res?.my_requests || [], history: res?.recent_history || [] });
        setItems(res?.pending_approvals || res?.results || []);
        try { const st = await api.get<any>("/admin/approvals/stats/"); setApprovalStats(st); } catch {}
        setNextUrl(res?.next || null); setPrevUrl(res?.previous || null);
        setLoading(false); return;
      } else if (tab === "banAppeals") { res = await api.get<any>("/admin/moderation/ban-appeals/"); }
      else if (tab === "sessionAppeals") { res = await api.get<any>("/admin/trainers/session-appeals/"); }
      setItems(res?.results || res || []);
      setNextUrl(res?.next || null); setPrevUrl(res?.previous || null);
    } catch (err) { showToast(err instanceof Error ? err.message : "Failed to load data", "error"); }
    setLoading(false);
  }, [tab, api, showToast]);

  useEffect(() => { setSummary(null); setApprovalStats(null); setApprovalSections({ pending: [], my: [], history: [] }); loadData(); }, [loadData]);

  /* ── Alert actions ──────────────────────────────── */
  const handleAlertAction = async (id: string, action: string) => {
    try { await api.post(`/admin/alerts/${id}/action/`, { action }); showToast(`Alert ${action}d`, "success"); loadData(); }
    catch (err) { showToast(err instanceof Error ? err.message : "Action failed", "error"); }
  };
  const handleCheckAlerts = async () => {
    try { await api.post("/admin/alerts/check/"); showToast("Alert check triggered", "success"); loadData(); }
    catch (err) { showToast(err instanceof Error ? err.message : "Check failed", "error"); }
  };

  /* ── Approval actions ───────────────────────────── */
  const handleApproval = async (id: string, action: string) => {
    try { await api.post(`/admin/approvals/${id}/action/`, { action }); showToast(`Request ${action}d`, "success"); loadData(); }
    catch (err) { showToast(err instanceof Error ? err.message : "Action failed", "error"); }
  };

  /* ── Ban appeals ────────────────────────────────── */
  const handleBanAppeal = async (id: string, action: string) => {
    try { await api.post(`/admin/moderation/ban-appeals/${id}/review/`, { action }); showToast(`Appeal ${action}d`, "success"); loadData(); }
    catch (err) { showToast(err instanceof Error ? err.message : "Action failed", "error"); }
  };

  /* ── Session appeals ────────────────────────────── */
  const handleSessionAppeal = async (id: string, action: string) => {
    try { await api.post(`/admin/trainers/session-appeals/${id}/action/`, { action }); showToast(`Session appeal ${action}d`, "success"); loadData(); }
    catch (err) { showToast(err instanceof Error ? err.message : "Action failed", "error"); }
  };

  /* ── Config CRUD ────────────────────────────────── */
  const saveConfig = async () => {
    setSaving(true);
    try {
      if (form.id) await api.put(`/admin/alerts/configs/${form.id}/`, form);
      else await api.post("/admin/alerts/configs/", form);
      showToast(form.id ? "Config updated" : "Config created", "success");
      setModal(null); loadData();
    } catch (err) { showToast(err instanceof Error ? err.message : "Save failed", "error"); }
    setSaving(false);
  };
  const deleteConfig = async (id: string) => {
    try { await api.del(`/admin/alerts/configs/${id}/`); showToast("Config deleted", "success"); setDeleteConfigConfirm(null); loadData(); }
    catch (err) { showToast(err instanceof Error ? err.message : "Delete failed", "error"); }
  };

  /* ── New approval ───────────────────────────────── */
  const saveApproval = async () => {
    setSaving(true);
    try { await api.post("/admin/approvals/", form); showToast("Approval request created", "success"); setModal(null); loadData(); }
    catch (err) { showToast(err instanceof Error ? err.message : "Create failed", "error"); }
    setSaving(false);
  };

  /* ── Session detail ─────────────────────────────── */
  const loadSessionDetail = async (id: string) => {
    try { const d = await api.get<any>(`/admin/trainers/session-appeals/${id}/`); setDetailData(d); setModal({ type: "sessionDetail" }); }
    catch (err) { showToast(err instanceof Error ? err.message : "Load failed", "error"); }
  };

  /* ── Approval sub-table ─────────────────────────── */
  const ApprovalSection = ({ rows, title }: { rows: any[]; title: string }) => (
    <div className="mb-4">
      <p className="text-[12px] font-semibold mb-2" style={{ color: BRAND.accent }}>{title}</p>
      {rows.length === 0 ? <EmptyState icon={ShieldCheck} message={`No ${title.toLowerCase()}`} /> : (
        <DataTable cols={["Type", "Requester", "Status", "Actions"]}>
          {rows.map((item: any, i: number) => (
            <TR key={item.id || i}>
              <TD>{item.type || item.action_type}</TD>
              <TD>{item.requester}</TD>
              <TD><StatusBadge status={item.status || "pending"} color={STATUS_CLR(item.status)} /></TD>
              <TD>
                {item.status === "pending" && (
                  <div className="flex gap-1">
                    <PrimaryButton onClick={() => handleApproval(item.id, "approve")}>Approve</PrimaryButton>
                    <GhostButton onClick={() => handleApproval(item.id, "reject")}><span style={{ color: BRAND.error }}>Reject</span></GhostButton>
                  </div>
                )}
              </TD>
            </TR>
          ))}
        </DataTable>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      <PageHeader title="Alerts & Approvals" subtitle="System alerts, configs, approval workflows and appeals" />

      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <TabBar<Tab>
          tabs={[
            { key: "alerts", label: "Alerts", icon: Bell },
            { key: "configs", label: "Alert Configs", icon: Settings },
            { key: "approvals", label: "Approvals", icon: ShieldCheck },
            { key: "banAppeals", label: "Ban Appeals", icon: Ban },
            { key: "sessionAppeals", label: "Session Appeals", icon: MessageSquare },
          ]}
          active={tab}
          onChange={setTab}
        />
      </motion.div>

      {loading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">

          {/* ── Alerts ────────────────────────────────── */}
          {tab === "alerts" && (
            <>
              {summary && (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
                  <StatCard label="Total" value={summary.total} />
                  <StatCard label="Critical" value={summary.by_severity?.critical} color={SEV_CLR.critical} />
                  <StatCard label="High" value={summary.by_severity?.high} color={SEV_CLR.high} />
                  <StatCard label="Medium" value={summary.by_severity?.medium} color={SEV_CLR.medium} />
                  <StatCard label="Low" value={summary.by_severity?.low} color={SEV_CLR.low} />
                </div>
              )}
              <div className="flex justify-end mb-3">
                <PrimaryButton onClick={handleCheckAlerts}>Check Alerts</PrimaryButton>
              </div>
              {items.length === 0 ? <EmptyState icon={Bell} message="No alerts found" /> : (
                <>
                  <DataTable cols={["Severity", "Message", "Timestamp", "Actions"]}>
                    {items.map((item: any, i: number) => (
                      <TR key={item.id || i}>
                        <TD><StatusBadge status={item.severity || "medium"} color={SEV_CLR[item.severity] || BRAND.info} /></TD>
                        <TD>{item.message}</TD>
                        <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{item.timestamp}</span></TD>
                        <TD>
                          <div className="flex gap-1">
                            <PrimaryButton onClick={() => handleAlertAction(item.id, "acknowledge")}>Acknowledge</PrimaryButton>
                            <GhostButton onClick={() => handleAlertAction(item.id, "dismiss")}>Dismiss</GhostButton>
                          </div>
                        </TD>
                      </TR>
                    ))}
                  </DataTable>
                  <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl!)} onNext={() => loadData(nextUrl!)} count={items.length} />
                </>
              )}
            </>
          )}

          {/* ── Alert Configs ─────────────────────────── */}
          {tab === "configs" && (
            <>
              <div className="flex justify-end mb-3">
                <PrimaryButton onClick={() => { setForm({ ...EMPTY_CFG }); setModal({ type: "config" }); }}>+ New Config</PrimaryButton>
              </div>
              {items.length === 0 ? <EmptyState icon={Settings} message="No alert configs" /> : (
                <>
                  <DataTable cols={["Name", "Type", "Threshold", "Active", "Actions"]}>
                    {items.map((item: any, i: number) => (
                      <TR key={item.id || i}>
                        <TD><span className="text-[12px] font-medium">{item.name}</span></TD>
                        <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{item.alert_type || item.type}</span></TD>
                        <TD><span className="text-[12px] font-semibold" style={{ color: BRAND.accent }}>{item.threshold}</span></TD>
                        <TD><StatusBadge status={(item.is_active || item.active) ? "active" : "inactive"} /></TD>
                        <TD>
                          <div className="flex gap-1">
                            <GhostButton onClick={() => { setForm({ id: item.id, name: item.name, alert_type: item.alert_type || item.type, threshold: item.threshold, is_active: item.is_active ?? item.active }); setModal({ type: "config" }); }}>Edit</GhostButton>
                            <GhostButton onClick={() => setDeleteConfigConfirm(item.id)}><span style={{ color: BRAND.error }}>Delete</span></GhostButton>
                          </div>
                        </TD>
                      </TR>
                    ))}
                  </DataTable>
                  <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl!)} onNext={() => loadData(nextUrl!)} count={items.length} />
                </>
              )}
            </>
          )}

          {/* ── Approvals ─────────────────────────────── */}
          {tab === "approvals" && (
            <>
              {approvalStats && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  <StatCard label="Pending" value={approvalStats.pending} color={BRAND.warning} />
                  <StatCard label="Approved" value={approvalStats.approved} color={BRAND.success} />
                  <StatCard label="Rejected" value={approvalStats.rejected} color={BRAND.error} />
                  <StatCard label="Expired" value={approvalStats.expired} color={BRAND.textDim} />
                </div>
              )}
              <div className="flex justify-end mb-3">
                <PrimaryButton onClick={() => { setForm({ ...EMPTY_APPROVAL }); setModal({ type: "approval" }); }}>+ New Approval</PrimaryButton>
              </div>
              <ApprovalSection rows={approvalSections.pending} title="Pending Approvals" />
              <ApprovalSection rows={approvalSections.my} title="My Requests" />
              <ApprovalSection rows={approvalSections.history} title="Recent History" />
              <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl!)} onNext={() => loadData(nextUrl!)} count={items.length} />
            </>
          )}

          {/* ── Ban Appeals ───────────────────────────── */}
          {tab === "banAppeals" && (
            items.length === 0 ? <EmptyState icon={Ban} message="No ban appeals" /> : (
              <>
                <DataTable cols={["User", "Reason", "Status", "Actions"]}>
                  {items.map((item: any, i: number) => (
                    <TR key={item.id || i}>
                      <TD>{item.user}</TD>
                      <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{item.reason}</span></TD>
                      <TD><StatusBadge status={item.status || "pending"} color={STATUS_CLR(item.status)} /></TD>
                      <TD>
                        {item.status === "pending" && (
                          <div className="flex gap-1">
                            <PrimaryButton onClick={() => handleBanAppeal(item.id, "approve")}>Approve</PrimaryButton>
                            <GhostButton onClick={() => handleBanAppeal(item.id, "reject")}><span style={{ color: BRAND.error }}>Reject</span></GhostButton>
                          </div>
                        )}
                      </TD>
                    </TR>
                  ))}
                </DataTable>
                <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl!)} onNext={() => loadData(nextUrl!)} count={items.length} />
              </>
            )
          )}

          {/* ── Session Appeals ───────────────────────── */}
          {tab === "sessionAppeals" && (
            items.length === 0 ? <EmptyState icon={MessageSquare} message="No session appeals" /> : (
              <>
                <DataTable cols={["Client", "Trainer", "Reason", "Status", "Actions"]}>
                  {items.map((item: any, i: number) => (
                    <TR key={item.id || i}>
                      <TD>{item.client}</TD>
                      <TD>{item.trainer}</TD>
                      <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{item.reason}</span></TD>
                      <TD><StatusBadge status={item.status || "pending"} color={STATUS_CLR(item.status)} /></TD>
                      <TD>
                        <div className="flex gap-1">
                          <GhostButton onClick={() => loadSessionDetail(item.id)}>View</GhostButton>
                          {item.status === "pending" && (
                            <>
                              <PrimaryButton onClick={() => handleSessionAppeal(item.id, "approve")}>Approve</PrimaryButton>
                              <GhostButton onClick={() => handleSessionAppeal(item.id, "refund")}><span style={{ color: BRAND.warning }}>Refund</span></GhostButton>
                              <GhostButton onClick={() => handleSessionAppeal(item.id, "reject")}><span style={{ color: BRAND.error }}>Reject</span></GhostButton>
                            </>
                          )}
                        </div>
                      </TD>
                    </TR>
                  ))}
                </DataTable>
                <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl!)} onNext={() => loadData(nextUrl!)} count={items.length} />
              </>
            )
          )}
        </motion.div>
      )}

      {/* ── Config Modal ──────────────────────────── */}
      {modal?.type === "config" && (
        <Modal title={form.id ? "Edit Config" : "New Config"} onClose={() => setModal(null)}>
          <div className="space-y-3">
            <FormField label="Name">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none" style={inputStyle} />
            </FormField>
            <FormField label="Alert Type">
              <input value={form.alert_type} onChange={e => setForm(f => ({ ...f, alert_type: e.target.value }))} className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none" style={inputStyle} />
            </FormField>
            <FormField label="Threshold">
              <input type="number" value={form.threshold} onChange={e => setForm(f => ({ ...f, threshold: e.target.value }))} className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none" style={inputStyle} />
            </FormField>
            <FormField label="Active">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <GhostButton onClick={() => setModal(null)}>Cancel</GhostButton>
              <PrimaryButton onClick={saveConfig} disabled={saving}>{saving ? "Saving..." : "Save"}</PrimaryButton>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Approval Modal ────────────────────────── */}
      {modal?.type === "approval" && (
        <Modal title="New Approval Request" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <FormField label="Action Type">
              <input value={form.action_type} onChange={e => setForm(f => ({ ...f, action_type: e.target.value }))} className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none" style={inputStyle} />
            </FormField>
            <FormField label="Target ID">
              <input value={form.target_id} onChange={e => setForm(f => ({ ...f, target_id: e.target.value }))} className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none" style={inputStyle} />
            </FormField>
            <FormField label="Reason">
              <input value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none" style={inputStyle} />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <GhostButton onClick={() => setModal(null)}>Cancel</GhostButton>
              <PrimaryButton onClick={saveApproval} disabled={saving}>{saving ? "Saving..." : "Submit"}</PrimaryButton>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Session Detail Modal ──────────────────── */}
      {modal?.type === "sessionDetail" && detailData && (
        <Modal title="Session Appeal Detail" onClose={() => { setModal(null); setDetailData(null); }} wide>
          <div className="space-y-2">
            {Object.entries(detailData).map(([k, v]) => (
              <div key={k} className="flex justify-between py-1.5" style={{ borderBottom: `1px solid rgba(126, 34, 206, 0.05)` }}>
                <span className="text-[10px] uppercase tracking-wider" style={{ color: BRAND.textDim }}>{k.replace(/_/g, " ")}</span>
                <span className="text-[12px]" style={{ color: BRAND.textMain }}>{typeof v === "object" ? JSON.stringify(v) : String(v ?? "-")}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <GhostButton onClick={() => { setModal(null); setDetailData(null); }}>Close</GhostButton>
          </div>
        </Modal>
      )}

      {/* ── Delete Config Confirm ─────────────────── */}
      {deleteConfigConfirm && (
        <ConfirmDialog
          message="Delete this alert config?"
          confirmLabel="Delete"
          onConfirm={() => deleteConfig(deleteConfigConfirm)}
          onCancel={() => setDeleteConfigConfirm(null)}
        />
      )}
    </div>
  );
}
