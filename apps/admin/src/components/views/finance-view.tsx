"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Eye, Wallet, Plus, Coins } from "lucide-react";
import { motion } from "framer-motion";
import { BRAND, Spinner } from "@holora/ui";
import type { ApiClient } from "@holora/api-client";
import {
  PageHeader, TabBar, DataTable, TR, TD, Modal, EmptyState,
  StatCard, StatusBadge, SimplePagination,
  PrimaryButton, GhostButton, FormField, inputStyle, fadeUp, cardStyle,
} from "@/components/shared";

interface ViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
}

type Tab = "dashboard" | "wallets" | "transactions" | "stats";

export default function FinanceView({ api, showToast }: ViewProps) {
  const [tab, setTab] = useState<Tab>("dashboard");

  /* ── Dashboard state ────────────────────────────── */
  const [dashData, setDashData] = useState<any>(null);
  const [dashLoading, setDashLoading] = useState(true);

  /* ── Wallets state ──────────────────────────────── */
  const [wallets, setWallets] = useState<any[]>([]);
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [walletsNext, setWalletsNext] = useState<string | null>(null);
  const [walletsPrev, setWalletsPrev] = useState<string | null>(null);
  const [walletSearch, setWalletSearch] = useState("");
  const [walletDetail, setWalletDetail] = useState<any>(null);
  const [rewardModal, setRewardModal] = useState(false);
  const [rewardForm, setRewardForm] = useState({ user_id: "", amount: "", description: "" });
  const [walletStats, setWalletStats] = useState<any>(null);
  const [walletStatsLoading, setWalletStatsLoading] = useState(false);

  /* ── Transactions state ─────────────────────────── */
  const [txns, setTxns] = useState<any[]>([]);
  const [txnsLoading, setTxnsLoading] = useState(false);
  const [txnsNext, setTxnsNext] = useState<string | null>(null);
  const [txnsPrev, setTxnsPrev] = useState<string | null>(null);
  const [txnType, setTxnType] = useState("");
  const [txnReason, setTxnReason] = useState("");
  const [txnSearch, setTxnSearch] = useState("");

  /* ── Loaders ────────────────────────────────────── */
  const loadDash = useCallback(async () => {
    setDashLoading(true);
    try { setDashData(await api.get<any>("/admin/FinanceDashboard/")); }
    catch (err) { showToast(err instanceof Error ? err.message : "Failed to load dashboard", "error"); }
    finally { setDashLoading(false); }
  }, [api, showToast]);

  const loadWallets = useCallback(async (url: string | null = null) => {
    setWalletsLoading(true);
    try {
      const res = url
        ? await api.get<any>(url)
        : await api.get<any>("/admin/finance/wallets/", { search: walletSearch || "" });
      setWallets(res?.results || []);
      setWalletsNext(res?.next || null);
      setWalletsPrev(res?.previous || null);
    } catch (err) { showToast(err instanceof Error ? err.message : "Failed to load wallets", "error"); }
    finally { setWalletsLoading(false); }
  }, [api, walletSearch, showToast]);

  const loadTxns = useCallback(async (url: string | null = null) => {
    setTxnsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (txnType) params.transaction_type = txnType;
      if (txnReason) params.reason = txnReason;
      if (txnSearch) params.search = txnSearch;
      const res = url ? await api.get<any>(url) : await api.get<any>("/admin/finance/wallets/transactions/", params);
      setTxns(res?.results || []);
      setTxnsNext(res?.next || null);
      setTxnsPrev(res?.previous || null);
    } catch (err) { showToast(err instanceof Error ? err.message : "Failed to load transactions", "error"); }
    finally { setTxnsLoading(false); }
  }, [api, txnType, txnReason, txnSearch, showToast]);

  useEffect(() => { if (tab === "dashboard") loadDash(); }, [tab, loadDash]);
  useEffect(() => { if (tab === "wallets") loadWallets(); }, [tab, loadWallets]);
  useEffect(() => { if (tab === "transactions") loadTxns(); }, [tab, loadTxns]);

  useEffect(() => {
    if (tab === "stats") {
      setWalletStatsLoading(true);
      api.get<any>("/admin/finance/wallets/stats/").then(setWalletStats).catch((e: unknown) => showToast(e instanceof Error ? e.message : "Failed to load stats", "error")).finally(() => setWalletStatsLoading(false));
    }
  }, [tab, api, showToast]);

  /* ── Actions ────────────────────────────────────── */
  async function openWalletDetail(id: string) {
    try { setWalletDetail(await api.get<any>(`/admin/finance/wallets/${id}/`)); }
    catch (err) { showToast(err instanceof Error ? err.message : "Failed to load wallet", "error"); }
  }

  async function submitReward() {
    try {
      await api.post("/admin/finance/wallets/manual-reward/", { ...rewardForm, amount: parseFloat(rewardForm.amount) });
      showToast("Reward sent", "success");
      setRewardModal(false);
      setRewardForm({ user_id: "", amount: "", description: "" });
      loadWallets();
    } catch (err) { showToast(err instanceof Error ? err.message : "Reward failed", "error"); }
  }

  const selectClass = "rounded-lg px-3 py-1.5 text-[12px] outline-none";

  return (
    <div className="space-y-4">
      <PageHeader title="Finance & Wallets" subtitle="Manage wallets, transactions and reward distribution">
        {tab === "wallets" && <PrimaryButton onClick={() => setRewardModal(true)}><Plus size={12} className="mr-1 inline" />Manual Reward</PrimaryButton>}
      </PageHeader>

      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <TabBar<Tab>
          tabs={[
            { key: "dashboard", label: "Dashboard" },
            { key: "wallets", label: "Wallets", icon: Wallet },
            { key: "transactions", label: "Transactions", icon: Coins },
            { key: "stats", label: "Wallet Stats" },
          ]}
          active={tab}
          onChange={setTab}
        />
      </motion.div>

      {/* ── Dashboard Tab ──────────────────────────── */}
      {tab === "dashboard" && (
        dashLoading ? <div className="flex justify-center py-10"><Spinner /></div> : dashData ? (
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard label="Total Wallets" value={dashData.wallet_summary?.total_wallets} />
              <StatCard label="Total Balance" value={dashData.wallet_summary?.total_balance} color={BRAND.accent} />
              <StatCard label="Total Earned" value={dashData.wallet_summary?.total_earned} color={BRAND.success} />
              <StatCard label="Total Spent" value={dashData.wallet_summary?.total_spent} color={BRAND.error} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              <StatCard label="Signup Bonuses" value={dashData.reward_summary?.total_signup_bonus} />
              <StatCard label="Daily Rewards" value={dashData.reward_summary?.total_daily_rewards} />
              <StatCard label="Streak Rewards" value={dashData.reward_summary?.total_streak_rewards} />
            </div>
            {dashData.recent_transactions?.length > 0 && (
              <div className="rounded-xl p-4" style={cardStyle}>
                <p className="text-[12px] font-semibold mb-3" style={{ color: BRAND.textMain }}>Recent Transactions</p>
                <DataTable cols={["User", "Type", "Reason", "Amount", "Balance After", "Date"]}>
                  {dashData.recent_transactions.map((t: any) => (
                    <TR key={t.id}>
                      <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{t.user_email || t.user || "\u2014"}</span></TD>
                      <TD><StatusBadge status={t.transaction_type || "pending"} color={t.transaction_type === "credit" ? BRAND.success : BRAND.error} /></TD>
                      <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{t.reason}</span></TD>
                      <TD>{t.amount}</TD>
                      <TD>{t.balance_after_transaction}</TD>
                      <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{t.created_at ? new Date(t.created_at).toLocaleDateString() : "\u2014"}</span></TD>
                    </TR>
                  ))}
                </DataTable>
              </div>
            )}
          </motion.div>
        ) : <EmptyState icon={Wallet} message="No dashboard data" />
      )}

      {/* ── Wallet Stats Tab ──────────────────────── */}
      {tab === "stats" && (
        walletStatsLoading ? <div className="flex justify-center py-10"><Spinner /></div> : walletStats ? (
          <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(walletStats).map(([k, v]) => (
              <StatCard key={k} label={k.replace(/_/g, " ")} value={String(v)} />
            ))}
          </motion.div>
        ) : <EmptyState icon={Wallet} message="No stats available" />
      )}

      {/* ── Wallets Tab ────────────────────────────── */}
      {tab === "wallets" && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="space-y-3">
          <div className="flex gap-2">
            <input value={walletSearch} onChange={e => setWalletSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && loadWallets()}
              placeholder="Search wallets..." className="flex-1 rounded-lg px-3 py-1.5 text-[12px] outline-none placeholder:text-[11px]" style={inputStyle} />
            <PrimaryButton onClick={() => loadWallets()}><Search size={12} /></PrimaryButton>
          </div>
          {walletsLoading ? <div className="flex justify-center py-10"><Spinner /></div> : wallets.length === 0 ? (
            <EmptyState icon={Wallet} message="No wallets found" />
          ) : (
            <>
              <DataTable cols={["User", "Balance", "Earned", "Spent", "Transactions", "Created", "Actions"]}>
                {wallets.map(w => (
                  <TR key={w.id}>
                    <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{w.user_email || w.user || "\u2014"}</span></TD>
                    <TD>{w.current_balance}</TD>
                    <TD><span className="text-[12px]" style={{ color: BRAND.success }}>{w.total_earned}</span></TD>
                    <TD><span className="text-[12px]" style={{ color: BRAND.error }}>{w.total_spent}</span></TD>
                    <TD>{w.transaction_count ?? "\u2014"}</TD>
                    <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{w.created_at ? new Date(w.created_at).toLocaleDateString() : "\u2014"}</span></TD>
                    <TD>
                      <GhostButton onClick={() => openWalletDetail(w.id)}><Eye size={12} /></GhostButton>
                    </TD>
                  </TR>
                ))}
              </DataTable>
              <SimplePagination prevUrl={walletsPrev} nextUrl={walletsNext} onPrev={() => loadWallets(walletsPrev)} onNext={() => loadWallets(walletsNext)} count={wallets.length} />
            </>
          )}
        </motion.div>
      )}

      {/* ── Transactions Tab ──────────────────────── */}
      {tab === "transactions" && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <select value={txnType} onChange={e => setTxnType(e.target.value)} className={selectClass} style={inputStyle}>
              <option value="">All Types</option><option value="credit">Credit</option><option value="debit">Debit</option>
            </select>
            <select value={txnReason} onChange={e => setTxnReason(e.target.value)} className={selectClass} style={inputStyle}>
              <option value="">All Reasons</option><option value="signup_bonus">Signup Bonus</option><option value="daily_login">Daily Login</option><option value="streak_reward">Streak Reward</option><option value="manual_bonus">Manual Bonus</option><option value="coin_spent">Coin Spent</option>
            </select>
            <input value={txnSearch} onChange={e => setTxnSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && loadTxns()}
              placeholder="Search..." className="flex-1 rounded-lg px-3 py-1.5 text-[12px] outline-none placeholder:text-[11px]" style={inputStyle} />
            <PrimaryButton onClick={() => loadTxns()}><Search size={12} /></PrimaryButton>
          </div>
          {txnsLoading ? <div className="flex justify-center py-10"><Spinner /></div> : txns.length === 0 ? (
            <EmptyState icon={Coins} message="No transactions found" />
          ) : (
            <>
              <DataTable cols={["User", "Type", "Reason", "Amount", "Balance After", "Description", "Date"]}>
                {txns.map(t => (
                  <TR key={t.id}>
                    <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{t.user_email || t.user || "\u2014"}</span></TD>
                    <TD><StatusBadge status={t.transaction_type || "pending"} color={t.transaction_type === "credit" ? BRAND.success : BRAND.error} /></TD>
                    <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{t.reason}</span></TD>
                    <TD>{t.amount}</TD>
                    <TD>{t.balance_after_transaction}</TD>
                    <TD><span className="text-[11px] max-w-[180px] truncate block" style={{ color: BRAND.textDim }}>{t.description || "\u2014"}</span></TD>
                    <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{t.created_at ? new Date(t.created_at).toLocaleDateString() : "\u2014"}</span></TD>
                  </TR>
                ))}
              </DataTable>
              <SimplePagination prevUrl={txnsPrev} nextUrl={txnsNext} onPrev={() => loadTxns(txnsPrev)} onNext={() => loadTxns(txnsNext)} count={txns.length} />
            </>
          )}
        </motion.div>
      )}

      {/* ── Wallet Detail Modal ───────────────────── */}
      {walletDetail && (
        <Modal title={`Wallet -- ${walletDetail.user_email || walletDetail.user || walletDetail.id}`} onClose={() => setWalletDetail(null)} wide>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatCard label="Balance" value={walletDetail.current_balance} />
            <StatCard label="Earned" value={walletDetail.total_earned} color={BRAND.success} />
            <StatCard label="Spent" value={walletDetail.total_spent} color={BRAND.error} />
          </div>
          {walletDetail.recent_transactions?.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              <DataTable cols={["Type", "Reason", "Amount", "Date"]}>
                {walletDetail.recent_transactions.map((t: any) => (
                  <TR key={t.id}>
                    <TD><StatusBadge status={t.transaction_type || "pending"} color={t.transaction_type === "credit" ? BRAND.success : BRAND.error} /></TD>
                    <TD><span className="text-[11px]">{t.reason}</span></TD>
                    <TD>{t.amount}</TD>
                    <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{t.created_at ? new Date(t.created_at).toLocaleDateString() : "\u2014"}</span></TD>
                  </TR>
                ))}
              </DataTable>
            </div>
          )}
        </Modal>
      )}

      {/* ── Reward Modal ──────────────────────────── */}
      {rewardModal && (
        <Modal title="Manual Reward" onClose={() => setRewardModal(false)}>
          <div className="space-y-3">
            <FormField label="User ID">
              <input value={rewardForm.user_id} onChange={e => setRewardForm(f => ({ ...f, user_id: e.target.value }))} className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none" style={inputStyle} />
            </FormField>
            <FormField label="Amount (coins)">
              <input value={rewardForm.amount} onChange={e => setRewardForm(f => ({ ...f, amount: e.target.value }))} className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none" style={inputStyle} />
            </FormField>
            <FormField label="Description">
              <input value={rewardForm.description} onChange={e => setRewardForm(f => ({ ...f, description: e.target.value }))} className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none" style={inputStyle} />
            </FormField>
            <div className="flex justify-end gap-2 pt-2">
              <GhostButton onClick={() => setRewardModal(false)}>Cancel</GhostButton>
              <PrimaryButton onClick={submitReward}>Send Reward</PrimaryButton>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
