"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTokenFromUrl } from "@holora/auth";
import { BRAND } from "@holora/ui";
import { CheckCircle } from "lucide-react";
import {
  P,
  STEPS,
  CATEGORIES,
  ALL_COUNTRIES,
  COUNTRY_CITY_MAP,
  ALL_TIMEZONES,
  ALL_CURRENCIES,
  VISIBILITY_PACKS,
} from "../lib/constants";
import { Field } from "./form/field";
import { FInput } from "./form/f-input";
import { FTextarea } from "./form/f-textarea";
import { SearchSelect } from "./form/search-select";
import { ProgressBar } from "./form/progress-bar";
import { Chip } from "./form/chip";

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface EventFormData {
  // Step 1 -- Organizer
  organizer_type: string;
  organizer_display_name: string;
  organizer_email: string;
  organizer_phone: string;
  nationality: string;
  country: string;
  legal_name: string;
  registration_number: string;
  registered_address: string;
  representative_name: string;
  representative_role: string;
  // Step 2 -- Event Details
  title: string;
  category: string;
  summary: string;
  description: string;
  languages: string;
  tags: string;
  // Step 3 -- Location
  event_type: string;
  event_country: string;
  event_city: string;
  venue_name: string;
  venue_address: string;
  google_maps_link: string;
  online_url: string;
  online_platform: string;
  // Step 4 -- Date & Time
  timezone: string;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  // Step 5 -- Pricing
  price_type: string;
  price_per_person: string;
  currency: string;
  ticket_required: boolean;
  ticket_url: string;
  // Step 6 -- Media
  cover_image_url: string;
  // Step 7 -- Visibility
  visibility_pack: string;
  // Step 8 -- Confirm
  confirm_rights: boolean;
  confirm_lawful: boolean;
}

// ─── RESPONSIVE HOOK ─────────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1024
  );
  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

function sanitize(str: string): string {
  if (!str) return str;
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

// ─── GLOBAL STYLES (injected via <style>) ────────────────────────────────────
const GLOBAL_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&display=swap');
html,body{margin:0;padding:0;background:${P.bg};min-height:100vh;font-family:'Figtree',sans-serif;overflow-x:hidden;}
.glass-wrap{position:relative;z-index:1;max-width:800px;width:100%;margin:48px auto;
  background:rgba(40,18,71,0.45);backdrop-filter:blur(20px);
  border:1px solid rgba(244,190,105,0.12);border-radius:28px;padding:48px 52px;
  box-shadow:0 32px 80px rgba(0,0,0,0.5);}
@media(max-width:900px){.glass-wrap{margin:24px 16px;padding:32px 28px;border-radius:22px;}}
@media(max-width:640px){.glass-wrap{margin:12px 8px;padding:24px 16px;border-radius:16px;}}
.bg-glow-a{position:fixed;top:-10%;left:-10%;width:60vw;height:60vw;border-radius:50%;
  background:radial-gradient(circle,rgba(126,34,206,0.22) 0%,transparent 70%);
  z-index:0;filter:blur(60px);pointer-events:none;}
.bg-glow-b{position:fixed;bottom:-10%;right:-10%;width:50vw;height:50vw;border-radius:50%;
  background:radial-gradient(circle,rgba(244,190,105,0.12) 0%,transparent 70%);
  z-index:0;filter:blur(60px);pointer-events:none;}
`;

// ─── NO TOKEN SCREEN ─────────────────────────────────────────────────────────
function NoTokenScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backgroundColor: BRAND.bg,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 448,
          borderRadius: 16,
          padding: 32,
          border: "1px solid rgba(255,255,255,0.05)",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
          textAlign: "center",
          backgroundColor: BRAND.panel,
        }}
      >
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 24,
            fontWeight: 700,
            margin: "0 auto 24px",
            boxShadow: "0 10px 15px rgba(0,0,0,0.3)",
            backgroundColor: BRAND.accent,
            color: BRAND.bg,
          }}
        >
          H
        </div>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: "#fff",
            marginBottom: 8,
          }}
        >
          Event Submission
        </h1>
        <p style={{ color: "#94a3b8", fontSize: 14 }}>
          Please open this form from the Holora app to submit an event.
        </p>
      </div>
    </div>
  );
}

// ─── SUCCESS SCREEN ──────────────────────────────────────────────────────────
function SuccessScreen({
  refId,
  displayName,
  email,
}: {
  refId: string;
  displayName: string;
  email: string;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: P.bg,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "32px 16px",
        fontFamily: '"Figtree", sans-serif',
        position: "relative",
        overflow: "hidden",
      }}
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `@import url('https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&display=swap');`,
        }}
      />
      {/* Animated glow orbs */}
      <motion.div
        animate={{ scale: [1, 1.3, 1], opacity: [0.2, 0.4, 0.2] }}
        transition={{ duration: 4, repeat: Infinity }}
        style={{
          position: "absolute", top: -100, left: -100,
          width: 400, height: 400, borderRadius: "50%",
          background: "rgba(16, 185, 129, 0.15)", filter: "blur(80px)",
        }}
      />
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.3, 0.15] }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        style={{
          position: "absolute", bottom: -80, right: -80,
          width: 300, height: 300, borderRadius: "50%",
          background: "rgba(244, 190, 105, 0.15)", filter: "blur(80px)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        style={{
          maxWidth: 480,
          width: "100%",
          background: "rgba(40,18,71,0.6)",
          backdropFilter: "blur(20px)",
          borderRadius: 28,
          padding: 48,
          border: "1px solid rgba(16,185,129,0.3)",
          textAlign: "center",
          boxShadow: "0 32px 64px rgba(0,0,0,0.5)",
          position: "relative",
          zIndex: 1,
        }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 12 }}
          style={{
            width: 88,
            height: 88,
            borderRadius: "50%",
            background: "linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))",
            border: "2px solid #10b981",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 28px",
            boxShadow: "0 0 40px rgba(16,185,129,0.2)",
          }}
        >
          <CheckCircle size={40} color="#10b981" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          style={{
            color: P.text,
            fontWeight: 700,
            fontSize: 28,
            margin: "0 0 12px",
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          Event Submitted!
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          style={{
            color: P.textMuted,
            fontSize: 16,
            margin: "0 0 24px",
            lineHeight: 1.7,
          }}
        >
          Hey{" "}
          <strong style={{ color: P.yellow }}>
            {displayName || "there"}
          </strong>{" "}
          <br />
          Your event is under review. Confirmation sent to{" "}
          <span style={{ color: P.yellow }}>{email}</span>.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.7 }}
          style={{
            background: "rgba(0,0,0,0.3)",
            borderRadius: 16,
            padding: "20px 24px",
            border: `1px solid ${P.border}`,
            marginBottom: 16,
          }}
        >
          <p
            style={{
              color: P.textDim,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              margin: "0 0 6px",
            }}
          >
            Reference ID
          </p>
          <p
            style={{
              color: P.yellow,
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: "0.15em",
              margin: 0,
              fontFamily: "Helvetica, Arial, sans-serif",
            }}
          >
            {refId}
          </p>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{
            color: "rgba(244,190,105,0.8)",
            fontSize: 14,
            margin: 0,
          }}
        >
          Decision within <strong>24-48 hours</strong>. Approved
          events go live on the Holora app.
        </motion.p>
      </motion.div>
    </div>
  );
}

// ─── MAIN FORM ───────────────────────────────────────────────────────────────
export function EventForm() {
  const { token, isReady } = useTokenFromUrl();
  const vw = useWindowWidth();
  const isMobile = vw < 640;

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [refId, setRefId] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);

  const detectedTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone;
    } catch {
      return "Asia/Dubai";
    }
  }, []);

  const [form, setForm] = useState<EventFormData>({
    // Step 1 -- Organizer
    organizer_type: "private",
    organizer_display_name: "",
    organizer_email: "",
    organizer_phone: "",
    nationality: "",
    country: "",
    legal_name: "",
    registration_number: "",
    registered_address: "",
    representative_name: "",
    representative_role: "",
    // Step 2 -- Event Details
    title: "",
    category: "",
    summary: "",
    description: "",
    languages: "",
    tags: "",
    // Step 3 -- Location
    event_type: "in_person",
    event_country: "",
    event_city: "",
    venue_name: "",
    venue_address: "",
    google_maps_link: "",
    online_url: "",
    online_platform: "",
    // Step 4 -- Date & Time
    timezone: detectedTz,
    start_date: "",
    start_time: "",
    end_date: "",
    end_time: "",
    // Step 5 -- Pricing
    price_type: "free",
    price_per_person: "",
    currency: "USD",
    ticket_required: false,
    ticket_url: "",
    // Step 6 -- Media
    cover_image_url: "",
    // Step 7 -- Visibility
    visibility_pack: "event_none",
    // Step 8 -- Confirm
    confirm_rights: false,
    confirm_lawful: false,
  });

  const set = useCallback(
    (k: keyof EventFormData) => (v: string | boolean) =>
      setForm((f) => ({ ...f, [k]: v })),
    []
  );

  const toggle = useCallback(
    (k: keyof EventFormData) => () =>
      setForm((f) => ({ ...f, [k]: !f[k] })),
    []
  );

  const isCompany = form.organizer_type === "company";
  const isInPerson =
    form.event_type === "in_person" || form.event_type === "hybrid";
  const isOnline =
    form.event_type === "online" || form.event_type === "hybrid";

  const handleEventCountryChange = useCallback(
    (v: string) => {
      setForm((f) => ({ ...f, event_country: v, event_city: "" }));
    },
    []
  );

  // ── VALIDATION ─────────────────────────────────────────────────────────────
  const validate = useCallback(
    (s: number): Record<string, string> => {
      const e: Record<string, string> = {};
      if (s === 1) {
        if (!form.organizer_display_name.trim())
          e.organizer_display_name = "Required";
        if (
          !form.organizer_email.trim() ||
          !/\S+@\S+\.\S+/.test(form.organizer_email)
        )
          e.organizer_email = "Valid email required";
        if (!form.nationality) e.nationality = "Required";
        if (!form.country) e.country = "Required";
        if (isCompany) {
          if (!form.legal_name.trim())
            e.legal_name = "Required for companies";
          if (!form.registration_number.trim())
            e.registration_number = "Required";
          if (!form.registered_address.trim())
            e.registered_address = "Required";
        }
      }
      if (s === 2) {
        if (!form.title.trim()) e.title = "Required";
        if (!form.category) e.category = "Required";
        if (!form.description.trim())
          e.description = "Required -- describe your event";
      }
      if (s === 3) {
        if (isInPerson) {
          if (!form.event_country) e.event_country = "Required";
          if (!form.event_city) e.event_city = "Required";
          if (!form.venue_address.trim())
            e.venue_address = "Full address required";
        }
        if (isOnline) {
          if (
            !form.online_url.trim() ||
            !form.online_url.startsWith("https://")
          )
            e.online_url = "Valid https:// URL required";
        }
        if (
          form.google_maps_link.trim() &&
          !form.google_maps_link.startsWith("http://") &&
          !form.google_maps_link.startsWith("https://")
        )
          e.google_maps_link = "Must be a valid URL (https://...)";
      }
      if (s === 4) {
        if (!form.start_date || !form.start_time)
          e.start_at = "Start date & time required";
        if (!form.end_date || !form.end_time)
          e.end_at = "End date & time required";
        if (
          form.start_date &&
          form.end_date &&
          form.start_time &&
          form.end_time
        ) {
          if (
            new Date(`${form.end_date}T${form.end_time}`) <=
            new Date(`${form.start_date}T${form.start_time}`)
          )
            e.end_at = "End must be after start";
        }
      }
      if (s === 5) {
        if (form.price_type === "paid") {
          if (
            !form.price_per_person ||
            parseFloat(form.price_per_person) <= 0
          )
            e.price_per_person = "Must be > 0";
        }
        if (
          form.ticket_required &&
          form.ticket_url &&
          !form.ticket_url.startsWith("https://")
        )
          e.ticket_url = "Must start with https://";
      }
      if (s === 8) {
        if (!form.confirm_rights) e.confirm_rights = "Required";
        if (!form.confirm_lawful) e.confirm_lawful = "Required";
      }
      return e;
    },
    [form, isCompany, isInPerson, isOnline]
  );

  const nextStep = useCallback(() => {
    const e = validate(step);
    if (Object.keys(e).length) {
      setErrors(e);
      window.scrollTo(0, 0);
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  }, [step, validate]);

  const prevStep = useCallback(() => {
    setErrors({});
    setStep((s) => s - 1);
    window.scrollTo(0, 0);
  }, []);

  const handleUpload = useCallback(
    (
      file: File | undefined,
      field: keyof EventFormData,
      setLoading: (v: boolean) => void
    ) => {
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        alert("File too large. Max 10MB.");
        return;
      }
      setLoading(true);
      const localUrl = URL.createObjectURL(file);
      setTimeout(() => {
        set(field)(localUrl);
        setLoading(false);
      }, 600);
    },
    [set]
  );

  const handleSubmit = useCallback(async () => {
    const e = validate(8);
    if (Object.keys(e).length) {
      setErrors(e);
      return;
    }
    setSubmitting(true);
    try {
      const start_at = `${form.start_date}T${form.start_time}:00`;
      const end_at = `${form.end_date}T${form.end_time}:00`;

      // Don't send blob: URLs — backend URLField rejects them.
      // Blob URLs are local browser previews only.
      const coverUrl =
        form.cover_image_url && !form.cover_image_url.startsWith("blob:")
          ? form.cover_image_url
          : "";

      // Backend serializer already sanitizes text via html.escape(),
      // so do NOT sanitize here to avoid double-escaping.
      const payload: Record<string, unknown> = {
        organizer_type: form.organizer_type,
        organizer_display_name: form.organizer_display_name.trim(),
        organizer_email: form.organizer_email.trim().toLowerCase(),
        organizer_phone: form.organizer_phone || "",
        country: form.country || "",
        title: form.title.trim(),
        category: form.category,
        summary: form.summary || "",
        description: form.description.trim(),
        languages: form.languages || "",
        tags: form.tags || "",
        event_type: form.event_type,
        city: form.event_city || "",
        venue_name: form.venue_name || "",
        venue_address: form.venue_address || "",
        google_maps_link: form.google_maps_link || "",
        online_url: form.online_url || "",
        online_platform: form.online_platform || "",
        timezone: form.timezone,
        start_at,
        end_at,
        price_type: form.price_type,
        price_per_person: form.price_per_person || "0",
        currency: form.currency,
        ticket_required: form.ticket_required,
        ticket_url: form.ticket_url || "",
        cover_image_url: coverUrl,
        visibility_pack: form.visibility_pack,
        confirm_rights: form.confirm_rights,
        confirm_lawful: form.confirm_lawful,
      };

      // Company-specific fields
      if (form.organizer_type === "company") {
        payload.legal_name = form.legal_name || "";
        payload.registration_number = form.registration_number || "";
        payload.registered_address = form.registered_address || "";
        payload.representative_name = form.representative_name || "";
        payload.representative_role = form.representative_role || "";
      }

      const apiBase = process.env.NEXT_PUBLIC_API_URL || "";

      const res = await fetch(`${apiBase}/events/events/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify(payload),
      });

      if (res.status === 400) {
        const data = await res.json();
        const msg =
          data.non_field_errors?.[0] ||
          Object.values(data).flat().join(" ") ||
          "Validation error.";
        setErrors({ submit: msg as string });
        setSubmitting(false);
        return;
      }
      if (!res.ok) throw new Error(`Server error ${res.status}`);

      const data = await res.json();
      setRefId(
        data.ref_id ||
          "EVT-" +
            Math.random().toString(36).substring(2, 8).toUpperCase()
      );
      setSubmitted(true);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Connection error. Please try again.";
      setErrors({ submit: message });
    }
    setSubmitting(false);
  }, [form, token, validate]);

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (!isReady) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            border: "2px solid rgba(255,255,255,0.2)",
            borderTopColor: "#fff",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style
          dangerouslySetInnerHTML={{
            __html: "@keyframes spin{to{transform:rotate(360deg)}}",
          }}
        />
      </div>
    );
  }

  // ── NO TOKEN ───────────────────────────────────────────────────────────────
  if (!token) {
    return <NoTokenScreen />;
  }

  // ── SUCCESS ────────────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <SuccessScreen
        refId={refId}
        displayName={form.organizer_display_name}
        email={form.organizer_email}
      />
    );
  }

  // ── MAIN FORM ──────────────────────────────────────────────────────────────
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: GLOBAL_CSS }} />
      <div className="bg-glow-a" />
      <div className="bg-glow-b" />

      <div className="glass-wrap">
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: isMobile ? 28 : 48 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 16,
              padding: "8px 18px",
              background: "rgba(0,0,0,0.25)",
              borderRadius: 100,
              border: `1px solid ${P.border}`,
            }}
          >
            <img
              src="/logo.png"
              alt="Holora Performance"
              style={{
                height: isMobile ? 24 : 32,
                width: isMobile ? 24 : 32,
                objectFit: "contain",
                borderRadius: 4,
              }}
            />
            <span
              style={{
                color: P.text,
                fontWeight: 600,
                fontSize: isMobile ? 12 : 14,
                letterSpacing: "0.05em",
              }}
            >
              EVENT CREATOR
            </span>
          </div>
          <h1
            style={{
              fontFamily: "Helvetica, Arial, sans-serif",
              color: P.text,
              fontSize: isMobile ? 22 : 30,
              fontWeight: 700,
              margin: "0 0 8px",
              letterSpacing: "-0.02em",
            }}
          >
            {STEPS[step - 1].label}
          </h1>
        </div>

        <ProgressBar step={step} isMobile={isMobile} />

        {Object.keys(errors).length > 0 && (
          <div
            style={{
              background: "rgba(239,68,68,0.1)",
              border: "1px solid rgba(239,68,68,0.3)",
              borderRadius: 12,
              padding: "14px 20px",
              marginBottom: 28,
              color: "#ef4444",
              fontWeight: 600,
              fontSize: 14,
            }}
          >
            Please fix the highlighted errors below to continue.
          </div>
        )}

        <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        >
        {/* ── STEP 1: Organizer ───────────────────────────────────────── */}
        {step === 1 && (
          <>
            <Field
              label="Organizer Type"
              required
              hint="Choose 'Private / Coach' for individuals, or 'Company / Studio' for businesses"
            >
              <div style={{ display: "flex", gap: 12 }}>
                <Chip
                  active={form.organizer_type === "private"}
                  onClick={() => set("organizer_type")("private")}
                >
                  Private / Coach
                </Chip>
                <Chip
                  active={form.organizer_type === "company"}
                  onClick={() => set("organizer_type")("company")}
                >
                  Company / Studio
                </Chip>
              </div>
            </Field>

            <Field
              label={
                isCompany ? "Brand / Company Name" : "Your Name or Alias"
              }
              required
              error={errors.organizer_display_name}
              hint="This is the name attendees will see on the event listing"
            >
              <FInput
                value={form.organizer_display_name}
                onChange={set("organizer_display_name") as (v: string) => void}
                placeholder="Publicly displayed name"
              />
            </Field>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 16,
              }}
            >
              <Field
                label="Contact Email"
                required
                error={errors.organizer_email}
                hint="Used for approval notifications -- not shown publicly"
              >
                <FInput
                  type="email"
                  value={form.organizer_email}
                  onChange={set("organizer_email") as (v: string) => void}
                  placeholder="Will remain private"
                />
              </Field>
              <Field
                label="Phone Number"
                hint="Include country code, e.g. +971 50 123 4567"
              >
                <FInput
                  value={form.organizer_phone}
                  onChange={set("organizer_phone") as (v: string) => void}
                  placeholder="+1 555 000 0000"
                />
              </Field>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 16,
              }}
            >
              <Field
                label="Nationality"
                required
                error={errors.nationality}
                hint="Your country of citizenship"
              >
                <FInput
                  value={form.nationality}
                  onChange={set("nationality") as (v: string) => void}
                  placeholder="e.g. United States"
                />
              </Field>
              <Field
                label="Country of Residence"
                required
                error={errors.country}
                hint="The country where you currently live and operate"
              >
                <FInput
                  value={form.country}
                  onChange={set("country") as (v: string) => void}
                  placeholder="e.g. United Arab Emirates"
                />
              </Field>
            </div>

            {isCompany && (
              <div
                style={{
                  marginTop: 8,
                  padding: 28,
                  background: "rgba(0,0,0,0.2)",
                  borderRadius: 16,
                  border: `1px solid ${P.border}`,
                }}
              >
                <h3
                  style={{
                    color: P.yellow,
                    fontSize: 13,
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    margin: "0 0 20px",
                    fontFamily: "Helvetica, Arial, sans-serif",
                  }}
                >
                  Legal Details (Private)
                </h3>
                <Field
                  label="Legal Company Name"
                  required
                  error={errors.legal_name}
                  hint="Official registered company name -- kept private"
                >
                  <FInput
                    value={form.legal_name}
                    onChange={set("legal_name") as (v: string) => void}
                    placeholder="Registered name"
                  />
                </Field>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <Field
                    label="Trade License / Registration No."
                    required
                    error={errors.registration_number}
                    hint="Your commercial registration or license number"
                  >
                    <FInput
                      value={form.registration_number}
                      onChange={
                        set("registration_number") as (v: string) => void
                      }
                      placeholder="CR / License ID"
                    />
                  </Field>
                  <Field
                    label="Registered Address"
                    required
                    error={errors.registered_address}
                    hint="Official business address as registered"
                  >
                    <FInput
                      value={form.registered_address}
                      onChange={
                        set("registered_address") as (v: string) => void
                      }
                      placeholder="Business address"
                    />
                  </Field>
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <Field
                    label="Representative Name"
                    hint="Person authorized to act on behalf of the company"
                  >
                    <FInput
                      value={form.representative_name}
                      onChange={
                        set("representative_name") as (v: string) => void
                      }
                      placeholder="Full name"
                    />
                  </Field>
                  <Field
                    label="Representative Role"
                    hint="Their job title or position in the company"
                  >
                    <FInput
                      value={form.representative_role}
                      onChange={
                        set("representative_role") as (v: string) => void
                      }
                      placeholder="e.g. CEO, Manager"
                    />
                  </Field>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── STEP 2: Event Details ───────────────────────────────────── */}
        {step === 2 && (
          <>
            <Field
              label="Event Title"
              required
              error={errors.title}
              hint="Keep it short and compelling -- this is the first thing attendees see"
            >
              <FInput
                value={form.title}
                onChange={set("title") as (v: string) => void}
                placeholder="e.g. Sunset HIIT Session"
              />
            </Field>
            <Field
              label="Category"
              required
              error={errors.category}
              hint="Choose the category that best describes your event type"
            >
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => set("category")(cat.value)}
                    style={{
                      padding: "8px 16px",
                      borderRadius: 12,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      backgroundColor:
                        form.category === cat.value ? P.yellow : P.inputBg,
                      color:
                        form.category === cat.value ? P.bg : P.text,
                      border: `1px solid ${form.category === cat.value ? P.yellow : P.border}`,
                      fontFamily: '"Figtree", sans-serif',
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </Field>
            <Field
              label="Short Summary"
              hint="One sentence shown in the feed card -- keep it under 120 characters"
            >
              <FInput
                value={form.summary}
                onChange={set("summary") as (v: string) => void}
                placeholder="A quick overview of your event"
              />
            </Field>
            <Field
              label="Full Description"
              required
              error={errors.description}
              hint="Tell attendees what to expect, what to bring, fitness level required, and any other relevant details"
            >
              <FTextarea
                value={form.description}
                onChange={set("description") as (v: string) => void}
                rows={6}
                placeholder="What should attendees expect? What to bring? Any requirements?"
              />
            </Field>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 16,
              }}
            >
              <Field label="Languages" hint="e.g. English, Arabic">
                <FInput
                  value={form.languages}
                  onChange={set("languages") as (v: string) => void}
                  placeholder="English, Arabic..."
                />
              </Field>
              <Field label="Tags" hint="Comma-separated">
                <FInput
                  value={form.tags}
                  onChange={set("tags") as (v: string) => void}
                  placeholder="outdoor, beginner, morning"
                />
              </Field>
            </div>
          </>
        )}

        {/* ── STEP 3: Location ────────────────────────────────────────── */}
        {step === 3 && (
          <>
            <Field label="Event Format" required>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                {[
                  { v: "in_person", l: "In-Person" },
                  { v: "online", l: "Online" },
                  { v: "hybrid", l: "Hybrid" },
                ].map((o) => (
                  <Chip
                    key={o.v}
                    active={form.event_type === o.v}
                    onClick={() => set("event_type")(o.v)}
                  >
                    {o.l}
                  </Chip>
                ))}
              </div>
            </Field>

            {isInPerson && (
              <>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                    gap: 16,
                  }}
                >
                  <Field
                    label="Event Country"
                    required
                    error={errors.event_country}
                  >
                    <SearchSelect
                      value={form.event_country}
                      onChange={handleEventCountryChange}
                      options={ALL_COUNTRIES}
                      placeholder="Select country"
                    />
                  </Field>
                  <Field
                    label="Event City"
                    required
                    error={errors.event_city}
                  >
                    {COUNTRY_CITY_MAP[form.event_country] ? (
                      <SearchSelect
                        value={form.event_city}
                        onChange={set("event_city") as (v: string) => void}
                        options={COUNTRY_CITY_MAP[form.event_country]}
                        placeholder="Select city"
                      />
                    ) : (
                      <FInput
                        value={form.event_city}
                        onChange={set("event_city") as (v: string) => void}
                        placeholder="Enter city"
                      />
                    )}
                  </Field>
                </div>
                <Field label="Venue Name">
                  <FInput
                    value={form.venue_name}
                    onChange={set("venue_name") as (v: string) => void}
                    placeholder="e.g. Fitness First Dubai Marina"
                  />
                </Field>
                <Field
                  label="Venue Address"
                  required
                  error={errors.venue_address}
                >
                  <FInput
                    value={form.venue_address}
                    onChange={set("venue_address") as (v: string) => void}
                    placeholder="Full street address"
                  />
                </Field>
                <Field label="Google Maps Link" hint="Optional" error={errors.google_maps_link}>
                  <FInput
                    value={form.google_maps_link}
                    onChange={set("google_maps_link") as (v: string) => void}
                    placeholder="https://maps.google.com/..."
                  />
                </Field>
              </>
            )}

            {isOnline && (
              <>
                <Field
                  label="Stream URL"
                  required
                  error={errors.online_url}
                >
                  <FInput
                    value={form.online_url}
                    onChange={set("online_url") as (v: string) => void}
                    placeholder="https://zoom.us/..."
                  />
                </Field>
                <Field
                  label="Platform"
                  hint="e.g. Zoom, Google Meet, YouTube Live"
                >
                  <FInput
                    value={form.online_platform}
                    onChange={set("online_platform") as (v: string) => void}
                    placeholder="Zoom"
                  />
                </Field>
              </>
            )}
          </>
        )}

        {/* ── STEP 4: Date & Time ─────────────────────────────────────── */}
        {step === 4 && (
          <>
            <Field label="Timezone" required>
              <SearchSelect
                value={form.timezone}
                onChange={set("timezone") as (v: string) => void}
                options={ALL_TIMEZONES}
                placeholder="Select timezone"
              />
            </Field>
            {errors.start_at && (
              <p
                style={{
                  fontSize: 13,
                  color: "#ef4444",
                  marginBottom: 12,
                  fontWeight: 600,
                }}
              >
                {errors.start_at}
              </p>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 16,
              }}
            >
              <Field label="Start Date" required>
                <FInput
                  type="date"
                  value={form.start_date}
                  onChange={set("start_date") as (v: string) => void}
                />
              </Field>
              <Field label="Start Time" required>
                <FInput
                  type="time"
                  value={form.start_time}
                  onChange={set("start_time") as (v: string) => void}
                />
              </Field>
            </div>
            {errors.end_at && (
              <p
                style={{
                  fontSize: 13,
                  color: "#ef4444",
                  marginBottom: 12,
                  fontWeight: 600,
                }}
              >
                {errors.end_at}
              </p>
            )}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
                gap: 16,
              }}
            >
              <Field label="End Date" required>
                <FInput
                  type="date"
                  value={form.end_date}
                  onChange={set("end_date") as (v: string) => void}
                />
              </Field>
              <Field label="End Time" required>
                <FInput
                  type="time"
                  value={form.end_time}
                  onChange={set("end_time") as (v: string) => void}
                />
              </Field>
            </div>
          </>
        )}

        {/* ── STEP 5: Pricing ─────────────────────────────────────────── */}
        {step === 5 && (
          <>
            <Field label="Pricing Model" required>
              <div style={{ display: "flex", gap: 12 }}>
                <Chip
                  active={form.price_type === "free"}
                  onClick={() => set("price_type")("free")}
                >
                  Free Event
                </Chip>
                <Chip
                  active={form.price_type === "paid"}
                  onClick={() => set("price_type")("paid")}
                >
                  Paid Tickets
                </Chip>
              </div>
            </Field>
            {form.price_type === "paid" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "2fr 1fr",
                  gap: 16,
                }}
              >
                <Field
                  label="Price per Person"
                  required
                  error={errors.price_per_person}
                >
                  <FInput
                    type="number"
                    value={form.price_per_person}
                    onChange={
                      set("price_per_person") as (v: string) => void
                    }
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </Field>
                <Field label="Currency">
                  <SearchSelect
                    value={form.currency}
                    onChange={set("currency") as (v: string) => void}
                    options={ALL_CURRENCIES}
                    placeholder="Select currency"
                  />
                </Field>
              </div>
            )}
            <div style={{ marginTop: 8 }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  cursor: "pointer",
                  padding: "16px 20px",
                  borderRadius: 12,
                  background: form.ticket_required
                    ? P.yellowGlow
                    : P.inputBg,
                  border: `1px solid ${form.ticket_required ? P.yellow : P.border}`,
                  transition: "all 0.2s",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.ticket_required}
                  onChange={toggle("ticket_required")}
                  style={{
                    width: 18,
                    height: 18,
                    accentColor: P.yellow,
                  }}
                />
                <span
                  style={{
                    color: P.text,
                    fontSize: 15,
                    fontFamily: '"Figtree", sans-serif',
                    fontWeight: 600,
                  }}
                >
                  External ticket required (Eventbrite, etc.)
                </span>
              </label>
              {form.ticket_required && (
                <div style={{ marginTop: 12 }}>
                  <Field label="Ticket URL" error={errors.ticket_url}>
                    <FInput
                      value={form.ticket_url}
                      onChange={set("ticket_url") as (v: string) => void}
                      placeholder="https://eventbrite.com/..."
                    />
                  </Field>
                </div>
              )}
            </div>
          </>
        )}

        {/* ── STEP 6: Media ───────────────────────────────────────────── */}
        {step === 6 && (
          <>
            <Field
              label="Cover Image"
              hint="Optional -- provide a hosted image URL or upload for preview"
              error={errors.cover_image_url}
            >
              {form.cover_image_url ? (
                <div style={{ position: "relative" }}>
                  <img
                    src={form.cover_image_url}
                    alt="Cover"
                    style={{
                      width: "100%",
                      height: 260,
                      objectFit: "cover",
                      borderRadius: 14,
                      border: `1px solid ${P.border}`,
                    }}
                  />
                  <button
                    onClick={() => set("cover_image_url")("")}
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      background: "#ef4444",
                      color: "#fff",
                      border: "none",
                      padding: "8px 16px",
                      borderRadius: 8,
                      fontWeight: 700,
                      cursor: "pointer",
                      fontFamily: '"Figtree", sans-serif',
                    }}
                  >
                    Replace
                  </button>
                </div>
              ) : (
                <label
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 12,
                    padding: "56px 24px",
                    background: P.inputBg,
                    border: `2px dashed ${uploadingCover ? P.yellow : P.border}`,
                    borderRadius: 14,
                    cursor: "pointer",
                    transition: "all 0.3s",
                  }}
                >
                  <span style={{ fontSize: 36 }}>
                    {uploadingCover ? "\u23F3" : "\u{1F4F8}"}
                  </span>
                  <span
                    style={{
                      color: P.text,
                      fontWeight: 700,
                      fontSize: 16,
                    }}
                  >
                    {uploadingCover
                      ? "Uploading..."
                      : "Click to browse image"}
                  </span>
                  <span
                    style={{ color: P.textMuted, fontSize: 13 }}
                  >
                    JPG, PNG, WebP -- Max 10MB
                  </span>
                  <input
                    type="file"
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={(e) =>
                      handleUpload(
                        e.target.files?.[0],
                        "cover_image_url",
                        setUploadingCover
                      )
                    }
                  />
                </label>
              )}
            </Field>
          </>
        )}

        {/* ── STEP 7: Visibility ──────────────────────────────────────── */}
        {step === 7 && (
          <div style={{ display: "grid", gap: 14 }}>
            {VISIBILITY_PACKS.map((pack) => (
              <div
                key={pack.id}
                onClick={() => set("visibility_pack")(pack.id)}
                style={{
                  padding: "22px 24px",
                  borderRadius: 16,
                  cursor: "pointer",
                  transition: "all 0.25s",
                  position: "relative",
                  background:
                    form.visibility_pack === pack.id
                      ? pack.accent
                      : P.inputBg,
                  border: `2px solid ${form.visibility_pack === pack.id ? pack.color : P.border}`,
                }}
              >
                {pack.popular && (
                  <span
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 16,
                      background: P.yellow,
                      color: "#150926",
                      fontSize: 11,
                      fontWeight: 800,
                      padding: "3px 10px",
                      borderRadius: 100,
                      fontFamily: '"Figtree", sans-serif',
                    }}
                  >
                    POPULAR
                  </span>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span
                    style={{
                      color: pack.color,
                      fontWeight: 800,
                      fontSize: 18,
                      letterSpacing: "0.04em",
                      fontFamily: "Helvetica, Arial, sans-serif",
                    }}
                  >
                    {pack.name}
                  </span>
                  <span
                    style={{
                      color: P.text,
                      fontWeight: 700,
                      fontSize: 16,
                    }}
                  >
                    {pack.label}
                  </span>
                </div>
                <p
                  style={{
                    color: P.textMuted,
                    margin: 0,
                    fontSize: 14,
                    lineHeight: 1.5,
                    fontFamily: '"Figtree", sans-serif',
                  }}
                >
                  {pack.desc}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* ── STEP 8: Review & Submit ─────────────────────────────────── */}
        {step === 8 && (
          <>
            <div
              style={{
                background: "rgba(0,0,0,0.2)",
                borderRadius: 16,
                padding: 28,
                marginBottom: 28,
                border: `1px solid ${P.border}`,
              }}
            >
              <h3
                style={{
                  color: P.yellow,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontSize: 13,
                  marginTop: 0,
                  marginBottom: 20,
                  fontFamily: "Helvetica, Arial, sans-serif",
                }}
              >
                Event Summary
              </h3>
              {(
                [
                  ["Event", form.title || "--"],
                  [
                    "Organizer",
                    form.organizer_display_name || "--",
                  ],
                  [
                    "Format",
                    form.event_type.replace("_", " ").toUpperCase(),
                  ],
                  [
                    "Location",
                    [form.event_city, form.event_country]
                      .filter(Boolean)
                      .join(", ") ||
                      (form.online_url ? "Online" : "--"),
                  ],
                  ["Date", form.start_date || "--"],
                  [
                    "Pricing",
                    form.price_type === "paid"
                      ? `${form.price_per_person} ${form.currency}`
                      : "Free",
                  ],
                  [
                    "Visibility",
                    VISIBILITY_PACKS.find(
                      (p) => p.id === form.visibility_pack
                    )?.name || "--",
                  ],
                ] as [string, string][]
              ).map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom:
                      "1px solid rgba(255,255,255,0.05)",
                    paddingBottom: 10,
                    marginBottom: 10,
                  }}
                >
                  <span
                    style={{
                      color: P.textMuted,
                      fontSize: 13,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      fontWeight: 600,
                    }}
                  >
                    {k}
                  </span>
                  <span
                    style={{
                      color: P.text,
                      fontWeight: 700,
                      fontSize: 14,
                      maxWidth: "60%",
                      textAlign: "right",
                    }}
                  >
                    {v}
                  </span>
                </div>
              ))}
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              <label
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  cursor: "pointer",
                  padding: "16px 20px",
                  borderRadius: 12,
                  border: `1px solid ${form.confirm_rights ? P.yellow : P.border}`,
                  background: form.confirm_rights
                    ? P.yellowGlow
                    : P.inputBg,
                  transition: "all 0.2s",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.confirm_rights}
                  onChange={toggle("confirm_rights")}
                  style={{
                    width: 18,
                    height: 18,
                    accentColor: P.yellow,
                    marginTop: 2,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: P.text,
                    fontSize: 14,
                    lineHeight: 1.5,
                    fontFamily: '"Figtree", sans-serif',
                  }}
                >
                  I confirm I hold all necessary rights to the media
                  and content provided in this submission.
                </span>
              </label>
              {errors.confirm_rights && (
                <p
                  style={{
                    fontSize: 13,
                    color: "#ef4444",
                    margin: "0 0 4px",
                    fontWeight: 600,
                  }}
                >
                  {errors.confirm_rights}
                </p>
              )}
              <label
                style={{
                  display: "flex",
                  gap: 14,
                  alignItems: "flex-start",
                  cursor: "pointer",
                  padding: "16px 20px",
                  borderRadius: 12,
                  border: `1px solid ${form.confirm_lawful ? P.yellow : P.border}`,
                  background: form.confirm_lawful
                    ? P.yellowGlow
                    : P.inputBg,
                  transition: "all 0.2s",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.confirm_lawful}
                  onChange={toggle("confirm_lawful")}
                  style={{
                    width: 18,
                    height: 18,
                    accentColor: P.yellow,
                    marginTop: 2,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    color: P.text,
                    fontSize: 14,
                    lineHeight: 1.5,
                    fontFamily: '"Figtree", sans-serif',
                  }}
                >
                  I confirm this event complies with Holora&apos;s
                  safety guidelines and applicable local laws.
                </span>
              </label>
              {errors.confirm_lawful && (
                <p
                  style={{
                    fontSize: 13,
                    color: "#ef4444",
                    margin: "0 0 4px",
                    fontWeight: 600,
                  }}
                >
                  {errors.confirm_lawful}
                </p>
              )}
            </div>
            {errors.submit && (
              <div
                style={{
                  marginTop: 16,
                  padding: "14px 18px",
                  borderRadius: 12,
                  background: "rgba(239,68,68,0.1)",
                  borderLeft: "4px solid #ef4444",
                  color: "#ef4444",
                  fontSize: 14,
                  fontFamily: '"Figtree", sans-serif',
                  fontWeight: 600,
                }}
              >
                {errors.submit}
              </div>
            )}
          </>
        )}

        </motion.div>
        </AnimatePresence>

        {/* ── NAVIGATION ──────────────────────────────────────────────── */}
        <div
          style={{
            display: "flex",
            gap: 12,
            marginTop: isMobile ? 32 : 48,
            paddingTop: isMobile ? 20 : 28,
            borderTop: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {step > 1 && (
            <button
              onClick={prevStep}
              style={{
                padding: isMobile ? "13px 20px" : "15px 28px",
                borderRadius: 12,
                background: "transparent",
                border: "1px solid rgba(247,247,247,0.25)",
                color: P.text,
                fontWeight: 700,
                cursor: "pointer",
                transition: "all 0.2s",
                fontFamily: '"Figtree", sans-serif',
                fontSize: isMobile ? 14 : 15,
                flexShrink: 0,
              }}
            >
              Back
            </button>
          )}
          <button
            onClick={step < STEPS.length ? nextStep : handleSubmit}
            disabled={submitting}
            style={{
              flex: 1,
              padding: isMobile ? "13px" : "15px",
              borderRadius: 12,
              background: P.yellow,
              border: "none",
              color: "#150926",
              fontWeight: 800,
              fontSize: isMobile ? 14 : 16,
              cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: `0 8px 24px ${P.yellowGlow}`,
              transition: "all 0.2s",
              fontFamily: '"Figtree", sans-serif',
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting
              ? "Processing..."
              : step < STEPS.length
                ? "Continue \u2192"
                : "Submit Event"}
          </button>
        </div>
      </div>
    </>
  );
}
