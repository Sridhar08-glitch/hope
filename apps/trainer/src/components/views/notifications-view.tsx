"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { Bell } from "lucide-react";
import { Spinner } from "@holora/ui";

interface NotificationsViewProps {
  notifications: any[];
  unreadCount: number;
  loading: boolean;
  onMarkAllRead: () => void;
  onMarkRead: (notif: any) => void;
}

export function NotificationsView({
  notifications,
  unreadCount,
  loading,
  onMarkAllRead,
  onMarkRead,
}: NotificationsViewProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#281247] p-4 rounded-3xl border border-purple-900/40 shadow-lg">
        <div>
          <h2 className="text-xl font-bold text-white px-2">
            Notifications{" "}
            {unreadCount > 0 && (
              <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full ml-2">
                {unreadCount} unread
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-500 px-2 mt-1">
            All your alerts and updates in one place.
          </p>
        </div>
        <div className="flex gap-2">
          {notifications.length > 0 && (
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 px-4 py-2 rounded-xl text-sm font-bold transition"
            >
              Mark All Read
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : notifications.length === 0 ? (
        <div className="bg-[#281247] border border-purple-900/40 rounded-3xl p-12 shadow-xl text-center">
          <Bell size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400 text-lg">No notifications yet</p>
          <p className="text-slate-500 text-sm mt-2">
            You&apos;ll see updates about bookings, payments, and more here.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              onClick={() => onMarkRead(notif)}
              className="bg-[#281247] border border-purple-900/40 rounded-3xl p-6 shadow-xl hover:border-purple-600/60 transition-all cursor-pointer"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-600/20 rounded-2xl flex-shrink-0">
                  <Bell size={20} className="text-yellow-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-white font-bold text-base mb-1">{notif.title}</h3>
                      <p className="text-slate-400 text-sm">{notif.message}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs text-slate-500 bg-purple-900/40 px-3 py-1 rounded-full">
                          {notif.notification_type?.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs text-slate-600">
                          {new Date(notif.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    {!notif.is_read &&
                      !notif.read_at?.toString().trim() &&
                      notif.status !== "read" &&
                      notif.status !== "clicked" && (
                        <div className="w-3 h-3 bg-yellow-400 rounded-full flex-shrink-0 mt-1" />
                      )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
