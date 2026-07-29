import { Menu, ChevronRight, AlertTriangle } from "lucide-react";
import BRAND from "../../constants/brand";
import { NAV } from "./Sidebar";

function Header({ section, pendingReports, user, onMenuClick }) {
  const label = NAV.find(n => n.id === section)?.label || section;
  return (
    <header className="h-20 px-6 flex items-center justify-between border-b z-10 sticky top-0" style={{ borderColor: BRAND.panelLight, backgroundColor: `${BRAND.bg}F2`, backdropFilter: 'blur(10px)' }}>
      <div className="flex items-center">
        <button className="mr-4 lg:hidden text-white" onClick={onMenuClick}><Menu size={24} /></button>
        <div className="hidden md:flex items-center gap-2 text-sm">
          <span className="text-slate-500">Admin Console</span>
          <ChevronRight size={14} className="text-slate-600" />
          <span className="text-white font-medium">{label}</span>
        </div>
      </div>
      <div className="flex items-center gap-5">
        <div className="relative cursor-pointer">
          <AlertTriangle size={20} className="text-slate-400 hover:text-white transition" />
          {pendingReports > 0 && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-red-500"></span>}
        </div>
        <div className="flex items-center gap-3 pl-5" style={{ borderLeft: `1px solid ${BRAND.panelLight}` }}>
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-white">{user?.first_name || user?.email || "Admin"}</p>
            <p className="text-xs" style={{ color: BRAND.accent }}>Superuser</p>
          </div>
          <div className="w-10 h-10 rounded-full p-[2px] shadow-lg" style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.accent})` }}>
            <div className="w-full h-full rounded-full flex items-center justify-center font-bold text-sm text-white" style={{ backgroundColor: BRAND.panel }}>
              {(user?.first_name?.[0] || user?.email?.[0] || "A").toUpperCase()}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
