"use client";

import { Menu, Bell, Search } from "lucide-react";
import { BRAND } from "../theme";
import type { NavItem } from "./sidebar";

interface HeaderProps {
  section: string;
  nav: NavItem[];
  breadcrumbPrefix?: string;
  pendingReports?: number;
  user?: {
    first_name?: string;
    email?: string;
    role?: string;
  } | null;
  onMenuClick: () => void;
}

export function Header({
  section,
  nav,
  breadcrumbPrefix = "Admin",
  pendingReports = 0,
  user,
  onMenuClick,
}: HeaderProps) {
  const initials = (
    user?.first_name?.[0] ||
    user?.email?.[0] ||
    "U"
  ).toUpperCase();

  return (
    <header
      className="h-16 flex items-center justify-between px-6 md:px-8 sticky top-0 z-10 shrink-0"
      style={{
        background: "rgba(15, 23, 42, 0.5)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(30, 41, 59, 0.5)",
      }}
    >
      {/* Left: Hamburger + Search */}
      <div className="flex items-center gap-4">
        <button
          className="lg:hidden text-slate-400 hover:text-white transition"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>

        <div className="relative w-80 hidden md:block">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Search... (Cmd+K)"
            className="w-full rounded-full pl-9 pr-4 py-1.5 text-sm text-white placeholder-slate-500 outline-none"
            style={{
              backgroundColor: "rgba(15, 23, 42, 0.8)",
              border: "1px solid rgba(51, 65, 85, 0.6)",
            }}
            onFocus={(e) => { e.currentTarget.style.borderColor = "#10b981"; }}
            onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(51, 65, 85, 0.6)"; }}
          />
        </div>
      </div>

      {/* Right: Bell + User */}
      <div className="flex items-center gap-5">
        <button className="relative text-slate-400 hover:text-white transition" aria-label="Notifications">
          <Bell size={18} />
          {pendingReports > 0 && (
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" style={{ border: "2px solid rgba(15, 23, 42, 1)" }} />
          )}
        </button>

        <div className="h-6 w-px bg-slate-800" />

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-medium text-slate-400">
            {initials}
          </div>
          <div className="text-sm hidden sm:block">
            <p className="font-medium text-white leading-none">
              {user?.first_name || user?.email?.split("@")[0] || "Admin"}
            </p>
            <p className="text-slate-500 text-xs mt-0.5">
              {user?.role || "admin"}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}
