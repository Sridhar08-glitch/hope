import { useState, useEffect, useCallback } from "react";
import { Eye, Check, X, Edit, Trash2, Plus } from "lucide-react";
import BRAND from "../../constants/brand";
import { LoadingSpinner, TableWrap, TR, TD, Badge, Btn, Pagination, Modal, ConfirmModal, InputField } from "../../components/ui";
import adminApi from "../../services/adminApi";
import TrainerDetailView from "./TrainerDetailView";

function TrainersView({ token, showToast, onSelectApp }) {
  const [tab, setTab] = useState("applications");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmAction, setConfirmAction] = useState(null);
  const [editItem, setEditItem] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({});
  const [planSubTab, setPlanSubTab] = useState("list");
  const [appStats, setAppStats] = useState(null);
  const [editTrainer, setEditTrainer] = useState(null);
  const [trainerForm, setTrainerForm] = useState({});
  const [confirmDelTrainer, setConfirmDelTrainer] = useState(null);
  const [selectedTrainerId, setSelectedTrainerId] = useState(null);
  const [bookingDetail, setBookingDetail] = useState(null);

  const load = useCallback(async (url = null) => {
    setLoading(true);
    try {
      let res;
      if (url) {
        const apiMap = { applications: adminApi.trainers.applications, trainers: adminApi.trainers, bookings: adminApi.bookings, payments: adminApi.payments, subscriptions: adminApi.subscriptions, reviews: adminApi.reviews, coupons: adminApi.coupons };
        const api = apiMap[tab];
        res = await api.listUrl(token, url);
      } else {
        const calls = {
          applications: () => adminApi.trainers.applications.list(token),
          trainers: () => adminApi.trainers.list(token),
          bookings: () => adminApi.bookings.list(token),
          payments: () => adminApi.payments.list(token),
          subscriptions: () => adminApi.subscriptions.list(token),
          reviews: () => adminApi.reviews.list(token),
          coupons: () => adminApi.coupons.list(token),
          plans: () => adminApi.subscriptions.plans.list(token),
        };
        res = await (calls[tab] || calls.applications)();
      }
      setItems(res?.results || (Array.isArray(res) ? res : []));
      setNextUrl(res?.next || null);
      setPrevUrl(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    finally { setLoading(false); }
  }, [token, tab, showToast]);

  useEffect(() => { load(); setSelectedIds([]); }, [load]);

  useEffect(() => {
    adminApi.trainers.applications.stats(token).then(setAppStats).catch(() => {});
  }, [token]);

  function toggleSelect(id) { setSelectedIds(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]); }

  async function approveApp(id) {
    try { await adminApi.trainers.applications.approve(token, id); showToast("Application approved", "success"); load(); }
    catch (err) { showToast(err.message, "error"); }
  }
  async function doRejectApp() {
    try { await adminApi.trainers.applications.reject(token, rejectModal, rejectReason); showToast("Application rejected", "success"); setRejectModal(null); setRejectReason(""); load(); }
    catch (err) { showToast(err.message, "error"); }
  }
  async function trainerAction(action, id) {
    try {
      const fn = adminApi.trainers[action];
      if (fn) await fn(token, id);
      showToast(`${action} done`, "success"); load();
    } catch (err) { showToast(err.message, "error"); }
  }
  async function doBulkTrainer(action) {
    if (!selectedIds.length) return;
    try { await adminApi.trainers.bulkAction(token, selectedIds, action); showToast("Done", "success"); setSelectedIds([]); load(); }
    catch (err) { showToast(err.message, "error"); }
  }
  async function cancelBooking(id) {
    try { await adminApi.bookings.cancel(token, id); showToast("Booking cancelled", "success"); setConfirmAction(null); load(); }
    catch (err) { showToast(err.message, "error"); }
  }
  async function refundBooking(id) {
    try { await adminApi.bookings.refund(token, id); showToast("Refund issued", "success"); setConfirmAction(null); load(); }
    catch (err) { showToast(err.message, "error"); }
  }
  async function refundPayment(id) {
    try { await adminApi.payments.refund(token, id); showToast("Payment refunded", "success"); setConfirmAction(null); load(); }
    catch (err) { showToast(err.message, "error"); }
  }
  async function cancelSub(id) {
    try { await adminApi.subscriptions.cancel(token, id); showToast("Subscription cancelled", "success"); setConfirmAction(null); load(); }
    catch (err) { showToast(err.message, "error"); }
  }
  async function deleteReview(id) {
    try { await adminApi.reviews.delete(token, id); showToast("Review deleted", "success"); load(); }
    catch (err) { showToast(err.message, "error"); }
  }
  async function deleteCoupon(id) {
    try { await adminApi.coupons.delete(token, id); showToast("Coupon deleted", "success"); load(); }
    catch (err) { showToast(err.message, "error"); }
  }
  async function saveCoupon() {
    try {
      if (editItem) { await adminApi.coupons.update(token, editItem.id, form); showToast("Updated", "success"); }
      else { await adminApi.coupons.create(token, form); showToast("Created", "success"); }
      setEditItem(null); setShowCreate(false); setForm({}); load();
    } catch (err) { showToast(err.message, "error"); }
  }
  async function savePlan() {
    try {
      if (editItem) { await adminApi.subscriptions.plans.update(token, editItem.id, form); showToast("Plan updated", "success"); }
      else { await adminApi.subscriptions.plans.create(token, form); showToast("Plan created", "success"); }
      setEditItem(null); setShowCreate(false); setForm({}); load();
    } catch (err) { showToast(err.message, "error"); }
  }
  async function deletePlan(id) {
    try { await adminApi.subscriptions.plans.delete(token, id); showToast("Plan deleted", "success"); load(); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function saveTrainer() {
    try {
      await adminApi.trainers.update(token, editTrainer.id, trainerForm);
      showToast("Trainer updated", "success");
      setEditTrainer(null); setTrainerForm({});
      load();
    } catch (err) { showToast(err.message, "error"); }
  }

  async function deleteTrainer(id) {
    try {
      await adminApi.trainers.delete(token, id);
      showToast("Trainer deleted", "success");
      setConfirmDelTrainer(null);
      load();
    } catch (err) { showToast(err.message, "error"); }
  }

  const mainTabs = [["applications", "Applications"], ["trainers", "Trainers"], ["bookings", "Bookings"], ["payments", "Payments"], ["subscriptions", "Subscriptions"], ["reviews", "Reviews"], ["coupons", "Coupons"]];

  if (selectedTrainerId) return <TrainerDetailView token={token} showToast={showToast} trainerId={selectedTrainerId} onBack={() => setSelectedTrainerId(null)} />;
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Trainers &amp; Booking</h1>
          <p className="mt-1 text-sm" style={{ color: BRAND.textMuted }}>Manage trainer applications, verifications, and bookings.</p>
        </div>
        {tab === "coupons" && (
          <button onClick={() => { setForm({}); setShowCreate(true); }}
            style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}
            className="px-4 py-2 font-bold rounded-lg hover:opacity-90 transition shadow-lg flex items-center gap-2 text-sm">
            <Plus size={14} /> New Coupon
          </button>
        )}
      </div>
      <div className="flex gap-0 flex-wrap border-b overflow-x-auto" style={{ borderColor: BRAND.panelLight }}>
        {mainTabs.map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className="px-5 py-3 text-sm font-bold uppercase tracking-wider whitespace-nowrap transition"
            style={{ color: tab === v ? BRAND.accent : BRAND.textMuted, borderBottom: tab === v ? `2px solid ${BRAND.accent}` : "2px solid transparent" }}>{l}</button>
        ))}
      </div>

      {tab === "trainers" && selectedIds.length > 0 && (
        <div className="flex gap-2 rounded-xl p-3 flex-wrap border border-purple-900/40" style={{ backgroundColor: BRAND.card }}>
          <span className="text-slate-400 text-sm">{selectedIds.length} selected</span>
          {["verify", "unverify", "feature", "unfeature", "activate", "deactivate"].map(a => (
            <Btn key={a} onClick={() => doBulkTrainer(a)} color="gray" small>{a}</Btn>
          ))}
        </div>
      )}



      {tab === "subscriptions" && (
        <div className="flex gap-2">
          <button onClick={() => { setPlanSubTab("list"); setTab("subscriptions"); }}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${planSubTab === "list" ? "bg-purple-700 text-white" : "text-slate-300 hover:bg-purple-900/40 border border-purple-900/40"}`}>Subscriptions</button>
          <button onClick={() => { setPlanSubTab("plans"); setTab("plans"); }}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${planSubTab === "plans" ? "bg-purple-700 text-white" : "text-slate-300 hover:bg-purple-900/40 border border-purple-900/40"}`}>Plans</button>
        </div>
      )}

      {loading ? <LoadingSpinner /> : (
        <>
          {tab === "applications" && appStats && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-2">
              <div className="rounded-xl p-3 border border-purple-900/40 text-center" style={{ backgroundColor: BRAND.card }}><p className="text-white font-bold text-lg">{appStats.total ?? "—"}</p><p className="text-slate-400 text-xs">Total</p></div>
              <div className="rounded-xl p-3 border border-purple-900/40 text-center" style={{ backgroundColor: BRAND.card }}><p className="text-amber-400 font-bold text-lg">{appStats.pending ?? "—"}</p><p className="text-slate-400 text-xs">Pending</p></div>
              <div className="rounded-xl p-3 border border-purple-900/40 text-center" style={{ backgroundColor: BRAND.card }}><p className="text-emerald-400 font-bold text-lg">{appStats.approved ?? "—"}</p><p className="text-slate-400 text-xs">Approved</p></div>
              <div className="rounded-xl p-3 border border-purple-900/40 text-center" style={{ backgroundColor: BRAND.card }}><p className="text-red-400 font-bold text-lg">{appStats.rejected ?? "—"}</p><p className="text-slate-400 text-xs">Rejected</p></div>
            </div>
          )}
          {tab === "applications" && (
            <TableWrap cols={["Name", "Email", "Specialty", "Status", "Actions"]}>
              {items.map(a => (
                <TR key={a.id}>
                  <TD><span className="text-white">{a.user_name || a.full_name || "—"}</span></TD>
                  <TD>{a.email || "—"}</TD>
                  <TD>{a.primary_specialty || "—"}</TD>
                  <TD><Badge color={a.status === "approved" ? "green" : a.status === "rejected" ? "red" : "yellow"}>{a.status}</Badge></TD>
                  <TD>
                    <div className="flex gap-1">
                      <Btn onClick={() => onSelectApp(a.id)} color="gray" small><Eye size={12} /></Btn>
                      {a.status === "pending" && <Btn onClick={() => approveApp(a.id)} color="green" small><Check size={12} /></Btn>}
                      {a.status === "pending" && <Btn onClick={() => setRejectModal(a.id)} color="red" small><X size={12} /></Btn>}
                    </div>
                  </TD>
                </TR>
              ))}
            </TableWrap>
          )}
          {tab === "trainers" && (
            <TableWrap cols={["", "Name", "Email", "Verified", "Featured", "Active", "Actions"]}>
              {items.map(t => (
                <TR key={t.id}>
                  <TD><input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => toggleSelect(t.id)} /></TD>
                  <TD><span className="text-white">{t.user_name || t.full_name || t.name || "—"}</span></TD>
                  <TD>{t.email || "—"}</TD>
                  <TD><Badge color={t.is_verified ? "green" : "red"}>{t.is_verified ? "Yes" : "No"}</Badge></TD>
                  <TD><Badge color={t.is_featured ? "purple" : "gray"}>{t.is_featured ? "Yes" : "No"}</Badge></TD>
                  <TD><Badge color={t.is_active ? "green" : "red"}>{t.is_active ? "Yes" : "No"}</Badge></TD>
                  <TD>
                    <div className="flex gap-1 flex-wrap">
                      <Btn onClick={() => setSelectedTrainerId(t.id)} color="gray" small><Eye size={12} /></Btn>
                      <Btn onClick={() => trainerAction(t.is_verified ? "unverify" : "verify", t.id)} color="gray" small>{t.is_verified ? "Unverify" : "Verify"}</Btn>
                      <Btn onClick={() => trainerAction(t.is_featured ? "unfeature" : "feature", t.id)} color="gray" small>{t.is_featured ? "Unfeature" : "Feature"}</Btn>
                      <Btn onClick={() => trainerAction(t.is_active ? "deactivate" : "activate", t.id)} color={t.is_active ? "red" : "green"} small>{t.is_active ? "Deactivate" : "Activate"}</Btn>
                      <Btn onClick={() => { setEditTrainer(t); setTrainerForm({ is_verified: t.is_verified, is_featured: t.is_featured, is_active: t.is_active }); }} color="gray" small><Edit size={12} /></Btn>
                      <Btn onClick={() => setConfirmDelTrainer(t.id)} color="red" small><Trash2 size={12} /></Btn>
                    </div>
                  </TD>
                </TR>
              ))}
            </TableWrap>
          )}
          {tab === "bookings" && (
            <TableWrap cols={["Client", "Trainer", "Service", "Amount", "Status", "Actions"]}>
              {items.map(b => (
                <TR key={b.id}>
                  <TD>{b.client_name || b.user_name || "—"}</TD>
                  <TD>{b.trainer_name || "—"}</TD>
                  <TD>{b.service_name || b.service || "—"}</TD>
                  <TD>{b.amount ? `$${b.amount}` : "—"}</TD>
                  <TD><Badge color={b.status === "confirmed" ? "green" : b.status === "cancelled" ? "red" : "yellow"}>{b.status}</Badge></TD>
                  <TD>
                    <div className="flex gap-1">
                      <Btn onClick={() => adminApi.bookings.detail(token, b.id).then(d => setBookingDetail(d?.data || d)).catch(e => showToast(e.message, "error"))} color="gray" small><Eye size={12} /></Btn>
                      {b.status !== "cancelled" && <Btn onClick={() => setConfirmAction({ type: "cancelBooking", id: b.id })} color="red" small>Cancel</Btn>}
                      <Btn onClick={() => setConfirmAction({ type: "refundBooking", id: b.id })} color="yellow" small>Refund</Btn>
                    </div>
                  </TD>
                </TR>
              ))}
            </TableWrap>
          )}
          {tab === "payments" && (
            <TableWrap cols={["User", "Amount", "Method", "Status", "Date", "Actions"]}>
              {items.map(p => (
                <TR key={p.id}>
                  <TD>{p.user_name || p.user || "—"}</TD>
                  <TD>{p.amount ? `$${p.amount}` : "—"}</TD>
                  <TD>{p.payment_method || p.method || "—"}</TD>
                  <TD><Badge color={p.status === "completed" ? "green" : p.status === "refunded" ? "blue" : "yellow"}>{p.status}</Badge></TD>
                  <TD>{p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}</TD>
                  <TD><Btn onClick={() => setConfirmAction({ type: "refundPayment", id: p.id })} color="yellow" small>Refund</Btn></TD>
                </TR>
              ))}
            </TableWrap>
          )}
          {tab === "subscriptions" && planSubTab === "list" && (
            <TableWrap cols={["User", "Plan", "Status", "Start", "End", "Actions"]}>
              {items.map(s => (
                <TR key={s.id}>
                  <TD>{s.user_name || s.user || "—"}</TD>
                  <TD>{s.plan_name || s.plan || "—"}</TD>
                  <TD><Badge color={s.status === "active" ? "green" : "red"}>{s.status}</Badge></TD>
                  <TD>{s.start_date ? new Date(s.start_date).toLocaleDateString() : "—"}</TD>
                  <TD>{s.end_date ? new Date(s.end_date).toLocaleDateString() : "—"}</TD>
                  <TD>{s.status === "active" && <Btn onClick={() => setConfirmAction({ type: "cancelSub", id: s.id })} color="red" small>Cancel</Btn>}</TD>
                </TR>
              ))}
            </TableWrap>
          )}
          {tab === "plans" && (
            <>
              <div className="flex justify-end mb-2">
                <Btn onClick={() => { setForm({}); setShowCreate(true); }} small><Plus size={12} className="inline mr-1" />New Plan</Btn>
              </div>
              <TableWrap cols={["Name", "Price", "Interval", "Features", "Actions"]}>
                {items.map(p => (
                  <TR key={p.id}>
                    <TD><span className="text-white">{p.name}</span></TD>
                    <TD>{p.price ? `$${p.price}` : "—"}</TD>
                    <TD>{p.billing_interval || p.interval || "—"}</TD>
                    <TD>{p.features ? (Array.isArray(p.features) ? p.features.length + " features" : p.features) : "—"}</TD>
                    <TD>
                      <div className="flex gap-1">
                        <Btn onClick={() => { setEditItem(p); setForm(p); }} color="gray" small><Edit size={12} /></Btn>
                        <Btn onClick={() => deletePlan(p.id)} color="red" small><Trash2 size={12} /></Btn>
                      </div>
                    </TD>
                  </TR>
                ))}
              </TableWrap>
            </>
          )}
          {tab === "reviews" && (
            <TableWrap cols={["User", "Trainer", "Rating", "Comment", "Date", "Actions"]}>
              {items.map(r => (
                <TR key={r.id}>
                  <TD>{r.reviewer_name || r.user_name || "—"}</TD>
                  <TD>{r.trainer_name || "—"}</TD>
                  <TD><Badge color={r.rating >= 4 ? "green" : r.rating >= 2 ? "yellow" : "red"}>{r.rating}/5</Badge></TD>
                  <TD><span className="truncate max-w-xs block">{r.comment || "—"}</span></TD>
                  <TD>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</TD>
                  <TD><Btn onClick={() => deleteReview(r.id)} color="red" small><Trash2 size={12} /></Btn></TD>
                </TR>
              ))}
            </TableWrap>
          )}
          {tab === "coupons" && (
            <TableWrap cols={["Code", "Discount", "Type", "Uses", "Expires", "Actions"]}>
              {items.map(c => (
                <TR key={c.id}>
                  <TD><span className="text-white font-mono">{c.code}</span></TD>
                  <TD>{c.discount_type === "percentage" ? `${c.discount_value}%` : `$${c.discount_value}`}</TD>
                  <TD><Badge>{c.discount_type}</Badge></TD>
                  <TD>{c.used_count ?? 0}/{c.usage_limit ?? "∞"}</TD>
                  <TD>{c.valid_until ? new Date(c.valid_until).toLocaleDateString() : "Never"}</TD>
                  <TD>
                    <div className="flex gap-1">
                      <Btn onClick={() => { setEditItem(c); setForm(c); }} color="gray" small><Edit size={12} /></Btn>
                      <Btn onClick={() => deleteCoupon(c.id)} color="red" small><Trash2 size={12} /></Btn>
                    </div>
                  </TD>
                </TR>
              ))}
            </TableWrap>
          )}
          <Pagination nextUrl={nextUrl} prevUrl={prevUrl} onNext={() => load(nextUrl)} onPrev={() => load(prevUrl)} />
        </>
      )}

      {editTrainer && (
        <Modal title="Edit Trainer" onClose={() => { setEditTrainer(null); setTrainerForm({}); }}>
          <div className="space-y-3">
            {[["is_verified", "Verified"], ["is_featured", "Featured"], ["is_active", "Active"]].map(([key, label]) => (
              <div key={key} className="flex items-center gap-3">
                <input type="checkbox" id={key} checked={!!trainerForm[key]} onChange={e => setTrainerForm(f => ({ ...f, [key]: e.target.checked }))} className="accent-purple-500" />
                <label htmlFor={key} className="text-slate-300 text-sm">{label}</label>
              </div>
            ))}
          </div>
          <div className="flex gap-3 justify-end mt-4">
            <Btn onClick={() => setEditTrainer(null)} color="gray">Cancel</Btn>
            <Btn onClick={saveTrainer}>Save</Btn>
          </div>
        </Modal>
      )}
      {confirmDelTrainer && <ConfirmModal message="Delete this trainer profile permanently?" onConfirm={() => deleteTrainer(confirmDelTrainer)} onCancel={() => setConfirmDelTrainer(null)} />}
      {bookingDetail && (
        <Modal title="Booking Detail" onClose={() => setBookingDetail(null)}>
          <div className="space-y-2">
            {[
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
            ].filter(([, v]) => v != null && v !== "").map(([label, val]) => (
              <div key={label} className="flex gap-4 text-sm">
                <span className="text-slate-400 w-40 shrink-0">{label}</span>
                <span className="text-white break-words">{String(val)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-end mt-4">
            <Btn onClick={() => setBookingDetail(null)} color="gray">Close</Btn>
          </div>
        </Modal>
      )}
      {rejectModal && (
        <Modal title="Reject Application" onClose={() => { setRejectModal(null); setRejectReason(""); }}>
          <div className="mb-4">
            <label className="block text-slate-400 text-sm mb-1">Reason</label>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              className="w-full border border-purple-800/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-amber-500/70 h-24 resize-none" style={{ backgroundColor: BRAND.cardLight }} />
          </div>
          <div className="flex gap-3 justify-end">
            <Btn onClick={() => setRejectModal(null)} color="gray">Cancel</Btn>
            <Btn onClick={doRejectApp} color="red">Reject</Btn>
          </div>
        </Modal>
      )}


      {confirmAction && (
        <ConfirmModal
          message={`Confirm: ${confirmAction.type}?`}
          onConfirm={() => {
            if (confirmAction.type === "cancelBooking") cancelBooking(confirmAction.id);
            else if (confirmAction.type === "refundBooking") refundBooking(confirmAction.id);
            else if (confirmAction.type === "refundPayment") refundPayment(confirmAction.id);
            else if (confirmAction.type === "cancelSub") cancelSub(confirmAction.id);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}

      {(showCreate || editItem) && (tab === "coupons" || tab === "plans") && (
        <Modal title={editItem ? "Edit" : "New"} onClose={() => { setShowCreate(false); setEditItem(null); setForm({}); }}>
          {tab === "coupons" && ["trainer", "code", "discount_type", "discount_value", "usage_limit", "valid_from", "valid_until"].map(k => (
            <InputField key={k} label={k.replace(/_/g, " ")} value={form[k] || ""} onChange={v => setForm(f => ({ ...f, [k]: v }))} />
          ))}
          {tab === "plans" && ["trainer", "name", "price", "duration_days", "description", "features"].map(k => (
            <InputField key={k} label={k.replace(/_/g, " ")} value={form[k] || ""} onChange={v => setForm(f => ({ ...f, [k]: v }))} />
          ))}
          <div className="flex gap-3 justify-end">
            <Btn onClick={() => { setShowCreate(false); setEditItem(null); }} color="gray">Cancel</Btn>
            <Btn onClick={tab === "coupons" ? saveCoupon : savePlan}>{editItem ? "Update" : "Create"}</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default TrainersView;
