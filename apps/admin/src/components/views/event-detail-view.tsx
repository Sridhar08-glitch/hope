"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Calendar, MapPin, Users, Tag, Check, X } from "lucide-react";
import { BRAND, Spinner } from "@holora/ui";
import type { ApiClient } from "@holora/api-client";
import {
  fadeUp,
  cardStyle,
  subtleBorder,
  PageHeader,
  StatusBadge,
  PrimaryButton,
  GhostButton,
  Modal,
  FormField,
  inputStyle,
} from "@/components/shared";

/* ── Types ──────────────────────────────────────── */

interface EventData {
  id: string;
  title?: string;
  description?: string;
  organizer_name?: string;
  organizer?: string;
  event_date?: string;
  location?: string;
  category_name?: string;
  category?: string;
  status?: string;
  max_participants?: number;
  current_participants_count?: number;
  created_at?: string;
  updated_at?: string;
}

interface EventDetailViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
  eventId: string;
  onBack: () => void;
}

/* ── Info Card Helper ───────────────────────────── */

function InfoCard({ icon: Icon, label, value }: { icon: typeof Calendar; label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg p-3 flex items-start gap-3" style={cardStyle}>
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${BRAND.primary}12` }}
      >
        <Icon size={14} style={{ color: BRAND.accent }} />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: BRAND.textDim }}>{label}</p>
        <p className="text-[12px] mt-0.5 break-words" style={{ color: BRAND.textMain }}>{value || "\u2014"}</p>
      </div>
    </div>
  );
}

/* ── Main Component ─────────────────────────────── */

export default function EventDetailView({ api, showToast, eventId, onBack }: EventDetailViewProps) {
  const [event, setEvent] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectModal, setRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    api
      .get<EventData | { data: EventData }>(`/admin/events/${eventId}/`)
      .then((d) => {
        const ev = (d as { data?: EventData }).data || (d as EventData);
        setEvent(ev);
      })
      .catch((e: unknown) =>
        showToast(
          e instanceof Error ? e.message : "Failed to load event",
          "error",
        ),
      )
      .finally(() => setLoading(false));
  }, [api, eventId, showToast]);

  /* ── Actions ─────────────────────────────────── */

  async function approve() {
    try {
      await api.post(`/admin/events/${eventId}/approve/`);
      showToast("Event approved", "success");
      setEvent((ev) => (ev ? { ...ev, status: "approved" } : ev));
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Approve failed", "error");
    }
  }

  async function doReject() {
    try {
      await api.post(`/admin/events/${eventId}/reject/`, { reason: rejectReason });
      showToast("Event rejected", "success");
      setRejectModal(false);
      setRejectReason("");
      setEvent((ev) => (ev ? { ...ev, status: "rejected" } : ev));
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Reject failed", "error");
    }
  }

  /* ── Render ──────────────────────────────────── */

  return (
    <div className="space-y-4">
      {/* Header with back button */}
      <PageHeader title="Event Detail" subtitle={event?.title || "Loading..."}>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium transition hover:bg-white/5"
          style={{ color: BRAND.textMuted }}
        >
          <ArrowLeft size={13} />
          Back
        </button>
      </PageHeader>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !event ? (
        <div className="text-center py-10 rounded-xl" style={cardStyle}>
          <p className="text-[12px]" style={{ color: BRAND.textDim }}>Event not found.</p>
        </div>
      ) : (
        <>
          {/* Status + Actions Bar */}
          <motion.div
            custom={1}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="flex items-center justify-between rounded-lg px-4 py-3"
            style={cardStyle}
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px]" style={{ color: BRAND.textDim }}>Status:</span>
              <StatusBadge status={event.status || "unknown"} />
            </div>
            {event.status === "pending" && (
              <div className="flex items-center gap-2">
                <button
                  onClick={approve}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition hover:opacity-80"
                  style={{ backgroundColor: `${BRAND.success}18`, color: BRAND.success }}
                >
                  <Check size={12} />
                  Approve
                </button>
                <button
                  onClick={() => setRejectModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition hover:opacity-80"
                  style={{ backgroundColor: `${BRAND.error}18`, color: BRAND.error }}
                >
                  <X size={12} />
                  Reject
                </button>
              </div>
            )}
          </motion.div>

          {/* Info Cards Grid */}
          <motion.div
            custom={2}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3"
          >
            <InfoCard icon={Calendar} label="Event Date" value={event.event_date ? new Date(event.event_date).toLocaleString() : null} />
            <InfoCard icon={MapPin} label="Location" value={event.location} />
            <InfoCard icon={Tag} label="Category" value={event.category_name || event.category} />
            <InfoCard icon={Users} label="Organizer" value={event.organizer_name || event.organizer} />
            <InfoCard
              icon={Users}
              label="Participants"
              value={
                event.max_participants != null
                  ? `${event.current_participants_count ?? 0} / ${event.max_participants}`
                  : event.current_participants_count != null
                    ? String(event.current_participants_count)
                    : null
              }
            />
            <InfoCard icon={Calendar} label="Created" value={event.created_at ? new Date(event.created_at).toLocaleString() : null} />
          </motion.div>

          {/* Description */}
          {event.description && (
            <motion.div custom={3} variants={fadeUp} initial="hidden" animate="visible" className="rounded-lg p-4" style={cardStyle}>
              <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: BRAND.textDim }}>Description</p>
              <p className="text-[12px] leading-relaxed whitespace-pre-wrap" style={{ color: BRAND.textMain }}>{event.description}</p>
            </motion.div>
          )}

          {/* Updated at */}
          {event.updated_at && (
            <motion.div custom={4} variants={fadeUp} initial="hidden" animate="visible">
              <p className="text-[10px]" style={{ color: BRAND.textDim }}>
                Last updated: {new Date(event.updated_at).toLocaleString()}
              </p>
            </motion.div>
          )}
        </>
      )}

      {/* Reject Modal */}
      {rejectModal && (
        <Modal title="Reject Event" onClose={() => { setRejectModal(false); setRejectReason(""); }}>
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
              <GhostButton onClick={() => { setRejectModal(false); setRejectReason(""); }}>Cancel</GhostButton>
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
    </div>
  );
}
