"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Download,
  ExternalLink,
  Loader2,
  ReceiptText,
  Wallet,
  X,
} from "lucide-react";
import { BRAND, Badge, Spinner, StatCard, Pagination } from "@holora/ui";
import { formatCurrency, formatDate } from "@holora/utils";
import type { ApiClient } from "@holora/api-client";
import { trainerApi } from "@/lib/trainer-api";

interface EarningsViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
  payments: any[];
  invoices: any[];
  financeLoading: boolean;
}

type Tab = "overview" | "payouts" | "statement" | "disputes" | "payments" | "invoices";

const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "payouts", label: "Payouts" },
  { id: "statement", label: "Statement" },
  { id: "disputes", label: "Disputes" },
  { id: "payments", label: "Payments" },
  { id: "invoices", label: "Invoices" },
];

/** Format a raw decimal amount + sibling currency string. */
const money = (amount: any, currency?: string) =>
  formatCurrency(Number(amount) || 0, (currency || "QAR").toUpperCase());

/** Map a payout / entry / dispute status to a Badge color. */
function statusColor(status?: string): "green" | "red" | "yellow" | "blue" | "purple" | "gray" {
  switch (status) {
    case "paid":
    case "available":
    case "won":
    case "approved":
      return "green";
    case "rejected":
    case "failed":
    case "reversed":
    case "lost":
    case "disputed":
      return "red";
    case "pending":
    case "requested":
    case "under_review":
    case "processing":
    case "retrying":
    case "held":
      return "yellow";
    default:
      return "gray";
  }
}

const titleCase = (s?: string) =>
  (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function EarningsView({ api, showToast, payments, invoices, financeLoading }: EarningsViewProps) {
  const [tab, setTab] = useState<Tab>("overview");

  // ── Core data (fetched on mount) ─────────────────────────────────────
  const [dashboard, setDashboard] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [eligibility, setEligibility] = useState<any>(null);
  const [connect, setConnect] = useState<any>(null);
  const [coreLoading, setCoreLoading] = useState(true);

  // ── Payout requests (lazy) ───────────────────────────────────────────
  const [requests, setRequests] = useState<any>(null);
  const [reqPage, setReqPage] = useState(1);
  const [reqLoading, setReqLoading] = useState(false);
  const [detail, setDetail] = useState<any>(null); // expanded payout request

  // ── Statement (lazy) ─────────────────────────────────────────────────
  const now = new Date();
  const [stmtYear, setStmtYear] = useState(now.getFullYear());
  const [stmtMonth, setStmtMonth] = useState(now.getMonth() + 1);
  const [statement, setStatement] = useState<any>(null);
  const [stmtLoading, setStmtLoading] = useState(false);

  // ── Disputes (lazy) ──────────────────────────────────────────────────
  const [disputes, setDisputes] = useState<any>(null);
  const [dispPage, setDispPage] = useState(1);
  const [dispLoading, setDispLoading] = useState(false);

  // ── Payout request modal ─────────────────────────────────────────────
  const [showRequest, setShowRequest] = useState(false);
  const [requestNote, setRequestNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [connecting, setConnecting] = useState(false);

  const loadCore = useCallback(async () => {
    setCoreLoading(true);
    const [d, b, e, c] = await Promise.allSettled([
      trainerApi.earnings.dashboard(api),
      trainerApi.earnings.payoutBalance(api),
      trainerApi.earnings.payoutEligibility(api),
      trainerApi.connect.status(api),
    ]);
    if (d.status === "fulfilled") setDashboard(d.value);
    if (b.status === "fulfilled") setBalance(b.value);
    if (e.status === "fulfilled") setEligibility(e.value);
    if (c.status === "fulfilled") setConnect(c.value);
    if ([d, b, e, c].every((r) => r.status === "rejected")) {
      showToast("Failed to load earnings data", "error");
    }
    setCoreLoading(false);
  }, [api, showToast]);

  useEffect(() => {
    loadCore();
  }, [loadCore]);

  const loadRequests = useCallback(
    async (page: number) => {
      setReqLoading(true);
      try {
        const data = await trainerApi.earnings.payoutRequests(api, page);
        setRequests(data);
        setReqPage(page);
      } catch (err: any) {
        showToast(err?.message || "Failed to load payout requests", "error");
      } finally {
        setReqLoading(false);
      }
    },
    [api, showToast]
  );

  const loadStatement = useCallback(async () => {
    setStmtLoading(true);
    try {
      const data = await trainerApi.earnings.financialStatement(api, { year: stmtYear, month: stmtMonth });
      setStatement(data?.statement ?? data);
    } catch (err: any) {
      showToast(err?.message || "Failed to load statement", "error");
    } finally {
      setStmtLoading(false);
    }
  }, [api, showToast, stmtYear, stmtMonth]);

  const loadDisputes = useCallback(
    async (page: number) => {
      setDispLoading(true);
      try {
        const data = await trainerApi.earnings.disputes(api, page);
        setDisputes(data);
        setDispPage(page);
      } catch (err: any) {
        showToast(err?.message || "Failed to load disputes", "error");
      } finally {
        setDispLoading(false);
      }
    },
    [api, showToast]
  );

  // Lazy-load per tab on first visit.
  useEffect(() => {
    if (tab === "payouts" && requests === null && !reqLoading) loadRequests(1);
    if (tab === "statement" && statement === null && !stmtLoading) loadStatement();
    if (tab === "disputes" && disputes === null && !dispLoading) loadDisputes(1);
  }, [tab]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitPayoutRequest = async () => {
    setSubmitting(true);
    try {
      await trainerApi.earnings.createPayoutRequest(api, requestNote.trim());
      showToast("Payout requested successfully", "success");
      setShowRequest(false);
      setRequestNote("");
      // Refresh balance, eligibility and the requests list.
      const [b, e] = await Promise.allSettled([
        trainerApi.earnings.payoutBalance(api),
        trainerApi.earnings.payoutEligibility(api),
      ]);
      if (b.status === "fulfilled") setBalance(b.value);
      if (e.status === "fulfilled") setEligibility(e.value);
      loadRequests(1);
    } catch (err: any) {
      showToast(err?.message || "Payout request failed", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const startConnectOnboarding = async () => {
    setConnecting(true);
    try {
      const here = window.location.href;
      const res = await trainerApi.connect.onboardingLink(api, here, here);
      if (res?.onboarding_url) {
        window.location.href = res.onboarding_url;
      } else {
        showToast("Could not start Stripe onboarding", "error");
      }
    } catch (err: any) {
      showToast(err?.message || "Stripe onboarding failed", "error");
    } finally {
      setConnecting(false);
    }
  };

  const anyEligible = !!eligibility?.any_eligible;
  const hasPending = !!balance?.has_pending_request;
  const payoutsEnabled = !!connect?.payouts_enabled;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl border shadow-lg"
        style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight }}
      >
        <div>
          <h2 className="text-xl font-bold px-1" style={{ color: BRAND.textMain }}>
            Earnings &amp; Payouts
          </h2>
          <p className="text-xs mt-1 px-1" style={{ color: BRAND.textMuted }}>
            Track earnings, request payouts and review your financial activity.
          </p>
        </div>
        <button
          onClick={() => setShowRequest(true)}
          disabled={!anyEligible || hasPending}
          className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}
        >
          <ArrowUpRight size={18} /> Request Payout
        </button>
      </div>

      {/* Stripe Connect banner */}
      <ConnectBanner
        connect={connect}
        connecting={connecting}
        onStart={startConnectOnboarding}
      />

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-1">
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="px-4 py-2 rounded-xl text-sm font-semibold whitespace-nowrap transition border"
              style={{
                backgroundColor: active ? BRAND.primary : BRAND.panel,
                borderColor: active ? BRAND.primary : BRAND.panelLight,
                color: active ? "#fff" : BRAND.textMuted,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {coreLoading ? (
        <Spinner />
      ) : (
        <>
          {tab === "overview" && (
            <OverviewTab dashboard={dashboard} balance={balance} />
          )}
          {tab === "payouts" && (
            <PayoutsTab
              balance={balance}
              eligibility={eligibility}
              requests={requests}
              loading={reqLoading}
              page={reqPage}
              onPage={loadRequests}
              detail={detail}
              onOpenDetail={async (id: number) => {
                try {
                  const d = await trainerApi.earnings.payoutRequestDetail(api, id);
                  setDetail(d?.payout_request ?? d);
                } catch (err: any) {
                  showToast(err?.message || "Failed to load request", "error");
                }
              }}
              onCloseDetail={() => setDetail(null)}
            />
          )}
          {tab === "statement" && (
            <StatementTab
              statement={statement}
              loading={stmtLoading}
              year={stmtYear}
              month={stmtMonth}
              onChange={(y, m) => {
                setStmtYear(y);
                setStmtMonth(m);
              }}
              onApply={loadStatement}
            />
          )}
          {tab === "disputes" && (
            <DisputesTab
              disputes={disputes}
              loading={dispLoading}
              page={dispPage}
              onPage={loadDisputes}
            />
          )}
          {tab === "payments" && <PaymentsTab payments={payments} loading={financeLoading} />}
          {tab === "invoices" && <InvoicesTab invoices={invoices} loading={financeLoading} />}
        </>
      )}

      {showRequest && (
        <RequestModal
          eligibility={eligibility}
          note={requestNote}
          onNote={setRequestNote}
          submitting={submitting}
          payoutsEnabled={payoutsEnabled}
          onClose={() => setShowRequest(false)}
          onSubmit={submitPayoutRequest}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════ */
/*  Sub-components                                                          */
/* ══════════════════════════════════════════════════════════════════════ */

function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={`rounded-3xl border shadow-xl ${className}`}
      style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight }}
    >
      {children}
    </div>
  );
}

function ConnectBanner({
  connect,
  connecting,
  onStart,
}: {
  connect: any;
  connecting: boolean;
  onStart: () => void;
}) {
  if (!connect) return null;
  if (connect.payouts_enabled) {
    return (
      <Panel className="p-4 flex items-center gap-3">
        <CheckCircle2 size={20} style={{ color: BRAND.success }} />
        <div className="flex-1">
          <p className="text-sm font-semibold" style={{ color: BRAND.textMain }}>
            Stripe payouts enabled
          </p>
          <p className="text-xs" style={{ color: BRAND.textMuted }}>
            Your account is fully set up to receive payouts.
          </p>
        </div>
      </Panel>
    );
  }
  const dueCount =
    (connect.requirements?.currently_due?.length || 0) +
    (connect.requirements?.past_due?.length || 0);
  return (
    <Panel className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <AlertTriangle size={20} style={{ color: BRAND.warning }} className="flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-semibold" style={{ color: BRAND.textMain }}>
          {connect.has_connect_account ? "Finish setting up payouts" : "Set up payouts with Stripe"}
        </p>
        <p className="text-xs" style={{ color: BRAND.textMuted }}>
          {connect.has_connect_account
            ? `Stripe needs more information before you can receive payouts${
                dueCount ? ` (${dueCount} item${dueCount !== 1 ? "s" : ""} outstanding)` : ""
              }.`
            : "Connect a Stripe account to start receiving your earnings."}
        </p>
      </div>
      <button
        onClick={onStart}
        disabled={connecting}
        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50"
        style={{ backgroundColor: BRAND.primary, color: "#fff" }}
      >
        {connecting ? <Loader2 size={16} className="animate-spin" /> : <ExternalLink size={16} />}
        {connect.has_connect_account ? "Continue setup" : "Set up Stripe"}
      </button>
    </Panel>
  );
}

function OverviewTab({ dashboard, balance }: { dashboard: any; balance: any }) {
  if (!dashboard) return <EmptyState label="No earnings data yet." />;
  const lifetime = dashboard.lifetime || {};
  const balances: any[] = balance?.balances || dashboard.balances || [];
  return (
    <div className="space-y-6">
      {/* Available balances */}
      <Panel className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Wallet size={18} style={{ color: BRAND.accent }} />
          <h3 className="font-bold" style={{ color: BRAND.textMain }}>
            Available Balance
          </h3>
        </div>
        {balances.length === 0 ? (
          <p className="text-sm" style={{ color: BRAND.textMuted }}>
            No balance yet.
          </p>
        ) : (
          <div className="flex flex-wrap gap-6">
            {balances.map((b) => (
              <div key={b.currency}>
                <p
                  className="text-3xl font-black"
                  style={{ color: Number(b.amount) < 0 ? BRAND.error : BRAND.accent }}
                >
                  {money(b.amount, b.currency)}
                </p>
                <p className="text-xs uppercase tracking-wide mt-1" style={{ color: BRAND.textMuted }}>
                  {b.currency}
                </p>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {/* Lifetime stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Lifetime Net" value={money(lifetime.net)} />
        <StatCard label="Lifetime Gross" value={money(lifetime.gross)} />
        <StatCard label="Commission Paid" value={money(lifetime.commission)} />
        <StatCard
          label="Earning Entries"
          value={lifetime.count ?? 0}
          sub={
            dashboard.commission_override_pct != null
              ? `Custom commission: ${dashboard.commission_override_pct}%`
              : undefined
          }
        />
      </div>

      {/* Breakdown by source type */}
      {Array.isArray(dashboard.by_source_type) && dashboard.by_source_type.length > 0 && (
        <Panel className="overflow-hidden">
          <div className="p-5 border-b" style={{ borderColor: BRAND.panelLight }}>
            <h3 className="font-bold" style={{ color: BRAND.textMain }}>
              Earnings by Source
            </h3>
          </div>
          <SimpleTable
            head={["Source", "Count", "Gross", "Commission", "Net"]}
            rows={dashboard.by_source_type.map((s: any) => [
              titleCase(s.source_type),
              s.count,
              money(s.gross),
              money(s.commission),
              money(s.net),
            ])}
            alignRight={[2, 3, 4]}
          />
        </Panel>
      )}

      {/* Recent entries */}
      {Array.isArray(dashboard.recent_entries) && dashboard.recent_entries.length > 0 && (
        <Panel className="overflow-hidden">
          <div className="p-5 border-b" style={{ borderColor: BRAND.panelLight }}>
            <h3 className="font-bold" style={{ color: BRAND.textMain }}>
              Recent Earning Entries
            </h3>
          </div>
          <SimpleTable
            head={["Source", "Date", "Status", "Net"]}
            rows={dashboard.recent_entries.map((e: any) => [
              titleCase(e.source_type),
              formatDate(e.created_at),
              <Badge key={e.id} color={statusColor(e.status)}>
                {titleCase(e.status)}
              </Badge>,
              money(e.trainer_net_amount),
            ])}
            alignRight={[3]}
          />
        </Panel>
      )}
    </div>
  );
}

function PayoutsTab({
  balance,
  eligibility,
  requests,
  loading,
  page,
  onPage,
  detail,
  onOpenDetail,
  onCloseDetail,
}: {
  balance: any;
  eligibility: any;
  requests: any;
  loading: boolean;
  page: number;
  onPage: (p: number) => void;
  detail: any;
  onOpenDetail: (id: number) => void;
  onCloseDetail: () => void;
}) {
  const currencies: any[] = eligibility?.currencies || [];
  const results: any[] = requests?.results || [];
  const count: number = requests?.count ?? results.length;
  const pageSize = 10;
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  return (
    <div className="space-y-6">
      {/* Eligibility per currency */}
      <Panel className="p-6">
        <h3 className="font-bold mb-4" style={{ color: BRAND.textMain }}>
          Payout Eligibility
        </h3>
        {currencies.length === 0 ? (
          <p className="text-sm" style={{ color: BRAND.textMuted }}>
            No withdrawable balance right now.
          </p>
        ) : (
          <div className="space-y-3">
            {currencies.map((c) => (
              <div
                key={c.currency}
                className="flex items-center justify-between gap-4 p-4 rounded-2xl"
                style={{ backgroundColor: BRAND.input }}
              >
                <div>
                  <p className="font-bold" style={{ color: BRAND.textMain }}>
                    {money(c.available_balance, c.currency)}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: BRAND.textMuted }}>
                    {c.eligible ? "Ready to withdraw" : c.detail || titleCase(c.reason)}
                  </p>
                </div>
                <Badge color={c.eligible ? "green" : "yellow"}>
                  {c.eligible ? "Eligible" : titleCase(c.reason) || "On hold"}
                </Badge>
              </div>
            ))}
          </div>
        )}
        {balance?.has_pending_request && (
          <p className="text-xs mt-4 flex items-center gap-1.5" style={{ color: BRAND.warning }}>
            <AlertTriangle size={13} /> You already have a payout request in progress.
          </p>
        )}
      </Panel>

      {/* Payout requests history */}
      <Panel className="overflow-hidden">
        <div className="p-5 border-b" style={{ borderColor: BRAND.panelLight }}>
          <h3 className="font-bold" style={{ color: BRAND.textMain }}>
            Payout Requests
          </h3>
        </div>
        {loading ? (
          <div className="p-8">
            <Spinner />
          </div>
        ) : results.length === 0 ? (
          <EmptyState label="No payout requests yet." />
        ) : (
          <>
            <SimpleTable
              head={["Amount", "Status", "Requested", "Paid", ""]}
              rows={results.map((r: any) => [
                money(r.requested_amount, r.currency),
                <Badge key={r.id} color={statusColor(r.status)}>
                  {titleCase(r.status)}
                </Badge>,
                formatDate(r.created_at),
                r.paid_at ? formatDate(r.paid_at) : "—",
                <button
                  key={`v${r.id}`}
                  onClick={() => onOpenDetail(r.id)}
                  className="text-xs font-semibold underline"
                  style={{ color: BRAND.accent }}
                >
                  View
                </button>,
              ])}
            />
            <div className="px-5 pb-4">
              <Pagination
                prevUrl={page > 1 ? "prev" : null}
                nextUrl={page < totalPages ? "next" : null}
                onPrev={() => onPage(page - 1)}
                onNext={() => onPage(page + 1)}
              />
            </div>
          </>
        )}
      </Panel>

      {detail && <PayoutDetailModal detail={detail} onClose={onCloseDetail} />}
    </div>
  );
}

function PayoutDetailModal({ detail, onClose }: { detail: any; onClose: () => void }) {
  const entries: any[] = detail.entries || [];
  return (
    <ModalShell title="Payout Request" onClose={onClose}>
      <div className="grid grid-cols-2 gap-3 mb-5">
        <Field label="Amount" value={money(detail.requested_amount, detail.currency)} />
        <Field label="Status" value={titleCase(detail.status)} />
        <Field label="Requested" value={formatDate(detail.created_at)} />
        <Field label="Paid" value={detail.paid_at ? formatDate(detail.paid_at) : "—"} />
        {detail.rejection_reason && (
          <div className="col-span-2">
            <Field label="Rejection reason" value={detail.rejection_reason} />
          </div>
        )}
        {detail.payout_reference && (
          <div className="col-span-2">
            <Field label="Reference" value={detail.payout_reference} />
          </div>
        )}
      </div>
      <p className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: BRAND.textMuted }}>
        Included entries ({entries.length})
      </p>
      {entries.length === 0 ? (
        <p className="text-sm" style={{ color: BRAND.textMuted }}>
          No entries.
        </p>
      ) : (
        <SimpleTable
          head={["Source", "Date", "Net"]}
          rows={entries.map((e: any) => [
            titleCase(e.source_type),
            formatDate(e.created_at),
            money(e.trainer_net_amount),
          ])}
          alignRight={[2]}
        />
      )}
    </ModalShell>
  );
}

function StatementTab({
  statement,
  loading,
  year,
  month,
  onChange,
  onApply,
}: {
  statement: any;
  loading: boolean;
  year: number;
  month: number;
  onChange: (y: number, m: number) => void;
  onApply: () => void;
}) {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const thisYear = new Date().getFullYear();
  const years = [thisYear, thisYear - 1, thisYear - 2];
  return (
    <div className="space-y-6">
      <Panel className="p-4 flex flex-wrap items-end gap-3">
        <SelectField
          label="Month"
          value={month}
          options={months.map((m, i) => ({ value: i + 1, label: m }))}
          onChange={(v) => onChange(year, Number(v))}
        />
        <SelectField
          label="Year"
          value={year}
          options={years.map((y) => ({ value: y, label: String(y) }))}
          onChange={(v) => onChange(Number(v), month)}
        />
        <button
          onClick={onApply}
          className="px-5 py-2.5 rounded-xl text-sm font-bold transition"
          style={{ backgroundColor: BRAND.primary, color: "#fff" }}
        >
          Apply
        </button>
      </Panel>

      {loading ? (
        <Spinner />
      ) : !statement ? (
        <EmptyState label="Select a period to view your statement." />
      ) : (
        <>
          <CurrencyBreakdown title="Earnings" data={statement.earnings_by_currency} />
          <CurrencyBreakdown title="Deductions" data={statement.deductions_by_currency} />
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard label="Disputes Opened" value={statement.disputes_opened_count ?? 0} />
            <StatCard label="Disputes Won" value={statement.disputes_won_count ?? 0} />
            <StatCard label="Disputes Lost" value={statement.disputes_lost_count ?? 0} />
          </div>
          {statement.payouts_by_currency &&
            Object.keys(statement.payouts_by_currency).length > 0 && (
              <Panel className="overflow-hidden">
                <div className="p-5 border-b" style={{ borderColor: BRAND.panelLight }}>
                  <h3 className="font-bold" style={{ color: BRAND.textMain }}>
                    Payouts in Period
                  </h3>
                </div>
                <SimpleTable
                  head={["Currency", "Count", "Total Paid"]}
                  rows={Object.entries(statement.payouts_by_currency).map(([cur, v]: any) => [
                    cur,
                    v.count,
                    money(v.total_paid, cur),
                  ])}
                  alignRight={[1, 2]}
                />
              </Panel>
            )}
        </>
      )}
    </div>
  );
}

function CurrencyBreakdown({ title, data }: { title: string; data: any }) {
  const entries = data ? Object.entries(data) : [];
  if (entries.length === 0) return null;
  return (
    <Panel className="overflow-hidden">
      <div className="p-5 border-b" style={{ borderColor: BRAND.panelLight }}>
        <h3 className="font-bold" style={{ color: BRAND.textMain }}>
          {title}
        </h3>
      </div>
      <SimpleTable
        head={["Currency", "Gross", "Commission", "Net", "Count"]}
        rows={entries.map(([cur, v]: any) => [
          cur,
          money(v.gross, cur),
          money(v.commission, cur),
          money(v.net, cur),
          v.count,
        ])}
        alignRight={[1, 2, 3, 4]}
      />
    </Panel>
  );
}

function DisputesTab({
  disputes,
  loading,
  page,
  onPage,
}: {
  disputes: any;
  loading: boolean;
  page: number;
  onPage: (p: number) => void;
}) {
  const results: any[] = disputes?.results || [];
  const count: number = disputes?.count ?? results.length;
  const totalPages = Math.max(1, Math.ceil(count / 10));
  if (loading) return <Spinner />;
  return (
    <Panel className="overflow-hidden">
      <div className="p-5 border-b" style={{ borderColor: BRAND.panelLight }}>
        <h3 className="font-bold" style={{ color: BRAND.textMain }}>
          Disputes
        </h3>
      </div>
      {results.length === 0 ? (
        <EmptyState label="No disputes — nice work." />
      ) : (
        <>
          <SimpleTable
            head={["Amount", "Reason", "Status", "Outcome", "Opened"]}
            rows={results.map((d: any) => [
              money(d.amount, d.currency),
              titleCase(d.reason),
              titleCase(d.stripe_status),
              <Badge key={d.id} color={statusColor(d.outcome)}>
                {d.outcome ? titleCase(d.outcome) : "Pending"}
              </Badge>,
              formatDate(d.opened_at),
            ])}
          />
          <div className="px-5 pb-4">
            <Pagination
              prevUrl={page > 1 ? "prev" : null}
              nextUrl={page < totalPages ? "next" : null}
              onPrev={() => onPage(page - 1)}
              onNext={() => onPage(page + 1)}
            />
          </div>
        </>
      )}
    </Panel>
  );
}

function PaymentsTab({ payments, loading }: { payments: any[]; loading: boolean }) {
  const handleExport = () => {
    const rows = ["Client,Date,Status,Amount,Currency"];
    (payments || [])
      .filter((p) => p.amount != null && p.amount !== "" && p.amount !== 0)
      .forEach((p) =>
        rows.push(
          `${p.client_name || p.user || ""},${p.created_at || ""},${p.payment_status || p.status || ""},${
            p.converted_amount ?? p.amount ?? ""
          },${p.currency || "QAR"}`
        )
      );
    const url = URL.createObjectURL(new Blob([rows.join("\n")], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "payments_report.csv";
    a.click();
    URL.revokeObjectURL(url);
  };
  if (loading) return <Spinner />;
  return (
    <Panel className="overflow-hidden">
      <div className="p-5 border-b flex items-center justify-between" style={{ borderColor: BRAND.panelLight }}>
        <h3 className="font-bold" style={{ color: BRAND.textMain }}>
          Payments
        </h3>
        {payments.length > 0 && (
          <button
            onClick={handleExport}
            className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-lg"
            style={{ backgroundColor: BRAND.input, color: BRAND.textMuted }}
          >
            <Download size={14} /> Export CSV
          </button>
        )}
      </div>
      {payments.length === 0 ? (
        <EmptyState label="No payments recorded." />
      ) : (
        <SimpleTable
          head={["Client", "Date", "Status", "Amount"]}
          rows={payments.map((p: any) => [
            p.client_name || "Unknown",
            formatDate(p.created_at),
            <Badge key={p.id} color={statusColor(p.payment_status || p.status)}>
              {titleCase(p.payment_status || p.status)}
            </Badge>,
            money(p.converted_amount ?? p.amount, p.currency),
          ])}
          alignRight={[3]}
        />
      )}
    </Panel>
  );
}

function InvoicesTab({ invoices, loading }: { invoices: any[]; loading: boolean }) {
  if (loading) return <Spinner />;
  return (
    <Panel className="overflow-hidden">
      <div className="p-5 border-b flex items-center gap-2" style={{ borderColor: BRAND.panelLight }}>
        <ReceiptText size={18} style={{ color: BRAND.accent }} />
        <h3 className="font-bold" style={{ color: BRAND.textMain }}>
          Invoices
        </h3>
      </div>
      {invoices.length === 0 ? (
        <EmptyState label="No invoices yet." />
      ) : (
        <SimpleTable
          head={["Invoice", "Date", "Status", "Amount"]}
          rows={invoices.map((inv: any) => [
            inv.invoice_number || inv.number || `#${inv.id}`,
            formatDate(inv.created_at || inv.issued_at),
            <Badge key={inv.id} color={statusColor(inv.status)}>
              {titleCase(inv.status)}
            </Badge>,
            money(inv.total ?? inv.amount, inv.currency),
          ])}
          alignRight={[3]}
        />
      )}
    </Panel>
  );
}

/* ── shared primitives ─────────────────────────────────────────────────── */

function SimpleTable({
  head,
  rows,
  alignRight = [],
}: {
  head: (string | React.ReactNode)[];
  rows: React.ReactNode[][];
  alignRight?: number[];
}) {
  return (
    <div className="overflow-x-auto custom-scrollbar">
      <table className="w-full text-left text-sm min-w-[560px]">
        <thead>
          <tr style={{ backgroundColor: BRAND.panelLight }}>
            {head.map((h, i) => (
              <th
                key={i}
                className={`px-5 py-3 text-xs uppercase font-bold ${alignRight.includes(i) ? "text-right" : ""}`}
                style={{ color: BRAND.textMuted }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, ri) => (
            <tr key={ri} className="border-t hover:bg-black/20 transition" style={{ borderColor: BRAND.panelLight }}>
              {r.map((cell, ci) => (
                <td
                  key={ci}
                  className={`px-5 py-3 ${alignRight.includes(ci) ? "text-right font-semibold" : ""}`}
                  style={{ color: BRAND.textMain }}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Field({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide font-bold mb-0.5" style={{ color: BRAND.textMuted }}>
        {label}
      </p>
      <p className="text-sm" style={{ color: BRAND.textMain }}>
        {value}
      </p>
    </div>
  );
}

function SelectField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string | number;
  options: { value: string | number; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] uppercase tracking-wide font-bold" style={{ color: BRAND.textMuted }}>
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-xl text-sm border outline-none"
        style={{ backgroundColor: BRAND.input, borderColor: BRAND.panelLight, color: BRAND.textMain }}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} style={{ backgroundColor: BRAND.input }}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="p-10 text-center text-sm" style={{ color: BRAND.textMuted }}>
      {label}
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[85vh] overflow-y-auto custom-scrollbar rounded-3xl border shadow-2xl"
        style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sticky top-0 flex items-center justify-between p-5 border-b"
          style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight }}
        >
          <h3 className="font-bold" style={{ color: BRAND.textMain }}>
            {title}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition">
            <X size={18} style={{ color: BRAND.textMuted }} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function RequestModal({
  eligibility,
  note,
  onNote,
  submitting,
  payoutsEnabled,
  onClose,
  onSubmit,
}: {
  eligibility: any;
  note: string;
  onNote: (v: string) => void;
  submitting: boolean;
  payoutsEnabled: boolean;
  onClose: () => void;
  onSubmit: () => void;
}) {
  const eligible: any[] = (eligibility?.currencies || []).filter((c: any) => c.eligible);
  return (
    <ModalShell title="Request Payout" onClose={onClose}>
      <p className="text-sm mb-4" style={{ color: BRAND.textMuted }}>
        This claims your <b>entire available balance</b>. One request is created per currency.
      </p>
      <div className="space-y-2 mb-4">
        {eligible.map((c) => (
          <div
            key={c.currency}
            className="flex items-center justify-between p-3 rounded-2xl"
            style={{ backgroundColor: BRAND.input }}
          >
            <span className="text-sm" style={{ color: BRAND.textMuted }}>
              {c.currency}
            </span>
            <span className="font-bold" style={{ color: BRAND.accent }}>
              {money(c.available_balance, c.currency)}
            </span>
          </div>
        ))}
      </div>
      {!payoutsEnabled && (
        <p className="text-xs mb-4 flex items-center gap-1.5" style={{ color: BRAND.warning }}>
          <AlertTriangle size={13} /> Stripe payouts aren&apos;t enabled yet — your request will be
          held until setup is complete.
        </p>
      )}
      <label className="block mb-4">
        <span className="text-[10px] uppercase tracking-wide font-bold" style={{ color: BRAND.textMuted }}>
          Note (optional)
        </span>
        <textarea
          value={note}
          onChange={(e) => onNote(e.target.value)}
          rows={3}
          className="mt-1 w-full px-3 py-2 rounded-xl text-sm border outline-none resize-none"
          style={{ backgroundColor: BRAND.input, borderColor: BRAND.panelLight, color: BRAND.textMain }}
          placeholder="Add a note for the finance team…"
        />
      </label>
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border"
          style={{ borderColor: BRAND.panelLight, color: BRAND.textMuted }}
        >
          Cancel
        </button>
        <button
          onClick={onSubmit}
          disabled={submitting || eligible.length === 0}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <ArrowUpRight size={16} />}
          Confirm Request
        </button>
      </div>
    </ModalShell>
  );
}
