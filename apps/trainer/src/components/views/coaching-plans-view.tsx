"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useState } from "react";
import {
  CalendarRange,
  Package,
  Plus,
  X,
  Trash2,
  Video,
  Utensils,
  Loader2,
  ClipboardList,
} from "lucide-react";
import { BRAND, Badge, Spinner, Pagination } from "@holora/ui";
import { formatCurrency, formatDate } from "@holora/utils";
import type { ApiClient } from "@holora/api-client";
import { trainerApi } from "@/lib/trainer-api";

interface CoachingPlansViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
}

type SubTab = "plans" | "packages";

const PLAN_STATUSES = ["active", "paused", "completed", "cancelled"];
const DAY_TYPES = ["workout", "rest", "recovery", "meal_focus", "mixed"];
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack", "pre_workout", "post_workout"];

const money = (a: any, c?: string, sym?: string) =>
  sym ? `${sym}${Number(a || 0).toFixed(2)}` : formatCurrency(Number(a) || 0, (c || "QAR").toUpperCase());
const titleCase = (s?: string) => (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

function statusColor(s?: string): "green" | "yellow" | "red" | "gray" | "blue" {
  if (s === "active") return "green";
  if (s === "paused") return "yellow";
  if (s === "cancelled") return "red";
  if (s === "completed") return "blue";
  return "gray";
}

export function CoachingPlansView({ api, showToast }: CoachingPlansViewProps) {
  const [sub, setSub] = useState<SubTab>("plans");
  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div
        className="p-5 rounded-3xl border shadow-lg"
        style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight }}
      >
        <h2 className="text-xl font-bold px-1" style={{ color: BRAND.textMain }}>
          Coaching
        </h2>
        <p className="text-xs mt-1 px-1" style={{ color: BRAND.textMuted }}>
          Author multi-week coaching plans for your clients and manage sellable packages.
        </p>
      </div>

      <div className="flex gap-2">
        {(["plans", "packages"] as SubTab[]).map((t) => {
          const active = sub === t;
          return (
            <button
              key={t}
              onClick={() => setSub(t)}
              className="px-4 py-2 rounded-xl text-sm font-semibold transition border capitalize"
              style={{
                backgroundColor: active ? BRAND.primary : BRAND.panel,
                borderColor: active ? BRAND.primary : BRAND.panelLight,
                color: active ? "#fff" : BRAND.textMuted,
              }}
            >
              {t}
            </button>
          );
        })}
      </div>

      {sub === "plans" ? <PlansTab api={api} showToast={showToast} /> : <PackagesTab api={api} showToast={showToast} />}
    </div>
  );
}

/* ════════════════════════════ PLANS ════════════════════════════ */

function PlansTab({ api, showToast }: CoachingPlansViewProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [meta, setMeta] = useState<{ next: string | null; previous: string | null }>({ next: null, previous: null });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await trainerApi.coachingPlans.list(api, page);
      setRows(res?.results || []);
      setMeta({ next: res?.next ?? null, previous: res?.previous ?? null });
    } catch (err: any) {
      showToast(err?.message || "Failed to load coaching plans", "error");
    } finally {
      setLoading(false);
    }
  }, [api, page, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition"
          style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}
        >
          <Plus size={16} /> New plan
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Empty icon={CalendarRange} label="No coaching plans yet. Create one for a client." />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rows.map((p) => (
              <button
                key={p.id}
                onClick={() => setOpenId(p.id)}
                className="text-left p-5 rounded-3xl border shadow-xl transition hover:border-purple-500/40"
                style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight }}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-bold" style={{ color: BRAND.textMain }}>
                    {p.title}
                  </h3>
                  <Badge color={statusColor(p.status)}>{titleCase(p.status)}</Badge>
                </div>
                <p className="text-sm" style={{ color: BRAND.textMuted }}>
                  {p.client_name || `Client #${p.client}`}
                </p>
                <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: BRAND.textDim }}>
                  <span>{p.duration_weeks} wks</span>
                  <span>
                    {formatDate(p.start_date)} → {p.end_date ? formatDate(p.end_date) : "—"}
                  </span>
                </div>
              </button>
            ))}
          </div>
          <Pagination
            prevUrl={meta.previous}
            nextUrl={meta.next}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}

      {creating && (
        <CreatePlanModal
          api={api}
          showToast={showToast}
          onClose={() => setCreating(false)}
          onCreated={() => {
            setCreating(false);
            setPage(1);
            load();
          }}
        />
      )}
      {openId != null && (
        <PlanDetailModal
          api={api}
          showToast={showToast}
          planId={openId}
          onClose={() => setOpenId(null)}
          onChanged={load}
        />
      )}
    </div>
  );
}

function CreatePlanModal({
  api,
  showToast,
  onClose,
  onCreated,
}: CoachingPlansViewProps & { onClose: () => void; onCreated: () => void }) {
  const [clients, setClients] = useState<any[]>([]);
  const [form, setForm] = useState<Record<string, any>>({ client: "", title: "", start_date: "", duration_weeks: 4 });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    trainerApi.clients
      .list(api)
      .then((d: any) => setClients(d?.results || d || []))
      .catch(() => {});
  }, [api]);

  const submit = async () => {
    setSubmitting(true);
    try {
      await trainerApi.coachingPlans.create(api, {
        client: Number(form.client),
        title: form.title.trim(),
        start_date: form.start_date,
        duration_weeks: Number(form.duration_weeks),
      });
      showToast("Coaching plan created", "success");
      onCreated();
    } catch (err: any) {
      showToast(err?.message || "Failed to create plan", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const valid = form.client && form.title.trim() && form.start_date && Number(form.duration_weeks) >= 1;

  return (
    <ModalShell title="New Coaching Plan" onClose={onClose}>
      <div className="space-y-3">
        <Field label="Client">
          <select
            value={form.client}
            onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
            style={{ backgroundColor: BRAND.input, borderColor: BRAND.panelLight, color: BRAND.textMain }}
          >
            <option value="">Select a client…</option>
            {clients.map((c) => (
              <option key={c.id} value={c.client} style={{ backgroundColor: BRAND.input }}>
                {c.client_name || `Client #${c.client}`}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Title">
          <input
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
            style={{ backgroundColor: BRAND.input, borderColor: BRAND.panelLight, color: BRAND.textMain }}
            placeholder="e.g. 8-Week Strength Block"
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Start date">
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => setForm((f) => ({ ...f, start_date: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ backgroundColor: BRAND.input, borderColor: BRAND.panelLight, color: BRAND.textMain }}
            />
          </Field>
          <Field label="Duration (weeks)">
            <input
              type="number"
              min={1}
              value={form.duration_weeks}
              onChange={(e) => setForm((f) => ({ ...f, duration_weeks: e.target.value }))}
              className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
              style={{ backgroundColor: BRAND.input, borderColor: BRAND.panelLight, color: BRAND.textMain }}
            />
          </Field>
        </div>
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border"
            style={{ borderColor: BRAND.panelLight, color: BRAND.textMuted }}
          >
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={!valid || submitting}
            className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
            style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Create
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function PlanDetailModal({
  api,
  showToast,
  planId,
  onClose,
  onChanged,
}: CoachingPlansViewProps & { planId: number; onClose: () => void; onChanged: () => void }) {
  const [plan, setPlan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [title, setTitle] = useState("");
  const [savingHeader, setSavingHeader] = useState(false);
  const [addingDay, setAddingDay] = useState(false);
  const [newDayNum, setNewDayNum] = useState("");
  const [newDayType, setNewDayType] = useState("workout");
  const [progress, setProgress] = useState<any>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const p: any = await trainerApi.coachingPlans.detail(api, planId);
      setPlan(p);
      setStatus(p?.status || "active");
      setTitle(p?.title || "");
    } catch (err: any) {
      showToast(err?.message || "Failed to load plan", "error");
    } finally {
      setLoading(false);
    }
  }, [api, planId, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const saveHeader = async () => {
    setSavingHeader(true);
    try {
      await trainerApi.coachingPlans.update(api, planId, { title: title.trim(), status });
      showToast("Plan updated", "success");
      load();
      onChanged();
    } catch (err: any) {
      showToast(err?.message || "Update failed", "error");
    } finally {
      setSavingHeader(false);
    }
  };

  const addDay = async () => {
    try {
      await trainerApi.coachingPlans.createDay(api, planId, {
        day_number: Number(newDayNum),
        day_type: newDayType,
      });
      showToast("Day added", "success");
      setAddingDay(false);
      setNewDayNum("");
      load();
    } catch (err: any) {
      showToast(err?.message || "Failed to add day", "error");
    }
  };

  const loadProgress = async () => {
    try {
      const p: any = await trainerApi.coachingPlans.progress(api, planId);
      setProgress(p?.coaching_progress ?? p);
    } catch (err: any) {
      showToast(err?.message || "Failed to load progress", "error");
    }
  };

  const days: any[] = plan?.days || [];

  return (
    <ModalShell wide title={loading ? "Coaching Plan" : plan?.title || "Coaching Plan"} onClose={onClose}>
      {loading ? (
        <Spinner />
      ) : !plan ? (
        <Empty icon={CalendarRange} label="Plan not found." />
      ) : (
        <div className="space-y-5">
          {/* Header edit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Field label="Title">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                style={{ backgroundColor: BRAND.input, borderColor: BRAND.panelLight, color: BRAND.textMain }}
              />
            </Field>
            <Field label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                style={{ backgroundColor: BRAND.input, borderColor: BRAND.panelLight, color: BRAND.textMain }}
              >
                {PLAN_STATUSES.map((s) => (
                  <option key={s} value={s} style={{ backgroundColor: BRAND.input }}>
                    {titleCase(s)}
                  </option>
                ))}
              </select>
            </Field>
            <div className="flex items-end">
              <button
                onClick={saveHeader}
                disabled={savingHeader}
                className="w-full px-4 py-2 rounded-xl text-sm font-bold transition disabled:opacity-50"
                style={{ backgroundColor: BRAND.primary, color: "#fff" }}
              >
                {savingHeader ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-4 text-xs" style={{ color: BRAND.textMuted }}>
            <span>Client: {plan.client_name || `#${plan.client}`}</span>
            <span>
              {formatDate(plan.start_date)} → {plan.end_date ? formatDate(plan.end_date) : "—"}
            </span>
            <span>{plan.duration_weeks} weeks</span>
            <button onClick={loadProgress} className="underline" style={{ color: BRAND.accent }}>
              Load progress
            </button>
          </div>

          {progress && (
            <div className="p-3 rounded-2xl text-xs" style={{ backgroundColor: BRAND.input, color: BRAND.textMuted }}>
              <pre className="whitespace-pre-wrap break-words">{JSON.stringify(progress, null, 2)}</pre>
            </div>
          )}

          {/* Days */}
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-sm" style={{ color: BRAND.textMain }}>
              Days ({days.length})
            </h4>
            <button
              onClick={() => setAddingDay((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: BRAND.input, color: BRAND.textMuted }}
            >
              <Plus size={13} /> Add day
            </button>
          </div>

          {addingDay && (
            <div className="flex flex-wrap items-end gap-3 p-3 rounded-2xl" style={{ backgroundColor: BRAND.input }}>
              <Field label="Day number">
                <input
                  type="number"
                  min={1}
                  value={newDayNum}
                  onChange={(e) => setNewDayNum(e.target.value)}
                  className="w-28 px-3 py-2 rounded-xl text-sm border outline-none"
                  style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight, color: BRAND.textMain }}
                />
              </Field>
              <Field label="Type">
                <select
                  value={newDayType}
                  onChange={(e) => setNewDayType(e.target.value)}
                  className="px-3 py-2 rounded-xl text-sm border outline-none"
                  style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight, color: BRAND.textMain }}
                >
                  {DAY_TYPES.map((t) => (
                    <option key={t} value={t} style={{ backgroundColor: BRAND.input }}>
                      {titleCase(t)}
                    </option>
                  ))}
                </select>
              </Field>
              <button
                onClick={addDay}
                disabled={!newDayNum}
                className="px-4 py-2 rounded-xl text-sm font-bold disabled:opacity-50"
                style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}
              >
                Add
              </button>
            </div>
          )}

          {days.length === 0 ? (
            <p className="text-sm" style={{ color: BRAND.textDim }}>
              No days scheduled yet.
            </p>
          ) : (
            <div className="space-y-2">
              {days
                .slice()
                .sort((a, b) => a.day_number - b.day_number)
                .map((d) => (
                  <DayCard key={d.id} api={api} showToast={showToast} day={d} onChanged={load} />
                ))}
            </div>
          )}
        </div>
      )}
    </ModalShell>
  );
}

function DayCard({
  api,
  showToast,
  day,
  onChanged,
}: CoachingPlansViewProps & { day: any; onChanged: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const [videoId, setVideoId] = useState("");
  const [mealType, setMealType] = useState("breakfast");
  const [mealNote, setMealNote] = useState("");
  const [busy, setBusy] = useState(false);
  const videos: any[] = day.studio_videos_detail || [];
  const meals: any[] = day.meal_recommendations || [];

  const attachVideo = async () => {
    if (!videoId.trim()) return;
    setBusy(true);
    try {
      await trainerApi.coachingDays.attachVideo(api, day.id, videoId.trim());
      showToast("Video attached", "success");
      setVideoId("");
      onChanged();
    } catch (err: any) {
      showToast(err?.message || "Attach failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const addMeal = async () => {
    if (!mealNote.trim()) return;
    setBusy(true);
    try {
      await trainerApi.coachingDays.addMeal(api, day.id, { meal_type: mealType, note: mealNote.trim() });
      showToast("Meal added", "success");
      setMealNote("");
      onChanged();
    } catch (err: any) {
      showToast(err?.message || "Add meal failed", "error");
    } finally {
      setBusy(false);
    }
  };

  const deleteDay = async () => {
    setBusy(true);
    try {
      await trainerApi.coachingDays.delete(api, day.id);
      showToast("Day removed", "success");
      onChanged();
    } catch (err: any) {
      showToast(err?.message || "Delete failed (day may have started)", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border overflow-hidden" style={{ borderColor: BRAND.panelLight, backgroundColor: BRAND.surface }}>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-3 p-3 text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold" style={{ color: BRAND.textMain }}>
            Day {day.day_number}
          </span>
          <Badge color={day.day_type === "rest" ? "gray" : "purple"}>{titleCase(day.day_type)}</Badge>
          {day.date && (
            <span className="text-xs" style={{ color: BRAND.textDim }}>
              {formatDate(day.date)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 text-xs" style={{ color: BRAND.textDim }}>
          <span className="flex items-center gap-1">
            <Video size={12} /> {videos.length}
          </span>
          <span className="flex items-center gap-1">
            <Utensils size={12} /> {meals.length}
          </span>
        </div>
      </button>

      {expanded && (
        <div className="p-3 pt-0 space-y-3">
          {day.trainer_note && (
            <p className="text-xs italic" style={{ color: BRAND.textMuted }}>
              “{day.trainer_note}”
            </p>
          )}

          {/* Videos */}
          <div>
            <p className="text-[10px] uppercase tracking-wide font-bold mb-1" style={{ color: BRAND.textDim }}>
              Videos
            </p>
            {videos.map((v) => (
              <div key={v.id} className="flex items-center justify-between text-xs py-1" style={{ color: BRAND.textMain }}>
                <span>{v.title}</span>
                <button
                  onClick={async () => {
                    try {
                      await trainerApi.coachingDays.detachVideo(api, day.id, v.id);
                      onChanged();
                    } catch (err: any) {
                      showToast(err?.message || "Detach failed", "error");
                    }
                  }}
                  style={{ color: BRAND.error }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            <div className="flex gap-2 mt-1">
              <input
                value={videoId}
                onChange={(e) => setVideoId(e.target.value)}
                placeholder="Studio video ID (UUID)"
                className="flex-1 px-2.5 py-1.5 rounded-lg text-xs border outline-none"
                style={{ backgroundColor: BRAND.input, borderColor: BRAND.panelLight, color: BRAND.textMain }}
              />
              <button
                onClick={attachVideo}
                disabled={busy || !videoId.trim()}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                style={{ backgroundColor: BRAND.primary, color: "#fff" }}
              >
                Attach
              </button>
            </div>
          </div>

          {/* Meals */}
          <div>
            <p className="text-[10px] uppercase tracking-wide font-bold mb-1" style={{ color: BRAND.textDim }}>
              Meals
            </p>
            {meals.map((m) => (
              <div key={m.id} className="flex items-center justify-between text-xs py-1" style={{ color: BRAND.textMain }}>
                <span>
                  <b>{titleCase(m.meal_type)}:</b> {m.recipe_detail?.name || m.note}
                </span>
                <button
                  onClick={async () => {
                    try {
                      await trainerApi.coachingDays.deleteMeal(api, m.id);
                      onChanged();
                    } catch (err: any) {
                      showToast(err?.message || "Delete failed", "error");
                    }
                  }}
                  style={{ color: BRAND.error }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            <div className="flex gap-2 mt-1">
              <select
                value={mealType}
                onChange={(e) => setMealType(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg text-xs border outline-none"
                style={{ backgroundColor: BRAND.input, borderColor: BRAND.panelLight, color: BRAND.textMain }}
              >
                {MEAL_TYPES.map((t) => (
                  <option key={t} value={t} style={{ backgroundColor: BRAND.input }}>
                    {titleCase(t)}
                  </option>
                ))}
              </select>
              <input
                value={mealNote}
                onChange={(e) => setMealNote(e.target.value)}
                placeholder="Meal note"
                className="flex-1 px-2.5 py-1.5 rounded-lg text-xs border outline-none"
                style={{ backgroundColor: BRAND.input, borderColor: BRAND.panelLight, color: BRAND.textMain }}
              />
              <button
                onClick={addMeal}
                disabled={busy || !mealNote.trim()}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold disabled:opacity-50"
                style={{ backgroundColor: BRAND.primary, color: "#fff" }}
              >
                Add
              </button>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={deleteDay}
              disabled={busy}
              className="flex items-center gap-1 text-xs font-semibold disabled:opacity-50"
              style={{ color: BRAND.error }}
            >
              <Trash2 size={13} /> Remove day
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════ PACKAGES ════════════════════════════ */

function PackagesTab({ api, showToast }: CoachingPlansViewProps) {
  const [rows, setRows] = useState<any[]>([]);
  const [meta, setMeta] = useState<{ next: string | null; previous: string | null }>({ next: null, previous: null });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({ name: "", duration_weeks: 4, price: "", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await trainerApi.coachingPackages.list(api, page);
      setRows(res?.results || []);
      setMeta({ next: res?.next ?? null, previous: res?.previous ?? null });
    } catch (err: any) {
      showToast(err?.message || "Failed to load packages", "error");
    } finally {
      setLoading(false);
    }
  }, [api, page, showToast]);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    try {
      await trainerApi.coachingPackages.create(api, {
        name: form.name.trim(),
        duration_weeks: Number(form.duration_weeks),
        price: form.price,
        description: form.description.trim(),
      });
      showToast("Package created", "success");
      setCreating(false);
      setForm({ name: "", duration_weeks: 4, price: "", description: "" });
      setPage(1);
      load();
    } catch (err: any) {
      showToast(err?.message || "Create failed", "error");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition"
          style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}
        >
          <Plus size={16} /> New package
        </button>
      </div>

      {loading ? (
        <Spinner />
      ) : rows.length === 0 ? (
        <Empty icon={Package} label="No coaching packages yet." />
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {rows.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-3xl border shadow-xl"
                style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold" style={{ color: BRAND.textMain }}>
                    {p.name}
                  </h3>
                  <Badge color={p.is_active ? "green" : "gray"}>{p.is_active ? "Active" : "Inactive"}</Badge>
                </div>
                <p className="text-2xl font-black mb-1" style={{ color: BRAND.accent }}>
                  {money(p.price, p.currency, p.currency_symbol)}
                </p>
                <p className="text-xs" style={{ color: BRAND.textDim }}>
                  {p.duration_weeks} weeks
                </p>
                {p.description && (
                  <p className="text-xs mt-2" style={{ color: BRAND.textMuted }}>
                    {p.description}
                  </p>
                )}
                <button
                  onClick={async () => {
                    try {
                      await trainerApi.coachingPackages.update(api, p.id, { is_active: !p.is_active });
                      showToast("Package updated", "success");
                      load();
                    } catch (err: any) {
                      showToast(err?.message || "Update failed", "error");
                    }
                  }}
                  className="mt-3 text-xs font-semibold underline"
                  style={{ color: p.is_active ? BRAND.error : BRAND.success }}
                >
                  {p.is_active ? "Deactivate" : "Activate"}
                </button>
              </div>
            ))}
          </div>
          <Pagination
            prevUrl={meta.previous}
            nextUrl={meta.next}
            onPrev={() => setPage((p) => Math.max(1, p - 1))}
            onNext={() => setPage((p) => p + 1)}
          />
        </>
      )}

      {creating && (
        <ModalShell title="New Coaching Package" onClose={() => setCreating(false)}>
          <div className="space-y-3">
            <Field label="Name">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                style={{ backgroundColor: BRAND.input, borderColor: BRAND.panelLight, color: BRAND.textMain }}
              />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Duration (weeks)">
                <input
                  type="number"
                  min={1}
                  value={form.duration_weeks}
                  onChange={(e) => setForm((f) => ({ ...f, duration_weeks: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                  style={{ backgroundColor: BRAND.input, borderColor: BRAND.panelLight, color: BRAND.textMain }}
                />
              </Field>
              <Field label="Price">
                <input
                  type="number"
                  step="0.01"
                  min={0.01}
                  value={form.price}
                  onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl text-sm border outline-none"
                  style={{ backgroundColor: BRAND.input, borderColor: BRAND.panelLight, color: BRAND.textMain }}
                />
              </Field>
            </div>
            <Field label="Description">
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 rounded-xl text-sm border outline-none resize-none"
                style={{ backgroundColor: BRAND.input, borderColor: BRAND.panelLight, color: BRAND.textMain }}
              />
            </Field>
            <div className="flex gap-3">
              <button
                onClick={() => setCreating(false)}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border"
                style={{ borderColor: BRAND.panelLight, color: BRAND.textMuted }}
              >
                Cancel
              </button>
              <button
                onClick={create}
                disabled={!form.name.trim() || !form.price || Number(form.duration_weeks) < 1}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50"
                style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}
              >
                Create
              </button>
            </div>
          </div>
        </ModalShell>
      )}
    </div>
  );
}

/* ════════════════════════════ shared bits ════════════════════════════ */

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wide font-bold" style={{ color: BRAND.textMuted }}>
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Empty({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div
      className="p-10 text-center rounded-3xl border"
      style={{ borderColor: BRAND.panelLight, backgroundColor: BRAND.panel }}
    >
      <Icon size={26} className="mx-auto mb-2" style={{ color: BRAND.textDim }} />
      <p className="text-sm" style={{ color: BRAND.textMuted }}>
        {label}
      </p>
    </div>
  );
}

function ModalShell({
  title,
  onClose,
  children,
  wide,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className={`w-full ${wide ? "max-w-2xl" : "max-w-lg"} max-h-[88vh] overflow-y-auto custom-scrollbar rounded-3xl border shadow-2xl`}
        style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sticky top-0 flex items-center justify-between p-5 border-b z-10"
          style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight }}
        >
          <h3 className="font-bold flex items-center gap-2" style={{ color: BRAND.textMain }}>
            <ClipboardList size={16} style={{ color: BRAND.accent }} /> {title}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition">
            <X size={18} style={{ color: BRAND.textMuted }} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
