"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Wallet,
  ScrollText,
  Percent,
  ShieldAlert,
  Timer,
  AlertOctagon,
  Activity,
  Bell,
  RefreshCw,
  Search,
} from "lucide-react";
import { BRAND } from "@holora/ui";
import { formatCurrency, formatDate } from "@holora/utils";
import { motion } from "framer-motion";
import type { ApiClient } from "@holora/api-client";
import { createAdminApi, type AdminApi } from "@/lib/admin-api";
import {
  PageHeader,
  TabBar,
  DataTable,
  TR,
  TD,
  StatCard,
  StatusBadge,
  Modal,
  ConfirmDialog,
  EmptyState,
  SimplePagination,
  PrimaryButton,
  GhostButton,
  FormField,
  inputStyle,
  fadeUp,
  cardStyle,
  useDebouncedValue,
} from "@/components/shared";

interface ViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
}

type Tab =
  | "payouts"
  | "ledger"
  | "commission"
  | "reserves"
  | "policies"
  | "incidents"
  | "operations"
  | "notifications";

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "payouts", label: "Payout Requests", icon: Wallet },
  { key: "ledger", label: "Ledger", icon: ScrollText },
  { key: "commission", label: "Commission", icon: Percent },
  { key: "reserves", label: "Reserves", icon: ShieldAlert },
  { key: "policies", label: "Hold Policies", icon: Timer },
  { key: "incidents", label: "Incidents", icon: AlertOctagon },
  { key: "operations", label: "Operations", icon: Activity },
  { key: "notifications", label: "Alerts", icon: Bell },
];

const money = (a: any, c?: string) => formatCurrency(Number(a) || 0, (c || "QAR").toUpperCase());
const dash = (v: any) => (v === null || v === undefined || v === "" ? "—" : v);

export default function TrainerEarningsView({ api, showToast }: ViewProps) {
  const adminApi = useMemo(() => createAdminApi(api), [api]);
  const [tab, setTab] = useState<Tab>("payouts");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Trainer Earnings & Payouts"
        subtitle="Commission config, payout approvals, reserves, holds, incidents and reconciliation."
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
        {tab === "payouts" && <PayoutsTab adminApi={adminApi} showToast={showToast} />}
        {tab === "ledger" && <LedgerTab adminApi={adminApi} showToast={showToast} />}
        {tab === "commission" && <CommissionTab adminApi={adminApi} showToast={showToast} />}
        {tab === "reserves" && <ReservesTab adminApi={adminApi} showToast={showToast} />}
        {tab === "policies" && <PoliciesTab adminApi={adminApi} showToast={showToast} />}
        {tab === "incidents" && <IncidentsTab adminApi={adminApi} showToast={showToast} />}
        {tab === "operations" && <OperationsTab adminApi={adminApi} showToast={showToast} />}
        {tab === "notifications" && <NotificationsTab adminApi={adminApi} showToast={showToast} />}
      </motion.div>
    </div>
  );
}

interface TabProps {
  adminApi: AdminApi;
  showToast: (message: string, type: "success" | "error") => void;
}

/* ══════════════════════════════ PAYOUTS ══════════════════════════════ */

function PayoutsTab({ adminApi, showToast }: TabProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [pageMeta, setPageMeta] = useState<{ count: number; next: string | null; previous: string | null }>({
    count: 0,
    next: null,
    previous: null,
  });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const debouncedTrainer = useDebouncedValue(trainerId);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState<any>(null);
  const [action, setAction] = useState<null | { kind: string; row: any }>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page) };
      if (statusFilter) params.status = statusFilter;
      if (debouncedTrainer) params.trainer_id = debouncedTrainer;
      const res: any = await adminApi.trainerEarnings.payoutRequests.list(params);
      setRows(res?.results || []);
      setPageMeta({ count: res?.count ?? 0, next: res?.next ?? null, previous: res?.previous ?? null });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load payout requests", "error");
    } finally {
      setLoading(false);
    }
  }, [adminApi, page, statusFilter, debouncedTrainer, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (id: number) => {
    try {
      const d: any = await adminApi.trainerEarnings.payoutRequests.detail(id);
      setDetail(d);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load request", "error");
    }
  };

  const runAction = async () => {
    if (!action) return;
    const { kind, row } = action;
    try {
      const pr = adminApi.trainerEarnings.payoutRequests;
      if (kind === "approve") await pr.approve(row.id);
      else if (kind === "reject") await pr.reject(row.id, reason);
      else if (kind === "under_review") await pr.underReview(row.id, reason);
      else if (kind === "mark_paid") await pr.markPaid(row.id, reason);
      else if (kind === "retry") await pr.retry(row.id, reason || undefined);
      showToast(`Request ${kind.replace(/_/g, " ")} done`, "success");
      setAction(null);
      setReason("");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Action failed", "error");
    }
  };

  const STATUSES = ["", "pending", "under_review", "approved", "processing", "paid", "failed", "retrying", "rejected"];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          className="px-2.5 py-1.5 rounded-lg text-[12px]"
          style={inputStyle}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s ? s.replace(/_/g, " ") : "All statuses"}
            </option>
          ))}
        </select>
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: BRAND.textDim }} />
          <input
            value={trainerId}
            onChange={(e) => {
              setPage(1);
              setTrainerId(e.target.value.replace(/\D/g, ""));
            }}
            placeholder="Trainer ID"
            className="pl-7 pr-2.5 py-1.5 rounded-lg text-[12px] w-32"
            style={inputStyle}
          />
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState icon={Wallet} message="No payout requests found." />
      ) : (
        <>
          <DataTable cols={["#", "Trainer", "Amount", "Status", "Stripe", "Requested", "Actions"]}>
            {rows.map((r) => (
              <TR key={r.id}>
                <TD>{r.id}</TD>
                <TD>
                  <button onClick={() => openDetail(r.id)} className="underline" style={{ color: BRAND.accent }}>
                    {r.trainer_name || `#${r.trainer_id}`}
                  </button>
                </TD>
                <TD className="font-semibold">{money(r.requested_amount, r.currency)}</TD>
                <TD>
                  <StatusBadge status={r.status} />
                </TD>
                <TD>
                  {r.trainer_stripe_connect_ready ? (
                    <span style={{ color: BRAND.success }}>ready</span>
                  ) : (
                    <span style={{ color: BRAND.warning }}>not ready</span>
                  )}
                </TD>
                <TD>{formatDate(r.created_at)}</TD>
                <TD>
                  <div className="flex flex-wrap gap-1">
                    {(r.status === "pending" || r.status === "under_review") && (
                      <MiniBtn label="Approve" color={BRAND.success} onClick={() => setAction({ kind: "approve", row: r })} />
                    )}
                    {r.status === "pending" && (
                      <MiniBtn label="Review" color={BRAND.info} onClick={() => setAction({ kind: "under_review", row: r })} />
                    )}
                    {r.status === "approved" && (
                      <MiniBtn label="Mark paid" color={BRAND.accent} onClick={() => setAction({ kind: "mark_paid", row: r })} />
                    )}
                    {r.status === "failed" && (
                      <MiniBtn label="Retry" color={BRAND.info} onClick={() => setAction({ kind: "retry", row: r })} />
                    )}
                    {!["paid", "rejected", "reversed"].includes(r.status) && (
                      <MiniBtn label="Reject" color={BRAND.error} onClick={() => setAction({ kind: "reject", row: r })} />
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </DataTable>
          <SimplePagination
            count={pageMeta.count}
            prevUrl={pageMeta.previous}
            nextUrl={pageMeta.next}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}

      {detail && <PayoutDetailModal detail={detail} onClose={() => setDetail(null)} />}

      {action && (
        <Modal
          title={`${action.kind.replace(/_/g, " ")} — request #${action.row.id}`}
          onClose={() => {
            setAction(null);
            setReason("");
          }}
        >
          <div className="space-y-3">
            {action.kind === "reject" && (
              <FormField label="Reason (required)">
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-[12px] resize-none"
                  style={inputStyle}
                  placeholder="Why is this being rejected?"
                />
              </FormField>
            )}
            {(action.kind === "mark_paid" || action.kind === "retry") && (
              <FormField label={action.kind === "retry" ? "Payout reference (optional — leave blank to re-attempt Stripe)" : "Payout reference (required)"}>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-[12px]"
                  style={inputStyle}
                  placeholder="e.g. bank transfer ref"
                />
              </FormField>
            )}
            {action.kind === "under_review" && (
              <FormField label="Note (optional)">
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-[12px]"
                  style={inputStyle}
                />
              </FormField>
            )}
            {action.kind === "approve" && (
              <p className="text-[12px]" style={{ color: BRAND.textMuted }}>
                Approve payout of <b>{money(action.row.requested_amount, action.row.currency)}</b> to{" "}
                {action.row.trainer_name || `trainer #${action.row.trainer_id}`}?
              </p>
            )}
            <div className="flex justify-end gap-2">
              <GhostButton onClick={() => { setAction(null); setReason(""); }}>Cancel</GhostButton>
              <PrimaryButton
                onClick={runAction}
                disabled={(action.kind === "reject" && !reason.trim()) || (action.kind === "mark_paid" && !reason.trim())}
              >
                Confirm
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function PayoutDetailModal({ detail, onClose }: { detail: any; onClose: () => void }) {
  const entries: any[] = detail.entries || [];
  return (
    <Modal wide title={`Payout Request #${detail.id}`} onClose={onClose}>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
        <Info label="Trainer" value={detail.trainer_name || `#${detail.trainer_id}`} />
        <Info label="Amount" value={money(detail.requested_amount, detail.currency)} />
        <Info label="Status" value={<StatusBadge status={detail.status} />} />
        <Info label="Reserve held" value={money(detail.reserve_held_amount, detail.currency)} />
        <Info label="Retries" value={dash(detail.retry_count)} />
        <Info label="Requested" value={formatDate(detail.created_at)} />
        {detail.rejection_reason && <Info label="Rejection" value={detail.rejection_reason} />}
        {detail.failure_reason && <Info label="Failure" value={detail.failure_reason} />}
        {detail.payout_reference && <Info label="Reference" value={detail.payout_reference} />}
        {detail.stripe_transfer_id && <Info label="Stripe transfer" value={detail.stripe_transfer_id} />}
      </div>
      <p className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>
        Entries ({entries.length})
      </p>
      {entries.length === 0 ? (
        <p className="text-[12px]" style={{ color: BRAND.textDim }}>No entries.</p>
      ) : (
        <DataTable cols={["Source", "Booking", "Gross", "Commission", "Net", "Date"]}>
          {entries.map((e) => (
            <TR key={e.id}>
              <TD>{(e.source_type || "").replace(/_/g, " ")}</TD>
              <TD>{dash(e.booking_id)}</TD>
              <TD>{money(e.gross_amount, e.gross_currency)}</TD>
              <TD>{money(e.commission_amount, e.gross_currency)}</TD>
              <TD className="font-semibold">{money(e.trainer_net_amount, e.gross_currency)}</TD>
              <TD>{formatDate(e.created_at)}</TD>
            </TR>
          ))}
        </DataTable>
      )}
    </Modal>
  );
}

/* ══════════════════════════════ LEDGER ══════════════════════════════ */

function LedgerTab({ adminApi, showToast }: TabProps) {
  const [summary, setSummary] = useState<any>(null);
  const [rows, setRows] = useState<any[]>([]);
  const [pageMeta, setPageMeta] = useState<{ count: number; next: string | null; previous: string | null }>({
    count: 0,
    next: null,
    previous: null,
  });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [trainerId, setTrainerId] = useState("");
  const debouncedTrainer = useDebouncedValue(trainerId);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page) };
      if (statusFilter) params.status = statusFilter;
      if (debouncedTrainer) params.trainer_id = debouncedTrainer;
      const [entriesRes, summaryRes] = await Promise.allSettled([
        adminApi.trainerEarnings.entries(params),
        adminApi.trainerEarnings.summary(debouncedTrainer ? { trainer_id: debouncedTrainer } : undefined),
      ]);
      if (entriesRes.status === "fulfilled") {
        const res: any = entriesRes.value;
        setRows(res?.results || []);
        setPageMeta({ count: res?.count ?? 0, next: res?.next ?? null, previous: res?.previous ?? null });
      }
      if (summaryRes.status === "fulfilled") setSummary(summaryRes.value);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load ledger", "error");
    } finally {
      setLoading(false);
    }
  }, [adminApi, page, statusFilter, debouncedTrainer, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const totals = summary?.totals || {};
  const STATUSES = ["", "pending", "held", "available", "requested", "disputed", "paid", "reversed"];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard label="Gross" value={money(totals.total_gross)} />
        <StatCard label="Commission" value={money(totals.total_commission)} color={BRAND.warning} />
        <StatCard label="Net" value={money(totals.total_net)} color={BRAND.success} />
        <StatCard label="Entries" value={dash(totals.count)} />
      </div>

      <div className="flex flex-wrap gap-2">
        <select
          value={statusFilter}
          onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
          className="px-2.5 py-1.5 rounded-lg text-[12px]"
          style={inputStyle}
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s ? s : "All statuses"}</option>
          ))}
        </select>
        <input
          value={trainerId}
          onChange={(e) => { setPage(1); setTrainerId(e.target.value.replace(/\D/g, "")); }}
          placeholder="Trainer ID"
          className="px-2.5 py-1.5 rounded-lg text-[12px] w-32"
          style={inputStyle}
        />
      </div>

      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState icon={ScrollText} message="No earning entries found." />
      ) : (
        <>
          <DataTable cols={["#", "Trainer", "Source", "Gross", "Commission", "Net", "Verified", "Status", "Date"]}>
            {rows.map((e) => (
              <TR key={e.id}>
                <TD>{e.id}</TD>
                <TD>{e.trainer_name || `#${e.trainer_id}`}</TD>
                <TD>{(e.source_type || "").replace(/_/g, " ")}</TD>
                <TD>{money(e.gross_amount, e.gross_currency)}</TD>
                <TD>{money(e.commission_amount, e.gross_currency)}</TD>
                <TD className="font-semibold">{money(e.trainer_net_amount, e.gross_currency)}</TD>
                <TD>{e.payment_verified ? <span style={{ color: BRAND.success }}>✓</span> : <span style={{ color: BRAND.textDim }}>—</span>}</TD>
                <TD><StatusBadge status={e.status} /></TD>
                <TD>{formatDate(e.created_at)}</TD>
              </TR>
            ))}
          </DataTable>
          <SimplePagination
            count={pageMeta.count}
            prevUrl={pageMeta.previous}
            nextUrl={pageMeta.next}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════ COMMISSION ══════════════════════════════ */

function CommissionTab({ adminApi, showToast }: TabProps) {
  const [config, setConfig] = useState<any>(null);
  const [tiers, setTiers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [cfg, tierRes] = await Promise.allSettled([
        adminApi.trainerEarnings.config.get(),
        adminApi.trainerEarnings.tiers.list(),
      ]);
      if (cfg.status === "fulfilled") setConfig(cfg.value);
      if (tierRes.status === "fulfilled") setTiers((tierRes.value as any)?.results || []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load commission config", "error");
    } finally {
      setLoading(false);
    }
  }, [adminApi, showToast]);

  useEffect(() => { load(); }, [load]);

  const RATE_FIELDS = [
    "booking_card_commission_pct",
    "booking_coin_commission_pct",
    "video_unlock_coin_commission_pct",
    "coin_to_cash_rate",
    "minimum_payout_amount",
    "reserve_pct",
  ];
  const BOOL_FIELDS = [
    "regional_floor_enabled",
    "earning_hold_enabled",
    "tiered_commission_enabled",
    "dynamic_hold_policy_enabled",
    "reserve_enabled",
  ];

  const setField = (k: string, v: any) => setEdit((e) => ({ ...e, [k]: v }));
  const val = (k: string) => (edit[k] !== undefined ? edit[k] : config?.[k]);

  const save = async () => {
    if (Object.keys(edit).length === 0) return;
    setSaving(true);
    try {
      const updated: any = await adminApi.trainerEarnings.config.update(edit);
      setConfig((c: any) => ({ ...c, ...updated }));
      setEdit({});
      showToast("Commission config updated", "success");
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Update failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loading />;
  if (!config) return <EmptyState icon={Percent} message="No commission config available." />;

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-4" style={cardStyle}>
        <h3 className="text-[13px] font-semibold mb-3" style={{ color: BRAND.textMain }}>Commission Config</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {RATE_FIELDS.map((f) => (
            <FormField key={f} label={f.replace(/_/g, " ")}>
              <input
                type="number"
                step="0.01"
                value={val(f) ?? ""}
                onChange={(e) => setField(f, e.target.value)}
                className="w-full px-2.5 py-1.5 rounded-lg text-[12px]"
                style={inputStyle}
              />
            </FormField>
          ))}
          <FormField label="earning hold hours">
            <input
              type="number"
              value={val("earning_hold_hours") ?? ""}
              onChange={(e) => setField("earning_hold_hours", e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg text-[12px]"
              style={inputStyle}
            />
          </FormField>
          <FormField label="reserve hold days">
            <input
              type="number"
              value={val("reserve_hold_days") ?? ""}
              onChange={(e) => setField("reserve_hold_days", e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg text-[12px]"
              style={inputStyle}
            />
          </FormField>
        </div>
        <div className="flex flex-wrap gap-3 mt-4">
          {BOOL_FIELDS.map((f) => (
            <label key={f} className="flex items-center gap-1.5 text-[11px]" style={{ color: BRAND.textMuted }}>
              <input type="checkbox" checked={!!val(f)} onChange={(e) => setField(f, e.target.checked)} />
              {f.replace(/_/g, " ")}
            </label>
          ))}
        </div>
        <div className="flex justify-end mt-4">
          <PrimaryButton onClick={save} disabled={saving || Object.keys(edit).length === 0}>
            {saving ? "Saving…" : "Save changes"}
          </PrimaryButton>
        </div>
      </div>

      <div className="rounded-xl p-4" style={cardStyle}>
        <h3 className="text-[13px] font-semibold mb-3" style={{ color: BRAND.textMain }}>
          Commission Tiers ({tiers.length})
        </h3>
        {tiers.length === 0 ? (
          <p className="text-[12px]" style={{ color: BRAND.textDim }}>No tiers configured.</p>
        ) : (
          <DataTable cols={["Label", "Currency", "Min", "Max", "Rate %", "Scope", "Active", ""]}>
            {tiers.map((t) => (
              <TR key={t.id}>
                <TD>{dash(t.label)}</TD>
                <TD>{t.currency}</TD>
                <TD>{money(t.min_gross_volume, t.currency)}</TD>
                <TD>{t.max_gross_volume == null ? "∞" : money(t.max_gross_volume, t.currency)}</TD>
                <TD className="font-semibold">{t.commission_pct}%</TD>
                <TD>{t.trainer_name ? `trainer ${t.trainer_id}` : t.category || "global"}</TD>
                <TD><StatusBadge status={t.is_active ? "active" : "inactive"} /></TD>
                <TD>
                  <MiniBtn
                    label={t.is_active ? "Disable" : "Enable"}
                    color={t.is_active ? BRAND.error : BRAND.success}
                    onClick={async () => {
                      try {
                        await adminApi.trainerEarnings.tiers.update(t.id, { is_active: !t.is_active });
                        showToast("Tier updated", "success");
                        load();
                      } catch (err) {
                        showToast(err instanceof Error ? err.message : "Update failed", "error");
                      }
                    }}
                  />
                </TD>
              </TR>
            ))}
          </DataTable>
        )}
      </div>
    </div>
  );
}

/* ══════════════════════════════ RESERVES ══════════════════════════════ */

function ReservesTab({ adminApi, showToast }: TabProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [pageMeta, setPageMeta] = useState<{ count: number; next: string | null; previous: string | null }>({ count: 0, next: null, previous: null });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [forfeit, setForfeit] = useState<any>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page) };
      if (statusFilter) params.status = statusFilter;
      const res: any = await adminApi.trainerEarnings.reserveHolds.list(params);
      setRows(res?.results || []);
      setPageMeta({ count: res?.count ?? 0, next: res?.next ?? null, previous: res?.previous ?? null });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load reserve holds", "error");
    } finally {
      setLoading(false);
    }
  }, [adminApi, page, statusFilter, showToast]);

  useEffect(() => { load(); }, [load]);

  const STATUSES = ["", "held", "released", "forfeited", "voided"];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
          className="px-2.5 py-1.5 rounded-lg text-[12px]"
          style={inputStyle}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s ? s : "All statuses"}</option>)}
        </select>
        <GhostButton
          onClick={async () => {
            try {
              await adminApi.trainerEarnings.reserveHolds.releaseNow();
              showToast("Expired reserve holds released", "success");
              load();
            } catch (err) {
              showToast(err instanceof Error ? err.message : "Release failed", "error");
            }
          }}
        >
          <RefreshCw size={12} className="inline mr-1" /> Release expired now
        </GhostButton>
      </div>

      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState icon={ShieldAlert} message="No reserve holds found." />
      ) : (
        <>
          <DataTable cols={["#", "Trainer", "Amount", "Status", "Held", "Release at", "Released", ""]}>
            {rows.map((h) => (
              <TR key={h.id}>
                <TD>{h.id}</TD>
                <TD>{h.trainer_name || `#${h.trainer_id}`}</TD>
                <TD className="font-semibold">{money(h.amount, h.currency)}</TD>
                <TD><StatusBadge status={h.status} /></TD>
                <TD>{formatDate(h.held_at)}</TD>
                <TD>{h.release_at ? formatDate(h.release_at) : "—"}</TD>
                <TD>{h.released_at ? formatDate(h.released_at) : "—"}</TD>
                <TD>
                  {h.status === "held" && (
                    <MiniBtn label="Forfeit" color={BRAND.error} onClick={() => setForfeit(h)} />
                  )}
                </TD>
              </TR>
            ))}
          </DataTable>
          <SimplePagination
            count={pageMeta.count}
            prevUrl={pageMeta.previous}
            nextUrl={pageMeta.next}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}

      {forfeit && (
        <Modal title={`Forfeit reserve hold #${forfeit.id}`} onClose={() => { setForfeit(null); setReason(""); }}>
          <div className="space-y-3">
            <FormField label="Reason (required)">
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg text-[12px] resize-none"
                style={inputStyle}
              />
            </FormField>
            <div className="flex justify-end gap-2">
              <GhostButton onClick={() => { setForfeit(null); setReason(""); }}>Cancel</GhostButton>
              <PrimaryButton
                onClick={async () => {
                  try {
                    await adminApi.trainerEarnings.reserveHolds.forfeit(forfeit.id, reason);
                    showToast("Reserve forfeited", "success");
                    setForfeit(null);
                    setReason("");
                    load();
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : "Forfeit failed", "error");
                  }
                }}
                disabled={!reason.trim()}
              >
                Forfeit
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════ HOLD POLICIES ══════════════════════════════ */

function PoliciesTab({ adminApi, showToast }: TabProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [del, setDel] = useState<any>(null);
  const [create, setCreate] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({ name: "", hold_hours: 0, priority: 0, is_active: true });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await adminApi.trainerEarnings.holdPolicyRules.list();
      setRows(res?.results || []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load hold policies", "error");
    } finally {
      setLoading(false);
    }
  }, [adminApi, showToast]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <PrimaryButton onClick={() => setCreate(true)}>New rule</PrimaryButton>
      </div>
      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState icon={Timer} message="No hold-policy rules. Flat hold hours apply." />
      ) : (
        <DataTable cols={["Priority", "Name", "Hold hrs", "Tenure", "Risk ≥", "Active", ""]}>
          {rows.map((r) => (
            <TR key={r.id}>
              <TD>{r.priority}</TD>
              <TD>{r.name}</TD>
              <TD className="font-semibold">{r.hold_hours}h</TD>
              <TD>{dash(r.min_tenure_days)}–{r.max_tenure_days ?? "∞"}d</TD>
              <TD>{dash(r.min_risk_score)}</TD>
              <TD><StatusBadge status={r.is_active ? "active" : "inactive"} /></TD>
              <TD>
                <div className="flex gap-1">
                  <MiniBtn
                    label={r.is_active ? "Disable" : "Enable"}
                    color={r.is_active ? BRAND.warning : BRAND.success}
                    onClick={async () => {
                      try {
                        await adminApi.trainerEarnings.holdPolicyRules.update(r.id, { is_active: !r.is_active });
                        load();
                      } catch (err) {
                        showToast(err instanceof Error ? err.message : "Update failed", "error");
                      }
                    }}
                  />
                  <MiniBtn label="Delete" color={BRAND.error} onClick={() => setDel(r)} />
                </div>
              </TD>
            </TR>
          ))}
        </DataTable>
      )}

      {del && (
        <ConfirmDialog
          message={`Delete hold-policy rule "${del.name}"?`}
          confirmLabel="Delete"
          onCancel={() => setDel(null)}
          onConfirm={async () => {
            try {
              await adminApi.trainerEarnings.holdPolicyRules.delete(del.id);
              showToast("Rule deleted", "success");
              setDel(null);
              load();
            } catch (err) {
              showToast(err instanceof Error ? err.message : "Delete failed", "error");
            }
          }}
        />
      )}

      {create && (
        <Modal title="New hold-policy rule" onClose={() => setCreate(false)}>
          <div className="space-y-3">
            <FormField label="Name (required)">
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-[12px]" style={inputStyle} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Hold hours (required)">
                <input type="number" value={form.hold_hours} onChange={(e) => setForm((f) => ({ ...f, hold_hours: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-[12px]" style={inputStyle} />
              </FormField>
              <FormField label="Priority">
                <input type="number" value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-[12px]" style={inputStyle} />
              </FormField>
              <FormField label="Min tenure days">
                <input type="number" value={form.min_tenure_days ?? ""} onChange={(e) => setForm((f) => ({ ...f, min_tenure_days: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-[12px]" style={inputStyle} />
              </FormField>
              <FormField label="Min risk score (≤100)">
                <input type="number" value={form.min_risk_score ?? ""} onChange={(e) => setForm((f) => ({ ...f, min_risk_score: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-[12px]" style={inputStyle} />
              </FormField>
            </div>
            <label className="flex items-center gap-1.5 text-[11px]" style={{ color: BRAND.textMuted }}>
              <input type="checkbox" checked={!!form.is_active} onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))} /> Active
            </label>
            <div className="flex justify-end gap-2">
              <GhostButton onClick={() => setCreate(false)}>Cancel</GhostButton>
              <PrimaryButton
                onClick={async () => {
                  try {
                    const payload: any = { ...form };
                    ["min_tenure_days", "min_risk_score"].forEach((k) => { if (payload[k] === "") delete payload[k]; });
                    await adminApi.trainerEarnings.holdPolicyRules.create(payload);
                    showToast("Rule created", "success");
                    setCreate(false);
                    setForm({ name: "", hold_hours: 0, priority: 0, is_active: true });
                    load();
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : "Create failed", "error");
                  }
                }}
                disabled={!form.name.trim()}
              >
                Create
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════ INCIDENTS ══════════════════════════════ */

function IncidentsTab({ adminApi, showToast }: TabProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [pageMeta, setPageMeta] = useState<{ count: number; next: string | null; previous: string | null }>({ count: 0, next: null, previous: null });
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [resolve, setResolve] = useState<any>(null);
  const [resolution, setResolution] = useState("");
  const [create, setCreate] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({ title: "", severity: "warning", incident_type: "manual" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page) };
      if (statusFilter) params.status = statusFilter;
      const res: any = await adminApi.trainerEarnings.incidents.list(params);
      setRows(res?.results || []);
      setPageMeta({ count: res?.count ?? 0, next: res?.next ?? null, previous: res?.previous ?? null });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load incidents", "error");
    } finally {
      setLoading(false);
    }
  }, [adminApi, page, statusFilter, showToast]);

  useEffect(() => { load(); }, [load]);

  const STATUSES = ["", "open", "investigating", "resolved", "closed"];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <select
          value={statusFilter}
          onChange={(e) => { setPage(1); setStatusFilter(e.target.value); }}
          className="px-2.5 py-1.5 rounded-lg text-[12px]"
          style={inputStyle}
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s ? s : "All statuses"}</option>)}
        </select>
        <PrimaryButton onClick={() => setCreate(true)}>New incident</PrimaryButton>
      </div>

      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState icon={AlertOctagon} message="No financial incidents." />
      ) : (
        <>
          <DataTable cols={["#", "Title", "Type", "Severity", "Trainer", "Status", "Opened", ""]}>
            {rows.map((i) => (
              <TR key={i.id}>
                <TD>{i.id}</TD>
                <TD>{i.title}</TD>
                <TD>{(i.incident_type || "").replace(/_/g, " ")}</TD>
                <TD><StatusBadge status={i.severity} color={i.severity === "critical" ? BRAND.error : i.severity === "warning" ? BRAND.warning : BRAND.info} /></TD>
                <TD>{i.trainer_name ? i.trainer_name : dash(i.trainer_id)}</TD>
                <TD><StatusBadge status={i.status} /></TD>
                <TD>{formatDate(i.opened_at)}</TD>
                <TD>
                  {!["resolved", "closed"].includes(i.status) && (
                    <MiniBtn label="Resolve" color={BRAND.success} onClick={() => setResolve(i)} />
                  )}
                </TD>
              </TR>
            ))}
          </DataTable>
          <SimplePagination
            count={pageMeta.count}
            prevUrl={pageMeta.previous}
            nextUrl={pageMeta.next}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}

      {resolve && (
        <Modal title={`Resolve incident #${resolve.id}`} onClose={() => { setResolve(null); setResolution(""); }}>
          <div className="space-y-3">
            <FormField label="Resolution note">
              <textarea value={resolution} onChange={(e) => setResolution(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-lg text-[12px] resize-none" style={inputStyle} />
            </FormField>
            <div className="flex justify-end gap-2">
              <GhostButton onClick={() => { setResolve(null); setResolution(""); }}>Cancel</GhostButton>
              <PrimaryButton
                onClick={async () => {
                  try {
                    await adminApi.trainerEarnings.incidents.resolve(resolve.id, { status: "resolved", resolution });
                    showToast("Incident resolved", "success");
                    setResolve(null);
                    setResolution("");
                    load();
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : "Resolve failed", "error");
                  }
                }}
              >
                Resolve
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}

      {create && (
        <Modal title="New financial incident" onClose={() => setCreate(false)}>
          <div className="space-y-3">
            <FormField label="Title (required)">
              <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-[12px]" style={inputStyle} />
            </FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Severity">
                <select value={form.severity} onChange={(e) => setForm((f) => ({ ...f, severity: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-[12px]" style={inputStyle}>
                  {["info", "warning", "critical"].map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </FormField>
              <FormField label="Trainer ID (optional)">
                <input value={form.trainer_id ?? ""} onChange={(e) => setForm((f) => ({ ...f, trainer_id: e.target.value.replace(/\D/g, "") }))} className="w-full px-3 py-2 rounded-lg text-[12px]" style={inputStyle} />
              </FormField>
            </div>
            <FormField label="Description">
              <textarea value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg text-[12px] resize-none" style={inputStyle} />
            </FormField>
            <div className="flex justify-end gap-2">
              <GhostButton onClick={() => setCreate(false)}>Cancel</GhostButton>
              <PrimaryButton
                onClick={async () => {
                  try {
                    const payload: any = { ...form };
                    if (payload.trainer_id) payload.trainer_id = Number(payload.trainer_id); else delete payload.trainer_id;
                    await adminApi.trainerEarnings.incidents.create(payload);
                    showToast("Incident created", "success");
                    setCreate(false);
                    setForm({ title: "", severity: "warning", incident_type: "manual" });
                    load();
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : "Create failed", "error");
                  }
                }}
                disabled={!form.title.trim()}
              >
                Create
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

/* ══════════════════════════════ OPERATIONS ══════════════════════════════ */

function OperationsTab({ adminApi, showToast }: TabProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [audits, setAudits] = useState<any[]>([]);
  const [recons, setRecons] = useState<any[]>([]);
  const [sweeps, setSweeps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [an, au, re, sw] = await Promise.allSettled([
      adminApi.trainerEarnings.analytics(),
      adminApi.trainerEarnings.auditRuns.list({ page_size: "5" }),
      adminApi.trainerEarnings.reconciliation.list({ page_size: "5" }),
      adminApi.trainerEarnings.sweep.runs({ page_size: "5" }),
    ]);
    if (an.status === "fulfilled") setAnalytics(an.value);
    if (au.status === "fulfilled") setAudits((au.value as any)?.results || []);
    if (re.status === "fulfilled") setRecons((re.value as any)?.results || []);
    if (sw.status === "fulfilled") setSweeps((sw.value as any)?.results || []);
    setLoading(false);
  }, [adminApi]);

  useEffect(() => { load(); }, [load]);

  const trigger = async (kind: string, fn: () => Promise<unknown>) => {
    setBusy(kind);
    try {
      await fn();
      showToast(`${kind} completed`, "success");
      load();
    } catch (err) {
      showToast(err instanceof Error ? err.message : `${kind} failed`, "error");
    } finally {
      setBusy(null);
    }
  };

  if (loading) return <Loading />;

  const pending = analytics?.pending_payout_totals_by_currency;
  const pendingLabel =
    pending && typeof pending === "object"
      ? Object.entries(pending).map(([c, v]) => money(v, c)).join(" · ") || "—"
      : "—";
  const velocity = analytics?.avg_payout_velocity_hours;

  return (
    <div className="space-y-4">
      {analytics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <StatCard label="Active trainers" value={dash(analytics.active_trainer_count)} color={BRAND.success} />
          <StatCard label="Pending payouts" value={pendingLabel} color={BRAND.warning} />
          <StatCard label="Avg payout velocity" value={velocity != null ? `${Number(velocity).toFixed(1)}h` : "—"} />
          <StatCard label="Months covered" value={dash(analytics.months_covered)} />
        </div>
      )}

      <OpsRunList
        title="Ledger Audit Runs"
        rows={audits}
        cols={["#", "Ran", "Status", "Anomalies"]}
        render={(r) => [r.id, formatDate(r.run_at), <StatusBadge key="s" status={r.status} />, dash(r.anomaly_count)]}
        actionLabel="Run audit now"
        busy={busy === "Ledger audit"}
        onAction={() => trigger("Ledger audit", () => adminApi.trainerEarnings.auditRuns.runNow())}
      />

      <OpsRunList
        title="Stripe Reconciliation"
        rows={recons}
        cols={["#", "Started", "Status", "Issues"]}
        render={(r) => [r.id, formatDate(r.started_at), <StatusBadge key="s" status={r.status} />, dash(r.issue_count)]}
        actionLabel="Reconcile now"
        busy={busy === "Reconciliation"}
        onAction={() => trigger("Reconciliation", () => adminApi.trainerEarnings.reconciliation.runNow({ window_days: 7 }))}
      />

      <OpsRunList
        title="Monthly Sweep Runs"
        rows={sweeps}
        cols={["#", "Started", "Status", "Created"]}
        render={(r) => [r.id, formatDate(r.started_at), <StatusBadge key="s" status={r.status} />, dash(r.requests_created)]}
        actionLabel="Preview sweep"
        busy={busy === "Sweep preview"}
        onAction={() => trigger("Sweep preview", () => adminApi.trainerEarnings.sweep.preview())}
      />
    </div>
  );
}

function OpsRunList({
  title,
  rows,
  cols,
  render,
  actionLabel,
  busy,
  onAction,
}: {
  title: string;
  rows: any[];
  cols: string[];
  render: (r: any) => any[];
  actionLabel: string;
  busy: boolean;
  onAction: () => void;
}) {
  return (
    <div className="rounded-xl p-4" style={cardStyle}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[13px] font-semibold" style={{ color: BRAND.textMain }}>{title}</h3>
        <button
          onClick={onAction}
          disabled={busy}
          className="px-2.5 py-1 rounded-lg text-[11px] font-semibold disabled:opacity-50"
          style={{ backgroundColor: `${BRAND.primary}22`, color: BRAND.textMain }}
        >
          {busy ? "Running…" : actionLabel}
        </button>
      </div>
      {rows.length === 0 ? (
        <p className="text-[12px]" style={{ color: BRAND.textDim }}>No runs recorded.</p>
      ) : (
        <DataTable cols={cols}>
          {rows.map((r, i) => (
            <TR key={r.id ?? i}>
              {render(r).map((cell, ci) => (
                <TD key={ci}>{cell}</TD>
              ))}
            </TR>
          ))}
        </DataTable>
      )}
    </div>
  );
}

/* ══════════════════════════════ NOTIFICATIONS ══════════════════════════════ */

function NotificationsTab({ adminApi, showToast }: TabProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [pageMeta, setPageMeta] = useState<{ count: number; next: string | null; previous: string | null }>({ count: 0, next: null, previous: null });
  const [page, setPage] = useState(1);
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { page: String(page) };
      if (unreadOnly) params.is_read = "false";
      const res: any = await adminApi.trainerEarnings.notifications.list(params);
      setRows(res?.results || []);
      setPageMeta({ count: res?.count ?? 0, next: res?.next ?? null, previous: res?.previous ?? null });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load alerts", "error");
    } finally {
      setLoading(false);
    }
  }, [adminApi, page, unreadOnly, showToast]);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <label className="flex items-center gap-1.5 text-[11px]" style={{ color: BRAND.textMuted }}>
          <input type="checkbox" checked={unreadOnly} onChange={(e) => { setPage(1); setUnreadOnly(e.target.checked); }} /> Unread only
        </label>
        <GhostButton
          onClick={async () => {
            try {
              await adminApi.trainerEarnings.notifications.markAllRead();
              showToast("All marked read", "success");
              load();
            } catch (err) {
              showToast(err instanceof Error ? err.message : "Failed", "error");
            }
          }}
        >
          Mark all read
        </GhostButton>
      </div>

      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState icon={Bell} message="No alerts." />
      ) : (
        <>
          <div className="space-y-2">
            {rows.map((n) => (
              <div
                key={n.id}
                className="rounded-xl p-3 flex items-start justify-between gap-3"
                style={{ ...cardStyle, opacity: n.is_read ? 0.6 : 1 }}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={n.severity} color={n.severity === "critical" ? BRAND.error : n.severity === "warning" ? BRAND.warning : BRAND.info} />
                    <span className="text-[12px] font-semibold" style={{ color: BRAND.textMain }}>{n.title}</span>
                  </div>
                  <p className="text-[11px] mt-1" style={{ color: BRAND.textMuted }}>{n.message}</p>
                  <p className="text-[10px] mt-1" style={{ color: BRAND.textDim }}>
                    {(n.notification_type || "").replace(/_/g, " ")} · {formatDate(n.created_at)}
                    {n.trainer_name ? ` · ${n.trainer_name}` : ""}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  {!n.is_read && (
                    <MiniBtn label="Read" color={BRAND.info} onClick={async () => { try { await adminApi.trainerEarnings.notifications.markRead(n.id); load(); } catch (err) { showToast(err instanceof Error ? err.message : "Failed", "error"); } }} />
                  )}
                  {!n.resolved && (
                    <MiniBtn label="Resolve" color={BRAND.success} onClick={async () => { try { await adminApi.trainerEarnings.notifications.resolve(n.id); showToast("Resolved", "success"); load(); } catch (err) { showToast(err instanceof Error ? err.message : "Failed", "error"); } }} />
                  )}
                </div>
              </div>
            ))}
          </div>
          <SimplePagination
            count={pageMeta.count}
            prevUrl={pageMeta.previous}
            nextUrl={pageMeta.next}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════ shared bits ══════════════════════════════ */

function Loading() {
  return (
    <div className="py-10 text-center text-[12px]" style={{ color: BRAND.textDim }}>
      Loading…
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[9px] uppercase tracking-wider" style={{ color: BRAND.textDim }}>{label}</p>
      <div className="text-[12px] mt-0.5" style={{ color: BRAND.textMain }}>{value}</div>
    </div>
  );
}

function MiniBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-0.5 rounded text-[10px] font-semibold transition hover:opacity-80"
      style={{ backgroundColor: `${color}18`, color }}
    >
      {label}
    </button>
  );
}
