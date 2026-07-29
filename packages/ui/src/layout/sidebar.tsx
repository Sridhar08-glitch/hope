"use client";

import { LogOut } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  group: string;
}

export interface NavGroup {
  key: string;
  label: string;
}

interface SidebarProps {
  nav: NavItem[];
  groups: NavGroup[];
  active: string;
  onSelect: (id: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  badges?: Record<string, number>;
  /** "static" = flex child in layout, "overlay" = fixed drawer with backdrop */
  mode?: "static" | "overlay";
}

const SIDEBAR_BG = "rgba(13, 10, 25, 0.95)";
const BORDER_COLOR = "rgba(255, 255, 255, 0.06)";

export function Sidebar({
  nav,
  groups,
  active,
  onSelect,
  onLogout,
  isOpen,
  onClose,
  collapsed = false,
  onToggleCollapse,
  badges = {},
  mode = "static",
}: SidebarProps) {
  const isOverlay = mode === "overlay";
  const isCollapsed = isOverlay ? false : collapsed;
  const sidebarWidth = isCollapsed ? 72 : 280;

  /* ── nav item click handler ── */
  function handleSelect(id: string) {
    onSelect(id);
    if (isOverlay) onClose();
  }

  /* ── nav content ── */
  const navContent = (
    <>
      {/* Logo header */}
      <div
        className={`h-14 flex items-center shrink-0 ${isCollapsed ? "justify-center px-0" : "px-5 gap-3"}`}
        style={{ borderBottom: `1px solid ${BORDER_COLOR}` }}
      >
        <img
          src="/assets/logo.png"
          alt="Holora"
          className={`rounded-lg object-contain shrink-0 ${isCollapsed ? "w-8 h-8" : "h-10 w-auto"}`}
        />
      </div>

      {/* Navigation — scrollable (overflow-visible when collapsed so tooltips aren't clipped) */}
      <div className={`flex-1 py-4 px-2 flex flex-col gap-1 min-h-0 sidebar-scroll ${isCollapsed ? "overflow-y-visible" : "overflow-y-auto"}`}>
        {groups.map(({ key, label }, groupIdx) => {
          const items = nav.filter((n) => n.group === key);
          if (items.length === 0) return null;
          return (
            <div key={key}>
              {/* Group separator/label */}
              {groupIdx > 0 && (
                <div className={`h-px my-3 ${isCollapsed ? "mx-2" : "mx-3"}`} style={{ backgroundColor: BORDER_COLOR }} />
              )}
              {!isCollapsed && (
                <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-[0.1em] mb-1.5 px-3">
                  {label}
                </h4>
              )}
              <div className="space-y-0.5">
                {items.map(({ id, label: navLabel, icon: Icon }) => {
                  const isActive = active === id;
                  const badgeCount = badges[id] || 0;

                  if (isCollapsed) {
                    return (
                      <div key={id} className="relative group">
                        <button
                          onClick={() => handleSelect(id)}
                          className={`w-full flex items-center justify-center py-2.5 rounded-lg relative transition-all duration-150 ${
                            isActive
                              ? "text-white"
                              : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                          }`}
                          style={isActive ? { backgroundColor: "rgba(126, 34, 206, 0.1)" } : undefined}
                          aria-current={isActive ? "page" : undefined}
                          aria-label={navLabel}
                        >
                          {isActive && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ backgroundColor: "#7E22CE" }} />
                          )}
                          <Icon size={18} />
                          {badgeCount > 0 && (
                            <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-red-500" />
                          )}
                        </button>
                        {/* Tooltip */}
                        <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-md text-xs font-medium text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none z-[60]"
                          style={{ backgroundColor: "#1e1b2e", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
                          {navLabel}
                          {badgeCount > 0 && (
                            <span className="ml-2 text-[10px] text-red-400">({badgeCount})</span>
                          )}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={id}
                      onClick={() => handleSelect(id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] relative transition-all duration-150 ${
                        isActive
                          ? "text-white font-medium"
                          : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-200"
                      }`}
                      style={isActive ? { backgroundColor: "rgba(126, 34, 206, 0.1)" } : undefined}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full" style={{ backgroundColor: "#7E22CE" }} />
                      )}
                      <div className="flex items-center gap-3">
                        <Icon size={16} />
                        <span>{navLabel}</span>
                      </div>
                      {badgeCount > 0 && (
                        <span className="text-[10px] font-bold bg-red-500/15 text-red-400 px-1.5 py-0.5 rounded-full border border-red-500/20">
                          {badgeCount > 99 ? "99+" : badgeCount}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Logout — pinned to bottom */}
      <div className="px-2 py-3 shrink-0" style={{ borderTop: `1px solid ${BORDER_COLOR}` }}>
        {isCollapsed ? (
          <div className="relative group">
            <button
              onClick={onLogout}
              className="w-full flex items-center justify-center py-2.5 rounded-lg text-slate-400 hover:bg-red-500/8 hover:text-red-400 transition-colors"
              aria-label="Logout"
            >
              <LogOut size={16} />
            </button>
            <div className="absolute left-full top-1/2 -translate-y-1/2 ml-3 px-2.5 py-1.5 rounded-md text-xs font-medium text-white whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-150 pointer-events-none z-[60]"
              style={{ backgroundColor: "#1e1b2e", border: "1px solid rgba(255,255,255,0.1)", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
              Logout
            </div>
          </div>
        ) : (
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] text-slate-400 hover:bg-red-500/8 hover:text-red-400 transition-colors"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        )}
      </div>
    </>
  );

  /* ── OVERLAY mode (mobile/tablet drawer) ── */
  if (isOverlay) {
    return (
      <>
        {isOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40"
            style={{ backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)" }}
            onClick={onClose}
          />
        )}
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[280px] flex flex-col transition-transform duration-300 ease-in-out ${
            isOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{
            backgroundColor: SIDEBAR_BG,
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderRight: `1px solid ${BORDER_COLOR}`,
          }}
        >
          {navContent}
        </aside>
        <style dangerouslySetInnerHTML={{ __html: `
          .sidebar-scroll::-webkit-scrollbar { width: 3px; }
          .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
          .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.15); border-radius: 4px; }
          .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.3); }
        `}} />
      </>
    );
  }

  /* ── STATIC mode (desktop flex child) ── */
  return (
    <>
      <aside
        className="flex flex-col shrink-0 transition-[width] duration-300 ease-in-out overflow-visible"
        style={{
          width: sidebarWidth,
          backgroundColor: SIDEBAR_BG,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRight: `1px solid ${BORDER_COLOR}`,
        }}
      >
        {navContent}
      </aside>
      <style dangerouslySetInnerHTML={{ __html: `
        .sidebar-scroll::-webkit-scrollbar { width: 3px; }
        .sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .sidebar-scroll::-webkit-scrollbar-thumb { background: rgba(100,116,139,0.15); border-radius: 4px; }
        .sidebar-scroll::-webkit-scrollbar-thumb:hover { background: rgba(100,116,139,0.3); }
      `}} />
    </>
  );
}
