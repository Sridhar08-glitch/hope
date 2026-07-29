"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  Eye, Check, X, Edit, Trash2, Plus,
  ClipboardList, Users, Calendar, CreditCard, Crown, Star, Tag, LayoutList,
} from "lucide-react";
import { BRAND, Spinner } from "@holora/ui";
import type { ApiClient } from "@holora/api-client";
import {
  fadeUp, cardStyle, inputStyle,
  PageHeader, TabBar, DataTable, TR, TD,
  Modal, ConfirmDialog, EmptyState, StatusBadge, SimplePagination,
  PrimaryButton, GhostButton, FormField, StatCard,
} from "../shared";
import TrainerDetailView from "./trainer-detail-view";

/* ── Types ──────────────────────────────────────── */

interface PaginatedRes<T> { results?: T[]; next?: string | null; previous?: string | null }

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyItem = Record<string, any>;

type TabKey = "applications" | "trainers" | "bookings" | "payments" | "subscriptions" | "plans" | "reviews" | "coupons";

interface TrainersViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
  onSelectApp?: (id: string) => void;
}

const TABS: { key: TabKey; label: string; icon: typeof ClipboardList }[] = [
  { key: "applications", label: "Applications", icon: ClipboardList },
  { key: "trainers",     label: "Trainers",     icon: Users },
  { key: "bookings",     label: "Bookings",     icon: Calendar },
  { key: "payments",     label: "Payments",     icon: CreditCard },
  { key: "subscriptions", label: "Subscriptions", icon: Crown },
  { key: "plans",        label: "Plans",        icon: LayoutList },
  { key: "reviews",      label: "Reviews",      icon: Star },
  { key: "coupons",      label: "Coupons",      icon: Tag },
];

const API_PATHS: Record<TabKey, string> = {
  applications:  "/admin/trainers/applications/",
  trainers:      "/admin/trainers/",
  bookings:      "/admin/bookings/",
  payments:      "/admin/payments/",
  subscriptions: "/admin/subscriptions/",
  plans:         "/admin/subscriptions/plans/",
  reviews:       "/admin/reviews/",
  coupons:       "/admin/coupons/",
};

/* ── Helper: safe error message ─────────────────── */

function errMsg(err: unknown, fallback: string) {
  return err instanceof Error ? err.message : fallback;
}

/* ── Main View ──────────────────────────────────── */

export default function TrainersView({ api, showToast, onSelectApp }: TrainersViewProps) {
  /* ---- state ---- */
  const [tab, setTab] = useState<TabKey>("applications");
  const [items, setItems] = useState<AnyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [appStats, setAppStats] = useState<AnyItem | null>(null);

  /* modals */
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmAction, setConfirmAction] = useState<{ type: string; id: string } | null>(null);
  const [editItem, setEditItem] = useState<AnyItem | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});

  /* trainer edit */
  const [editTrainer, setEditTrainer] = useState<AnyItem | null>(null);
  const [trainerForm, setTrainerForm] = useState<Record<string, boolean>>({});
  const [confirmDelTrainer, setConfirmDelTrainer] = useState<string | null>(null);

  /* detail views */
  const [selectedTrainerId, setSelectedTrainerId] = useState<string | null>(null);
  const [bookingDetail, setBookingDetail] = useState<AnyItem | null>(null);

  /* ---- data loading ---- */

  const load = useCallback(async (url: string | null = null) => {
    setLoading(true);
    try {
      const res: PaginatedRes<AnyItem> = url ? await api.get(url) : await api.get(API_PATHS[tab]);
      setItems(res?.results || (Array.isArray(res) ? (res as AnyItem[]) : []));
      setNextUrl(res?.next || null);
      setPrevUrl(res?.previous || null);
    } catch (err: unknown) {
      showToast(errMsg(err, "Failed to load data"), "error");
    } finally {
      setLoading(false);
    }
  }, [api, tab, showToast]);

  useEffect(() => { load(); setSelectedIds([]); }, [load]);

  useEffect(() => {
    api.get<AnyItem>("/admin/trainers/applications/stats/").then(setAppStats).catch(() => {});
  }, [api]);

  /* ---- actions ---- */

  function toggleSelect(id: string) {
    setSelectedIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  }

  async function approveApp(id: string) {
    try { await api.post(`/admin/trainers/applications/${id}/approve/`); showToast("Application approved", "success"); load(); }
    catch (err: unknown) { showToast(errMsg(err, "Approve failed"), "error"); }
  }

  async function doRejectApp() {
    try {
      await api.post(`/admin/trainers/applications/${rejectModal}/reject/`, { reason: rejectReason });
      showToast("Application rejected", "success"); setRejectModal(null); setRejectReason(""); load();
    } catch (err: unknown) { showToast(errMsg(err, "Reject failed"), "error"); }
  }

  async function trainerAction(action: string, id: string) {
    try { await api.post(`/admin/trainers/${id}/${action}/`); showToast(`${action} done`, "success"); load(); }
    catch (err: unknown) { showToast(errMsg(err, "Action failed"), "error"); }
  }

  async function doBulkTrainer(action: string) {
    if (!selectedIds.length) return;
    try { await api.post("/admin/trainers/bulk-action/", { ids: selectedIds, action }); showToast("Done", "success"); setSelectedIds([]); load(); }
    catch (err: unknown) { showToast(errMsg(err, "Bulk action failed"), "error"); }
  }

  async function cancelBooking(id: string) {
    try { await api.post(`/admin/bookings/${id}/cancel/`); showToast("Booking cancelled", "success"); setConfirmAction(null); load(); }
    catch (err: unknown) { showToast(errMsg(err, "Cancel failed"), "error"); }
  }

  async function refundBooking(id: string) {
    try { await api.post(`/admin/bookings/${id}/refund/`); showToast("Refund issued", "success"); setConfirmAction(null); load(); }
    catch (err: unknown) { showToast(errMsg(err, "Refund failed"), "error"); }
  }

  async function refundPayment(id: string) {
    try { await api.post(`/admin/payments/${id}/refund/`); showToast("Payment refunded", "success"); setConfirmAction(null); load(); }
    catch (err: unknown) { showToast(errMsg(err, "Refund failed"), "error"); }
  }

  async function cancelSub(id: string) {
    try { await api.post(`/admin/subscriptions/${id}/cancel/`); showToast("Subscription cancelled", "success"); setConfirmAction(null); load(); }
    catch (err: unknown) { showToast(errMsg(err, "Cancel failed"), "error"); }
  }

  async function deleteReview(id: string) {
    try { await api.del(`/admin/reviews/${id}/`); showToast("Review deleted", "success"); load(); }
    catch (err: unknown) { showToast(errMsg(err, "Delete failed"), "error"); }
  }

  async function deleteCoupon(id: string) {
    try { await api.del(`/admin/coupons/${id}/`); showToast("Coupon deleted", "success"); load(); }
    catch (err: unknown) { showToast(errMsg(err, "Delete failed"), "error"); }
  }

  async function saveCoupon() {
    try {
      if (editItem) { await api.put(`/admin/coupons/${editItem.id}/`, form); showToast("Updated", "success"); }
      else { await api.post("/admin/coupons/", form); showToast("Created", "success"); }
      setEditItem(null); setShowCreate(false); setForm({}); load();
    } catch (err: unknown) { showToast(errMsg(err, "Save failed"), "error"); }
  }

  async function savePlan() {
    try {
      if (editItem) { await api.put(`/admin/subscriptions/plans/${editItem.id}/`, form); showToast("Plan updated", "success"); }
      else { await api.post("/admin/subscriptions/plans/", form); showToast("Plan created", "success"); }
      setEditItem(null); setShowCreate(false); setForm({}); load();
    } catch (err: unknown) { showToast(errMsg(err, "Save failed"), "error"); }
  }

  async function deletePlan(id: string) {
    try { await api.del(`/admin/subscriptions/plans/${id}/`); showToast("Plan deleted", "success"); load(); }
    catch (err: unknown) { showToast(errMsg(err, "Delete failed"), "error"); }
  }

  async function saveTrainer() {
    if (!editTrainer) return;
    try { await api.put(`/admin/trainers/${editTrainer.id}/`, trainerForm); showToast("Trainer updated", "success"); setEditTrainer(null); setTrainerForm({}); load(); }
    catch (err: unknown) { showToast(errMsg(err, "Update failed"), "error"); }
  }

  async function deleteTrainer(id: string) {
    try { await api.del(`/admin/trainers/${id}/`); showToast("Trainer deleted", "success"); setConfirmDelTrainer(null); load(); }
    catch (err: unknown) { showToast(errMsg(err, "Delete failed"), "error"); }
  }

  function handleConfirmAction() {
    if (!confirmAction) return;
    if (confirmAction.type === "cancelBooking") cancelBooking(confirmAction.id);
    else if (confirmAction.type === "refundBooking") refundBooking(confirmAction.id);
    else if (confirmAction.type === "refundPayment") refundPayment(confirmAction.id);
    else if (confirmAction.type === "cancelSub") cancelSub(confirmAction.id);
  }

  /* ---- trainer detail sub-view ---- */

  if (selectedTrainerId) {
    return <TrainerDetailView api={api} showToast={showToast} trainerId={selectedTrainerId} onBack={() => setSelectedTrainerId(null)} />;
  }

  /* ---- render ---- */

  return (
    <div className="space-y-4">
      <PageHeader title="Trainers & Booking" subtitle="Manage trainer applications, verifications, and bookings.">
        {tab === "coupons" && (
          <PrimaryButton onClick={() => { setForm({}); setShowCreate(true); }}><Plus size={12} className="inline mr-1" />New Coupon</PrimaryButton>
        )}
        {tab === "plans" && (
          <PrimaryButton onClick={() => { setForm({}); setShowCreate(true); }}><Plus size={12} className="inline mr-1" />New Plan</PrimaryButton>
        )}
      </PageHeader>

      {/* Tab bar */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <TabBar tabs={TABS} active={tab} onChange={setTab} />
      </motion.div>

      {/* Bulk actions bar for trainers */}
      {tab === "trainers" && selectedIds.length > 0 && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible"
          className="flex gap-2 items-center flex-wrap rounded-lg px-3 py-2" style={cardStyle}>
          <span className="text-[11px]" style={{ color: BRAND.textDim }}>{selectedIds.length} selected</span>
          {["verify", "unverify", "feature", "unfeature", "activate", "deactivate"].map(a => (
            <button key={a} onClick={() => doBulkTrainer(a)}
              className="px-2 py-1 rounded-md text-[11px] capitalize transition hover:bg-white/5"
              style={{ color: BRAND.textMuted, border: `1px solid rgba(126,34,206,0.08)` }}>{a}</button>
          ))}
        </motion.div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="space-y-4">

          {/* ═══ APPLICATIONS ═══ */}
          {tab === "applications" && (
            <>
              {appStats && (
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <StatCard label="Total" value={appStats.total ?? "\u2014"} />
                  <StatCard label="Pending" value={appStats.pending ?? "\u2014"} color={BRAND.warning} />
                  <StatCard label="Approved" value={appStats.approved ?? "\u2014"} color={BRAND.success} />
                  <StatCard label="Rejected" value={appStats.rejected ?? "\u2014"} color={BRAND.error} />
                </div>
              )}
              {items.length === 0 ? <EmptyState icon={ClipboardList} message="No applications found" /> : (
                <DataTable cols={["Name", "Email", "Specialty", "Status", "Actions"]}>
                  {items.map(a => (
                    <TR key={a.id}>
                      <TD>{a.user_name || a.full_name || "\u2014"}</TD>
                      <TD>{a.email || "\u2014"}</TD>
                      <TD>{a.primary_specialty || "\u2014"}</TD>
                      <TD><StatusBadge status={a.status || "pending"} /></TD>
                      <TD>
                        <div className="flex gap-1">
                          <button onClick={() => onSelectApp?.(a.id)} className="p-1 rounded-md hover:bg-white/5 transition" title="View">
                            <Eye size={13} style={{ color: BRAND.textMuted }} />
                          </button>
                          {a.status === "pending" && (
                            <>
                              <button onClick={() => approveApp(a.id)} className="p-1 rounded-md hover:bg-white/5 transition" title="Approve">
                                <Check size={13} style={{ color: BRAND.success }} />
                              </button>
                              <button onClick={() => setRejectModal(a.id)} className="p-1 rounded-md hover:bg-white/5 transition" title="Reject">
                                <X size={13} style={{ color: BRAND.error }} />
                              </button>
                            </>
                          )}
                        </div>
                      </TD>
                    </TR>
                  ))}
                </DataTable>
              )}
            </>
          )}

          {/* ═══ TRAINERS ═══ */}
          {tab === "trainers" && (
            <>
              {items.length === 0 ? <EmptyState icon={Users} message="No trainers found" /> : (
                <DataTable cols={["", "Name", "Email", "Verified", "Featured", "Active", "Actions"]}>
                  {items.map(t => (
                    <TR key={t.id}>
                      <TD className="w-8">
                        <input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => toggleSelect(t.id)} className="accent-purple-500" />
                      </TD>
                      <TD>{t.user_name || t.full_name || t.name || "\u2014"}</TD>
                      <TD>{t.email || "\u2014"}</TD>
                      <TD><StatusBadge status={t.is_verified ? "active" : "inactive"} /></TD>
                      <TD><StatusBadge status={t.is_featured ? "active" : "inactive"} /></TD>
                      <TD><StatusBadge status={t.is_active ? "active" : "inactive"} /></TD>
                      <TD>
                        <div className="flex gap-1 flex-wrap">
                          <button onClick={() => setSelectedTrainerId(t.id)} className="p-1 rounded-md hover:bg-white/5 transition" title="View">
                            <Eye size={13} style={{ color: BRAND.textMuted }} />
                          </button>
                          <button onClick={() => trainerAction(t.is_verified ? "unverify" : "verify", t.id)}
                            className="px-1.5 py-0.5 rounded-md text-[10px] hover:bg-white/5 transition" style={{ color: BRAND.textMuted }}>
                            {t.is_verified ? "Unverify" : "Verify"}
                          </button>
                          <button onClick={() => trainerAction(t.is_featured ? "unfeature" : "feature", t.id)}
                            className="px-1.5 py-0.5 rounded-md text-[10px] hover:bg-white/5 transition" style={{ color: BRAND.textMuted }}>
                            {t.is_featured ? "Unfeature" : "Feature"}
                          </button>
                          <button onClick={() => trainerAction(t.is_active ? "deactivate" : "activate", t.id)}
                            className="px-1.5 py-0.5 rounded-md text-[10px] hover:bg-white/5 transition"
                            style={{ color: t.is_active ? BRAND.error : BRAND.success }}>
                            {t.is_active ? "Deactivate" : "Activate"}
                          </button>
                          <button onClick={() => { setEditTrainer(t); setTrainerForm({ is_verified: t.is_verified, is_featured: t.is_featured, is_active: t.is_active }); }}
                            className="p-1 rounded-md hover:bg-white/5 transition" title="Edit">
                            <Edit size={13} style={{ color: BRAND.textMuted }} />
                          </button>
                          <button onClick={() => setConfirmDelTrainer(t.id)} className="p-1 rounded-md hover:bg-white/5 transition" title="Delete">
                            <Trash2 size={13} style={{ color: BRAND.error }} />
                          </button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </DataTable>
              )}
            </>
          )}

          {/* ═══ BOOKINGS ═══ */}
          {tab === "bookings" && (
            <>
              {items.length === 0 ? <EmptyState icon={Calendar} message="No bookings found" /> : (
                <DataTable cols={["Client", "Trainer", "Service", "Amount", "Status", "Actions"]}>
                  {items.map(b => (
                    <TR key={b.id}>
                      <TD>{b.client_name || b.user_name || "\u2014"}</TD>
                      <TD>{b.trainer_name || "\u2014"}</TD>
                      <TD>{b.service_name || b.service || "\u2014"}</TD>
                      <TD>{b.amount ? `$${b.amount}` : "\u2014"}</TD>
                      <TD><StatusBadge status={b.status || "pending"} /></TD>
                      <TD>
                        <div className="flex gap-1">
                          <button onClick={() => {
                            api.get(`/admin/bookings/${b.id}/`)
                              .then((d: unknown) => { const item = d as AnyItem; setBookingDetail((item as Record<string, unknown>)?.data as AnyItem || item); })
                              .catch((e: unknown) => showToast(errMsg(e, "Failed"), "error"));
                          }} className="p-1 rounded-md hover:bg-white/5 transition" title="View">
                            <Eye size={13} style={{ color: BRAND.textMuted }} />
                          </button>
                          {b.status !== "cancelled" && (
                            <button onClick={() => setConfirmAction({ type: "cancelBooking", id: b.id })}
                              className="px-1.5 py-0.5 rounded-md text-[10px] hover:bg-white/5 transition" style={{ color: BRAND.error }}>Cancel</button>
                          )}
                          <button onClick={() => setConfirmAction({ type: "refundBooking", id: b.id })}
                            className="px-1.5 py-0.5 rounded-md text-[10px] hover:bg-white/5 transition" style={{ color: BRAND.warning }}>Refund</button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </DataTable>
              )}
            </>
          )}

          {/* ═══ PAYMENTS ═══ */}
          {tab === "payments" && (
            <>
              {items.length === 0 ? <EmptyState icon={CreditCard} message="No payments found" /> : (
                <DataTable cols={["User", "Amount", "Method", "Status", "Date", "Actions"]}>
                  {items.map(p => (
                    <TR key={p.id}>
                      <TD>{p.user_name || p.user || "\u2014"}</TD>
                      <TD>{p.amount ? `$${p.amount}` : "\u2014"}</TD>
                      <TD>{p.payment_method || p.method || "\u2014"}</TD>
                      <TD><StatusBadge status={p.status || "pending"} /></TD>
                      <TD>{p.created_at ? new Date(p.created_at).toLocaleDateString() : "\u2014"}</TD>
                      <TD>
                        <button onClick={() => setConfirmAction({ type: "refundPayment", id: p.id })}
                          className="px-1.5 py-0.5 rounded-md text-[10px] hover:bg-white/5 transition" style={{ color: BRAND.warning }}>Refund</button>
                      </TD>
                    </TR>
                  ))}
                </DataTable>
              )}
            </>
          )}

          {/* ═══ SUBSCRIPTIONS ═══ */}
          {tab === "subscriptions" && (
            <>
              {items.length === 0 ? <EmptyState icon={Crown} message="No subscriptions found" /> : (
                <DataTable cols={["User", "Plan", "Status", "Start", "End", "Actions"]}>
                  {items.map(s => (
                    <TR key={s.id}>
                      <TD>{s.user_name || s.user || "\u2014"}</TD>
                      <TD>{s.plan_name || s.plan || "\u2014"}</TD>
                      <TD><StatusBadge status={s.status || "pending"} /></TD>
                      <TD>{s.start_date ? new Date(s.start_date).toLocaleDateString() : "\u2014"}</TD>
                      <TD>{s.end_date ? new Date(s.end_date).toLocaleDateString() : "\u2014"}</TD>
                      <TD>
                        {s.status === "active" && (
                          <button onClick={() => setConfirmAction({ type: "cancelSub", id: s.id })}
                            className="px-1.5 py-0.5 rounded-md text-[10px] hover:bg-white/5 transition" style={{ color: BRAND.error }}>Cancel</button>
                        )}
                      </TD>
                    </TR>
                  ))}
                </DataTable>
              )}
            </>
          )}

          {/* ═══ PLANS ═══ */}
          {tab === "plans" && (
            <>
              {items.length === 0 ? <EmptyState icon={LayoutList} message="No plans found" /> : (
                <DataTable cols={["Name", "Price", "Interval", "Features", "Actions"]}>
                  {items.map(p => (
                    <TR key={p.id}>
                      <TD>{p.name}</TD>
                      <TD>{p.price ? `$${p.price}` : "\u2014"}</TD>
                      <TD>{p.billing_interval || p.interval || "\u2014"}</TD>
                      <TD>{p.features ? (Array.isArray(p.features) ? `${p.features.length} features` : p.features) : "\u2014"}</TD>
                      <TD>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditItem(p); setForm(p); }} className="p-1 rounded-md hover:bg-white/5 transition" title="Edit">
                            <Edit size={13} style={{ color: BRAND.textMuted }} />
                          </button>
                          <button onClick={() => deletePlan(p.id)} className="p-1 rounded-md hover:bg-white/5 transition" title="Delete">
                            <Trash2 size={13} style={{ color: BRAND.error }} />
                          </button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </DataTable>
              )}
            </>
          )}

          {/* ═══ REVIEWS ═══ */}
          {tab === "reviews" && (
            <>
              {items.length === 0 ? <EmptyState icon={Star} message="No reviews found" /> : (
                <DataTable cols={["User", "Trainer", "Rating", "Comment", "Date", "Actions"]}>
                  {items.map(r => (
                    <TR key={r.id}>
                      <TD>{r.reviewer_name || r.user_name || "\u2014"}</TD>
                      <TD>{r.trainer_name || "\u2014"}</TD>
                      <TD>
                        <StatusBadge status={`${r.rating}/5`} color={r.rating >= 4 ? BRAND.success : r.rating >= 2 ? BRAND.warning : BRAND.error} />
                      </TD>
                      <TD><span className="truncate max-w-[200px] block text-[12px]">{r.comment || "\u2014"}</span></TD>
                      <TD>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "\u2014"}</TD>
                      <TD>
                        <button onClick={() => deleteReview(r.id)} className="p-1 rounded-md hover:bg-white/5 transition" title="Delete">
                          <Trash2 size={13} style={{ color: BRAND.error }} />
                        </button>
                      </TD>
                    </TR>
                  ))}
                </DataTable>
              )}
            </>
          )}

          {/* ═══ COUPONS ═══ */}
          {tab === "coupons" && (
            <>
              {items.length === 0 ? <EmptyState icon={Tag} message="No coupons found" /> : (
                <DataTable cols={["Code", "Discount", "Type", "Uses", "Expires", "Actions"]}>
                  {items.map(c => (
                    <TR key={c.id}>
                      <TD><span className="font-mono text-[12px]">{c.code}</span></TD>
                      <TD>{c.discount_type === "percentage" ? `${c.discount_value}%` : `$${c.discount_value}`}</TD>
                      <TD><StatusBadge status={c.discount_type || "fixed"} /></TD>
                      <TD>{c.used_count ?? 0}/{c.usage_limit ?? "\u221e"}</TD>
                      <TD>{c.valid_until ? new Date(c.valid_until).toLocaleDateString() : "Never"}</TD>
                      <TD>
                        <div className="flex gap-1">
                          <button onClick={() => { setEditItem(c); setForm(c); }} className="p-1 rounded-md hover:bg-white/5 transition" title="Edit">
                            <Edit size={13} style={{ color: BRAND.textMuted }} />
                          </button>
                          <button onClick={() => deleteCoupon(c.id)} className="p-1 rounded-md hover:bg-white/5 transition" title="Delete">
                            <Trash2 size={13} style={{ color: BRAND.error }} />
                          </button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </DataTable>
              )}
            </>
          )}

          {/* Pagination */}
          <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => load(prevUrl)} onNext={() => load(nextUrl)} count={items.length} />
        </motion.div>
      )}

      {/* ═══ MODALS ═══ */}

      {/* Reject Application */}
      {rejectModal && (
        <Modal title="Reject Application" onClose={() => { setRejectModal(null); setRejectReason(""); }}>
          <FormField label="Reason">
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-[12px] h-24 resize-none border-0 outline-none focus:ring-1 focus:ring-purple-500/30"
              style={inputStyle} />
          </FormField>
          <div className="flex gap-2 justify-end mt-4">
            <GhostButton onClick={() => setRejectModal(null)}>Cancel</GhostButton>
            <button onClick={doRejectApp} className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition hover:opacity-90"
              style={{ backgroundColor: BRAND.error, color: "#fff" }}>Reject</button>
          </div>
        </Modal>
      )}

      {/* Edit Trainer */}
      {editTrainer && (
        <Modal title="Edit Trainer" onClose={() => { setEditTrainer(null); setTrainerForm({}); }}>
          <div className="space-y-3">
            {([["is_verified", "Verified"], ["is_featured", "Featured"], ["is_active", "Active"]] as const).map(([key, label]) => (
              <div key={key} className="flex items-center gap-3">
                <input type="checkbox" id={key} checked={!!trainerForm[key]}
                  onChange={e => setTrainerForm(f => ({ ...f, [key]: e.target.checked }))} className="accent-purple-500" />
                <label htmlFor={key} className="text-[12px]" style={{ color: BRAND.textMain }}>{label}</label>
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <GhostButton onClick={() => setEditTrainer(null)}>Cancel</GhostButton>
            <PrimaryButton onClick={saveTrainer}>Save</PrimaryButton>
          </div>
        </Modal>
      )}

      {/* Delete Trainer Confirm */}
      {confirmDelTrainer && (
        <ConfirmDialog
          message="Delete this trainer profile permanently?"
          onConfirm={() => deleteTrainer(confirmDelTrainer)}
          onCancel={() => setConfirmDelTrainer(null)}
        />
      )}

      {/* Booking Detail */}
      {bookingDetail && (
        <Modal title="Booking Detail" onClose={() => setBookingDetail(null)} wide>
          <div className="space-y-2">
            {([
              ["ID", bookingDetail.id],
              ["Client", bookingDetail.client_name || bookingDetail.user_name],
              ["Trainer", bookingDetail.trainer_name],
              ["Service", bookingDetail.service_name || bookingDetail.service],
              ["Session Type", bookingDetail.session_type],
              ["Date/Time", bookingDetail.scheduled_at ? new Date(bookingDetail.scheduled_at).toLocaleString() : bookingDetail.date],
              ["Duration", bookingDetail.duration_minutes ? `${bookingDetail.duration_minutes} min` : null],
              ["Amount", bookingDetail.amount ? `$${bookingDetail.amount}` : null],
              ["Payment Status", bookingDetail.payment_status],
              ["Status", bookingDetail.status],
              ["Notes", bookingDetail.notes],
              ["Created", bookingDetail.created_at ? new Date(bookingDetail.created_at).toLocaleString() : null],
            ] as [string, unknown][])
              .filter(([, v]) => v != null && v !== "")
              .map(([label, val]) => (
                <div key={label} className="flex items-center justify-between py-1.5" style={{ borderBottom: `1px solid rgba(126,34,206,0.05)` }}>
                  <span className="text-[11px]" style={{ color: BRAND.textDim }}>{label}</span>
                  <span className="text-[12px] font-medium" style={{ color: BRAND.textMain }}>{String(val)}</span>
                </div>
              ))}
          </div>
          <div className="flex justify-end mt-4">
            <GhostButton onClick={() => setBookingDetail(null)}>Close</GhostButton>
          </div>
        </Modal>
      )}

      {/* Generic Confirm (cancel booking, refund, cancel sub) */}
      {confirmAction && (
        <ConfirmDialog
          message={`Confirm: ${confirmAction.type.replace(/([A-Z])/g, " $1").toLowerCase()}?`}
          onConfirm={handleConfirmAction}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {/* Create / Edit Coupon or Plan */}
      {(showCreate || editItem) && (tab === "coupons" || tab === "plans") && (
        <Modal title={editItem ? `Edit ${tab === "coupons" ? "Coupon" : "Plan"}` : `New ${tab === "coupons" ? "Coupon" : "Plan"}`} onClose={() => { setShowCreate(false); setEditItem(null); setForm({}); }}>
          <div className="space-y-3">
            {(tab === "coupons"
              ? ["trainer", "code", "discount_type", "discount_value", "usage_limit", "valid_from", "valid_until"]
              : ["trainer", "name", "price", "duration_days", "description", "features"]
            ).map(k => (
              <FormField key={k} label={k.replace(/_/g, " ")}>
                <input value={form[k] || ""} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  className="w-full rounded-lg px-3 py-2 text-[12px] border-0 outline-none focus:ring-1 focus:ring-purple-500/30"
                  style={inputStyle} />
              </FormField>
            ))}
          </div>
          <div className="flex gap-2 justify-end mt-4">
            <GhostButton onClick={() => { setShowCreate(false); setEditItem(null); }}>Cancel</GhostButton>
            <PrimaryButton onClick={tab === "coupons" ? saveCoupon : savePlan}>{editItem ? "Update" : "Create"}</PrimaryButton>
          </div>
        </Modal>
      )}
    </div>
  );
}
