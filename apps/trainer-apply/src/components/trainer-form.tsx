"use client";

import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTokenFromUrl } from "@holora/auth";
import { User, Mail, Phone, Star, CheckCircle, PartyPopper } from "lucide-react";
import {
  P,
  ALL_COUNTRIES,
  COUNTRY_CITY_MAP,
  SPECIALTIES,
  LANGUAGES,
  DAYS,
  STEPS,
} from "../lib/constants";
import { Field } from "./form/field";
import { FInput } from "./form/f-input";
import { FTextarea } from "./form/f-textarea";
import { SearchSelect } from "./form/search-select";
import { TagGrid } from "./form/tag-grid";
import { ToggleCard } from "./form/toggle-card";
import { FileUploadBox } from "./form/file-upload-box";
import { ProgressBar } from "./form/progress-bar";

// ─── RESPONSIVE HOOK ─────────────────────────────────────────────────────────
function useWindowWidth() {
  const [width, setWidth] = useState(1024);
  useEffect(() => {
    setWidth(window.innerWidth);
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return width;
}

// ─── TYPES ───────────────────────────────────────────────────────────────────
interface ScheduleEntry {
  enabled: boolean;
  start: string;
  end: string;
}

interface FormState {
  full_name: string;
  email: string;
  phone: string;
  experience: string;
  primary_specialty: string;
  secondary_specialties: string[];
  languages: string[];
  bio: string;
  profile_image: File | null;
  certificates: File | null;
  nationality: string;
  country: string;
  city: string;
  supports_virtual_training: boolean;
  supports_home_training: boolean;
  supports_gym_training: boolean;
  supports_training_plan: boolean;
  gym_session_price: string;
  virtual_session_price: string;
  home_training_price: string;
  training_plan_price: string;
  schedule: Record<string, ScheduleEntry>;
}

interface FormErrors {
  [key: string]: string | undefined;
}

// ─── API ─────────────────────────────────────────────────────────────────────
const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────
export function TrainerForm() {
  const { token } = useTokenFromUrl();
  const vw = useWindowWidth();
  const isMobile = vw < 640;
  const isTablet = vw < 900;
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const [form, setForm] = useState<FormState>({
    full_name: "",
    email: "",
    phone: "",
    experience: "",
    primary_specialty: "",
    secondary_specialties: [],
    languages: [],
    bio: "",
    profile_image: null,
    certificates: null,
    nationality: "",
    country: "",
    city: "",
    supports_virtual_training: true,
    supports_home_training: false,
    supports_gym_training: true,
    supports_training_plan: true,
    gym_session_price: "",
    virtual_session_price: "",
    home_training_price: "",
    training_plan_price: "",
    schedule: {},
  });

  const availableCities = useMemo(() => {
    if (!form.country) return [];
    if (COUNTRY_CITY_MAP[form.country])
      return COUNTRY_CITY_MAP[form.country].map((c) => ({
        label: c,
        value: c,
      }));
    return [
      { label: `${form.country} City 1`, value: `${form.country} City 1` },
      { label: `${form.country} City 2`, value: `${form.country} City 2` },
      { label: "Other (Type manually)", value: "Other" },
    ];
  }, [form.country]);

  const set = (k: keyof FormState, v: FormState[keyof FormState]) =>
    setForm((p) => ({ ...p, [k]: v }));

  const togList = (field: "secondary_specialties" | "languages", val: string) => {
    setForm((p) => ({
      ...p,
      [field]: p[field].includes(val)
        ? p[field].filter((x) => x !== val)
        : [...p[field], val],
    }));
  };

  const validate = (): boolean => {
    const e: FormErrors = {};
    if (step === 1) {
      if (!form.full_name.trim()) e.full_name = "Name is required";
      if (!form.email.trim()) e.email = "Email is required";
      if (!form.phone.trim()) e.phone = "Phone is required";
      if (!form.nationality) e.nationality = "Nationality is required";
      if (!form.country) e.country = "Residence country is required";
      if (!form.city) e.city = "City is required";
      if (!form.profile_image) {
        e.profile_image = "Profile photo is required";
      } else if (form.profile_image.size > 10 * 1024 * 1024) {
        e.profile_image = "Profile image must be under 10MB";
      }
      if (!form.certificates) {
        e.certificates = "Certificate file is required";
      } else if (form.certificates.size > 10 * 1024 * 1024) {
        e.certificates = "Certificate file must be under 10MB";
      }
    }
    if (step === 2 && !form.primary_specialty)
      e.primary_specialty = "Primary specialty is required";
    if (step === 3) {
      if (form.supports_gym_training && (parseFloat(form.gym_session_price) || 0) <= 0)
        e.gym_session_price = "Price is required when gym training is enabled";
      if (form.supports_virtual_training && (parseFloat(form.virtual_session_price) || 0) <= 0)
        e.virtual_session_price = "Price is required when virtual training is enabled";
      if (form.supports_home_training && (parseFloat(form.home_training_price) || 0) <= 0)
        e.home_training_price = "Price is required when home training is enabled";
      if (form.supports_training_plan && (parseFloat(form.training_plan_price) || 0) <= 0)
        e.training_plan_price = "Price is required when training plans are enabled";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (validate()) {
      setStep((s) => Math.min(s + 1, 5));
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
  const prev = () => {
    setStep((s) => Math.max(s - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setErrors({});
    try {
      // Convert schedule: {day:{enabled,start,end}} -> {day:[start,end]} (enabled days only)
      const schedule: Record<string, [string, string]> = {};
      Object.entries(form.schedule).forEach(([day, data]) => {
        if (data.enabled) schedule[day] = [data.start, data.end];
      });

      // Build FormData -- backend requires multipart/form-data (has file fields)
      const formData = new FormData();
      formData.append("full_name", form.full_name);
      formData.append("email", form.email);
      formData.append("phone", form.phone);
      formData.append("experience", form.experience || "0");
      formData.append("primary_specialty", form.primary_specialty);
      formData.append("bio", form.bio || "");
      formData.append("nationality", form.nationality || "");
      formData.append("country", form.country || "");
      formData.append("city", form.city || "");
      formData.append(
        "supports_virtual_training",
        String(form.supports_virtual_training)
      );
      formData.append(
        "supports_home_training",
        String(form.supports_home_training)
      );
      formData.append(
        "supports_gym_training",
        String(form.supports_gym_training)
      );
      formData.append(
        "supports_training_plan",
        String(form.supports_training_plan)
      );
      formData.append("gym_session_price", form.gym_session_price || "0");
      formData.append(
        "virtual_session_price",
        form.virtual_session_price || "0"
      );
      formData.append("home_training_price", form.home_training_price || "0");
      formData.append("training_plan_price", form.training_plan_price || "0");
      // JSONField values must be sent as JSON strings in multipart
      formData.append(
        "secondary_specialties",
        JSON.stringify(form.secondary_specialties || [])
      );
      formData.append(
        "locations",
        JSON.stringify([form.city, form.country].filter(Boolean))
      );
      formData.append("languages", JSON.stringify(form.languages || []));
      formData.append("schedule", JSON.stringify(schedule));
      // Files (required — validated in step 1)
      if (form.profile_image)
        formData.append("profile_image", form.profile_image);
      if (form.certificates)
        formData.append("certificates", form.certificates);

      const headers: Record<string, string> = {
        "ngrok-skip-browser-warning": "true",
      };
      if (token) headers.Authorization = `Bearer ${token}`;

      const res = await fetch(`${API_URL}/trainer/trainer-application/`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (res.status === 400) {
        const data = await res.json();
        const msg =
          data.detail ||
          data.error ||
          (data.errors
            ? Object.entries(data.errors)
                .map(
                  ([k, v]) =>
                    `${k}: ${Array.isArray(v) ? v.join(", ") : v}`
                )
                .join(" | ")
            : "Submission failed. Please check your details.");
        setErrors({ submit: msg });
        setSubmitting(false);
        return;
      }
      if (!res.ok) throw new Error(`Server error ${res.status}`);

      setSubmitted(true);
    } catch (err) {
      setErrors({
        submit:
          err instanceof Error
            ? err.message
            : "Connection error. Please try again.",
      });
    }
    setSubmitting(false);
  };

  const schToggle = (day: string) => {
    setForm((p) => {
      const s = { ...p.schedule };
      if (!s[day]) s[day] = { enabled: false, start: "06:00", end: "22:00" };
      s[day] = { ...s[day], enabled: !s[day].enabled };
      return { ...p, schedule: s };
    });
  };
  const schTime = (day: string, field: "start" | "end", val: string) => {
    setForm((p) => {
      const s = { ...p.schedule };
      if (!s[day]) s[day] = { enabled: false, start: "06:00", end: "22:00" };
      s[day] = { ...s[day], [field]: val };
      return { ...p, schedule: s };
    });
  };

  // ─── SUCCESS SCREEN ──────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: P.bg,
          fontFamily: "'Figtree', sans-serif",
          padding: 16,
          position: "relative",
          overflow: "hidden",
        }}
      >
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
            background: `rgba(244, 190, 105, 0.15)`, filter: "blur(80px)",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
          style={{
            textAlign: "center",
            padding: isMobile ? "40px 24px" : "64px 48px",
            background: P.surface,
            borderRadius: 24,
            border: `1px solid ${P.border}`,
            maxWidth: 520,
            width: "100%",
            boxShadow: "0 32px 64px rgba(0,0,0,0.4)",
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
              margin: "0 auto 32px",
              background: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.05))",
              border: "2px solid #10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 40px rgba(16, 185, 129, 0.2)",
            }}
          >
            <CheckCircle size={40} color="#10b981" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            style={{
              fontFamily: "Helvetica, Arial, sans-serif",
              fontSize: isMobile ? 24 : 30,
              color: P.text,
              fontWeight: 700,
              margin: "0 0 16px",
            }}
          >
            Application Sent!
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.65 }}
            style={{
              color: P.textMuted,
              fontSize: 16,
              lineHeight: 1.7,
              margin: 0,
            }}
          >
            Thank you for applying. The{" "}
            <strong style={{ color: P.yellow }}>Holora Performance</strong> team
            will review your profile and get back to you within{" "}
            <strong style={{ color: P.text }}>48 hours</strong>.
          </motion.p>
        </motion.div>
      </div>
    );
  }

  const col2 = isMobile ? "1fr" : "1fr 1fr";

  // ─── STEP CONTENT ────────────────────────────────────────────────────────
  const stepContent: Record<number, React.ReactNode> = {
    1: (
      <div>
        <div style={{ display: "grid", gridTemplateColumns: col2, gap: 20 }}>
          <Field label="Full Name" required error={errors.full_name}>
            <FInput
              value={form.full_name}
              onChange={(v) => set("full_name", v)}
              placeholder="Legal name"
              icon={User}
            />
          </Field>
          <Field label="Email Address" required error={errors.email}>
            <FInput
              type="email"
              value={form.email}
              onChange={(v) => set("email", v)}
              placeholder="your@email.com"
              icon={Mail}
            />
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: col2, gap: 20 }}>
          <Field label="Phone Number" required error={errors.phone}>
            <FInput
              type="tel"
              value={form.phone}
              onChange={(v) => set("phone", v)}
              placeholder="+1 555..."
              icon={Phone}
            />
          </Field>
          <Field label="Experience (Years)" error={errors.experience}>
            <FInput
              type="number"
              min="0"
              value={form.experience}
              onChange={(v) => set("experience", v)}
              placeholder="0"
              icon={Star}
            />
          </Field>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: col2,
            gap: 20,
            marginTop: 16,
            paddingTop: 32,
            borderTop: `1px solid ${P.border}`,
          }}
        >
          <Field label="Nationality" required error={errors.nationality}>
            <SearchSelect
              value={form.nationality}
              onChange={(v) => set("nationality", v)}
              options={ALL_COUNTRIES}
              placeholder="Select nationality"
            />
          </Field>
          <Field label="Country of Residence" required error={errors.country}>
            <SearchSelect
              value={form.country}
              onChange={(v) =>
                setForm((p) => ({ ...p, country: v, city: "" }))
              }
              options={ALL_COUNTRIES}
              placeholder="Select country"
            />
          </Field>
        </div>
        <Field label="City" required error={errors.city}>
          {COUNTRY_CITY_MAP[form.country] ? (
            <SearchSelect
              value={form.city}
              onChange={(v) => set("city", v)}
              options={COUNTRY_CITY_MAP[form.country]}
              placeholder="Select city"
            />
          ) : (
            <FInput
              value={form.city}
              onChange={(v) => set("city", v)}
              placeholder="Enter your city"
            />
          )}
        </Field>

        <div
          style={{
            marginTop: 16,
            paddingTop: 32,
            borderTop: `1px solid ${P.border}`,
          }}
        >
          <Field label="Professional Bio">
            <FTextarea
              value={form.bio}
              onChange={(v) => set("bio", v)}
              rows={4}
              placeholder="Summarize your training philosophy, background, and achievements..."
            />
          </Field>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: col2, gap: 20 }}>
          <FileUploadBox
            label="Profile Photo"
            file={form.profile_image}
            onFile={(f) => set("profile_image", f)}
            accept="image/*"
            required
            error={errors.profile_image}
          />
          <FileUploadBox
            label="Certificates"
            file={form.certificates}
            onFile={(f) => set("certificates", f)}
            accept=".pdf,.jpg,.png"
            required
            error={errors.certificates}
          />
        </div>
      </div>
    ),

    2: (
      <div>
        <Field
          label="Select Primary Specialty"
          required
          error={errors.primary_specialty}
        >
          <TagGrid
            options={SPECIALTIES}
            selected={[form.primary_specialty]}
            onToggle={(v) => set("primary_specialty", v)}
          />
        </Field>
        <div
          style={{ margin: "32px 0", height: 1, background: P.border }}
        />
        <Field label="Secondary Specialties (Optional)">
          <TagGrid
            options={SPECIALTIES.filter((s) => s !== form.primary_specialty)}
            selected={form.secondary_specialties}
            onToggle={(v) => togList("secondary_specialties", v)}
          />
        </Field>
        <div
          style={{ margin: "32px 0", height: 1, background: P.border }}
        />
        <Field label="Languages Spoken">
          <TagGrid
            options={LANGUAGES}
            selected={form.languages}
            onToggle={(v) => togList("languages", v)}
          />
        </Field>
      </div>
    ),

    3: (
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: P.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 16,
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          Training Environments
        </div>
        <div style={{ display: "grid", gap: 16, marginBottom: 40 }}>
          <ToggleCard
            label="Gym Training"
            desc="In-person sessions at gym facilities."
            checked={form.supports_gym_training}
            onChange={() =>
              set("supports_gym_training", !form.supports_gym_training)
            }
          />
          <ToggleCard
            label="Virtual Training"
            desc="1-on-1 online video coaching."
            checked={form.supports_virtual_training}
            onChange={() =>
              set(
                "supports_virtual_training",
                !form.supports_virtual_training
              )
            }
          />
          <ToggleCard
            label="Home Training"
            desc="Travel to clients' homes for sessions."
            checked={form.supports_home_training}
            onChange={() =>
              set("supports_home_training", !form.supports_home_training)
            }
          />
          <ToggleCard
            label="Custom Training Plans"
            desc="Build asynchronous routines."
            checked={form.supports_training_plan}
            onChange={() =>
              set("supports_training_plan", !form.supports_training_plan)
            }
          />
        </div>

        <div
          style={{
            background: P.inputBg,
            padding: 24,
            borderRadius: 16,
            border: `1px solid ${P.border}`,
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: P.yellow,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 24,
              fontFamily: "Helvetica, Arial, sans-serif",
            }}
          >
            Session Base Pricing (QAR)
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: col2,
              gap: 20,
            }}
          >
            {form.supports_gym_training && (
              <Field label="Gym Session Rate" required error={errors.gym_session_price}>
                <FInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.gym_session_price}
                  onChange={(v) => set("gym_session_price", v)}
                />
              </Field>
            )}
            {form.supports_virtual_training && (
              <Field label="Virtual Session Rate" required error={errors.virtual_session_price}>
                <FInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.virtual_session_price}
                  onChange={(v) => set("virtual_session_price", v)}
                />
              </Field>
            )}
            {form.supports_home_training && (
              <Field label="Home Training Rate" required error={errors.home_training_price}>
                <FInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.home_training_price}
                  onChange={(v) => set("home_training_price", v)}
                />
              </Field>
            )}
            {form.supports_training_plan && (
              <Field label="Training Plan Rate" required error={errors.training_plan_price}>
                <FInput
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.training_plan_price}
                  onChange={(v) => set("training_plan_price", v)}
                />
              </Field>
            )}
          </div>
        </div>
      </div>
    ),

    4: (
      <div>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: P.textMuted,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            marginBottom: 4,
            fontFamily: "Helvetica, Arial, sans-serif",
          }}
        >
          Standard Weekly Availability
        </div>
        <p
          style={{
            margin: "0 0 16px",
            fontSize: 13,
            color: P.textDim,
            fontFamily: '"Figtree", sans-serif',
            lineHeight: 1.4,
          }}
        >
          Toggle the days you are available and set your working hours for each
          day
        </p>
        <div style={{ display: "grid", gap: 12 }}>
          {DAYS.map((day) => {
            const s = form.schedule[day] || {
              enabled: false,
              start: "06:00",
              end: "22:00",
            };
            return (
              <div
                key={day}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 20,
                  padding: "20px",
                  borderRadius: 16,
                  background: s.enabled
                    ? "rgba(126, 34, 206, 0.1)"
                    : P.inputBg,
                  border: `1px solid ${s.enabled ? P.purple : P.border}`,
                  transition: "all 0.3s",
                }}
              >
                <div
                  onClick={() => schToggle(day)}
                  style={{
                    width: 48,
                    height: 26,
                    borderRadius: 13,
                    cursor: "pointer",
                    position: "relative",
                    flexShrink: 0,
                    background: s.enabled
                      ? P.yellow
                      : "rgba(255,255,255,0.1)",
                    transition: "all 0.3s",
                  }}
                >
                  <div
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: "50%",
                      background: s.enabled ? "#150926" : P.text,
                      position: "absolute",
                      top: 3,
                      left: s.enabled ? 25 : 3,
                      transition:
                        "all 0.3s cubic-bezier(.4,0,.2,1)",
                    }}
                  />
                </div>
                <span
                  style={{
                    width: 100,
                    fontWeight: 700,
                    fontSize: 15,
                    textTransform: "capitalize",
                    color: s.enabled ? P.text : P.textMuted,
                    fontFamily: "Helvetica, Arial, sans-serif",
                  }}
                >
                  {day}
                </span>
                {s.enabled && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      marginLeft: "auto",
                    }}
                  >
                    <input
                      type="time"
                      value={s.start}
                      onChange={(e) =>
                        schTime(day, "start", e.target.value)
                      }
                      style={{
                        background: P.surface,
                        border: `1px solid ${P.border}`,
                        borderRadius: 8,
                        padding: "10px 12px",
                        color: P.text,
                        fontSize: 14,
                        fontFamily: "'Figtree', sans-serif",
                        outline: "none",
                      }}
                    />
                    <span
                      style={{
                        color: P.textMuted,
                        fontSize: 14,
                        fontWeight: 600,
                      }}
                    >
                      to
                    </span>
                    <input
                      type="time"
                      value={s.end}
                      onChange={(e) =>
                        schTime(day, "end", e.target.value)
                      }
                      style={{
                        background: P.surface,
                        border: `1px solid ${P.border}`,
                        borderRadius: 8,
                        padding: "10px 12px",
                        color: P.text,
                        fontSize: 14,
                        fontFamily: "'Figtree', sans-serif",
                        outline: "none",
                      }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    ),

    5: (
      <div style={{ display: "grid", gap: 24 }}>
        {[
          {
            title: "Personal Information",
            items: [
              ["Name", form.full_name],
              ["Email", form.email],
              ["Phone", form.phone],
              ["Experience", `${form.experience || 0} years`],
              ["Nationality", form.nationality],
              [
                "Location",
                [form.city, form.country].filter(Boolean).join(", "),
              ],
            ],
          },
          {
            title: "Expertise",
            items: [
              ["Primary", form.primary_specialty],
              [
                "Secondary",
                form.secondary_specialties.join(", ") || "\u2014",
              ],
              ["Languages", form.languages.join(", ") || "\u2014"],
            ],
          },
          {
            title: "Services & Pricing",
            items: (
              [
                form.supports_gym_training && [
                  "Gym Session",
                  `${form.gym_session_price || 0} QAR`,
                ],
                form.supports_virtual_training && [
                  "Virtual",
                  `${form.virtual_session_price || 0} QAR`,
                ],
                form.supports_home_training && [
                  "Home Training",
                  `${form.home_training_price || 0} QAR`,
                ],
                form.supports_training_plan && [
                  "Training Plan",
                  `${form.training_plan_price || 0} QAR`,
                ],
              ] as (false | [string, string])[]
            ).filter(Boolean) as [string, string][],
          },
        ].map((sec, i) => (
          <div
            key={i}
            style={{
              background: P.inputBg,
              borderRadius: 16,
              border: `1px solid ${P.border}`,
              padding: "24px",
            }}
          >
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: P.yellow,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 20,
                fontFamily: "Helvetica, Arial, sans-serif",
              }}
            >
              {sec.title}
            </div>
            <div style={{ display: "grid", gap: 16 }}>
              {sec.items.map(([k, v], j) => (
                <div
                  key={j}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderBottom: `1px solid rgba(255,255,255,0.05)`,
                    paddingBottom: 10,
                  }}
                >
                  <span
                    style={{
                      color: P.textMuted,
                      fontSize: 14,
                      fontFamily: "'Figtree', sans-serif",
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
                      fontSize: 15,
                      fontWeight: 700,
                      fontFamily: "'Figtree', sans-serif",
                      textAlign: "right",
                      maxWidth: "60%",
                    }}
                  >
                    {v || "\u2014"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
        {errors.submit && (
          <div
            style={{
              padding: "16px 20px",
              borderRadius: 12,
              background: "rgba(239,68,68,0.1)",
              borderLeft: "4px solid #ef4444",
              color: "#ef4444",
              fontSize: 14,
              fontFamily: "'Figtree', sans-serif",
              fontWeight: 600,
            }}
          >
            {errors.submit}
          </div>
        )}
      </div>
    ),
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Figtree:wght@300;400;500;600;700&display=swap');
        html, body { margin: 0; padding: 0; background: ${P.bg}; min-height: 100vh; font-family: 'Figtree', sans-serif; overflow-x: hidden; }
        .custom-scroll::-webkit-scrollbar { width: 6px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: ${P.border}; border-radius: 4px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `,
        }}
      />

      {/* HEADER */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: P.bg,
          borderBottom: `1px solid ${P.border}`,
        }}
      >
        <div
          style={{
            maxWidth: 860,
            margin: "0 auto",
            padding: isMobile ? "12px 16px" : "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{ display: "flex", alignItems: "center", gap: 10 }}
          >
            <img
              src="/logo.png"
              alt="Holora Performance"
              style={{
                height: isMobile ? 32 : 40,
                width: isMobile ? 32 : 40,
                objectFit: "contain",
                borderRadius: 6,
              }}
            />
            <div
              style={{
                fontWeight: 700,
                fontSize: isMobile ? 14 : 16,
                fontFamily: "Helvetica, Arial, sans-serif",
                color: P.text,
              }}
            >
              Holora <span style={{ color: P.yellow }}>Trainer</span>
            </div>
          </div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: P.textMuted,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Application
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 860,
          margin: isMobile ? "16px auto" : "40px auto",
          padding: isMobile ? "0 12px 80px" : "0 24px 100px",
        }}
      >
        {/* PROGRESS */}
        <ProgressBar step={step} isMobile={isMobile} />

        {/* CARD */}
        <div
          style={{
            background: P.surface,
            borderRadius: isMobile ? 16 : 24,
            border: `1px solid ${P.border}`,
            padding: isMobile
              ? "28px 20px"
              : isTablet
                ? "36px 32px"
                : "48px",
            boxShadow: "0 32px 64px rgba(0,0,0,0.3)",
            animation: "fadeIn 0.3s ease-out",
          }}
        >
          <div style={{ marginBottom: isMobile ? 28 : 40 }}>
            <h2
              style={{
                fontFamily: "Helvetica, Arial, sans-serif",
                fontSize: isMobile ? 22 : 28,
                fontWeight: 700,
                color: P.text,
                margin: "0 0 8px",
              }}
            >
              {STEPS[step - 1].label}
            </h2>
            <div
              style={{
                height: 3,
                width: 48,
                borderRadius: 2,
                background: P.yellow,
              }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
            >
              {stepContent[step]}
            </motion.div>
          </AnimatePresence>

          {/* NAV BUTTONS */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: isMobile ? 32 : 48,
              paddingTop: isMobile ? 20 : 32,
              borderTop: `1px solid ${P.border}`,
              gap: 12,
            }}
          >
            <button
              type="button"
              onClick={prev}
              disabled={step === 1}
              style={{
                padding: isMobile ? "12px 20px" : "14px 28px",
                borderRadius: 12,
                border: `1px solid ${P.border}`,
                background: "transparent",
                color: step === 1 ? P.textDim : P.text,
                fontSize: isMobile ? 14 : 15,
                fontWeight: 700,
                cursor: step === 1 ? "not-allowed" : "pointer",
                opacity: step === 1 ? 0.4 : 1,
                transition: "all 0.3s",
                fontFamily: '"Figtree", sans-serif',
                flexShrink: 0,
              }}
            >
              {"\u2190"} Back
            </button>

            {step < 5 ? (
              <button
                type="button"
                onClick={next}
                style={{
                  padding: isMobile ? "12px 24px" : "14px 32px",
                  borderRadius: 12,
                  border: "none",
                  background: `linear-gradient(135deg, ${P.yellow}, #e8a84a)`,
                  color: "#150926",
                  fontSize: isMobile ? 14 : 15,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.3s",
                  fontFamily: '"Figtree", sans-serif',
                  boxShadow: `0 8px 24px rgba(244,190,105,0.3)`,
                  flex: 1,
                }}
              >
                Continue {"\u2192"}
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  padding: isMobile ? "12px 24px" : "14px 32px",
                  borderRadius: 12,
                  border: "none",
                  background: submitting
                    ? P.border
                    : `linear-gradient(135deg, ${P.yellow}, #e8a84a)`,
                  color: "#150926",
                  fontSize: isMobile ? 14 : 15,
                  fontWeight: 700,
                  cursor: submitting ? "not-allowed" : "pointer",
                  transition: "all 0.3s",
                  fontFamily: '"Figtree", sans-serif',
                  boxShadow: submitting
                    ? "none"
                    : `0 8px 24px rgba(244,190,105,0.3)`,
                  flex: 1,
                }}
              >
                {submitting ? "Submitting\u2026" : "Submit Application"}
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
