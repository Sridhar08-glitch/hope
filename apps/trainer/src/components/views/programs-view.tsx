"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { BRAND, Spinner, Badge, Button } from "@holora/ui";
import {
  ListVideo,
  Plus,
  Edit3,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Film,
  Calendar,
  Dumbbell,
  Tag,
  Crown,
  ArrowUp,
  ArrowDown,
  X,
  Search,
  Check,
  Coffee,
} from "lucide-react";
import { formatDate } from "@holora/utils";

/* ── types ── */

interface ProgramsViewProps {
  programs: any[];
  loading: boolean;
  selectedProgram: any | null;
  availableVideos: any[];
  onCreateProgram: (data: any) => void;
  onUpdateProgram: (id: number, data: any) => void;
  onDeleteProgram: (id: number) => void;
  onPublishProgram: (id: number) => void;
  onUnpublishProgram: (id: number) => void;
  onDuplicateProgram: (id: number) => void;
  onSelectProgram: (program: any | null) => void;
  onCreateDay: (programId: number, data: any) => void;
  onUpdateDay: (programId: number, dayNumber: number, data: any) => void;
  onDeleteDay: (programId: number, dayNumber: number) => void;
  onAddVideoToDay: (
    programId: number,
    dayNumber: number,
    data: any
  ) => void;
  onRemoveVideoFromDay: (
    programId: number,
    dayNumber: number,
    videoId: number
  ) => void;
  onReorderDayVideos: (
    programId: number,
    dayNumber: number,
    order: number[]
  ) => void;
  showToast: (message: string, type: "success" | "error") => void;
}

interface ProgramFormData {
  title: string;
  description: string;
  duration_weeks: number;
  difficulty: string;
  equipment: string[];
  tags: string[];
  is_premium: boolean;
  cover_image_url: string;
}

/* ── constants ── */

const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
];

const DIFFICULTY_COLORS: Record<string, "green" | "yellow" | "red"> = {
  beginner: "green",
  intermediate: "yellow",
  advanced: "red",
};

const EMPTY_FORM: ProgramFormData = {
  title: "",
  description: "",
  duration_weeks: 4,
  difficulty: "beginner",
  equipment: [],
  tags: [],
  is_premium: false,
  cover_image_url: "",
};

/* ── component ── */

export function ProgramsView({
  programs,
  loading,
  selectedProgram,
  availableVideos,
  onCreateProgram,
  onUpdateProgram,
  onDeleteProgram,
  onPublishProgram,
  onUnpublishProgram,
  onDuplicateProgram,
  onSelectProgram,
  onCreateDay,
  onUpdateDay,
  onDeleteDay,
  onAddVideoToDay,
  onRemoveVideoFromDay,
  onReorderDayVideos,
  showToast,
}: ProgramsViewProps) {
  /* ── state ── */
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<any | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [formData, setFormData] = useState<ProgramFormData>({ ...EMPTY_FORM });
  const [tagInput, setTagInput] = useState("");
  const [equipmentInput, setEquipmentInput] = useState("");

  /* detail mode state */
  const [expandedDays, setExpandedDays] = useState<Set<number>>(new Set());
  const [videoPickerDay, setVideoPickerDay] = useState<number | null>(null);
  const [videoSearch, setVideoSearch] = useState("");
  const [videoNotes, setVideoNotes] = useState("");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [deleteDayConfirm, setDeleteDayConfirm] = useState<number | null>(null);

  /* ── helpers ── */

  function resetForm() {
    setFormData({ ...EMPTY_FORM });
    setTagInput("");
    setEquipmentInput("");
  }

  function openCreate() {
    resetForm();
    setEditingProgram(null);
    setShowCreateModal(true);
  }

  function openEdit(program: any) {
    setFormData({
      title: program.title ?? "",
      description: program.description ?? "",
      duration_weeks: program.duration_weeks ?? 4,
      difficulty: program.difficulty ?? "beginner",
      equipment: Array.isArray(program.equipment) ? [...program.equipment] : [],
      tags: Array.isArray(program.tags) ? [...program.tags] : [],
      is_premium: program.is_premium ?? false,
      cover_image_url: program.cover_image_url ?? "",
    });
    setEditingProgram(program);
    setShowCreateModal(true);
  }

  function handleSubmitForm() {
    if (!formData.title.trim()) {
      showToast("Program title is required", "error");
      return;
    }
    if (editingProgram) {
      onUpdateProgram(editingProgram.id, formData);
    } else {
      onCreateProgram(formData);
    }
    setShowCreateModal(false);
    resetForm();
    setEditingProgram(null);
  }

  function addTag() {
    const value = tagInput.trim();
    if (value && !formData.tags.includes(value)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, value] }));
    }
    setTagInput("");
  }

  function removeTag(tag: string) {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((t) => t !== tag),
    }));
  }

  function addEquipment() {
    const value = equipmentInput.trim();
    if (value && !formData.equipment.includes(value)) {
      setFormData((prev) => ({
        ...prev,
        equipment: [...prev.equipment, value],
      }));
    }
    setEquipmentInput("");
  }

  function removeEquipment(item: string) {
    setFormData((prev) => ({
      ...prev,
      equipment: prev.equipment.filter((e) => e !== item),
    }));
  }

  function toggleDay(dayNumber: number) {
    setExpandedDays((prev) => {
      const next = new Set(prev);
      if (next.has(dayNumber)) next.delete(dayNumber);
      else next.add(dayNumber);
      return next;
    });
  }

  function handleReorder(
    day: any,
    videoIndex: number,
    direction: "up" | "down"
  ) {
    const videos = Array.isArray(day?.videos) ? [...day.videos] : [];
    if (!videos.length) return;
    if (
      (direction === "up" && videoIndex === 0) ||
      (direction === "down" && videoIndex === videos.length - 1)
    ) {
      return;
    }
    const swapIdx = direction === "up" ? videoIndex - 1 : videoIndex + 1;
    [videos[videoIndex], videos[swapIdx]] = [videos[swapIdx], videos[videoIndex]];
    const newOrder = videos.map((v: any) => v.video_id ?? v.id);
    onReorderDayVideos(selectedProgram.id, day.day_number, newOrder);
  }

  function handleAddVideoToDay() {
    if (!selectedVideoId || videoPickerDay === null) return;
    onAddVideoToDay(selectedProgram.id, videoPickerDay, {
      video_id: selectedVideoId,
      notes: videoNotes.trim() || undefined,
    });
    setVideoPickerDay(null);
    setSelectedVideoId(null);
    setVideoNotes("");
    setVideoSearch("");
  }

  /* ── loading ── */

  if (loading) return <Spinner />;

  /* ── detail / builder mode ── */

  if (selectedProgram) {
    const days: any[] = Array.isArray(selectedProgram.days)
      ? [...selectedProgram.days].sort(
          (a: any, b: any) => a.day_number - b.day_number
        )
      : [];

    const publishedVideos = (availableVideos ?? []).filter(
      (v: any) => v.status === "published" || v.status === "PUBLISHED"
    );

    const filteredVideos = publishedVideos.filter((v: any) =>
      (v.title ?? "")
        .toLowerCase()
        .includes(videoSearch.toLowerCase())
    );

    return (
      <div className="space-y-6 animate-in fade-in duration-500 pb-20">
        {/* ── header ── */}
        <div
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl p-5 border border-purple-900/40 shadow-lg"
          style={{ backgroundColor: BRAND.panel }}
        >
          <div className="flex items-center gap-3">
            <button
              onClick={() => onSelectProgram(null)}
              className="p-2 rounded-xl transition hover:bg-black/20"
              aria-label="Go back"
            >
              <ArrowLeft size={20} style={{ color: BRAND.textMain }} />
            </button>
            <h2
              className="text-xl font-bold truncate max-w-xs sm:max-w-md"
              style={{ color: BRAND.textMain }}
            >
              {selectedProgram.title || "Untitled Program"}
            </h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {selectedProgram.is_published ? (
              <Button
                color="yellow"
                small
                onClick={() => onUnpublishProgram(selectedProgram.id)}
              >
                <span className="flex items-center gap-1.5">
                  <EyeOff size={14} /> Unpublish
                </span>
              </Button>
            ) : (
              <Button
                color="green"
                small
                onClick={() => onPublishProgram(selectedProgram.id)}
              >
                <span className="flex items-center gap-1.5">
                  <Eye size={14} /> Publish
                </span>
              </Button>
            )}
            <Button
              color="gray"
              small
              onClick={() => openEdit(selectedProgram)}
            >
              <span className="flex items-center gap-1.5">
                <Edit3 size={14} /> Edit
              </span>
            </Button>
          </div>
        </div>

        {/* ── program info card ── */}
        <div
          className="rounded-3xl p-6 border border-purple-900/40 shadow-xl"
          style={{ backgroundColor: BRAND.panel }}
        >
          {selectedProgram.description && (
            <p
              className="text-sm mb-4 leading-relaxed"
              style={{ color: BRAND.textMuted }}
            >
              {selectedProgram.description}
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Calendar size={14} style={{ color: BRAND.primary }} />
              <span className="text-sm" style={{ color: BRAND.textMuted }}>
                {selectedProgram.duration_weeks ?? 0} weeks
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Dumbbell size={14} style={{ color: BRAND.primary }} />
              <Badge
                color={
                  DIFFICULTY_COLORS[selectedProgram.difficulty] ?? "gray"
                }
              >
                {selectedProgram.difficulty ?? "N/A"}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <ListVideo size={14} style={{ color: BRAND.primary }} />
              <span className="text-sm" style={{ color: BRAND.textMuted }}>
                {selectedProgram.day_count ?? days.length} days
              </span>
            </div>
            {selectedProgram.is_premium && (
              <div className="flex items-center gap-2">
                <Crown size={14} style={{ color: BRAND.accent }} />
                <span
                  className="text-sm font-medium"
                  style={{ color: BRAND.accent }}
                >
                  Premium
                </span>
              </div>
            )}
          </div>

          {/* equipment */}
          {Array.isArray(selectedProgram.equipment) &&
            selectedProgram.equipment.length > 0 && (
              <div className="mb-3">
                <span
                  className="text-xs uppercase tracking-wider font-semibold mr-2"
                  style={{ color: BRAND.textDim }}
                >
                  Equipment
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedProgram.equipment.map((eq: string) => (
                    <Badge key={eq} color="purple">
                      {eq}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

          {/* tags */}
          {Array.isArray(selectedProgram.tags) &&
            selectedProgram.tags.length > 0 && (
              <div>
                <span
                  className="text-xs uppercase tracking-wider font-semibold mr-2"
                  style={{ color: BRAND.textDim }}
                >
                  Tags
                </span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {selectedProgram.tags.map((t: string) => (
                    <Badge key={t} color="blue">
                      <span className="flex items-center gap-1">
                        <Tag size={10} /> {t}
                      </span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
        </div>

        {/* ── days section ── */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3
              className="text-lg font-bold"
              style={{ color: BRAND.textMain }}
            >
              Program Days
            </h3>
            <Button
              small
              onClick={() =>
                onCreateDay(selectedProgram.id, {
                  title: `Day ${days.length + 1}`,
                  is_rest_day: false,
                })
              }
            >
              <span className="flex items-center gap-1.5">
                <Plus size={14} /> Add Day
              </span>
            </Button>
          </div>

          {days.length === 0 && (
            <div
              className="rounded-2xl border border-purple-900/40 p-10 text-center"
              style={{ backgroundColor: BRAND.panel }}
            >
              <Calendar
                size={40}
                className="mx-auto mb-3"
                style={{ color: BRAND.textDim }}
              />
              <p
                className="text-sm font-medium mb-1"
                style={{ color: BRAND.textMuted }}
              >
                No days added yet
              </p>
              <p className="text-xs" style={{ color: BRAND.textDim }}>
                Add days to structure your program
              </p>
            </div>
          )}

          {days.map((day: any) => {
            const isExpanded = expandedDays.has(day.day_number);
            const videos: any[] = Array.isArray(day.videos)
              ? [...day.videos].sort(
                  (a: any, b: any) => (a.order ?? 0) - (b.order ?? 0)
                )
              : [];

            return (
              <div
                key={day.id ?? day.day_number}
                className="rounded-2xl border border-purple-900/40 overflow-hidden"
                style={{ backgroundColor: BRAND.panel }}
              >
                {/* day header */}
                <button
                  onClick={() => toggleDay(day.day_number)}
                  className="w-full flex items-center gap-3 px-5 py-4 text-left transition hover:bg-black/10"
                >
                  {isExpanded ? (
                    <ChevronUp
                      size={16}
                      style={{ color: BRAND.textMuted }}
                    />
                  ) : (
                    <ChevronDown
                      size={16}
                      style={{ color: BRAND.textMuted }}
                    />
                  )}
                  <span
                    className="text-xs uppercase tracking-wider font-semibold shrink-0"
                    style={{ color: BRAND.primary }}
                  >
                    Day {day.day_number}
                  </span>
                  <span
                    className="font-semibold truncate"
                    style={{ color: BRAND.textMain }}
                  >
                    {day.title || "Untitled"}
                  </span>
                  {day.is_rest_day && (
                    <Badge color="yellow">
                      <span className="flex items-center gap-1">
                        <Coffee size={10} /> Rest Day
                      </span>
                    </Badge>
                  )}
                  <span
                    className="text-xs ml-auto shrink-0"
                    style={{ color: BRAND.textDim }}
                  >
                    {videos.length} video{videos.length !== 1 ? "s" : ""}
                  </span>

                  {/* delete day - stop propagation to prevent toggle */}
                  <span
                    role="button"
                    tabIndex={0}
                    className="p-1.5 rounded-lg transition hover:bg-red-500/20 shrink-0 ml-2"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeleteDayConfirm(day.day_number);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        setDeleteDayConfirm(day.day_number);
                      }
                    }}
                  >
                    <Trash2 size={14} style={{ color: BRAND.error }} />
                  </span>
                </button>

                {/* day content (expanded) */}
                {isExpanded && (
                  <div
                    className="px-5 pb-5 space-y-4"
                    style={{
                      borderTop: "1px solid rgba(255,255,255,0.05)",
                    }}
                  >
                    {/* editable title */}
                    <div className="pt-4 flex flex-col sm:flex-row gap-3">
                      <div className="flex-1">
                        <label
                          className="block text-xs font-medium mb-1"
                          style={{ color: BRAND.textDim }}
                        >
                          Day Title
                        </label>
                        <input
                          type="text"
                          defaultValue={day.title ?? ""}
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val !== (day.title ?? "")) {
                              onUpdateDay(selectedProgram.id, day.day_number, {
                                title: val,
                              });
                            }
                          }}
                          className="w-full rounded-xl px-3 py-2 text-sm border focus:outline-none transition"
                          style={{
                            backgroundColor: BRAND.input,
                            borderColor: "rgba(126,34,206,0.4)",
                            color: BRAND.textMain,
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <label
                          className="block text-xs font-medium mb-1"
                          style={{ color: BRAND.textDim }}
                        >
                          Notes
                        </label>
                        <input
                          type="text"
                          defaultValue={day.notes ?? ""}
                          placeholder="Optional notes..."
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (val !== (day.notes ?? "")) {
                              onUpdateDay(selectedProgram.id, day.day_number, {
                                notes: val,
                              });
                            }
                          }}
                          className="w-full rounded-xl px-3 py-2 text-sm border focus:outline-none transition"
                          style={{
                            backgroundColor: BRAND.input,
                            borderColor: "rgba(126,34,206,0.4)",
                            color: BRAND.textMain,
                          }}
                        />
                      </div>
                    </div>

                    {/* rest day toggle */}
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div
                        className={`w-9 h-5 rounded-full relative transition-colors ${
                          day.is_rest_day
                            ? "bg-amber-500"
                            : "bg-white/10"
                        }`}
                        onClick={() =>
                          onUpdateDay(selectedProgram.id, day.day_number, {
                            is_rest_day: !day.is_rest_day,
                          })
                        }
                        role="switch"
                        aria-checked={day.is_rest_day}
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            onUpdateDay(
                              selectedProgram.id,
                              day.day_number,
                              { is_rest_day: !day.is_rest_day }
                            );
                          }
                        }}
                      >
                        <span
                          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                            day.is_rest_day
                              ? "translate-x-4"
                              : "translate-x-0.5"
                          }`}
                        />
                      </div>
                      <span
                        className="text-sm"
                        style={{ color: BRAND.textMuted }}
                      >
                        Rest Day
                      </span>
                    </label>

                    {/* videos list */}
                    <div>
                      <p
                        className="text-xs uppercase tracking-wider font-semibold mb-2"
                        style={{ color: BRAND.textDim }}
                      >
                        Videos
                      </p>

                      {videos.length === 0 ? (
                        <p
                          className="text-sm py-4 text-center"
                          style={{ color: BRAND.textDim }}
                        >
                          No videos added to this day yet
                        </p>
                      ) : (
                        <div className="space-y-0">
                          {videos.map((video: any, idx: number) => (
                            <div
                              key={video.id}
                              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-black/20 group"
                              style={{
                                borderBottom:
                                  idx < videos.length - 1
                                    ? "1px solid rgba(255,255,255,0.05)"
                                    : undefined,
                              }}
                            >
                              {/* order number */}
                              <span
                                className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0"
                                style={{
                                  backgroundColor: BRAND.panelLight,
                                  color: BRAND.textMuted,
                                }}
                              >
                                {video.order ?? idx + 1}
                              </span>

                              {/* thumbnail */}
                              {video.thumbnail_r2_key ? (
                                <img
                                  src={video.thumbnail_r2_key}
                                  alt=""
                                  className="w-12 h-8 rounded-lg object-cover shrink-0"
                                />
                              ) : (
                                <div
                                  className="w-12 h-8 rounded-lg flex items-center justify-center shrink-0"
                                  style={{
                                    background:
                                      "linear-gradient(135deg, #7E22CE, #c026d3)",
                                  }}
                                >
                                  <Film
                                    size={12}
                                    className="text-white"
                                  />
                                </div>
                              )}

                              {/* title + notes */}
                              <div className="flex-1 min-w-0">
                                <p
                                  className="text-sm font-medium truncate"
                                  style={{ color: BRAND.textMain }}
                                >
                                  {video.video_title || "Untitled"}
                                </p>
                                {video.notes && (
                                  <p
                                    className="text-xs truncate"
                                    style={{ color: BRAND.textDim }}
                                  >
                                    {video.notes}
                                  </p>
                                )}
                              </div>

                              {/* reorder + remove actions */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                <button
                                  onClick={() =>
                                    handleReorder(day, idx, "up")
                                  }
                                  disabled={idx === 0}
                                  className="p-1 rounded-lg transition hover:bg-black/30 disabled:opacity-30"
                                  aria-label="Move up"
                                >
                                  <ArrowUp
                                    size={14}
                                    style={{ color: BRAND.textMuted }}
                                  />
                                </button>
                                <button
                                  onClick={() =>
                                    handleReorder(day, idx, "down")
                                  }
                                  disabled={idx === videos.length - 1}
                                  className="p-1 rounded-lg transition hover:bg-black/30 disabled:opacity-30"
                                  aria-label="Move down"
                                >
                                  <ArrowDown
                                    size={14}
                                    style={{ color: BRAND.textMuted }}
                                  />
                                </button>
                                <button
                                  onClick={() =>
                                    onRemoveVideoFromDay(
                                      selectedProgram.id,
                                      day.day_number,
                                      video.id
                                    )
                                  }
                                  className="p-1 rounded-lg transition hover:bg-red-500/20"
                                  aria-label="Remove video"
                                >
                                  <X
                                    size={14}
                                    style={{ color: BRAND.error }}
                                  />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <button
                        onClick={() => setVideoPickerDay(day.day_number)}
                        className="mt-2 flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition hover:bg-purple-900/20"
                        style={{ color: BRAND.primary }}
                      >
                        <Plus size={14} /> Add Video
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── delete day confirm modal ── */}
        {deleteDayConfirm !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          >
            <div
              className="w-full max-w-sm rounded-2xl p-6 border border-purple-900/40 shadow-2xl"
              style={{ backgroundColor: BRAND.panel }}
            >
              <h3
                className="text-lg font-bold mb-3"
                style={{ color: BRAND.textMain }}
              >
                Delete Day {deleteDayConfirm}?
              </h3>
              <p
                className="text-sm mb-6"
                style={{ color: BRAND.textMuted }}
              >
                This will permanently remove this day and all its videos
                from the program. This action cannot be undone.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  color="gray"
                  small
                  onClick={() => setDeleteDayConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  color="red"
                  small
                  onClick={() => {
                    onDeleteDay(selectedProgram.id, deleteDayConfirm);
                    setDeleteDayConfirm(null);
                  }}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── video picker modal ── */}
        {videoPickerDay !== null && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
          >
            <div
              className="w-full max-w-2xl max-h-[85vh] rounded-2xl border border-purple-900/40 shadow-2xl flex flex-col overflow-hidden"
              style={{ backgroundColor: BRAND.panel }}
            >
              {/* modal header */}
              <div
                className="flex items-center justify-between px-6 py-4 shrink-0"
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <h3
                  className="text-lg font-bold"
                  style={{ color: BRAND.textMain }}
                >
                  Select Video
                </h3>
                <button
                  onClick={() => {
                    setVideoPickerDay(null);
                    setSelectedVideoId(null);
                    setVideoNotes("");
                    setVideoSearch("");
                  }}
                  className="p-1.5 rounded-lg transition hover:bg-black/20"
                >
                  <X size={18} style={{ color: BRAND.textMuted }} />
                </button>
              </div>

              {/* search */}
              <div className="px-6 pt-4 shrink-0">
                <div className="relative">
                  <Search
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2"
                    style={{ color: BRAND.textDim }}
                  />
                  <input
                    type="text"
                    value={videoSearch}
                    onChange={(e) => setVideoSearch(e.target.value)}
                    placeholder="Search videos..."
                    className="w-full rounded-xl pl-9 pr-3 py-2.5 text-sm border focus:outline-none transition"
                    style={{
                      backgroundColor: BRAND.input,
                      borderColor: "rgba(126,34,206,0.4)",
                      color: BRAND.textMain,
                    }}
                  />
                </div>
              </div>

              {/* video grid */}
              <div className="flex-1 overflow-y-auto px-6 py-4">
                {filteredVideos.length === 0 ? (
                  <div className="py-10 text-center">
                    <Film
                      size={32}
                      className="mx-auto mb-2"
                      style={{ color: BRAND.textDim }}
                    />
                    <p
                      className="text-sm"
                      style={{ color: BRAND.textMuted }}
                    >
                      No published videos found
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {filteredVideos.map((video: any) => {
                      const isSelected =
                        selectedVideoId === (video.video_id ?? video.id);
                      return (
                        <button
                          key={video.video_id ?? video.id}
                          onClick={() =>
                            setSelectedVideoId(
                              video.video_id ?? video.id
                            )
                          }
                          className={`relative rounded-xl overflow-hidden border-2 transition text-left ${
                            isSelected
                              ? "border-purple-500 ring-2 ring-purple-500/30"
                              : "border-transparent hover:border-purple-900/40"
                          }`}
                        >
                          {/* thumbnail */}
                          {video.thumbnail_r2_key ? (
                            <img
                              src={video.thumbnail_r2_key}
                              alt=""
                              className="w-full aspect-video object-cover"
                            />
                          ) : (
                            <div
                              className="w-full aspect-video flex items-center justify-center"
                              style={{
                                background:
                                  "linear-gradient(135deg, #7E22CE, #c026d3)",
                              }}
                            >
                              <Film
                                size={24}
                                className="text-white/50"
                              />
                            </div>
                          )}
                          <div
                            className="p-2"
                            style={{
                              backgroundColor: BRAND.surface,
                            }}
                          >
                            <p
                              className="text-xs font-medium truncate"
                              style={{ color: BRAND.textMain }}
                            >
                              {video.title || "Untitled"}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full flex items-center justify-center bg-purple-600">
                              <Check
                                size={12}
                                className="text-white"
                              />
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* notes + add button */}
              {selectedVideoId && (
                <div
                  className="px-6 pb-4 pt-3 shrink-0 space-y-3"
                  style={{
                    borderTop: "1px solid rgba(255,255,255,0.05)",
                  }}
                >
                  <input
                    type="text"
                    value={videoNotes}
                    onChange={(e) => setVideoNotes(e.target.value)}
                    placeholder="Optional notes for this video..."
                    className="w-full rounded-xl px-3 py-2 text-sm border focus:outline-none transition"
                    style={{
                      backgroundColor: BRAND.input,
                      borderColor: "rgba(126,34,206,0.4)",
                      color: BRAND.textMain,
                    }}
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleAddVideoToDay}>
                      <span className="flex items-center gap-1.5">
                        <Plus size={14} /> Add to Day
                      </span>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── create/edit program modal (reused) ── */}
        {showCreateModal && <ProgramFormModal />}

        {/* ── delete program confirm modal ── */}
        {deleteConfirmId !== null && <DeleteConfirmModal />}
      </div>
    );
  }

  /* ── list mode ── */

  /* ── inline sub-components (declared inside main fn for closure access) ── */

  function ProgramFormModal() {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      >
        <div
          className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-purple-900/40 shadow-2xl"
          style={{ backgroundColor: BRAND.panel }}
        >
          {/* header */}
          <div
            className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
            style={{
              backgroundColor: BRAND.panel,
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <h3
              className="text-lg font-bold"
              style={{ color: BRAND.textMain }}
            >
              {editingProgram ? "Edit Program" : "Create Program"}
            </h3>
            <button
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
                setEditingProgram(null);
              }}
              className="p-1.5 rounded-lg transition hover:bg-black/20"
            >
              <X size={18} style={{ color: BRAND.textMuted }} />
            </button>
          </div>

          <div className="px-6 py-5 space-y-4">
            {/* title */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: BRAND.textMuted }}
              >
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    title: e.target.value,
                  }))
                }
                placeholder="e.g. 8-Week Strength Builder"
                className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none transition"
                style={{
                  backgroundColor: BRAND.input,
                  borderColor: "rgba(126,34,206,0.4)",
                  color: BRAND.textMain,
                }}
              />
            </div>

            {/* description */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: BRAND.textMuted }}
              >
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    description: e.target.value,
                  }))
                }
                rows={3}
                placeholder="Describe what this program covers..."
                className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none transition resize-none"
                style={{
                  backgroundColor: BRAND.input,
                  borderColor: "rgba(126,34,206,0.4)",
                  color: BRAND.textMain,
                }}
              />
            </div>

            {/* duration + difficulty row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: BRAND.textMuted }}
                >
                  Duration (weeks)
                </label>
                <input
                  type="number"
                  min={1}
                  max={52}
                  value={formData.duration_weeks}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      duration_weeks: parseInt(e.target.value) || 1,
                    }))
                  }
                  className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none transition"
                  style={{
                    backgroundColor: BRAND.input,
                    borderColor: "rgba(126,34,206,0.4)",
                    color: BRAND.textMain,
                  }}
                />
              </div>
              <div>
                <label
                  className="block text-sm font-medium mb-1"
                  style={{ color: BRAND.textMuted }}
                >
                  Difficulty
                </label>
                <select
                  value={formData.difficulty}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      difficulty: e.target.value,
                    }))
                  }
                  className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none transition appearance-none"
                  style={{
                    backgroundColor: BRAND.input,
                    borderColor: "rgba(126,34,206,0.4)",
                    color: BRAND.textMain,
                  }}
                >
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* equipment multi-tag */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: BRAND.textMuted }}
              >
                Equipment
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={equipmentInput}
                  onChange={(e) => setEquipmentInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addEquipment();
                    }
                  }}
                  placeholder="Add equipment and press Enter"
                  className="flex-1 rounded-xl px-3 py-2.5 text-sm border focus:outline-none transition"
                  style={{
                    backgroundColor: BRAND.input,
                    borderColor: "rgba(126,34,206,0.4)",
                    color: BRAND.textMain,
                  }}
                />
                <Button small onClick={addEquipment}>
                  <Plus size={14} />
                </Button>
              </div>
              {formData.equipment.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.equipment.map((eq) => (
                    <span
                      key={eq}
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: "rgba(126,34,206,0.2)",
                        color: BRAND.textMain,
                        border: "1px solid rgba(126,34,206,0.3)",
                      }}
                    >
                      {eq}
                      <button
                        onClick={() => removeEquipment(eq)}
                        className="hover:opacity-70 transition"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* tags multi-tag */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: BRAND.textMuted }}
              >
                Tags
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag();
                    }
                  }}
                  placeholder="Add tags and press Enter"
                  className="flex-1 rounded-xl px-3 py-2.5 text-sm border focus:outline-none transition"
                  style={{
                    backgroundColor: BRAND.input,
                    borderColor: "rgba(126,34,206,0.4)",
                    color: BRAND.textMain,
                  }}
                />
                <Button small onClick={addTag}>
                  <Plus size={14} />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: "rgba(59,130,246,0.2)",
                        color: "#93c5fd",
                        border: "1px solid rgba(59,130,246,0.3)",
                      }}
                    >
                      <Tag size={10} />
                      {tag}
                      <button
                        onClick={() => removeTag(tag)}
                        className="hover:opacity-70 transition"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* cover image url */}
            <div>
              <label
                className="block text-sm font-medium mb-1"
                style={{ color: BRAND.textMuted }}
              >
                Cover Image URL
              </label>
              <input
                type="text"
                value={formData.cover_image_url}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    cover_image_url: e.target.value,
                  }))
                }
                placeholder="https://..."
                className="w-full rounded-xl px-3 py-2.5 text-sm border focus:outline-none transition"
                style={{
                  backgroundColor: BRAND.input,
                  borderColor: "rgba(126,34,206,0.4)",
                  color: BRAND.textMain,
                }}
              />
            </div>

            {/* premium toggle */}
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <div
                className={`w-9 h-5 rounded-full relative transition-colors ${
                  formData.is_premium ? "bg-amber-500" : "bg-white/10"
                }`}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    is_premium: !prev.is_premium,
                  }))
                }
                role="switch"
                aria-checked={formData.is_premium}
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    setFormData((prev) => ({
                      ...prev,
                      is_premium: !prev.is_premium,
                    }));
                  }
                }}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
                    formData.is_premium
                      ? "translate-x-4"
                      : "translate-x-0.5"
                  }`}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <Crown
                  size={14}
                  style={{
                    color: formData.is_premium
                      ? BRAND.accent
                      : BRAND.textDim,
                  }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: BRAND.textMuted }}
                >
                  Premium Content
                </span>
              </div>
            </label>
          </div>

          {/* footer */}
          <div
            className="flex justify-end gap-2 px-6 py-4"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <Button
              color="gray"
              onClick={() => {
                setShowCreateModal(false);
                resetForm();
                setEditingProgram(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSubmitForm}>
              {editingProgram ? "Save Changes" : "Create Program"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  function DeleteConfirmModal() {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.7)" }}
      >
        <div
          className="w-full max-w-sm rounded-2xl p-6 border border-purple-900/40 shadow-2xl"
          style={{ backgroundColor: BRAND.panel }}
        >
          <h3
            className="text-lg font-bold mb-3"
            style={{ color: BRAND.textMain }}
          >
            Delete Program?
          </h3>
          <p className="text-sm mb-6" style={{ color: BRAND.textMuted }}>
            This will permanently delete this program and all its days and
            videos. This action cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <Button
              color="gray"
              small
              onClick={() => setDeleteConfirmId(null)}
            >
              Cancel
            </Button>
            <Button
              color="red"
              small
              onClick={() => {
                if (deleteConfirmId !== null) {
                  onDeleteProgram(deleteConfirmId);
                  setDeleteConfirmId(null);
                }
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* ── header ── */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-3xl p-5 border border-purple-900/40 shadow-lg"
        style={{ backgroundColor: BRAND.panel }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${BRAND.primary}, #c026d3)`,
            }}
          >
            <ListVideo size={20} className="text-white" />
          </div>
          <h2
            className="text-xl font-bold"
            style={{ color: BRAND.textMain }}
          >
            Programs
          </h2>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition shadow-lg hover:shadow-xl hover:brightness-110"
          style={{
            background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryHover})`,
          }}
        >
          <Plus size={16} /> Create Program
        </button>
      </div>

      {/* ── program cards grid ── */}
      {programs.length === 0 ? (
        <div
          className="rounded-3xl border border-purple-900/40 p-16 text-center"
          style={{ backgroundColor: BRAND.panel }}
        >
          <ListVideo
            size={48}
            className="mx-auto mb-4"
            style={{ color: BRAND.textDim }}
          />
          <p
            className="text-lg font-semibold mb-2"
            style={{ color: BRAND.textMuted }}
          >
            No programs yet
          </p>
          <p
            className="text-sm mb-6"
            style={{ color: BRAND.textDim }}
          >
            Create your first training program to get started
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition shadow-lg hover:shadow-xl hover:brightness-110"
            style={{
              background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryHover})`,
            }}
          >
            <Plus size={16} /> Create Your First Program
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {programs.map((program: any) => (
            <div
              key={program.id}
              className="rounded-2xl border border-purple-900/40 overflow-hidden shadow-lg group transition hover:border-purple-500/30"
              style={{ backgroundColor: BRAND.panel }}
            >
              {/* cover image / placeholder */}
              {program.cover_image_url ? (
                <img
                  src={program.cover_image_url}
                  alt={program.title ?? "Program"}
                  className="w-full aspect-[16/9] object-cover"
                />
              ) : (
                <div
                  className="w-full aspect-[16/9] flex items-center justify-center"
                  style={{
                    background:
                      "linear-gradient(135deg, #1D0E35 0%, #3b0866 50%, #7E22CE 100%)",
                  }}
                >
                  <Dumbbell
                    size={36}
                    className="text-white/20"
                  />
                </div>
              )}

              {/* content */}
              <div className="p-5 space-y-3">
                <h3
                  className="font-semibold text-base truncate"
                  style={{ color: BRAND.textMain }}
                >
                  {program.title || "Untitled Program"}
                </h3>
                {program.description && (
                  <p
                    className="text-sm line-clamp-2 leading-relaxed"
                    style={{ color: BRAND.textMuted }}
                  >
                    {program.description}
                  </p>
                )}

                {/* stats row */}
                <div className="flex items-center gap-3 flex-wrap">
                  <span
                    className="flex items-center gap-1 text-xs"
                    style={{ color: BRAND.textMuted }}
                  >
                    <Calendar size={12} />
                    {program.day_count ?? 0} days
                  </span>
                  <span
                    className="flex items-center gap-1 text-xs"
                    style={{ color: BRAND.textMuted }}
                  >
                    <Dumbbell size={12} />
                    {program.duration_weeks ?? 0} weeks
                  </span>
                  {program.difficulty && (
                    <Badge
                      color={
                        DIFFICULTY_COLORS[program.difficulty] ?? "gray"
                      }
                    >
                      {program.difficulty}
                    </Badge>
                  )}
                </div>

                {/* bottom row: badges */}
                <div className="flex items-center gap-2">
                  <Badge
                    color={program.is_published ? "green" : "gray"}
                  >
                    {program.is_published ? "Published" : "Draft"}
                  </Badge>
                  {program.is_premium && (
                    <span className="flex items-center gap-1">
                      <Crown
                        size={14}
                        style={{ color: BRAND.accent }}
                      />
                      <span
                        className="text-xs font-medium"
                        style={{ color: BRAND.accent }}
                      >
                        Premium
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* actions row */}
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{
                  borderTop: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <button
                  onClick={() => onSelectProgram(program)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition hover:bg-purple-900/30"
                  style={{ color: BRAND.primary }}
                  title="View / Edit"
                >
                  <Eye size={14} /> View
                </button>
                <button
                  onClick={() =>
                    program.is_published
                      ? onUnpublishProgram(program.id)
                      : onPublishProgram(program.id)
                  }
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition hover:bg-black/20"
                  style={{
                    color: program.is_published
                      ? BRAND.warning
                      : BRAND.success,
                  }}
                  title={
                    program.is_published ? "Unpublish" : "Publish"
                  }
                >
                  {program.is_published ? (
                    <>
                      <EyeOff size={14} /> Unpublish
                    </>
                  ) : (
                    <>
                      <Eye size={14} /> Publish
                    </>
                  )}
                </button>
                <button
                  onClick={() => onDuplicateProgram(program.id)}
                  className="p-1.5 rounded-lg transition hover:bg-black/20"
                  title="Duplicate"
                >
                  <Copy
                    size={14}
                    style={{ color: BRAND.textMuted }}
                  />
                </button>
                <button
                  onClick={() => setDeleteConfirmId(program.id)}
                  className="p-1.5 rounded-lg transition hover:bg-red-500/20 ml-auto"
                  title="Delete"
                >
                  <Trash2 size={14} style={{ color: BRAND.error }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── modals ── */}
      {showCreateModal && <ProgramFormModal />}
      {deleteConfirmId !== null && <DeleteConfirmModal />}
    </div>
  );
}
