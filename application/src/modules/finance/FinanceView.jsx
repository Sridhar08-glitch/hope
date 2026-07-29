import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Eye, Wallet, Coins, TrendingUp, Activity, Award, CalendarDays, Flame } from "lucide-react";
import BRAND from "../../constants/brand";
import { LoadingSpinner, TableWrap, TR, TD, Badge, Btn, StatCard, Pagination, Modal, InputField } from "../../components/ui";
import adminApi from "../../services/adminApi";

function FinanceView({ token, showToast }) {
  const [tab, setTab] = useState("dashboard");
  const [dashData, setDashData] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);

  const [wallets, setWallets] = useState([]);
  const [walletsLoading, setWalletsLoading] = useState(false);
  const [walletsNext, setWalletsNext] = useState(null);
  const [walletsPrev, setWalletsPrev] = useState(null);
  const [walletSearch, setWalletSearch] = useState("");
  const [walletDetail, setWalletDetail] = useState(null);
  const [rewardModal, setRewardModal] = useState(false);
  const [rewardForm, setRewardForm] = useState({ user_id: "", amount: "", description: "" });
  const [walletStats, setWalletStats] = useState(null);
  const [walletStatsLoading, setWalletStatsLoading] = useState(false);

  const [txns, setTxns] = useState([]);
  const [txnsLoading, setTxnsLoading] = useState(false);
  const [txnsNext, setTxnsNext] = useState(null);
  const [txnsPrev, setTxnsPrev] = useState(null);
  const [txnType, setTxnType] = useState("");
  const [txnReason, setTxnReason] = useState("");
  const [txnSearch, setTxnSearch] = useState("");

  const loadDash = useCallback(async () => {
    setDashLoading(true);
    try { setDashData(await adminApi.finance.dashboard(token)); }
    catch (err) { showToast(err.message, "error"); }
    finally { setDashLoading(false); }
  }, [token, showToast]);

  const loadWallets = useCallback(async (url = null) => {
    setWalletsLoading(true);
    try {
      const res = url
        ? await adminApi.finance.wallets.listUrl(token, url)
        : await adminApi.finance.wallets.list(token, { search: walletSearch || undefined });
      setWallets(res?.results || []);
      setWalletsNext(res?.next || null);
      setWalletsPrev(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    finally { setWalletsLoading(false); }
  }, [token, walletSearch, showToast]);

  const loadTxns = useCallback(async (url = null) => {
    setTxnsLoading(true);
    try {
      const res = url
        ? await adminApi.finance.wallets.transactionsUrl(token, url)
        : await adminApi.finance.wallets.transactions(token, { transaction_type: txnType || undefined, reason: txnReason || undefined, search: txnSearch || undefined });
      setTxns(res?.results || []);
      setTxnsNext(res?.next || null);
      setTxnsPrev(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    finally { setTxnsLoading(false); }
  }, [token, txnType, txnReason, txnSearch, showToast]);

  useEffect(() => { if (tab === "dashboard") loadDash(); }, [tab, loadDash]);
  useEffect(() => { if (tab === "wallets") loadWallets(); }, [tab, loadWallets]);
  useEffect(() => { if (tab === "transactions") loadTxns(); }, [tab, loadTxns]);

  useEffect(() => {
    if (tab === "stats") {
      setWalletStatsLoading(true);
      adminApi.finance.wallets.stats(token).then(setWalletStats).catch(e => showToast(e.message, "error")).finally(() => setWalletStatsLoading(false));
    }
  }, [tab, token, showToast]);

  async function openWalletDetail(id) {
    try { setWalletDetail(await adminApi.finance.wallets.detail(token, id)); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function submitReward() {
    try {
      await adminApi.finance.wallets.manualReward(token, { ...rewardForm, amount: parseFloat(rewardForm.amount) });
      showToast("Reward sent", "success");
      setRewardModal(false);
      setRewardForm({ user_id: "", amount: "", description: "" });
      loadWallets();
    } catch (err) { showToast(err.message, "error"); }
  }

  const txnBadge = (type) => <Badge color={type === "credit" ? "green" : "red"}>{type}</Badge>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-xl font-bold">Finance & Wallets</h2>
        {tab === "wallets" && <Btn onClick={() => setRewardModal(true)}><Plus size={14} className="mr-1" />Manual Reward</Btn>}
      </div>
      <div className="flex gap-2 border-b border-purple-900/40">
        {[["dashboard", "Dashboard"], ["wallets", "Wallets"], ["transactions", "Transactions"], ["stats", "Wallet Stats"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-2 text-sm font-medium ${tab === v ? "text-amber-400 border-b-2 border-amber-400" : "text-slate-400 hover:text-white"}`}>{l}</button>
        ))}
      </div>

      {tab === "dashboard" && (
        dashLoading ? <LoadingSpinner /> : dashData ? (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Wallets" value={dashData.wallet_summary?.total_wallets} icon={Wallet} color={BRAND.primary} />
              <StatCard label="Total Balance" value={dashData.wallet_summary?.total_balance} icon={Coins} color={BRAND.accent} />
              <StatCard label="Total Earned" value={dashData.wallet_summary?.total_earned} icon={TrendingUp} color={BRAND.success} />
              <StatCard label="Total Spent" value={dashData.wallet_summary?.total_spent} icon={Activity} color={BRAND.error} />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <StatCard label="Signup Bonuses" value={dashData.reward_summary?.total_signup_bonus} icon={Award} color={BRAND.info} />
              <StatCard label="Daily Rewards" value={dashData.reward_summary?.total_daily_rewards} icon={CalendarDays} color={BRAND.warning} />
              <StatCard label="Streak Rewards" value={dashData.reward_summary?.total_streak_rewards} icon={Flame} color={BRAND.error} />
            </div>
            {dashData.recent_transactions?.length > 0 && (
              <div className="rounded-2xl p-4 border border-white/5" style={{ backgroundColor: BRAND.card }}>
                <h3 className="text-white font-bold mb-3">Recent Transactions</h3>
                <TableWrap cols={["User", "Type", "Reason", "Amount", "Balance After", "Date"]}>
                  {dashData.recent_transactions.map(t => (
                    <TR key={t.id}>
                      <TD>{t.user_email || t.user || "—"}</TD>
                      <TD>{txnBadge(t.transaction_type)}</TD>
                      <TD><span className="text-slate-300 text-xs">{t.reason}</span></TD>
                      <TD>{t.amount}</TD>
                      <TD>{t.balance_after_transaction}</TD>
                      <TD>{t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}</TD>
                    </TR>
                  ))}
                </TableWrap>
              </div>
            )}
          </div>
        ) : <p className="text-slate-500">No data</p>
      )}

      {tab === "stats" && (
        walletStatsLoading ? <LoadingSpinner /> : walletStats ? (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(walletStats).map(([k, v]) => (
              <div key={k} className="rounded-xl p-4 border border-purple-900/40" style={{ backgroundColor: BRAND.card }}>
                <p className="text-slate-400 text-xs mb-1">{k.replace(/_/g, " ")}</p>
                <p className="text-white text-xl font-bold">{String(v)}</p>
              </div>
            ))}
          </div>
        ) : <p className="text-slate-500">No data</p>
      )}

      {tab === "wallets" && (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input value={walletSearch} onChange={e => setWalletSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && loadWallets()}
              placeholder="Search wallets…" className="flex-1 bg-white/5 border border-purple-900/40 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none" />
            <Btn onClick={() => loadWallets()}><Search size={14} /></Btn>
          </div>
          {walletsLoading ? <LoadingSpinner /> : (
            <>
              <TableWrap cols={["User", "Balance", "Earned", "Spent", "Transactions", "Created", "Actions"]}>
                {wallets.map(w => (
                  <TR key={w.id}>
                    <TD>{w.user_email || w.user || "—"}</TD>
                    <TD>{w.current_balance}</TD>
                    <TD>{w.total_earned}</TD>
                    <TD>{w.total_spent}</TD>
                    <TD>{w.transaction_count ?? "—"}</TD>
                    <TD>{w.created_at ? new Date(w.created_at).toLocaleDateString() : "—"}</TD>
                    <TD><Btn small onClick={() => openWalletDetail(w.id)}><Eye size={12} /></Btn></TD>
                  </TR>
                ))}
              </TableWrap>
              <Pagination nextUrl={walletsNext} prevUrl={walletsPrev} onNext={() => loadWallets(walletsNext)} onPrev={() => loadWallets(walletsPrev)} />
            </>
          )}
        </div>
      )}

      {tab === "transactions" && (
        <div className="space-y-3">
          <div className="flex gap-2 flex-wrap">
            <select value={txnType} onChange={e => setTxnType(e.target.value)}
              className="bg-white/5 border border-purple-900/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
              <option value="">All Types</option>
              <option value="credit">Credit</option>
              <option value="debit">Debit</option>
            </select>
            <select value={txnReason} onChange={e => setTxnReason(e.target.value)}
              className="bg-white/5 border border-purple-900/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
              <option value="">All Reasons</option>
              <option value="signup_bonus">Signup Bonus</option>
              <option value="daily_login">Daily Login</option>
              <option value="streak_reward">Streak Reward</option>
              <option value="manual_bonus">Manual Bonus</option>
              <option value="coin_spent">Coin Spent</option>
            </select>
            <input value={txnSearch} onChange={e => setTxnSearch(e.target.value)} onKeyDown={e => e.key === "Enter" && loadTxns()}
              placeholder="Search…" className="flex-1 bg-white/5 border border-purple-900/40 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none" />
            <Btn onClick={() => loadTxns()}><Search size={14} /></Btn>
          </div>
          {txnsLoading ? <LoadingSpinner /> : (
            <>
              <TableWrap cols={["User", "Type", "Reason", "Amount", "Balance After", "Description", "Date"]}>
                {txns.map(t => (
                  <TR key={t.id}>
                    <TD>{t.user_email || t.user || "—"}</TD>
                    <TD>{txnBadge(t.transaction_type)}</TD>
                    <TD><span className="text-xs text-slate-300">{t.reason}</span></TD>
                    <TD>{t.amount}</TD>
                    <TD>{t.balance_after_transaction}</TD>
                    <TD><span className="text-xs text-slate-400 max-w-xs truncate block">{t.description || "—"}</span></TD>
                    <TD>{t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}</TD>
                  </TR>
                ))}
              </TableWrap>
              <Pagination nextUrl={txnsNext} prevUrl={txnsPrev} onNext={() => loadTxns(txnsNext)} onPrev={() => loadTxns(txnsPrev)} />
            </>
          )}
        </div>
      )}

      {walletDetail && (
        <Modal title={`Wallet — ${walletDetail.user_email || walletDetail.user || walletDetail.id}`} onClose={() => setWalletDetail(null)}>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: BRAND.panelLight }}>
              <p className="text-white font-bold">{walletDetail.current_balance}</p>
              <p className="text-xs text-slate-400">Balance</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: BRAND.panelLight }}>
              <p className="text-white font-bold">{walletDetail.total_earned}</p>
              <p className="text-xs text-slate-400">Earned</p>
            </div>
            <div className="rounded-xl p-3 text-center" style={{ backgroundColor: BRAND.panelLight }}>
              <p className="text-white font-bold">{walletDetail.total_spent}</p>
              <p className="text-xs text-slate-400">Spent</p>
            </div>
          </div>
          {walletDetail.recent_transactions?.length > 0 && (
            <div className="max-h-64 overflow-y-auto">
              <TableWrap cols={["Type", "Reason", "Amount", "Date"]}>
                {walletDetail.recent_transactions.map(t => (
                  <TR key={t.id}>
                    <TD>{txnBadge(t.transaction_type)}</TD>
                    <TD><span className="text-xs">{t.reason}</span></TD>
                    <TD>{t.amount}</TD>
                    <TD>{t.created_at ? new Date(t.created_at).toLocaleDateString() : "—"}</TD>
                  </TR>
                ))}
              </TableWrap>
            </div>
          )}
        </Modal>
      )}

      {rewardModal && (
        <Modal title="Manual Reward" onClose={() => setRewardModal(false)}>
          <InputField label="User ID" value={rewardForm.user_id} onChange={v => setRewardForm(f => ({ ...f, user_id: v }))} />
          <InputField label="Amount (coins)" value={rewardForm.amount} onChange={v => setRewardForm(f => ({ ...f, amount: v }))} />
          <InputField label="Description" value={rewardForm.description} onChange={v => setRewardForm(f => ({ ...f, description: v }))} />
          <Btn onClick={submitReward}>Send Reward</Btn>
        </Modal>
      )}
    </div>
  );
}

export default FinanceView;
