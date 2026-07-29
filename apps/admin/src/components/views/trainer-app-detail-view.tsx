"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, User, Briefcase, DollarSign, Calendar, FileText } from "lucide-react";
import { BRAND, Spinner } from "@holora/ui";
import { motion } from "framer-motion";
import type { ApiClient } from "@holora/api-client";
import {
  PageHeader,
  TabBar,
  StatusBadge,
  fadeUp,
  cardStyle,
  subtleBorder,
} from "@/components/shared";

/* ── Types ─────────────────────────────────────────── */

interface AppData {
  id: string;
  full_name?: string;
  user_name?: string;
  email?: string;
  status?: string;
  profile_image?: string;
  phone?: string;
  nationality?: string;
  country?: string;
  city?: string;
  experience?: number;
  bio?: string;
  primary_specialty?: string;
  secondary_specialties?: string[] | string;
  languages?: string[] | string;
  supports_gym_training?: boolean;
  gym_session_price?: number;
  supports_virtual_training?: boolean;
  virtual_session_price?: number;
  supports_home_training?: boolean;
  home_training_price?: number;
  supports_training_plan?: boolean;
  training_plan_price?: number;
  schedule?: Record<string, string[] | unknown>;
  created_at?: string;
  updated_at?: string;
  rejection_reason?: string;
  certificates?: string;
}

interface TrainerAppDetailViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
  appId: string;
  onBack: () => void;
}

type Tab = "personal" | "expertise" | "services" | "schedule" | "other";

/* ── Row helper ────────────────────────────────────── */

function Row({ label, value }: { label: string; value?: unknown }) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="flex justify-between items-start py-2.5" style={{ borderBottom: subtleBorder }}>
      <span className="text-[10px] font-medium uppercase tracking-wider shrink-0 w-40" style={{ color: BRAND.textDim }}>{label}</span>
      <span className="text-[12px] text-right break-all" style={{ color: BRAND.textMain }}>{String(value)}</span>
    </div>
  );
}

/* ── Main View ─────────────────────────────────────── */

export default function TrainerAppDetailView({ api, showToast, appId, onBack }: TrainerAppDetailViewProps) {
  const [data, setData] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("personal");

  useEffect(() => {
    setLoading(true);
    api
      .get<AppData>(`/admin/trainers/applications/${appId}/`)
      .then(setData)
      .catch((err: unknown) => {
        showToast(err instanceof Error ? err.message : "Failed to load application", "error");
        onBack();
      })
      .finally(() => setLoading(false));
  }, [api, appId, onBack, showToast]);

  const tabs: { key: Tab; label: string; icon: typeof User }[] = [
    { key: "personal", label: "Personal", icon: User },
    { key: "expertise", label: "Expertise", icon: Briefcase },
    { key: "services", label: "Services", icon: DollarSign },
    { key: "schedule", label: "Schedule", icon: Calendar },
    { key: "other", label: "Other", icon: FileText },
  ];

  if (loading) return <Spinner />;
  if (!data) return null;

  return (
    <div className="space-y-5">
      {/* Back + header */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-md hover:bg-white/5 transition" aria-label="Back">
          <ChevronLeft size={18} style={{ color: BRAND.textMuted }} />
        </button>
        <span className="text-[11px]" style={{ color: BRAND.textMuted }}>Back to Applications</span>
      </motion.div>

      {/* Profile card */}
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl p-5" style={cardStyle}>
        <div className="flex items-center gap-4 pb-4 mb-4" style={{ borderBottom: subtleBorder }}>
          {data.profile_image ? (
            <img src={data.profile_image} alt="" className="w-16 h-16 rounded-full object-cover" style={{ border: `2px solid ${BRAND.primary}` }} />
          ) : (
            <div className="w-16 h-16 rounded-full flex items-center justify-center text-xl font-bold" style={{ backgroundColor: BRAND.primary, color: BRAND.accent }}>
              {(data.full_name || "?")[0]}
            </div>
          )}
          <div>
            <h2 className="text-[13px] font-semibold" style={{ color: BRAND.textMain }}>{data.full_name || data.user_name || "\u2014"}</h2>
            <p className="text-[11px] mt-0.5" style={{ color: BRAND.textDim }}>{data.email}</p>
            <div className="mt-1.5"><StatusBadge status={data.status || "pending"} /></div>
          </div>
        </div>

        <TabBar tabs={tabs} active={tab} onChange={setTab} />

        <div className="mt-4 rounded-lg p-4" style={{ backgroundColor: `${BRAND.surface}80` }}>
          {tab === "personal" && (
            <>
              <Row label="Phone" value={data.phone} />
              <Row label="Nationality" value={data.nationality} />
              <Row label="Country" value={data.country} />
              <Row label="City" value={data.city} />
              <Row label="Experience" value={data.experience !== undefined ? `${data.experience} years` : undefined} />
              {data.bio && (
                <div className="mt-3 pt-3" style={{ borderTop: subtleBorder }}>
                  <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: BRAND.textDim }}>Bio</p>
                  <p className="text-[12px] leading-relaxed" style={{ color: BRAND.textMain }}>{data.bio}</p>
                </div>
              )}
            </>
          )}

          {tab === "expertise" && (
            <>
              <Row label="Primary Specialty" value={data.primary_specialty} />
              <Row label="Secondary Specialties" value={Array.isArray(data.secondary_specialties) ? data.secondary_specialties.join(", ") : data.secondary_specialties} />
              <Row label="Languages" value={Array.isArray(data.languages) ? data.languages.join(", ") : data.languages} />
            </>
          )}

          {tab === "services" && (
            <>
              <Row label="Gym Training" value={data.supports_gym_training !== undefined ? (data.supports_gym_training ? "Yes" : "No") : undefined} />
              <Row label="Gym Session Price" value={data.gym_session_price !== undefined ? `${data.gym_session_price} QAR` : undefined} />
              <Row label="Virtual Training" value={data.supports_virtual_training !== undefined ? (data.supports_virtual_training ? "Yes" : "No") : undefined} />
              <Row label="Virtual Session Price" value={data.virtual_session_price !== undefined ? `${data.virtual_session_price} QAR` : undefined} />
              <Row label="Home Training" value={data.supports_home_training !== undefined ? (data.supports_home_training ? "Yes" : "No") : undefined} />
              <Row label="Home Training Price" value={data.home_training_price !== undefined ? `${data.home_training_price} QAR` : undefined} />
              <Row label="Training Plans" value={data.supports_training_plan !== undefined ? (data.supports_training_plan ? "Yes" : "No") : undefined} />
              <Row label="Training Plan Price" value={data.training_plan_price !== undefined ? `${data.training_plan_price} QAR` : undefined} />
            </>
          )}

          {tab === "schedule" && (
            data.schedule && Object.keys(data.schedule).length > 0 ? (
              Object.entries(data.schedule).map(([day, hours]) => (
                <Row key={day} label={day.charAt(0).toUpperCase() + day.slice(1)} value={Array.isArray(hours) ? `${hours[0]} \u2013 ${hours[1]}` : JSON.stringify(hours)} />
              ))
            ) : (
              <p className="text-[11px]" style={{ color: BRAND.textDim }}>No schedule provided.</p>
            )
          )}

          {tab === "other" && (
            <>
              <Row label="Submitted" value={data.created_at ? new Date(data.created_at).toLocaleString() : undefined} />
              <Row label="Updated" value={data.updated_at ? new Date(data.updated_at).toLocaleString() : undefined} />
              {data.rejection_reason && (
                <div className="mt-3 pt-3" style={{ borderTop: subtleBorder }}>
                  <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: BRAND.textDim }}>Rejection Reason</p>
                  <p className="text-[12px]" style={{ color: BRAND.error }}>{data.rejection_reason}</p>
                </div>
              )}
              {data.certificates && (
                <div className="mt-3 pt-3" style={{ borderTop: subtleBorder }}>
                  <a href={data.certificates} target="_blank" rel="noreferrer" className="text-[12px] underline" style={{ color: BRAND.accent }}>
                    View Certificates
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
