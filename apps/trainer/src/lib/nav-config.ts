"use client";

import {
  LayoutDashboard,
  CalendarDays,
  Users,
  MessageSquare,
  Bell,
  Clock,
  CreditCard,
  Briefcase,
  Settings,
  MonitorPlay,
  Film,
  Upload,
  BarChart3,
  ListVideo,
  MessageCircle,
  ClipboardList,
} from "lucide-react";
import type { NavItem, NavGroup } from "@holora/ui";

export const NAV_ITEMS: NavItem[] = [
  // Main menu
  { id: "dashboard",     icon: LayoutDashboard, label: "Dashboard",         group: "main" },
  { id: "bookings",      icon: CalendarDays,    label: "Bookings",          group: "main" },
  { id: "clients",       icon: Users,           label: "Clients",           group: "main" },
  { id: "coaching",      icon: ClipboardList,   label: "Coaching",          group: "main" },
  { id: "messages",      icon: MessageSquare,   label: "Chat & Community",  group: "main" },
  { id: "availability",  icon: Clock,           label: "Availability",      group: "main" },
  // Video Studio
  { id: "studio-dashboard", icon: MonitorPlay,  label: "Studio",            group: "studio" },
  { id: "my-videos",        icon: Film,         label: "My Videos",         group: "studio" },
  { id: "upload-video",     icon: Upload,       label: "Upload Video",      group: "studio" },
  { id: "video-analytics",  icon: BarChart3,    label: "Analytics",         group: "studio" },
  { id: "programs",         icon: ListVideo,    label: "Programs",          group: "studio" },
  { id: "comments",         icon: MessageCircle,label: "Comments",          group: "studio" },
  // Business
  { id: "notifications", icon: Bell,            label: "Notifications",     group: "business" },
  { id: "finance",       icon: CreditCard,      label: "Earnings & Payouts", group: "business" },
  { id: "business",      icon: Briefcase,       label: "Subscriptions",     group: "business" },
  { id: "settings",      icon: Settings,        label: "Profile",           group: "business" },
];

export const NAV_GROUPS: NavGroup[] = [
  { key: "main",     label: "Main Menu" },
  { key: "studio",   label: "Video Studio" },
  { key: "business", label: "Business" },
];

export type TabId =
  | "dashboard"
  | "bookings"
  | "clients"
  | "coaching"
  | "messages"
  | "notifications"
  | "availability"
  | "finance"
  | "business"
  | "settings"
  | "studio-dashboard"
  | "my-videos"
  | "upload-video"
  | "video-analytics"
  | "programs"
  | "comments";
