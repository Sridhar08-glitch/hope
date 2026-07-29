"use client";

import { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  Users,
  Share2,
  Coins,
  Receipt,
  BarChart3,
  RefreshCw,
  Undo2,
  Webhook,
} from "lucide-react";
import { BRAND, Spinner } from "@holora/ui";
import { motion } from "framer-motion";
import type { ApiClient } from "@holora/api-client";
import {
  PageHeader,
  TabBar,
  DataTable,
  TR,
  TD,
  Modal,
  StatCard,
  StatusBadge,
  SimplePagination,
  EmptyState,
  fadeUp,
  subtleBorder,
} from "@/components/shared";

/* ── Types ─────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyItem = Record<string, any>;

interface SubscriptionsViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
}

type MainTab = "plans" | "userSubs" | "referrals" | "coins" | "payments" | "reports" | "cycles" | "refunds" | "webhooks";

/* ── Stats Grid ────────────────────────────────────── */

function StatsGrid({ data }: { data: AnyItem | null | undefined }) {
  if (!data || typeof data !== "object") return <p className="text-[11px]" style={{ color: BRAND.textDim }}>No data available</p>;
  const entries = Object.entries(data).filter(([, v]) => typeof v !== "object");
  if (!entries.length) return <p className="text-[11px]" style={{ color: BRAND.textDim }}>No data available</p>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {entries.map(([k, v]) => (
        <StatCard key={k} label={k.replace(/_/g, " ")} value={typeof v === "number" ? v.toLocaleString() : String(v ?? "N/A")} />
      ))}
    </div>
  );
}

/* ── Main View ─────────────────────────────────────── */

export default function SubscriptionsView({ api, showToast }: SubscriptionsViewProps) {
  const [tab, setTab] = useState<MainTab>("plans");
  const [items, setItems] = useState<AnyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [extra, setExtra] = useState<AnyItem>({});
  const [modal, setModal] = useState<AnyItem | null>(null);
  const [subTab, setSubTab] = useState("codes");

  const safe = async <T,>(fn: () => Promise<T>, fallback: T): Promise<T> => {
    try { return await fn(); }
    catch (e: unknown) { showToast(e instanceof Error ? e.message : "Load failed", "error"); return fallback; }
  };

  const loadData = useCallback(async (url?: string | null) => {
    setLoading(true);
    setExtra({});
    try {
      let res: AnyItem | AnyItem[] | undefined;
      if (url) { res = await api.get(url); }
      else if (tab === "plans") res = await api.get("/admin/subs/plans/");
      else if (tab === "userSubs") res = await api.get("/admin/subs/users/");
      else if (tab === "referrals") {
        if (subTab === "codes") res = await api.get("/admin/subs/referrals/codes/");
        else if (subTab === "users") res = await api.get("/admin/subs/referrals/users/");
        else if (subTab === "distributions") res = await api.get("/admin/subs/referrals/distributions/");
        else if (subTab === "stats") {
          setExtra({ stats: await safe(() => api.get("/admin/subs/referrals/stats/"), {}) });
          setLoading(false);
          return;
        }
      } else if (tab === "coins") {
        res = await api.get("/admin/subs/coins/adjustments/");
        const [cfg, ana] = await Promise.all([
          safe(() => api.get("/admin/subs/coins/distribution-config/"), []),
          safe(() => api.get("/admin/subs/coins/analytics/"), {}),
        ]);
        setExtra({ coinConfig: Array.isArray(cfg) ? cfg : (cfg as AnyItem)?.results || [], coinAnalytics: ana });
      } else if (tab === "payments") {
        res = await api.get("/admin/subs/payments/");
        setExtra({ payAnalytics: await safe(() => api.get("/admin/subs/payments/analytics/"), {}) });
      } else if (tab === "reports") {
        const [health, revenue, churn, ltv, coinCost, analytics] = await Promise.all([
          safe(() => api.get("/admin/subs/health/"), {}),
          safe(() => api.get("/admin/subs/reports/revenue/"), {}),
          safe(() => api.get("/admin/subs/reports/churn/"), {}),
          safe(() => api.get("/admin/subs/reports/ltv/"), {}),
          safe(() => api.get("/admin/subs/reports/coin-cost/"), {}),
          safe(() => api.get("/admin/subs/analytics/"), {}),
        ]);
        setExtra({ health, revenue, churn, ltv, coinCost, analytics });
        setLoading(false);
        return;
      } else if (tab === "cycles") res = await api.get("/admin/subs/cycles/");
      else if (tab === "refunds") res = await api.get("/admin/subs/refunds/");
      else if (tab === "webhooks") res = await api.get("/admin/subs/webhooks/stripe/");

      const resolved = res as AnyItem;
      setItems(resolved?.results || (Array.isArray(resolved) ? resolved : []));
      setNextUrl(resolved?.next || null);
      setPrevUrl(resolved?.previous || null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Load failed", "error");
      setItems([]);
    }
    setLoading(false);
  }, [tab, subTab, api, showToast]);

  useEffect(() => { loadData(); }, [loadData]);

  /* ── Actions ── */
  const handleCancel = async (id: string) => { try { await api.post(`/admin/subs/users/${id}/cancel/`); showToast("Subscription cancelled", "success"); loadData(); } catch (e: unknown) { showToast(e instanceof Error ? e.message : "Cancel failed", "error"); } };
  const handleApprove = async (id: string) => { try { await api.post(`/admin/subs/coins/adjustments/${id}/approve/`); showToast("Adjustment approved", "success"); loadData(); } catch (e: unknown) { showToast(e instanceof Error ? e.message : "Approve failed", "error"); } };
  const handleUpgrade = async (id: string) => { try { await api.post(`/admin/subs/users/${id}/upgrade/`, {}); showToast("Upgraded", "success"); loadData(); } catch (e: unknown) { showToast(e instanceof Error ? e.message : "Upgrade failed", "error"); } };
  const handleDowngrade = async (id: string) => { try { await api.post(`/admin/subs/users/${id}/downgrade/`, {}); showToast("Downgraded", "success"); loadData(); } catch (e: unknown) { showToast(e instanceof Error ? e.message : "Downgrade failed", "error"); } };
  const handleDetail = async (id: string, type: string = "user") => { try { const d = type === "payment" ? await api.get(`/admin/subs/payments/${id}/`) : await api.get(`/admin/subs/users/${id}/`); setModal(d as AnyItem); } catch (e: unknown) { showToast(e instanceof Error ? e.message : "Load failed", "error"); } };
  const handleRefundApprove = async (id: string) => { try { await api.post(`/admin/subs/refunds/${id}/approve/`); showToast("Refund approved", "success"); loadData(); } catch (e: unknown) { showToast(e instanceof Error ? e.message : "Approve failed", "error"); } };
  const handleDistApprove = async (id: string) => { try { await api.post(`/admin/subs/referrals/distributions/${id}/approve/`); showToast("Distribution approved", "success"); loadData(); } catch (e: unknown) { showToast(e instanceof Error ? e.message : "Approve failed", "error"); } };
  const handleDeleteConfig = async (id: string) => { try { await api.del(`/admin/subs/coins/distribution-config/${id}/`); showToast("Config deleted", "success"); loadData(); } catch (e: unknown) { showToast(e instanceof Error ? e.message : "Delete failed", "error"); } };

  const mainTabs: { key: MainTab; label: string; icon: typeof CreditCard }[] = [
    { key: "plans", label: "Plans", icon: CreditCard },
    { key: "userSubs", label: "User Subs", icon: Users },
    { key: "referrals", label: "Referrals", icon: Share2 },
    { key: "coins", label: "Coins", icon: Coins },
    { key: "payments", label: "Payments", icon: Receipt },
    { key: "reports", label: "Reports", icon: BarChart3 },
    { key: "cycles", label: "Cycles", icon: RefreshCw },
    { key: "refunds", label: "Refunds", icon: Undo2 },
    { key: "webhooks", label: "Webhooks", icon: Webhook },
  ];

  const refSubTabs: { key: string; label: string }[] = [
    { key: "codes", label: "Codes" },
    { key: "users", label: "Users" },
    { key: "distributions", label: "Distributions" },
    { key: "stats", label: "Stats" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Subscriptions" subtitle="Plans, billing, referrals, coins, and reports" />

      <TabBar tabs={mainTabs} active={tab} onChange={(k) => { setTab(k); if (k === "referrals") setSubTab("codes"); }} />

      {/* Detail Modal */}
      {modal && (
        <Modal title="Detail" onClose={() => setModal(null)}>
          <div className="space-y-1.5">
            {Object.entries(modal).filter(([, v]) => typeof v !== "object").map(([k, v]) => (
              <div key={k} className="flex justify-between py-1" style={{ borderBottom: subtleBorder }}>
                <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: BRAND.textDim }}>{k.replace(/_/g, " ")}</span>
                <span className="text-[12px]" style={{ color: BRAND.textMain }}>{String(v)}</span>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {loading ? <div className="flex justify-center py-12"><Spinner /></div> : (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">

          {/* ── Plans ── */}
          {tab === "plans" && (
            <>
              {items.length === 0 ? <EmptyState icon={CreditCard} message="No plans found" /> : (
                <DataTable cols={["Name", "Price", "Interval"]}>
                  {items.map((r, i) => (
                    <TR key={r.id || i}>
                      <TD><span className="text-[12px] font-medium">{r.name}</span></TD>
                      <TD><span className="text-[12px]">{r.price}</span></TD>
                      <TD><span className="text-[11px]">{r.interval}</span></TD>
                    </TR>
                  ))}
                </DataTable>
              )}
              <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl)} onNext={() => loadData(nextUrl)} count={items.length} />
            </>
          )}

          {/* ── User Subs ── */}
          {tab === "userSubs" && (
            <>
              {items.length === 0 ? <EmptyState icon={Users} message="No user subscriptions" /> : (
                <DataTable cols={["User", "Plan", "Status", "Dates", "Actions"]}>
                  {items.map((r, i) => (
                    <TR key={r.id || i}>
                      <TD><span className="text-[12px]">{r.user}</span></TD>
                      <TD><span className="text-[12px]">{r.plan}</span></TD>
                      <TD><StatusBadge status={r.status} /></TD>
                      <TD><span className="text-[10px]" style={{ color: BRAND.textDim }}>{r.start_date} - {r.end_date}</span></TD>
                      <TD>
                        <div className="flex gap-1 flex-wrap">
                          <button onClick={() => handleDetail(r.id)} className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: `${BRAND.info}18`, color: BRAND.info }}>Detail</button>
                          {r.status === "active" && (
                            <>
                              <button onClick={() => handleUpgrade(r.id)} className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: `${BRAND.success}18`, color: BRAND.success }}>Upgrade</button>
                              <button onClick={() => handleDowngrade(r.id)} className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: `${BRAND.textDim}18`, color: BRAND.textDim }}>Downgrade</button>
                              <button onClick={() => handleCancel(r.id)} className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: `${BRAND.error}18`, color: BRAND.error }}>Cancel</button>
                            </>
                          )}
                        </div>
                      </TD>
                    </TR>
                  ))}
                </DataTable>
              )}
              <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl)} onNext={() => loadData(nextUrl)} count={items.length} />
            </>
          )}

          {/* ── Referrals ── */}
          {tab === "referrals" && (
            <>
              <TabBar tabs={refSubTabs} active={subTab} onChange={setSubTab} />
              <div className="mt-3">
                {subTab === "stats" ? <StatsGrid data={extra.stats} /> : subTab === "distributions" ? (
                  <>
                    {items.length === 0 ? <EmptyState icon={Share2} message="No distributions" /> : (
                      <DataTable cols={["ID", "User", "Amount", "Status", "Actions"]}>
                        {items.map((r, i) => (
                          <TR key={r.id || i}>
                            <TD><span className="text-[11px]">{r.id}</span></TD>
                            <TD><span className="text-[12px]">{r.user}</span></TD>
                            <TD><span className="text-[12px]">{r.amount}</span></TD>
                            <TD><StatusBadge status={r.status} /></TD>
                            <TD>{r.status === "pending" && <button onClick={() => handleDistApprove(r.id)} className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: `${BRAND.success}18`, color: BRAND.success }}>Approve</button>}</TD>
                          </TR>
                        ))}
                      </DataTable>
                    )}
                    <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl)} onNext={() => loadData(nextUrl)} count={items.length} />
                  </>
                ) : (
                  <>
                    {items.length === 0 ? <EmptyState icon={Share2} message="No data" /> : (
                      <DataTable cols={subTab === "codes" ? ["Code", "User", "Uses"] : ["ID", "User", "Referrer", "Status"]}>
                        {items.map((r, i) => (
                          <TR key={r.id || i}>
                            {subTab === "codes" ? (
                              <>
                                <TD><span className="text-[12px]" style={{ color: BRAND.accent }}>{r.code}</span></TD>
                                <TD><span className="text-[12px]">{r.user}</span></TD>
                                <TD><span className="text-[12px]">{r.uses}</span></TD>
                              </>
                            ) : (
                              <>
                                <TD><span className="text-[11px]">{r.id}</span></TD>
                                <TD><span className="text-[12px]">{r.user}</span></TD>
                                <TD><span className="text-[12px]">{r.referrer}</span></TD>
                                <TD><StatusBadge status={r.status} /></TD>
                              </>
                            )}
                          </TR>
                        ))}
                      </DataTable>
                    )}
                    <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl)} onNext={() => loadData(nextUrl)} count={items.length} />
                  </>
                )}
              </div>
            </>
          )}

          {/* ── Coins ── */}
          {tab === "coins" && (
            <>
              {extra.coinAnalytics && typeof extra.coinAnalytics === "object" && Object.keys(extra.coinAnalytics).length > 0 && (
                <div className="mb-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Coin Analytics</h3>
                  <StatsGrid data={extra.coinAnalytics} />
                </div>
              )}
              <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Adjustments</h3>
              {items.length === 0 ? <EmptyState icon={Coins} message="No adjustments" /> : (
                <DataTable cols={["User", "Amount", "Reason", "Status", "Actions"]}>
                  {items.map((r, i) => (
                    <TR key={r.id || i}>
                      <TD><span className="text-[12px]">{r.user}</span></TD>
                      <TD><span className="text-[12px]">{r.amount}</span></TD>
                      <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{r.reason}</span></TD>
                      <TD><StatusBadge status={r.status} /></TD>
                      <TD>{r.status === "pending" && <button onClick={() => handleApprove(r.id)} className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: `${BRAND.success}18`, color: BRAND.success }}>Approve</button>}</TD>
                    </TR>
                  ))}
                </DataTable>
              )}
              <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl)} onNext={() => loadData(nextUrl)} count={items.length} />
              {extra.coinConfig && extra.coinConfig.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Distribution Config</h3>
                  <DataTable cols={["ID", "Type", "Amount", "Actions"]}>
                    {extra.coinConfig.map((r: AnyItem, i: number) => (
                      <TR key={r.id || i}>
                        <TD><span className="text-[11px]">{r.id}</span></TD>
                        <TD><span className="text-[12px]">{r.type || r.name}</span></TD>
                        <TD><span className="text-[12px]">{r.amount || r.coins}</span></TD>
                        <TD><button onClick={() => handleDeleteConfig(r.id)} className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: `${BRAND.error}18`, color: BRAND.error }}>Delete</button></TD>
                      </TR>
                    ))}
                  </DataTable>
                </div>
              )}
            </>
          )}

          {/* ── Payments ── */}
          {tab === "payments" && (
            <>
              {extra.payAnalytics && typeof extra.payAnalytics === "object" && Object.keys(extra.payAnalytics).length > 0 && (
                <div className="mb-4">
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Payment Analytics</h3>
                  <StatsGrid data={extra.payAnalytics} />
                </div>
              )}
              {items.length === 0 ? <EmptyState icon={Receipt} message="No payments" /> : (
                <DataTable cols={["User", "Amount", "Status", "Date", "Actions"]}>
                  {items.map((r, i) => (
                    <TR key={r.id || i}>
                      <TD><span className="text-[12px]">{r.user}</span></TD>
                      <TD><span className="text-[12px]">{r.amount}</span></TD>
                      <TD><StatusBadge status={r.status} /></TD>
                      <TD><span className="text-[10px]" style={{ color: BRAND.textDim }}>{r.date}</span></TD>
                      <TD><button onClick={() => handleDetail(r.id, "payment")} className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: `${BRAND.info}18`, color: BRAND.info }}>Detail</button></TD>
                    </TR>
                  ))}
                </DataTable>
              )}
              <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl)} onNext={() => loadData(nextUrl)} count={items.length} />
            </>
          )}

          {/* ── Reports ── */}
          {tab === "reports" && (
            <div className="space-y-5">
              {(
                [["Health", extra.health], ["Revenue", extra.revenue], ["Churn", extra.churn], ["LTV", extra.ltv], ["Coin Cost", extra.coinCost], ["Analytics", extra.analytics]] as [string, AnyItem][]
              ).map(([title, data]) => (
                <div key={title}>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>{title}</h3>
                  <StatsGrid data={data} />
                </div>
              ))}
            </div>
          )}

          {/* ── Cycles ── */}
          {tab === "cycles" && (
            <>
              {items.length === 0 ? <EmptyState icon={RefreshCw} message="No cycles" /> : (
                <DataTable cols={["ID", "User", "Plan", "Start", "End", "Status"]}>
                  {items.map((r, i) => (
                    <TR key={r.id || i}>
                      <TD><span className="text-[11px]">{r.id}</span></TD>
                      <TD><span className="text-[12px]">{r.user}</span></TD>
                      <TD><span className="text-[12px]">{r.plan}</span></TD>
                      <TD><span className="text-[10px]" style={{ color: BRAND.textDim }}>{r.start_date}</span></TD>
                      <TD><span className="text-[10px]" style={{ color: BRAND.textDim }}>{r.end_date}</span></TD>
                      <TD><StatusBadge status={r.status} /></TD>
                    </TR>
                  ))}
                </DataTable>
              )}
              <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl)} onNext={() => loadData(nextUrl)} count={items.length} />
            </>
          )}

          {/* ── Refunds ── */}
          {tab === "refunds" && (
            <>
              {items.length === 0 ? <EmptyState icon={Undo2} message="No refunds" /> : (
                <DataTable cols={["ID", "User", "Amount", "Reason", "Status", "Actions"]}>
                  {items.map((r, i) => (
                    <TR key={r.id || i}>
                      <TD><span className="text-[11px]">{r.id}</span></TD>
                      <TD><span className="text-[12px]">{r.user}</span></TD>
                      <TD><span className="text-[12px]">{r.amount}</span></TD>
                      <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{r.reason}</span></TD>
                      <TD><StatusBadge status={r.status} /></TD>
                      <TD>{r.status === "pending" && <button onClick={() => handleRefundApprove(r.id)} className="px-2 py-0.5 rounded text-[10px] font-semibold" style={{ backgroundColor: `${BRAND.success}18`, color: BRAND.success }}>Approve</button>}</TD>
                    </TR>
                  ))}
                </DataTable>
              )}
              <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl)} onNext={() => loadData(nextUrl)} count={items.length} />
            </>
          )}

          {/* ── Webhooks ── */}
          {tab === "webhooks" && (
            <>
              {items.length === 0 ? <EmptyState icon={Webhook} message="No webhooks" /> : (
                <DataTable cols={["ID", "Event", "Status", "Created", "Payload"]}>
                  {items.map((r, i) => (
                    <TR key={r.id || i}>
                      <TD><span className="text-[11px]">{r.id}</span></TD>
                      <TD><span className="text-[12px]">{r.event || r.event_type}</span></TD>
                      <TD><StatusBadge status={r.status === "processed" || r.status === "success" ? "completed" : r.status} /></TD>
                      <TD><span className="text-[10px]" style={{ color: BRAND.textDim }}>{r.created_at || r.date}</span></TD>
                      <TD><span className="text-[10px] max-w-[180px] truncate block" style={{ color: BRAND.textDim }}>{typeof r.payload === "object" ? JSON.stringify(r.payload).slice(0, 80) : r.payload}</span></TD>
                    </TR>
                  ))}
                </DataTable>
              )}
              <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl)} onNext={() => loadData(nextUrl)} count={items.length} />
            </>
          )}
        </motion.div>
      )}
    </div>
  );
}
