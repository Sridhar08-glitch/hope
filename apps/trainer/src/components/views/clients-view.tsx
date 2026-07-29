"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useState } from "react";
import { Search, Target, X, Loader2, Plus } from "lucide-react";
import { BRAND, Badge, Spinner } from "@holora/ui";
import { formatDate } from "@holora/utils";
import type { ApiClient } from "@holora/api-client";
import { trainerApi } from "@/lib/trainer-api";

interface ClientsViewProps {
  clients: any[];
  loading: boolean;
  clientSearch: string;
  onSearchChange: (value: string) => void;
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
}

const titleCase = (s?: string) => (s || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function ClientsView({ clients, loading, clientSearch, onSearchChange, api, showToast }: ClientsViewProps) {
  const [goalsClient, setGoalsClient] = useState<any>(null);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#281247] p-4 rounded-3xl border border-purple-900/40 shadow-lg">
        <h2 className="text-xl font-bold text-white px-2">Client Roster</h2>
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input
            type="text"
            value={clientSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search clients..."
            className="w-full bg-purple-900/40 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-2xl text-sm focus:outline-none focus:border-purple-500 transition-colors shadow-inner"
          />
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients
            .filter(
              (c) =>
                !clientSearch ||
                (c.first_name + " " + c.last_name + " " + (c.email || ""))
                  .toLowerCase()
                  .includes(clientSearch.toLowerCase())
            )
            .map((client) => (
              <div
                key={client.id}
                className="bg-[#281247] border border-purple-900/40 p-6 rounded-3xl shadow-xl hover:border-purple-500/30 transition-all group relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-purple-600/5 rounded-full blur-2xl group-hover:bg-purple-600/10 transition" />
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-xl font-bold text-yellow-400 border border-slate-700 group-hover:border-purple-500/50 shadow-[0_0_10px_rgba(0,0,0,0.5)] transition-colors">
                      {client.client_name
                        ?.split(" ")
                        .map((n: string) => n[0])
                        .join("") || "C"}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-lg">{client.client_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            client.status === "active"
                              ? "bg-cyan-400 shadow-[0_0_5px_rgba(126,34,206,0.8)]"
                              : "bg-slate-600"
                          }`}
                        />
                        <span className="text-xs text-slate-400 capitalize">{client.status}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-purple-900/40/50 p-4 rounded-2xl border border-purple-900/40">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Joined</div>
                    <div className="text-sm text-slate-200 font-semibold">
                      {client.joined_at?.substring(0, 10)}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Category</div>
                    <div className="text-sm text-yellow-400 font-bold">{client.category || "—"}</div>
                  </div>
                </div>

                <button
                  onClick={() => setGoalsClient(client)}
                  className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition"
                  style={{ backgroundColor: BRAND.input, color: BRAND.accent }}
                >
                  <Target size={15} /> Goals
                </button>
              </div>
            ))}
        </div>
      )}

      {goalsClient && (
        <GoalsModal api={api} showToast={showToast} client={goalsClient} onClose={() => setGoalsClient(null)} />
      )}
    </div>
  );
}

/* ── Goals modal ─────────────────────────────────────────────────────── */

const GOAL_TYPES = [
  { value: "CUSTOM_MANUAL", label: "Custom / manual" },
  { value: "WORKOUT_CONSISTENCY", label: "Workout consistency" },
  { value: "STRENGTH_PR", label: "Strength PR" },
];

function GoalsModal({
  api,
  showToast,
  client,
  onClose,
}: {
  api: ApiClient;
  showToast: (m: string, t: "success" | "error") => void;
  client: any;
  onClose: () => void;
}) {
  // Goals endpoints key off the client USER id — exposed as `client` on the roster row.
  const clientId: number = client.client ?? client.client_id ?? client.id;
  const [tab, setTab] = useState<"goals" | "suggest">("goals");
  const [goals, setGoals] = useState<any[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const data: any = await trainerApi.clientGoals.list(api, clientId);
      setGoals(Array.isArray(data) ? data : data?.data || data?.results || []);
    } catch (e: any) {
      setErr(e?.message || "Unable to load goals (client may not have shared workout data).");
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [api, clientId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-lg max-h-[88vh] overflow-y-auto custom-scrollbar rounded-3xl border shadow-2xl"
        style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="sticky top-0 flex items-center justify-between p-5 border-b z-10"
          style={{ backgroundColor: BRAND.panel, borderColor: BRAND.panelLight }}
        >
          <h3 className="font-bold flex items-center gap-2" style={{ color: BRAND.textMain }}>
            <Target size={16} style={{ color: BRAND.accent }} /> {client.client_name || "Client"} — Goals
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition">
            <X size={18} style={{ color: BRAND.textMuted }} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-2">
            {(["goals", "suggest"] as const).map((t) => {
              const active = tab === t;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold transition border"
                  style={{
                    backgroundColor: active ? BRAND.primary : BRAND.input,
                    borderColor: active ? BRAND.primary : BRAND.panelLight,
                    color: active ? "#fff" : BRAND.textMuted,
                  }}
                >
                  {t === "goals" ? "Current goals" : "Suggest a goal"}
                </button>
              );
            })}
          </div>

          {tab === "goals" ? (
            loading ? (
              <Spinner />
            ) : err ? (
              <p className="text-sm text-center py-6" style={{ color: BRAND.textMuted }}>
                {err}
              </p>
            ) : goals && goals.length > 0 ? (
              <div className="space-y-2">
                {goals.map((g) => (
                  <div key={g.id} className="p-3 rounded-2xl" style={{ backgroundColor: BRAND.input }}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold" style={{ color: BRAND.textMain }}>
                        {g.title || titleCase(g.goal_type)}
                      </span>
                      <Badge color={g.status === "ACHIEVED" ? "green" : g.status === "ACTIVE" ? "blue" : "gray"}>
                        {titleCase(g.status)}
                      </Badge>
                    </div>
                    {g.description && (
                      <p className="text-xs mt-1" style={{ color: BRAND.textMuted }}>
                        {g.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3 mt-2 text-[11px]" style={{ color: BRAND.textDim }}>
                      {g.target_value != null && (
                        <span>
                          Target: {g.target_value} {g.unit || ""}
                        </span>
                      )}
                      {g.deadline && <span>Due: {formatDate(g.deadline)}</span>}
                      {g.exercise_name && <span>{g.exercise_name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-center py-6" style={{ color: BRAND.textDim }}>
                No goals visible for this client yet.
              </p>
            )
          ) : (
            <SuggestGoalForm
              api={api}
              showToast={showToast}
              clientId={clientId}
              onDone={() => {
                setTab("goals");
                load();
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function SuggestGoalForm({
  api,
  showToast,
  clientId,
  onDone,
}: {
  api: ApiClient;
  showToast: (m: string, t: "success" | "error") => void;
  clientId: number;
  onDone: () => void;
}) {
  const [goalType, setGoalType] = useState("CUSTOM_MANUAL");
  const [form, setForm] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async () => {
    setSubmitting(true);
    try {
      const payload: Record<string, any> = { goal_type: goalType, title: form.title?.trim() };
      if (form.description) payload.description = form.description.trim();
      if (form.deadline_days) payload.deadline_days = Number(form.deadline_days);

      if (goalType === "CUSTOM_MANUAL") {
        if (form.target_value) payload.target_value = Number(form.target_value);
        if (form.unit) payload.unit = form.unit;
      } else if (goalType === "WORKOUT_CONSISTENCY") {
        const mode = form.consistency_mode || "TOTAL_IN_WINDOW";
        payload.consistency_mode = mode;
        if (mode === "TOTAL_IN_WINDOW") {
          payload.target_value = Number(form.target_value);
          payload.window_days = Number(form.window_days);
        } else {
          payload.per_week_target = Number(form.per_week_target);
          payload.duration_weeks = Number(form.duration_weeks);
        }
      } else if (goalType === "STRENGTH_PR") {
        const metric = form.metric || "MAX_WEIGHT";
        payload.metric = metric;
        payload.exercise = Number(form.exercise);
        payload.target_value = Number(form.target_value);
        if (metric === "MAX_REPS_AT_WEIGHT") payload.target_weight_kg = Number(form.target_weight_kg);
      }

      await trainerApi.clientGoals.suggest(api, clientId, payload);
      showToast("Goal suggested to client", "success");
      onDone();
    } catch (e: any) {
      showToast(e?.message || "Failed to suggest goal", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = { backgroundColor: BRAND.input, borderColor: BRAND.panelLight, color: BRAND.textMain };
  const canSubmit = !!form.title?.trim();
  const mode = form.consistency_mode || "TOTAL_IN_WINDOW";
  const metric = form.metric || "MAX_WEIGHT";

  return (
    <div className="space-y-3">
      <FieldLabel label="Goal type">
        <select value={goalType} onChange={(e) => setGoalType(e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm border outline-none" style={inputStyle}>
          {GOAL_TYPES.map((g) => (
            <option key={g.value} value={g.value} style={{ backgroundColor: BRAND.input }}>
              {g.label}
            </option>
          ))}
        </select>
      </FieldLabel>

      <FieldLabel label="Title">
        <input value={form.title || ""} onChange={(e) => set("title", e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm border outline-none" style={inputStyle} placeholder="e.g. Squat 100kg" />
      </FieldLabel>

      {goalType === "CUSTOM_MANUAL" && (
        <div className="grid grid-cols-2 gap-3">
          <FieldLabel label="Target value (optional)">
            <input type="number" value={form.target_value || ""} onChange={(e) => set("target_value", e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm border outline-none" style={inputStyle} />
          </FieldLabel>
          <FieldLabel label="Unit">
            <input value={form.unit || ""} onChange={(e) => set("unit", e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm border outline-none" style={inputStyle} placeholder="kg, reps…" />
          </FieldLabel>
        </div>
      )}

      {goalType === "WORKOUT_CONSISTENCY" && (
        <>
          <FieldLabel label="Consistency mode">
            <select value={mode} onChange={(e) => set("consistency_mode", e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm border outline-none" style={inputStyle}>
              <option value="TOTAL_IN_WINDOW">Total in window</option>
              <option value="PER_WEEK_TARGET">Per-week target</option>
            </select>
          </FieldLabel>
          {mode === "TOTAL_IN_WINDOW" ? (
            <div className="grid grid-cols-2 gap-3">
              <FieldLabel label="Target sessions">
                <input type="number" value={form.target_value || ""} onChange={(e) => set("target_value", e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm border outline-none" style={inputStyle} />
              </FieldLabel>
              <FieldLabel label="Window (days)">
                <input type="number" value={form.window_days || ""} onChange={(e) => set("window_days", e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm border outline-none" style={inputStyle} />
              </FieldLabel>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <FieldLabel label="Per-week target">
                <input type="number" value={form.per_week_target || ""} onChange={(e) => set("per_week_target", e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm border outline-none" style={inputStyle} />
              </FieldLabel>
              <FieldLabel label="Duration (weeks)">
                <input type="number" value={form.duration_weeks || ""} onChange={(e) => set("duration_weeks", e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm border outline-none" style={inputStyle} />
              </FieldLabel>
            </div>
          )}
        </>
      )}

      {goalType === "STRENGTH_PR" && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <FieldLabel label="Metric">
              <select value={metric} onChange={(e) => set("metric", e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm border outline-none" style={inputStyle}>
                <option value="MAX_WEIGHT">Max weight</option>
                <option value="ESTIMATED_1RM">Estimated 1RM</option>
                <option value="MAX_REPS_AT_WEIGHT">Max reps at weight</option>
              </select>
            </FieldLabel>
            <FieldLabel label="Exercise ID">
              <input type="number" value={form.exercise || ""} onChange={(e) => set("exercise", e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm border outline-none" style={inputStyle} />
            </FieldLabel>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FieldLabel label="Target value">
              <input type="number" value={form.target_value || ""} onChange={(e) => set("target_value", e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm border outline-none" style={inputStyle} />
            </FieldLabel>
            {metric === "MAX_REPS_AT_WEIGHT" && (
              <FieldLabel label="Target weight (kg)">
                <input type="number" value={form.target_weight_kg || ""} onChange={(e) => set("target_weight_kg", e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm border outline-none" style={inputStyle} />
              </FieldLabel>
            )}
          </div>
        </>
      )}

      <FieldLabel label="Deadline (days from now, optional)">
        <input type="number" value={form.deadline_days || ""} onChange={(e) => set("deadline_days", e.target.value)} className="w-full px-3 py-2 rounded-xl text-sm border outline-none" style={inputStyle} />
      </FieldLabel>

      <button
        onClick={submit}
        disabled={!canSubmit || submitting}
        className="w-full px-4 py-2.5 rounded-xl text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-2"
        style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />} Suggest goal
      </button>
    </div>
  );
}

function FieldLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-wide font-bold" style={{ color: BRAND.textMuted }}>
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
