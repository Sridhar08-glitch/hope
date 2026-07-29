"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Eye, Check, X, Edit, Trash2, Calendar } from "lucide-react";
import { BRAND, Spinner } from "@holora/ui";
import type { ApiClient } from "@holora/api-client";
import {
  fadeUp,
  cardStyle,
  subtleBorder,
  PageHeader,
  TabBar,
  Modal,
  ConfirmDialog,
  EmptyState,
  DataTable,
  TR,
  TD,
  SimplePagination,
  PrimaryButton,
  GhostButton,
  FormField,
  StatusBadge,
  inputStyle,
} from "@/components/shared";
import EventDetailView from "./event-detail-view";

/* ── Types ──────────────────────────────────────── */

interface EventItem {
  id: string;
  title: string;
  description?: string;
  event_date?: string;
  organizer_name?: string;
  organizer?: string;
  status: string;
}

interface EventsViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
}

/* ── Status Tabs ────────────────────────────────── */

type StatusKey = "" | "pending" | "approved" | "rejected";

const STATUS_TABS: { key: StatusKey; label: string }[] = [
  { key: "", label: "All" },
  { key: "pending", label: "Pending" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
];

/* ── Main Component ─────────────────────────────── */

export default function EventsView({ api, showToast }: EventsViewProps) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusKey>("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [rejectModal, setRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [confirmDel, setConfirmDel] = useState<string | null>(null);
  const [editEvent, setEditEvent] = useState<EventItem | null>(null);
  const [editForm, setEditForm] = useState<Record<string, string>>({});

  /* ── Data Loading ────────────────────────────── */

  const load = useCallback(
    async (url: string | null = null) => {
      setLoading(true);
      try {
        const params: Record<string, string> = {};
        if (statusFilter) params.status = statusFilter;
        const res: {
          results?: EventItem[];
          next?: string | null;
          previous?: string | null;
        } = url
          ? await api.get(url)
          : await api.get("/admin/events/", params);
        setEvents(res?.results || []);
        setNextUrl(res?.next || null);
        setPrevUrl(res?.previous || null);
      } catch (err: unknown) {
        showToast(
          err instanceof Error ? err.message : "Failed to load events",
          "error",
        );
      } finally {
        setLoading(false);
      }
    },
    [api, statusFilter, showToast],
  );

  useEffect(() => {
    load();
  }, [load]);

  /* ── Selection ───────────────────────────────── */

  function toggleSelect(id: string) {
    setSelectedIds((s) =>
      s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
    );
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked ? events.map((ev) => ev.id) : []);
  }

  /* ── Actions ─────────────────────────────────── */

  async function approve(id: string) {
    try {
      await api.post(`/admin/events/${id}/approve/`);
      showToast("Event approved", "success");
      load();
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Approve failed",
        "error",
      );
    }
  }

  async function doReject() {
    try {
      await api.post(`/admin/events/${rejectModal}/reject/`, {
        reason: rejectReason,
      });
      showToast("Event rejected", "success");
      setRejectModal(null);
      setRejectReason("");
      load();
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Reject failed",
        "error",
      );
    }
  }

  async function doDelete(id: string) {
    try {
      await api.del(`/admin/events/${id}/`);
      showToast("Event deleted", "success");
      setConfirmDel(null);
      load();
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Delete failed",
        "error",
      );
    }
  }

  async function bulkAction(action: string) {
    if (!selectedIds.length) return;
    try {
      await api.post("/admin/events/bulk-action/", {
        ids: selectedIds,
        action,
      });
      showToast(`Bulk ${action} done`, "success");
      setSelectedIds([]);
      load();
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Bulk action failed",
        "error",
      );
    }
  }

  async function saveEvent() {
    if (!editEvent) return;
    try {
      await api.put(`/admin/events/${editEvent.id}/`, editForm);
      showToast("Event updated", "success");
      setEditEvent(null);
      setEditForm({});
      load();
    } catch (err: unknown) {
      showToast(
        err instanceof Error ? err.message : "Update failed",
        "error",
      );
    }
  }

  /* ── Detail drill-down ───────────────────────── */

  if (selectedEventId)
    return (
      <EventDetailView
        api={api}
        showToast={showToast}
        eventId={selectedEventId}
        onBack={() => setSelectedEventId(null)}
      />
    );

  /* ── Render ──────────────────────────────────── */

  return (
    <div className="space-y-4">
      {/* Header */}
      <PageHeader title="Events" subtitle="Approve, reject, and manage platform events">
        <PrimaryButton onClick={() => {}}>Export CSV</PrimaryButton>
      </PageHeader>

      {/* Status filter tabs */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <TabBar tabs={STATUS_TABS} active={statusFilter} onChange={setStatusFilter} />
      </motion.div>

      {/* Bulk actions bar */}
      {selectedIds.length > 0 && (
        <motion.div
          custom={2}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ backgroundColor: `${BRAND.primary}10`, border: subtleBorder }}
        >
          <span className="text-[11px] font-medium" style={{ color: BRAND.textDim }}>
            {selectedIds.length} selected
          </span>
          <button
            onClick={() => bulkAction("approve")}
            className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition hover:opacity-80"
            style={{ backgroundColor: `${BRAND.success}18`, color: BRAND.success }}
          >
            Approve All
          </button>
          <button
            onClick={() => bulkAction("reject")}
            className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition hover:opacity-80"
            style={{ backgroundColor: `${BRAND.error}18`, color: BRAND.error }}
          >
            Reject All
          </button>
          <button
            onClick={() => bulkAction("delete")}
            className="px-2.5 py-1 rounded-md text-[11px] font-semibold transition hover:opacity-80"
            style={{ backgroundColor: `${BRAND.error}18`, color: BRAND.error }}
          >
            Delete All
          </button>
        </motion.div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : events.length === 0 ? (
        <EmptyState icon={Calendar} message="No events found" />
      ) : (
        <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible">
          <DataTable
            cols={[
              "",
              "Date",
              "Title",
              "Organizer",
              "Status",
              "Actions",
            ]}
          >
            {/* Select-all header checkbox */}
            <tr className="hidden">
              <td>
                <input
                  type="checkbox"
                  onChange={(e) => toggleSelectAll(e.target.checked)}
                  checked={selectedIds.length === events.length && events.length > 0}
                />
              </td>
            </tr>

            {events.map((e) => (
              <TR key={e.id}>
                <TD>
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(e.id)}
                    onChange={() => toggleSelect(e.id)}
                    className="accent-purple-500"
                  />
                </TD>
                <TD>
                  <span className="text-[11px]" style={{ color: BRAND.textDim }}>
                    {e.event_date
                      ? new Date(e.event_date).toLocaleDateString()
                      : "\u2014"}
                  </span>
                </TD>
                <TD>
                  <span className="text-[12px] font-semibold" style={{ color: BRAND.textMain }}>
                    {e.title}
                  </span>
                </TD>
                <TD>
                  <span className="text-[11px]" style={{ color: BRAND.textDim }}>
                    {e.organizer_name || e.organizer || "\u2014"}
                  </span>
                </TD>
                <TD>
                  <StatusBadge status={e.status} />
                </TD>
                <TD className="text-right">
                  <div className="flex items-center justify-end gap-0.5">
                    <button
                      onClick={() => setSelectedEventId(e.id)}
                      className="p-1.5 rounded-md hover:bg-white/5 transition"
                      title="View"
                    >
                      <Eye size={13} style={{ color: BRAND.accent }} />
                    </button>
                    {e.status === "pending" && (
                      <button
                        onClick={() => approve(e.id)}
                        className="p-1.5 rounded-md hover:bg-white/5 transition"
                        title="Approve"
                      >
                        <Check size={13} style={{ color: BRAND.success }} />
                      </button>
                    )}
                    {e.status === "pending" && (
                      <button
                        onClick={() => setRejectModal(e.id)}
                        className="p-1.5 rounded-md hover:bg-white/5 transition"
                        title="Reject"
                      >
                        <X size={13} style={{ color: BRAND.error }} />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditEvent(e);
                        setEditForm({
                          title: e.title,
                          description: e.description || "",
                          event_date: e.event_date || "",
                        });
                      }}
                      className="p-1.5 rounded-md hover:bg-white/5 transition"
                      title="Edit"
                    >
                      <Edit size={13} style={{ color: BRAND.textMuted }} />
                    </button>
                    <button
                      onClick={() => setConfirmDel(e.id)}
                      className="p-1.5 rounded-md hover:bg-red-500/5 transition"
                      title="Delete"
                    >
                      <Trash2 size={13} style={{ color: BRAND.error }} />
                    </button>
                  </div>
                </TD>
              </TR>
            ))}
          </DataTable>

          <SimplePagination
            prevUrl={prevUrl}
            nextUrl={nextUrl}
            onPrev={() => load(prevUrl)}
            onNext={() => load(nextUrl)}
            count={events.length}
          />
        </motion.div>
      )}

      {/* Edit Event Modal */}
      {editEvent && (
        <Modal
          title="Edit Event"
          onClose={() => {
            setEditEvent(null);
            setEditForm({});
          }}
        >
          <div className="space-y-3">
            <FormField label="Title">
              <input
                value={editForm.title || ""}
                onChange={(e) => setEditForm((f) => ({ ...f, title: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                style={inputStyle}
              />
            </FormField>
            <FormField label="Event Date">
              <input
                type="date"
                value={editForm.event_date || ""}
                onChange={(e) => setEditForm((f) => ({ ...f, event_date: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                style={inputStyle}
              />
            </FormField>
            <FormField label="Description">
              <textarea
                value={editForm.description || ""}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 rounded-lg text-[12px] outline-none resize-none"
                style={inputStyle}
              />
            </FormField>
            <div className="flex gap-2 justify-end pt-2">
              <GhostButton onClick={() => { setEditEvent(null); setEditForm({}); }}>Cancel</GhostButton>
              <PrimaryButton onClick={saveEvent}>Save</PrimaryButton>
            </div>
          </div>
        </Modal>
      )}

      {/* Reject Event Modal */}
      {rejectModal && (
        <Modal
          title="Reject Event"
          onClose={() => {
            setRejectModal(null);
            setRejectReason("");
          }}
        >
          <div className="space-y-3">
            <FormField label="Reason">
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 rounded-lg text-[12px] outline-none resize-none"
                style={inputStyle}
                placeholder="Describe why this event is being rejected..."
              />
            </FormField>
            <div className="flex gap-2 justify-end pt-2">
              <GhostButton onClick={() => { setRejectModal(null); setRejectReason(""); }}>Cancel</GhostButton>
              <button
                onClick={doReject}
                className="px-3 py-1.5 rounded-lg text-[12px] font-semibold transition hover:opacity-90"
                style={{ backgroundColor: BRAND.error, color: "#fff" }}
              >
                Reject
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {confirmDel && (
        <ConfirmDialog
          message="Delete this event permanently?"
          onConfirm={() => doDelete(confirmDel)}
          onCancel={() => setConfirmDel(null)}
          confirmLabel="Delete"
        />
      )}
    </div>
  );
}
