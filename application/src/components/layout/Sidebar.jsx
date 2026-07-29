import { LayoutDashboard, UsersRound, Globe, ShieldBan, Ticket, ActivitySquare, Utensils, Stethoscope, BadgeCheck, BookOpen, ShoppingCart, Bell, Wallet, LogOut, X, CreditCard, Tags, ScrollText, AlertTriangle, Database } from "lucide-react";
import BRAND from "../../constants/brand";

const NAV = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "core" },
  { id: "users", label: "User Management", icon: UsersRound, group: "core" },
  { id: "communities", label: "Communities", icon: Globe, group: "ecosystem" },
  { id: "moderation", label: "Chat & Moderation", icon: ShieldBan, group: "ecosystem" },
  { id: "events", label: "Events", icon: Ticket, group: "ecosystem" },
  { id: "fitness", label: "Fitness Records", icon: ActivitySquare, group: "ecosystem" },
  { id: "nutrition", label: "Nutrition & Meals", icon: Utensils, group: "ecosystem" },
  { id: "recovery", label: "Recovery & Wellness", icon: Stethoscope, group: "ecosystem" },
  { id: "trainers", label: "Trainers & Booking", icon: BadgeCheck, group: "ecosystem" },
  { id: "content", label: "Content Plans", icon: BookOpen, group: "ecosystem" },
  { id: "shop", label: "Shop & Orders", icon: ShoppingCart, group: "ecosystem" },
  { id: "notifications", label: "Notifications", icon: Bell, group: "ecosystem" },
  { id: "finance", label: "Finance & Wallets", icon: Wallet, group: "ecosystem" },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard, group: "business" },
  { id: "pricing", label: "Pricing Engine", icon: Tags, group: "business" },
  { id: "audit", label: "Audit & Logs", icon: ScrollText, group: "operations" },
  { id: "alerts", label: "Alerts & Appeals", icon: AlertTriangle, group: "operations" },
  { id: "datasets", label: "Datasets", icon: Database, group: "operations" },
];

const GROUPS = [
  { key: "core", label: "Core" },
  { key: "ecosystem", label: "Ecosystem" },
  { key: "business", label: "Business" },
  { key: "operations", label: "Operations" },
];

function Sidebar({ active, onSelect, pendingReports, onLogout, isOpen, onClose }) {
  return (
    <>
      {isOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={onClose} />}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-50 w-72 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        style={{ backgroundColor: BRAND.panel, borderRight: `1px solid ${BRAND.panelLight}` }}
      >
        <div className="p-6 flex items-center justify-between" style={{ borderBottom: `1px solid ${BRAND.panelLight}` }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold shadow-lg" style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}>H</div>
            <div>
              <h2 className="font-bold text-white text-lg leading-tight tracking-wide">HOLORA</h2>
              <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: BRAND.accent }}>Performance</p>
            </div>
          </div>
          <button className="lg:hidden text-slate-400 hover:text-white" onClick={onClose}><X size={24} /></button>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar">
          {GROUPS.map(({ key, label }) => (
            <div key={key}>
              <p className="text-xs font-bold uppercase tracking-widest mb-2 mt-4 first:mt-0 px-3 text-slate-500">{label}</p>
              {NAV.filter(n => n.group === key).map(({ id, label: navLabel, icon: Icon }) => (
                <button key={id} onClick={() => { onSelect(id); onClose(); }}
                  className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl transition-all duration-200"
                  style={{ backgroundColor: active === id ? BRAND.primary : 'transparent', color: active === id ? '#fff' : BRAND.textMuted }}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} style={{ color: active === id ? BRAND.accent : 'inherit' }} />
                    <span className="font-medium text-sm">{navLabel}</span>
                  </div>
                  {id === "moderation" && pendingReports > 0 && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{pendingReports}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4" style={{ borderTop: `1px solid ${BRAND.panelLight}` }}>
          <button onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors">
            <LogOut size={19} /><span className="font-medium text-sm">Secure Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
export { NAV };
