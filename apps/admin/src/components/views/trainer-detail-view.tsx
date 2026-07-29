"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Star, MapPin, Mail, Phone, Calendar, Award, Globe } from "lucide-react";
import { BRAND, Spinner } from "@holora/ui";
import type { ApiClient } from "@holora/api-client";
import { fadeUp, cardStyle, StatusBadge, TabBar } from "@/components/shared";

interface Trainer {
  id: string;
  user_name?: string;
  full_name?: string;
  name?: string;
  email?: string;
  phone?: string;
  bio?: string;
  location?: string;
  is_verified?: boolean;
  is_featured?: boolean;
  is_active?: boolean;
  created_at?: string;
  primary_specialty?: string;
  secondary_specialties?: string[] | string;
  certifications?: string[] | string;
  years_of_experience?: number;
  languages?: string[] | string;
  session_types?: string[] | string;
  hourly_rate?: number;
  gym_session_price?: number;
  virtual_session_price?: number;
  rating?: number;
  total_reviews?: number;
  total_bookings?: number;
  total_earnings?: number;
  total_clients?: number;
}

interface ViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
  trainerId: string;
  onBack?: () => void;
}

function InfoRow({ label, value, icon: Icon }: { label: string; value: React.ReactNode; icon?: typeof Mail }) {
  return (
    <div className="flex items-start gap-3 py-2.5" style={{ borderBottom: `1px solid rgba(126,34,206,0.05)` }}>
      {Icon && <Icon size={13} className="mt-0.5 shrink-0" style={{ color: BRAND.textDim }} />}
      <div className="flex-1 min-w-0">
        <p className="text-[10px] uppercase tracking-wider" style={{ color: BRAND.textDim }}>{label}</p>
        <p className="text-[12px] mt-0.5" style={{ color: BRAND.textMain }}>{value || "—"}</p>
      </div>
    </div>
  );
}

function arrayToString(val: string[] | string | undefined): string {
  if (!val) return "—";
  if (Array.isArray(val)) return val.join(", ") || "—";
  return val;
}

export default function TrainerDetailView({ api, showToast, trainerId, onBack }: ViewProps) {
  const [trainer, setTrainer] = useState<Trainer | null>(null);
  const [loading, setLoading] = useState(true);
  type Tab = "personal" | "expertise" | "services" | "stats";
  const [tab, setTab] = useState<Tab>("personal");

  useEffect(() => {
    setLoading(true);
    api.get<Trainer>(`/admin/trainers/${trainerId}/`)
      .then(setTrainer)
      .catch(err => showToast(err instanceof Error ? err.message : "Failed to load trainer", "error"))
      .finally(() => setLoading(false));
  }, [api, trainerId, showToast]);

  if (loading) return <div className="flex justify-center py-12"><Spinner /></div>;
  if (!trainer) return <p className="text-center py-12 text-[13px]" style={{ color: BRAND.textDim }}>Trainer not found</p>;

  const name = trainer.full_name || trainer.name || trainer.user_name || "Trainer";

  return (
    <div className="space-y-4">
      {/* Back + Name */}
      <motion.div custom={0} variants={fadeUp} initial="hidden" animate="visible" className="flex items-center gap-3">
        {onBack && (
          <button onClick={onBack} className="p-1.5 rounded-lg hover:bg-white/5 transition" aria-label="Back">
            <ArrowLeft size={16} style={{ color: BRAND.textMuted }} />
          </button>
        )}
        <div>
          <h1 className="text-xl font-semibold" style={{ color: BRAND.textMain }}>{name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            {trainer.is_verified && <StatusBadge status="Verified" color={BRAND.success} />}
            {trainer.is_featured && <StatusBadge status="Featured" color={BRAND.accent} />}
            <StatusBadge status={trainer.is_active ? "Active" : "Inactive"} />
          </div>
        </div>
      </motion.div>

      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <TabBar
          tabs={[
            { key: "personal" as Tab, label: "Personal" },
            { key: "expertise" as Tab, label: "Expertise" },
            { key: "services" as Tab, label: "Services" },
            { key: "stats" as Tab, label: "Stats" },
          ]}
          active={tab}
          onChange={setTab}
        />
      </motion.div>

      <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible" className="rounded-xl p-4" style={cardStyle}>
        {tab === "personal" && (
          <div>
            <InfoRow label="Email" value={trainer.email} icon={Mail} />
            <InfoRow label="Phone" value={trainer.phone} icon={Phone} />
            <InfoRow label="Location" value={trainer.location} icon={MapPin} />
            <InfoRow label="Joined" value={trainer.created_at ? new Date(trainer.created_at).toLocaleDateString() : undefined} icon={Calendar} />
            {trainer.bio && <div className="mt-3"><p className="text-[10px] uppercase tracking-wider mb-1" style={{ color: BRAND.textDim }}>Bio</p><p className="text-[12px] leading-relaxed" style={{ color: BRAND.textMuted }}>{trainer.bio}</p></div>}
          </div>
        )}
        {tab === "expertise" && (
          <div>
            <InfoRow label="Primary Specialty" value={trainer.primary_specialty} icon={Award} />
            <InfoRow label="Secondary Specialties" value={arrayToString(trainer.secondary_specialties)} />
            <InfoRow label="Certifications" value={arrayToString(trainer.certifications)} icon={Award} />
            <InfoRow label="Experience" value={trainer.years_of_experience ? `${trainer.years_of_experience} years` : undefined} />
            <InfoRow label="Languages" value={arrayToString(trainer.languages)} icon={Globe} />
          </div>
        )}
        {tab === "services" && (
          <div>
            <InfoRow label="Session Types" value={arrayToString(trainer.session_types)} />
            <InfoRow label="Hourly Rate" value={trainer.hourly_rate ? `$${trainer.hourly_rate}` : undefined} />
            <InfoRow label="Gym Session" value={trainer.gym_session_price ? `$${trainer.gym_session_price}` : undefined} />
            <InfoRow label="Virtual Session" value={trainer.virtual_session_price ? `$${trainer.virtual_session_price}` : undefined} />
          </div>
        )}
        {tab === "stats" && (
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg p-3" style={{ backgroundColor: `${BRAND.accent}08` }}>
              <div className="flex items-center gap-1 mb-1"><Star size={12} style={{ color: BRAND.accent }} /><span className="text-[10px]" style={{ color: BRAND.textDim }}>Rating</span></div>
              <p className="text-[18px] font-bold" style={{ color: BRAND.accent }}>{trainer.rating?.toFixed(1) ?? "—"}</p>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: `${BRAND.info}08` }}>
              <p className="text-[10px] mb-1" style={{ color: BRAND.textDim }}>Total Reviews</p>
              <p className="text-[18px] font-bold" style={{ color: BRAND.textMain }}>{trainer.total_reviews ?? 0}</p>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: `${BRAND.success}08` }}>
              <p className="text-[10px] mb-1" style={{ color: BRAND.textDim }}>Bookings</p>
              <p className="text-[18px] font-bold" style={{ color: BRAND.textMain }}>{trainer.total_bookings ?? 0}</p>
            </div>
            <div className="rounded-lg p-3" style={{ backgroundColor: `${BRAND.primary}08` }}>
              <p className="text-[10px] mb-1" style={{ color: BRAND.textDim }}>Earnings</p>
              <p className="text-[18px] font-bold" style={{ color: BRAND.textMain }}>${trainer.total_earnings ?? 0}</p>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
