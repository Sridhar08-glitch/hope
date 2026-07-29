"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import { BRAND } from "@holora/ui";
import { trainerApi } from "@/lib/trainer-api";
import {
  ArrowLeft,
  Undo2,
  Redo2,
  Save,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Repeat,
  Scissors,
  Crop,
  Gauge,
  Bookmark,
  Plus,
  Minus,
  X,
  ChevronRight,
  ChevronLeft,
  Eye,
  PanelRightOpen,
  PanelRightClose,
  Diamond,
  Music,
  Trash2,
  Copy,
  Search,
  Edit3,
  Square,
} from "lucide-react";

/* ================================================================== */
/*  Types                                                              */
/* ================================================================== */

interface VideoEditorViewProps {
  file: File;
  videoPreviewUrl: string;
  metadata: {
    duration: number;
    width: number;
    height: number;
  };
  api?: any;
  onPublish: (edl: any) => void;
  onSaveDraft: (edl: any) => void;
  onBack: () => void;
  showToast: (message: string, type: "success" | "error") => void;
}

interface Clip {
  id: string;
  sourceStart: number;
  sourceEnd: number;
  speed: number;
  volume: number;
}

interface MusicTrack {
  id: string;
  trackId: string;
  title: string;
  artist: string;
  videoStart: number;
  videoEnd: number;
  trackOffset: number;
  volume: number;
  fadeIn: number;
  fadeOut: number;
  loop: boolean;
}

interface EdlProject {
  id: string;
  version: number;
  resolution: { width: number; height: number };
  duration: number;
  clips: Clip[];
  selectedClipId: string | null;
  musicTracks: MusicTrack[];
  cropPreset: "original" | "16:9" | "9:16" | "4:3" | "1:1";
  rotation: 0 | 90 | 180 | 270;
  chapters: { time: number; title: string }[];
}

type ActiveTool = "trim" | "crop" | "speed" | "audio" | "chapters" | "music";

/* ================================================================== */
/*  Constants                                                          */
/* ================================================================== */

const SPEED_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4];

const CROP_PRESETS: { value: EdlProject["cropPreset"]; label: string; ratio: number }[] = [
  { value: "original", label: "Original", ratio: 0 },
  { value: "16:9", label: "16:9", ratio: 16 / 9 },
  { value: "9:16", label: "9:16", ratio: 9 / 16 },
  { value: "4:3", label: "4:3", ratio: 4 / 3 },
  { value: "1:1", label: "1:1", ratio: 1 },
];

const ROTATION_OPTIONS: EdlProject["rotation"][] = [0, 90, 180, 270];

const TOOL_ITEMS: { id: ActiveTool; icon: typeof Scissors; label: string }[] = [
  { id: "trim", icon: Scissors, label: "Trim / Split" },
  { id: "crop", icon: Crop, label: "Crop" },
  { id: "speed", icon: Gauge, label: "Speed" },
  { id: "audio", icon: Volume2, label: "Audio" },
  { id: "chapters", icon: Bookmark, label: "Chapters" },
  { id: "music", icon: Music, label: "Music" },
];

const EDITOR_BG = "#0a0515";
const PANEL_BG = "#1a0e2e";
const PANEL_BORDER = "rgba(255,255,255,0.06)";
const ACTIVE_TOOL_BG = "rgba(126,34,206,0.15)";
const TRACK_BG = "rgba(126,34,206,0.08)";
const MUSIC_TRACK_COLOR = "#06b6d4";

/* ================================================================== */
/*  Helpers                                                            */
/* ================================================================== */

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function formatTime(seconds: number, showMs = false): string {
  if (!isFinite(seconds) || seconds < 0) seconds = 0;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.round((seconds % 1) * 100);
  const base = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  if (showMs) return `${base}.${String(ms).padStart(2, "0")}`;
  return base;
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

function createInitialClip(duration: number): Clip {
  return {
    id: generateId(),
    sourceStart: 0,
    sourceEnd: duration,
    speed: 1,
    volume: 100,
  };
}

function createInitialEdl(metadata: VideoEditorViewProps["metadata"]): EdlProject {
  const clips: Clip[] = [createInitialClip(metadata.duration)];
  return {
    id: generateId(),
    version: 1,
    resolution: { width: metadata.width, height: metadata.height },
    duration: metadata.duration,
    clips,
    selectedClipId: clips[0].id,
    musicTracks: [],
    cropPreset: "original",
    rotation: 0,
    chapters: [],
  };
}

/** Get total output duration from clips (accounting for speed) */
function getOutputDuration(clips: Clip[]): number {
  return clips.reduce((sum, c) => sum + (c.sourceEnd - c.sourceStart) / c.speed, 0);
}

/** Convert output timeline position to source video time + which clip */
function outputTimeToSource(
  clips: Clip[],
  outputTime: number
): { clip: Clip; sourceTime: number; clipIndex: number } | null {
  let elapsed = 0;
  for (let i = 0; i < clips.length; i++) {
    const c = clips[i];
    const clipOutputDur = (c.sourceEnd - c.sourceStart) / c.speed;
    if (outputTime <= elapsed + clipOutputDur + 0.001) {
      const withinClip = (outputTime - elapsed) * c.speed;
      return { clip: c, sourceTime: c.sourceStart + withinClip, clipIndex: i };
    }
    elapsed += clipOutputDur;
  }
  if (clips.length > 0) {
    const last = clips[clips.length - 1];
    return { clip: last, sourceTime: last.sourceEnd, clipIndex: clips.length - 1 };
  }
  return null;
}

/** Convert source video currentTime to output timeline position */
function sourceTimeToOutput(clips: Clip[], sourceTime: number): number {
  let elapsed = 0;
  for (const c of clips) {
    if (sourceTime >= c.sourceStart && sourceTime <= c.sourceEnd) {
      return elapsed + (sourceTime - c.sourceStart) / c.speed;
    }
    elapsed += (c.sourceEnd - c.sourceStart) / c.speed;
  }
  return elapsed;
}

/** Find which clip contains a given source time */
function findClipAtSourceTime(clips: Clip[], sourceTime: number): Clip | null {
  for (const c of clips) {
    if (sourceTime >= c.sourceStart - 0.01 && sourceTime <= c.sourceEnd + 0.01) {
      return c;
    }
  }
  return null;
}

/** Get clip output start position on the timeline */
function getClipOutputStart(clips: Clip[], clipId: string): number {
  let elapsed = 0;
  for (const c of clips) {
    if (c.id === clipId) return elapsed;
    elapsed += (c.sourceEnd - c.sourceStart) / c.speed;
  }
  return elapsed;
}

/** Get output duration of a single clip */
function getClipOutputDuration(clip: Clip): number {
  return (clip.sourceEnd - clip.sourceStart) / clip.speed;
}

/* ================================================================== */
/*  Hook: useResponsive                                                */
/* ================================================================== */

function useResponsive() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1400
  );

  useEffect(() => {
    function handleResize() {
      setWidth(window.innerWidth);
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return useMemo(
    () => ({
      isMobile: width < 768,
      isTablet: width >= 768 && width < 992,
      isLaptop: width >= 992 && width < 1200,
      isDesktop: width >= 1200,
      width,
    }),
    [width]
  );
}

/* ================================================================== */
/*  Main Component                                                     */
/* ================================================================== */

export function VideoEditorView({
  file,
  videoPreviewUrl,
  metadata,
  api,
  onPublish,
  onSaveDraft,
  onBack,
  showToast,
}: VideoEditorViewProps) {
  /* ── Responsive ── */
  const { isMobile, isTablet, isLaptop, isDesktop } = useResponsive();

  /* ── Refs ── */
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioPreviewRef = useRef<HTMLAudioElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const playheadDragging = useRef(false);
  const clipEdgeDragging = useRef<{
    clipId: string;
    edge: "start" | "end";
  } | null>(null);
  const musicEdgeDragging = useRef<{
    trackId: string;
    edge: "start" | "end";
  } | null>(null);
  const musicAudioRefs = useRef<Map<string, HTMLAudioElement>>(new Map());
  const musicPreviewUrls = useRef<Map<string, string>>(new Map());

  /* ── EDL State ── */
  const initialEdl = useMemo(() => createInitialEdl(metadata), [metadata]);
  const [edl, setEdl] = useState<EdlProject>(initialEdl);
  const edlRef = useRef(edl);
  edlRef.current = edl;

  /* ── History ── */
  const [history, setHistory] = useState<EdlProject[]>([initialEdl]);
  const [historyIdx, setHistoryIdx] = useState(0);

  /* ── UI State ── */
  const [activeTool, setActiveTool] = useState<ActiveTool>("trim");
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isLooping, setIsLooping] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInspector, setShowInspector] = useState(true);
  const [toolPanelExpanded, setToolPanelExpanded] = useState(false);
  const [timelineZoom, setTimelineZoom] = useState(1);
  const [lastSaveTime, setLastSaveTime] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingChapterIdx, setEditingChapterIdx] = useState<number | null>(null);
  const [chapterEditValue, setChapterEditValue] = useState("");
  const [speedDropdownOpen, setSpeedDropdownOpen] = useState(false);
  const [maintainPitch, setMaintainPitch] = useState(true);

  /* ── Music UI State ── */
  const [musicSearchQuery, setMusicSearchQuery] = useState("");
  const [musicSearchResults, setMusicSearchResults] = useState<
    { trackId: string; title: string; artist: string; duration: number; bpm: number; previewUrl: string }[]
  >([]);
  const [musicSearchLoading, setMusicSearchLoading] = useState(false);
  const [musicPage, setMusicPage] = useState(1);
  const [musicHasMore, setMusicHasMore] = useState(true);
  const [musicLoadingMore, setMusicLoadingMore] = useState(false);
  const [musicInitialLoaded, setMusicInitialLoaded] = useState(false);
  const musicScrollRef = useRef<HTMLDivElement>(null);
  const [previewingTrackId, setPreviewingTrackId] = useState<string | null>(null);
  const [addingMusicConfig, setAddingMusicConfig] = useState<{
    trackId: string;
    title: string;
    artist: string;
    duration: number;
  } | null>(null);
  const [musicConfigForm, setMusicConfigForm] = useState({
    videoStart: 0,
    videoEnd: 0,
    trackOffset: 0,
    volume: 80,
    fadeIn: 1,
    fadeOut: 1,
    loop: false,
  });
  const [editingMusicTrackId, setEditingMusicTrackId] = useState<string | null>(null);
  const [selectedMusicTrackId, setSelectedMusicTrackId] = useState<string | null>(null);

  /* ── Derived ── */
  const duration = edl.duration;
  const totalOutputDuration = useMemo(() => getOutputDuration(edl.clips), [edl.clips]);
  const selectedClip = useMemo(
    () => edl.clips.find((c) => c.id === edl.selectedClipId) || null,
    [edl.clips, edl.selectedClipId]
  );

  const canUndo = historyIdx > 0;
  const canRedo = historyIdx < history.length - 1;

  /* ================================================================ */
  /*  History management                                               */
  /* ================================================================ */

  const pushHistory = useCallback(
    (newState: EdlProject) => {
      setHistory((prev) => [...prev.slice(0, historyIdx + 1), newState]);
      setHistoryIdx((prev) => prev + 1);
      setEdl(newState);
    },
    [historyIdx]
  );

  const undo = useCallback(() => {
    if (historyIdx > 0) {
      const newIdx = historyIdx - 1;
      setHistoryIdx(newIdx);
      setEdl(history[newIdx]);
    }
  }, [historyIdx, history]);

  const redo = useCallback(() => {
    if (historyIdx < history.length - 1) {
      const newIdx = historyIdx + 1;
      setHistoryIdx(newIdx);
      setEdl(history[newIdx]);
    }
  }, [historyIdx, history]);

  /* ================================================================ */
  /*  EDL update helper                                                */
  /* ================================================================ */

  const updateEdl = useCallback(
    (partial: Partial<EdlProject>) => {
      const updated = { ...edl, ...partial, version: edl.version + 1 };
      pushHistory(updated);
    },
    [edl, pushHistory]
  );

  /* ================================================================ */
  /*  Clip helpers                                                     */
  /* ================================================================ */

  const updateClip = useCallback(
    (clipId: string, partial: Partial<Clip>) => {
      const updated = {
        ...edl,
        version: edl.version + 1,
        clips: edl.clips.map((c) => (c.id === clipId ? { ...c, ...partial } : c)),
      };
      pushHistory(updated);
    },
    [edl, pushHistory]
  );

  const selectClip = useCallback(
    (clipId: string | null) => {
      setEdl((prev) => ({ ...prev, selectedClipId: clipId }));
      // Seek video to the start of the selected clip
      if (clipId) {
        const clip = edlRef.current.clips.find((c) => c.id === clipId);
        if (clip && videoRef.current) {
          videoRef.current.currentTime = clip.sourceStart;
        }
      }
    },
    []
  );

  const deleteClip = useCallback(
    (clipId: string) => {
      if (edl.clips.length <= 1) {
        showToast("Cannot delete the last clip", "error");
        return;
      }
      const newClips = edl.clips.filter((c) => c.id !== clipId);
      const deletedClip = edl.clips.find((c) => c.id === clipId);
      const wasSelected = edl.selectedClipId === clipId;
      const newSelected = wasSelected
        ? newClips.length > 0 ? newClips[0].id : null
        : edl.selectedClipId;

      pushHistory({
        ...edl,
        version: edl.version + 1,
        clips: newClips,
        selectedClipId: newSelected,
      });

      // Seek to the first remaining clip so playback starts from the new beginning
      if (wasSelected || (deletedClip && videoRef.current)) {
        const firstClip = newClips[0];
        if (firstClip && videoRef.current) {
          videoRef.current.currentTime = firstClip.sourceStart;
        }
      }

      showToast("Clip removed from output", "success");
    },
    [edl, pushHistory, showToast]
  );

  const duplicateClip = useCallback(
    (clipId: string) => {
      const clip = edl.clips.find((c) => c.id === clipId);
      if (!clip) return;
      const idx = edl.clips.findIndex((c) => c.id === clipId);
      // Duplicate inserts an independent copy AFTER the current clip
      // The copy references the same source segment but is a separate clip in the output
      const newClip: Clip = {
        ...clip,
        id: generateId(),
        sourceStart: clip.sourceStart,
        sourceEnd: clip.sourceEnd,
      };
      const newClips = [...edl.clips];
      newClips.splice(idx + 1, 0, newClip);
      pushHistory({
        ...edl,
        version: edl.version + 1,
        clips: newClips,
        selectedClipId: newClip.id,
      });
      showToast("Clip duplicated", "success");
    },
    [edl, pushHistory, showToast]
  );

  const splitClipAtPlayhead = useCallback(() => {
    // Find which clip contains currentTime (source time)
    const video = videoRef.current;
    if (!video) return;
    const srcTime = video.currentTime;

    const clip = findClipAtSourceTime(edl.clips, srcTime);
    if (!clip) {
      showToast("No clip at playhead position", "error");
      return;
    }

    // Ensure playhead is within the clip bounds (not at edges)
    if (srcTime <= clip.sourceStart + 0.05 || srcTime >= clip.sourceEnd - 0.05) {
      showToast("Playhead is at clip edge, cannot split", "error");
      return;
    }

    const clipA: Clip = {
      id: generateId(),
      sourceStart: clip.sourceStart,
      sourceEnd: srcTime,
      speed: clip.speed,
      volume: clip.volume,
    };
    const clipB: Clip = {
      id: generateId(),
      sourceStart: srcTime,
      sourceEnd: clip.sourceEnd,
      speed: clip.speed,
      volume: clip.volume,
    };

    const newClips = edl.clips.reduce<Clip[]>((acc, c) => {
      if (c.id === clip.id) {
        acc.push(clipA, clipB);
      } else {
        acc.push(c);
      }
      return acc;
    }, []);

    pushHistory({
      ...edl,
      version: edl.version + 1,
      clips: newClips,
      selectedClipId: clipB.id,
    });
    showToast("Clip split at playhead", "success");
  }, [edl, pushHistory, showToast]);

  const applySpeedToAll = useCallback(
    (speed: number) => {
      const updated = {
        ...edl,
        version: edl.version + 1,
        clips: edl.clips.map((c) => ({ ...c, speed })),
      };
      pushHistory(updated);
      showToast(`Speed ${speed}x applied to all clips`, "success");
    },
    [edl, pushHistory, showToast]
  );

  /* ================================================================ */
  /*  Video playback controls                                          */
  /* ================================================================ */

  const seekTo = useCallback(
    (time: number) => {
      const clamped = clamp(time, 0, duration);
      if (videoRef.current) {
        videoRef.current.currentTime = clamped;
      }
      setCurrentTime(clamped);
    },
    [duration]
  );

  const seekToOutputTime = useCallback(
    (outputTime: number) => {
      const result = outputTimeToSource(edl.clips, outputTime);
      if (result) {
        seekTo(result.sourceTime);
      }
    },
    [edl.clips, seekTo]
  );

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      // Ensure playhead is inside a valid clip before playing
      const currentEdl = edlRef.current;
      const clip = findClipAtSourceTime(currentEdl.clips, video.currentTime);
      if (!clip) {
        // Not in any clip — jump to nearest clip
        const sortedClips = [...currentEdl.clips].sort((a, b) => a.sourceStart - b.sourceStart);
        const nextClip = sortedClips.find((c) => c.sourceStart >= video.currentTime) || sortedClips[0];
        if (nextClip) {
          video.currentTime = nextClip.sourceStart;
          video.playbackRate = nextClip.speed;
          video.volume = clamp(nextClip.volume / 100, 0, 1);
        }
      } else {
        // Inside a clip — check if at the very end
        if (video.currentTime >= clip.sourceEnd - 0.05) {
          const clipIdx = currentEdl.clips.findIndex((c) => c.id === clip.id);
          const nextClip = currentEdl.clips[clipIdx + 1] || currentEdl.clips[0];
          if (nextClip) {
            video.currentTime = nextClip.sourceStart;
            video.playbackRate = nextClip.speed;
          }
        }
      }
      video.play().catch(() => {});
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  }, [selectedClip]);

  const stepFrame = useCallback(
    (direction: 1 | -1) => {
      const frameDuration = 1 / 30;
      seekTo(currentTime + direction * frameDuration);
    },
    [currentTime, seekTo]
  );

  const toggleLoop = useCallback(() => {
    setIsLooping((prev) => !prev);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!document.fullscreenElement) {
      video.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  }, []);

  /* ── Video timeupdate handler — skips deleted regions, jumps between clips ── */
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const t = video.currentTime;
    setCurrentTime(t);

    const currentEdl = edlRef.current;
    const clip = findClipAtSourceTime(currentEdl.clips, t);

    if (clip) {
      // Inside a clip — check if we've reached the end
      if (t >= clip.sourceEnd - 0.02) {
        const clipIdx = currentEdl.clips.findIndex((c) => c.id === clip.id);
        const nextClip = currentEdl.clips[clipIdx + 1];
        if (nextClip) {
          video.currentTime = nextClip.sourceStart;
          video.playbackRate = nextClip.speed;
          video.volume = clamp(nextClip.volume / 100, 0, 1);
        } else if (isLooping) {
          const firstClip = currentEdl.clips[0];
          video.currentTime = firstClip.sourceStart;
          video.playbackRate = firstClip.speed;
          video.volume = clamp(firstClip.volume / 100, 0, 1);
        } else {
          video.pause();
          setIsPlaying(false);
        }
      }
    } else if (!video.paused) {
      // Current time is in a gap (deleted region) — skip to next clip
      const sortedClips = [...currentEdl.clips].sort((a, b) => a.sourceStart - b.sourceStart);
      const nextClip = sortedClips.find((c) => c.sourceStart > t);
      if (nextClip) {
        video.currentTime = nextClip.sourceStart;
        video.playbackRate = nextClip.speed;
        video.volume = clamp(nextClip.volume / 100, 0, 1);
      } else if (isLooping) {
        const firstClip = currentEdl.clips[0];
        if (firstClip) {
          video.currentTime = firstClip.sourceStart;
          video.playbackRate = firstClip.speed;
          video.volume = clamp(firstClip.volume / 100, 0, 1);
        }
      } else {
        video.pause();
        setIsPlaying(false);
      }
    }
  }, [isLooping]);

  /* ── Sync speed & volume to video element based on current clip ── */
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (selectedClip) {
      video.playbackRate = selectedClip.speed;
    }
  }, [selectedClip?.speed, selectedClip]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (selectedClip) {
      // Only control original audio volume — never mute the video element
      // so that music tracks (played via separate <audio> elements) are unaffected
      video.volume = clamp(selectedClip.volume / 100, 0, 1);
    }
  }, [selectedClip?.volume, selectedClip]);

  /* ── Music playback sync ── */
  // Convert source time to output time
  const sourceTimeToOutputTime = useCallback(
    (srcTime: number): number => {
      let outputPos = 0;
      for (const c of edlRef.current.clips) {
        const clipDur = (c.sourceEnd - c.sourceStart) / (c.speed || 1);
        if (srcTime >= c.sourceStart && srcTime <= c.sourceEnd) {
          const fract = (c.sourceEnd - c.sourceStart) > 0
            ? (srcTime - c.sourceStart) / (c.sourceEnd - c.sourceStart) : 0;
          return outputPos + fract * clipDur;
        }
        outputPos += clipDur;
      }
      return outputPos;
    },
    []
  );

  // Fetch preview URLs for attached music tracks and create audio elements
  const ensureMusicAudio = useCallback(
    async (track: MusicTrack) => {
      if (musicAudioRefs.current.has(track.id)) return;
      // Fetch preview URL if not cached
      let url = musicPreviewUrls.current.get(track.trackId);
      if (!url && api) {
        try {
          const data = await trainerApi.studioMusic.preview(api, track.trackId);
          url = data?.preview_url || data?.url || "";
          if (url) musicPreviewUrls.current.set(track.trackId, url);
        } catch { return; }
      }
      if (!url) return;
      const audio = new Audio();
      audio.src = url;
      audio.loop = track.loop;
      audio.volume = clamp(track.volume / 100, 0, 1);
      audio.preload = "auto";
      musicAudioRefs.current.set(track.id, audio);
    },
    [api]
  );

  // Initialize audio elements when music tracks change
  useEffect(() => {
    const currentTrackIds = new Set(edl.musicTracks.map((t) => t.id));
    // Remove audio elements for deleted tracks
    musicAudioRefs.current.forEach((audio, id) => {
      if (!currentTrackIds.has(id)) {
        audio.pause();
        audio.src = "";
        musicAudioRefs.current.delete(id);
      }
    });
    // Create audio elements for new tracks
    edl.musicTracks.forEach((track) => {
      ensureMusicAudio(track);
    });
  }, [edl.musicTracks, ensureMusicAudio]);

  // Sync music playback with video
  const syncMusicPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    const outputTime = sourceTimeToOutputTime(video.currentTime);
    const playing = !video.paused;

    edlRef.current.musicTracks.forEach((track) => {
      const audio = musicAudioRefs.current.get(track.id);
      if (!audio) return;

      // Update volume
      audio.volume = clamp(track.volume / 100, 0, 1);
      audio.loop = track.loop;

      // Check if this track should be playing at the current output time
      const inRange = outputTime >= track.videoStart && outputTime < track.videoEnd;

      if (playing && inRange) {
        // Calculate where in the track we should be
        const trackTime = track.trackOffset + (outputTime - track.videoStart);
        // Only seek if significantly out of sync (>0.3s)
        if (Math.abs(audio.currentTime - trackTime) > 0.3) {
          audio.currentTime = trackTime;
        }
        if (audio.paused) audio.play().catch(() => {});
      } else {
        if (!audio.paused) audio.pause();
      }
    });
  }, [sourceTimeToOutputTime]);

  // Call syncMusicPlayback on every timeupdate and play/pause
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const onUpdate = () => syncMusicPlayback();
    const onPlay = () => syncMusicPlayback();
    const onPause = () => {
      // Pause all music
      musicAudioRefs.current.forEach((audio) => audio.pause());
    };
    const onSeeked = () => syncMusicPlayback();
    video.addEventListener("timeupdate", onUpdate);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    video.addEventListener("seeked", onSeeked);
    return () => {
      video.removeEventListener("timeupdate", onUpdate);
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
      video.removeEventListener("seeked", onSeeked);
    };
  }, [syncMusicPlayback]);

  // Cleanup music audio on unmount
  useEffect(() => {
    return () => {
      musicAudioRefs.current.forEach((audio) => {
        audio.pause();
        audio.src = "";
      });
      musicAudioRefs.current.clear();
    };
  }, []);

  /* ── Auto-select clip based on playhead (only during playback) ── */
  useEffect(() => {
    if (!isPlaying) return;
    if (playheadDragging.current || clipEdgeDragging.current) return;
    const clip = findClipAtSourceTime(edl.clips, currentTime);
    if (clip && clip.id !== edl.selectedClipId) {
      setEdl((prev) => ({ ...prev, selectedClipId: clip.id }));
    }
  }, [currentTime, edl.clips, edl.selectedClipId, isPlaying]);

  /* ── Fullscreen change listener ── */
  useEffect(() => {
    function handler() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  /* ================================================================ */
  /*  Trim / Split actions for inspector                               */
  /* ================================================================ */

  const setClipInPoint = useCallback(() => {
    if (!selectedClip) return;
    if (currentTime < selectedClip.sourceEnd - 0.1) {
      updateClip(selectedClip.id, { sourceStart: currentTime });
    }
  }, [currentTime, selectedClip, updateClip]);

  const setClipOutPoint = useCallback(() => {
    if (!selectedClip) return;
    if (currentTime > selectedClip.sourceStart + 0.1) {
      updateClip(selectedClip.id, { sourceEnd: currentTime });
    }
  }, [currentTime, selectedClip, updateClip]);

  /* ================================================================ */
  /*  Chapter actions                                                  */
  /* ================================================================ */

  const addChapterAtPlayhead = useCallback(() => {
    const existing = edl.chapters.find(
      (c) => Math.abs(c.time - currentTime) < 0.5
    );
    if (existing) {
      showToast("A chapter already exists near this time", "error");
      return;
    }
    const newChapters = [
      ...edl.chapters,
      { time: currentTime, title: `Chapter ${edl.chapters.length + 1}` },
    ].sort((a, b) => a.time - b.time);
    updateEdl({ chapters: newChapters });
    showToast("Chapter marker added", "success");
  }, [currentTime, edl.chapters, updateEdl, showToast]);

  const commitChapterTitle = useCallback(
    (idx: number, title: string) => {
      const updated = [...edl.chapters];
      updated[idx] = { ...updated[idx], title };
      updateEdl({ chapters: updated });
      setEditingChapterIdx(null);
    },
    [edl.chapters, updateEdl]
  );

  const removeChapter = useCallback(
    (idx: number) => {
      updateEdl({ chapters: edl.chapters.filter((_, i) => i !== idx) });
    },
    [edl.chapters, updateEdl]
  );

  /* ================================================================ */
  /*  Music actions                                                    */
  /* ================================================================ */

  const musicSearchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchMusicPage = useCallback(
    async (query: string, page: number, append: boolean) => {
      if (!api) return;
      try {
        const params: Record<string, string> = { page: String(page), page_size: "20" };
        if (query.trim()) params.q = query.trim();
        const data = await trainerApi.studioMusic.search(api, params);
        const results = (data?.results || []).map((t: any) => ({
          trackId: String(t.id || t.track_id || t.epidemic_sound_id || ""),
          title: t.title || t.name || "Untitled",
          artist: t.artist_name || t.artist || "Unknown Artist",
          duration: t.duration_seconds || t.duration || 0,
          bpm: t.bpm || 0,
          previewUrl: t.preview_url || "",
        }));
        if (append) {
          setMusicSearchResults((prev) => [...prev, ...results]);
        } else {
          setMusicSearchResults(results);
        }
        setMusicHasMore(data?.has_next ?? results.length >= 20);
      } catch {
        if (!append) setMusicSearchResults([]);
        setMusicHasMore(false);
      }
    },
    [api]
  );

  // Load initial music list when music tool is activated
  useEffect(() => {
    if (activeTool === "music" && !musicInitialLoaded && api) {
      setMusicInitialLoaded(true);
      setMusicSearchLoading(true);
      setMusicPage(1);
      fetchMusicPage("", 1, false).finally(() => setMusicSearchLoading(false));
    }
  }, [activeTool, musicInitialLoaded, api, fetchMusicPage]);

  const handleMusicSearch = useCallback(
    (query: string) => {
      setMusicSearchQuery(query);
      if (musicSearchTimerRef.current) clearTimeout(musicSearchTimerRef.current);
      setMusicSearchLoading(true);
      setMusicPage(1);
      setMusicHasMore(true);
      musicSearchTimerRef.current = setTimeout(() => {
        fetchMusicPage(query, 1, false).finally(() => setMusicSearchLoading(false));
      }, 350);
    },
    [fetchMusicPage]
  );

  const handleMusicLoadMore = useCallback(async () => {
    if (musicLoadingMore || !musicHasMore || !api) return;
    setMusicLoadingMore(true);
    const nextPage = musicPage + 1;
    setMusicPage(nextPage);
    await fetchMusicPage(musicSearchQuery, nextPage, true);
    setMusicLoadingMore(false);
  }, [musicLoadingMore, musicHasMore, musicPage, musicSearchQuery, api, fetchMusicPage]);

  // Infinite scroll handler for music results
  const handleMusicScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const el = e.currentTarget;
      if (el.scrollHeight - el.scrollTop - el.clientHeight < 80) {
        handleMusicLoadMore();
      }
    },
    [handleMusicLoadMore]
  );

  const toggleMusicPreview = useCallback(
    async (trackId: string, previewUrl: string) => {
      if (previewingTrackId === trackId) {
        // Stop playing
        if (audioPreviewRef.current) {
          audioPreviewRef.current.pause();
          audioPreviewRef.current.src = "";
        }
        setPreviewingTrackId(null);
        return;
      }

      setPreviewingTrackId(trackId);

      // If previewUrl is empty, fetch it from the backend
      let url = previewUrl;
      if (!url && api) {
        try {
          const data = await trainerApi.studioMusic.preview(api, trackId);
          url = data?.preview_url || data?.url || "";
        } catch {
          showToast("Failed to load music preview", "error");
          setPreviewingTrackId(null);
          return;
        }
      }

      if (audioPreviewRef.current && url) {
        audioPreviewRef.current.src = url;
        audioPreviewRef.current.play().catch(() => {
          showToast("Browser blocked audio playback", "error");
          setPreviewingTrackId(null);
        });
      } else {
        showToast("Preview not available for this track", "error");
        setPreviewingTrackId(null);
      }
    },
    [previewingTrackId, api, showToast]
  );

  const startAddMusicTrack = useCallback(
    (result: { trackId: string; title: string; artist: string; duration: number }) => {
      setAddingMusicConfig({
        trackId: result.trackId,
        title: result.title,
        artist: result.artist,
        duration: result.duration,
      });
      // Auto-position: start after the last music track
      const lastTrack = edlRef.current.musicTracks[edlRef.current.musicTracks.length - 1];
      const startAfter = lastTrack ? lastTrack.videoEnd : 0;
      const autoEnd = Math.min(startAfter + result.duration, totalOutputDuration);
      setMusicConfigForm({
        videoStart: startAfter,
        videoEnd: autoEnd,
        trackOffset: 0,
        volume: 80,
        fadeIn: 1,
        fadeOut: 1,
        loop: false,
      });
    },
    [totalOutputDuration]
  );

  const confirmAddMusicTrack = useCallback(() => {
    if (!addingMusicConfig) return;
    const track: MusicTrack = {
      id: generateId(),
      trackId: addingMusicConfig.trackId,
      title: addingMusicConfig.title,
      artist: addingMusicConfig.artist,
      videoStart: musicConfigForm.videoStart,
      videoEnd: musicConfigForm.videoEnd,
      trackOffset: musicConfigForm.trackOffset,
      volume: musicConfigForm.volume,
      fadeIn: musicConfigForm.fadeIn,
      fadeOut: musicConfigForm.fadeOut,
      loop: musicConfigForm.loop,
    };
    pushHistory({
      ...edl,
      version: edl.version + 1,
      musicTracks: [...edl.musicTracks, track],
    });
    setAddingMusicConfig(null);
    showToast("Music track added", "success");
  }, [addingMusicConfig, musicConfigForm, edl, pushHistory, showToast]);

  const removeMusicTrack = useCallback(
    (trackId: string) => {
      pushHistory({
        ...edl,
        version: edl.version + 1,
        musicTracks: edl.musicTracks.filter((t) => t.id !== trackId),
      });
      if (editingMusicTrackId === trackId) setEditingMusicTrackId(null);
      if (selectedMusicTrackId === trackId) setSelectedMusicTrackId(null);
      showToast("Music track removed", "success");
    },
    [edl, pushHistory, editingMusicTrackId, selectedMusicTrackId, showToast]
  );

  const startEditMusicTrack = useCallback(
    (trackId: string) => {
      const track = edl.musicTracks.find((t) => t.id === trackId);
      if (!track) return;
      setEditingMusicTrackId(trackId);
      setMusicConfigForm({
        videoStart: track.videoStart,
        videoEnd: track.videoEnd,
        trackOffset: track.trackOffset,
        volume: track.volume,
        fadeIn: track.fadeIn,
        fadeOut: track.fadeOut,
        loop: track.loop,
      });
    },
    [edl.musicTracks]
  );

  const confirmEditMusicTrack = useCallback(() => {
    if (!editingMusicTrackId) return;
    pushHistory({
      ...edl,
      version: edl.version + 1,
      musicTracks: edl.musicTracks.map((t) =>
        t.id === editingMusicTrackId
          ? {
              ...t,
              videoStart: musicConfigForm.videoStart,
              videoEnd: musicConfigForm.videoEnd,
              trackOffset: musicConfigForm.trackOffset,
              volume: musicConfigForm.volume,
              fadeIn: musicConfigForm.fadeIn,
              fadeOut: musicConfigForm.fadeOut,
              loop: musicConfigForm.loop,
            }
          : t
      ),
    });
    setEditingMusicTrackId(null);
    showToast("Music track updated", "success");
  }, [editingMusicTrackId, musicConfigForm, edl, pushHistory, showToast]);

  /* ================================================================ */
  /*  Auto-save (debounced 5s)                                         */
  /* ================================================================ */

  useEffect(() => {
    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        await onSaveDraft(edl);
        setLastSaveTime(Date.now());
      } catch {
        // Silent fail — auto-save is best-effort
      } finally {
        setTimeout(() => setIsSaving(false), 800);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [edl, onSaveDraft]);

  /* ================================================================ */
  /*  Keyboard shortcuts                                               */
  /* ================================================================ */

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      const isMeta = e.metaKey || e.ctrlKey;

      switch (e.key) {
        case " ":
          e.preventDefault();
          togglePlay();
          break;
        case "s":
          if (!isMeta) {
            e.preventDefault();
            splitClipAtPlayhead();
          }
          break;
        case "d":
          if (!isMeta && edlRef.current.selectedClipId) {
            e.preventDefault();
            duplicateClip(edlRef.current.selectedClipId);
          }
          break;
        case "Delete":
        case "Backspace":
          if (edlRef.current.selectedClipId) {
            e.preventDefault();
            deleteClip(edlRef.current.selectedClipId);
          }
          break;
        case "z":
          if (isMeta && e.shiftKey) {
            e.preventDefault();
            redo();
          } else if (isMeta) {
            e.preventDefault();
            undo();
          }
          break;
        case "i":
          e.preventDefault();
          setClipInPoint();
          break;
        case "o":
          e.preventDefault();
          setClipOutPoint();
          break;
        case "m":
          e.preventDefault();
          addChapterAtPlayhead();
          break;
        case "ArrowLeft":
          e.preventDefault();
          stepFrame(-1);
          break;
        case "ArrowRight":
          e.preventDefault();
          stepFrame(1);
          break;
        case "+":
        case "=":
          e.preventDefault();
          setTimelineZoom((prev) => Math.min(prev * 1.5, 10));
          break;
        case "-":
          e.preventDefault();
          setTimelineZoom((prev) => Math.max(prev / 1.5, 0.5));
          break;
        case "l":
          e.preventDefault();
          toggleLoop();
          break;
        default:
          break;
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    togglePlay,
    splitClipAtPlayhead,
    duplicateClip,
    deleteClip,
    undo,
    redo,
    setClipInPoint,
    setClipOutPoint,
    addChapterAtPlayhead,
    stepFrame,
    toggleLoop,
  ]);

  /* ================================================================ */
  /*  Timeline interactions                                            */
  /* ================================================================ */

  const getTimeFromMouseEvent = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const tl = timelineRef.current;
      if (!tl) return 0;
      const rect = tl.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const pct = clamp(x / rect.width, 0, 1);
      return pct * duration;
    },
    [duration]
  );

  // Convert output timeline percentage to source time
  const outputPctToSourceTime = useCallback(
    (pct: number): number => {
      const outputTime = pct * totalOutputDuration;
      let accumulated = 0;
      for (const c of edlRef.current.clips) {
        const clipDur = (c.sourceEnd - c.sourceStart) / (c.speed || 1);
        if (accumulated + clipDur >= outputTime) {
          const fract = clipDur > 0 ? (outputTime - accumulated) / clipDur : 0;
          return c.sourceStart + fract * (c.sourceEnd - c.sourceStart);
        }
        accumulated += clipDur;
      }
      // Past the end — return last clip's end
      const last = edlRef.current.clips[edlRef.current.clips.length - 1];
      return last ? last.sourceEnd : 0;
    },
    [totalOutputDuration]
  );

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      if (playheadDragging.current || clipEdgeDragging.current || musicEdgeDragging.current) return;
      const tl = timelineRef.current;
      if (!tl) return;
      const rect = tl.getBoundingClientRect();
      const pct = clamp((e.clientX - rect.left) / rect.width, 0, 1);
      const srcTime = outputPctToSourceTime(pct);
      seekTo(srcTime);
    },
    [outputPctToSourceTime, seekTo]
  );

  /* ── Playhead drag ── */
  const startPlayheadDrag = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      playheadDragging.current = true;

      const video = videoRef.current;
      const wasPlaying = video && !video.paused;
      if (wasPlaying) {
        video?.pause();
      }

      function onMove(ev: MouseEvent) {
        if (!playheadDragging.current) return;
        const tl = timelineRef.current;
        if (!tl) return;
        const rect = tl.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const pct = clamp(x / rect.width, 0, 1);
        const time = pct * duration;
        const clamped = clamp(time, 0, duration);
        if (videoRef.current) {
          videoRef.current.currentTime = clamped;
        }
        setCurrentTime(clamped);
      }

      function onUp() {
        playheadDragging.current = false;
        if (wasPlaying) {
          video?.play().catch(() => {});
        }
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      }

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [duration]
  );

  /* ── Clip edge drag (uses edlRef to avoid stale closures) ── */
  const startClipEdgeDrag = useCallback(
    (clipId: string, edge: "start" | "end", e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      clipEdgeDragging.current = { clipId, edge };

      function onMove(ev: MouseEvent) {
        if (!clipEdgeDragging.current) return;
        const tl = timelineRef.current;
        if (!tl) return;
        const rect = tl.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const pct = clamp(x / rect.width, 0, 1);
        const time = pct * duration;
        const { clipId: cId, edge: cEdge } = clipEdgeDragging.current;

        setEdl((prev) => {
          const clips = prev.clips.map((c) => {
            if (c.id !== cId) return c;
            if (cEdge === "start") {
              const clamped = clamp(time, 0, c.sourceEnd - 0.1);
              return { ...c, sourceStart: clamped };
            } else {
              const clamped = clamp(time, c.sourceStart + 0.1, duration);
              return { ...c, sourceEnd: clamped };
            }
          });
          return { ...prev, clips };
        });

        // Visual feedback: seek to the edge being dragged
        const targetTime = clamp(time, 0, duration);
        if (videoRef.current) {
          videoRef.current.currentTime = targetTime;
        }
        setCurrentTime(targetTime);
      }

      function onUp() {
        if (clipEdgeDragging.current) {
          // Commit the latest edl state from ref to history
          pushHistory({ ...edlRef.current, version: edlRef.current.version + 1 });
        }
        clipEdgeDragging.current = null;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      }

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [duration, pushHistory]
  );

  /* ── Music track edge drag ── */
  const startMusicEdgeDrag = useCallback(
    (trackId: string, edge: "start" | "end", e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      musicEdgeDragging.current = { trackId, edge };

      function onMove(ev: MouseEvent) {
        if (!musicEdgeDragging.current) return;
        const tl = timelineRef.current;
        if (!tl) return;
        const rect = tl.getBoundingClientRect();
        const x = ev.clientX - rect.left;
        const pct = clamp(x / rect.width, 0, 1);
        const time = pct * duration;
        const { trackId: tId, edge: tEdge } = musicEdgeDragging.current;

        setEdl((prev) => {
          const musicTracks = prev.musicTracks.map((t) => {
            if (t.id !== tId) return t;
            if (tEdge === "start") {
              const clamped = clamp(time, 0, t.videoEnd - 0.5);
              return { ...t, videoStart: clamped };
            } else {
              const clamped = clamp(time, t.videoStart + 0.5, duration);
              return { ...t, videoEnd: clamped };
            }
          });
          return { ...prev, musicTracks };
        });
      }

      function onUp() {
        if (musicEdgeDragging.current) {
          pushHistory({ ...edlRef.current, version: edlRef.current.version + 1 });
        }
        musicEdgeDragging.current = null;
        document.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseup", onUp);
      }

      document.addEventListener("mousemove", onMove);
      document.addEventListener("mouseup", onUp);
    },
    [duration, pushHistory]
  );

  /* ================================================================ */
  /*  Publish / Save Draft                                             */
  /* ================================================================ */

  const handlePublish = useCallback(() => {
    onPublish(edl);
  }, [edl, onPublish]);

  const handleSaveDraft = useCallback(async () => {
    setIsSaving(true);
    try {
      await onSaveDraft(edl);
      setLastSaveTime(Date.now());
      showToast("Draft saved", "success");
    } catch {
      showToast("Failed to save draft", "error");
    } finally {
      setTimeout(() => setIsSaving(false), 600);
    }
  }, [edl, onSaveDraft, showToast]);

  /* ================================================================ */
  /*  Render: Toolbar                                                  */
  /* ================================================================ */

  function renderToolbar() {
    return (
      <div
        className="flex items-center justify-between px-3 shrink-0"
        style={{
          height: 48,
          background: PANEL_BG,
          borderBottom: `1px solid ${PANEL_BORDER}`,
        }}
      >
        {/* Left group */}
        <div className="flex items-center gap-1">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 px-2 py-1.5 rounded-md transition-colors"
            style={{ color: BRAND.textMuted }}
            title="Back"
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <ArrowLeft size={16} />
            {!isMobile && <span className="text-xs">Back</span>}
          </button>

          <div
            className="mx-2 h-5"
            style={{ width: 1, background: PANEL_BORDER }}
          />

          <button
            onClick={undo}
            disabled={!canUndo}
            className="p-1.5 rounded-md transition-colors"
            style={{
              color: canUndo ? BRAND.textMuted : BRAND.textDim,
              cursor: canUndo ? "pointer" : "not-allowed",
            }}
            title="Undo (Ctrl+Z)"
            onMouseEnter={(e) => {
              if (canUndo)
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Undo2 size={16} />
          </button>

          <button
            onClick={redo}
            disabled={!canRedo}
            className="p-1.5 rounded-md transition-colors"
            style={{
              color: canRedo ? BRAND.textMuted : BRAND.textDim,
              cursor: canRedo ? "pointer" : "not-allowed",
            }}
            title="Redo (Ctrl+Shift+Z)"
            onMouseEnter={(e) => {
              if (canRedo)
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
            }}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Redo2 size={16} />
          </button>
        </div>

        {/* Center group */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveDraft}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-colors"
            style={{
              color: BRAND.textMuted,
              border: `1px solid ${PANEL_BORDER}`,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Save size={14} />
            {!isMobile && "Save Draft"}
          </button>
          {/* Auto-save indicator */}
          {isSaving && (
            <div className="flex items-center gap-1">
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: BRAND.accent }}
              />
              <span className="text-xs" style={{ color: BRAND.textDim }}>
                Saving...
              </span>
            </div>
          )}
          {!isSaving && lastSaveTime && (
            <span className="text-xs" style={{ color: BRAND.textDim }}>
              Saved
            </span>
          )}
        </div>

        {/* Right group */}
        <div className="flex items-center gap-2">
          {(isLaptop || isDesktop) && (
            <button
              onClick={() => setShowInspector((prev) => !prev)}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: BRAND.textMuted }}
              title={showInspector ? "Hide Inspector" : "Show Inspector"}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {showInspector ? (
                <PanelRightClose size={16} />
              ) : (
                <PanelRightOpen size={16} />
              )}
            </button>
          )}

          <button
            onClick={handlePublish}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-medium transition-opacity hover:opacity-90"
            style={{
              background: `linear-gradient(135deg, ${BRAND.primary}, #9333ea)`,
              color: "#fff",
            }}
          >
            <Eye size={14} />
            Publish
          </button>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  Render: Tool Panel                                               */
  /* ================================================================ */

  function renderToolPanel() {
    if (isMobile) return null;

    const expanded = toolPanelExpanded && !isTablet;
    const panelWidth = expanded ? 160 : 52;

    return (
      <div
        className="flex flex-col shrink-0 py-2"
        style={{
          width: panelWidth,
          background: PANEL_BG,
          borderRight: `1px solid ${PANEL_BORDER}`,
          transition: "width 0.2s ease",
        }}
      >
        {TOOL_ITEMS.map((tool) => {
          const Icon = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <button
              key={tool.id}
              onClick={() => setActiveTool(tool.id)}
              className="flex items-center gap-2.5 mx-1.5 mb-0.5 rounded-md transition-colors"
              style={{
                padding: expanded ? "8px 10px" : "8px",
                justifyContent: expanded ? "flex-start" : "center",
                background: isActive ? ACTIVE_TOOL_BG : "transparent",
                color: isActive ? "#fff" : BRAND.textMuted,
                borderLeft: isActive
                  ? `2px solid ${BRAND.primary}`
                  : "2px solid transparent",
              }}
              title={tool.label}
              onMouseEnter={(e) => {
                if (!isActive)
                  e.currentTarget.style.background = "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon size={18} />
              {expanded && (
                <span className="text-xs whitespace-nowrap">{tool.label}</span>
              )}
            </button>
          );
        })}

        {/* Expand/collapse toggle */}
        {!isTablet && (
          <button
            onClick={() => setToolPanelExpanded((prev) => !prev)}
            className="mt-auto mx-1.5 p-2 rounded-md flex justify-center"
            style={{ color: BRAND.textDim }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            {expanded ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
          </button>
        )}
      </div>
    );
  }

  /* ================================================================ */
  /*  Render: Video Player                                             */
  /* ================================================================ */

  function renderVideoPlayer() {
    const clipSpeed = selectedClip ? selectedClip.speed : 1;

    return (
      <div className="flex flex-col flex-1 min-w-0">
        {/* Video container */}
        <div
          className="flex-1 flex items-center justify-center relative overflow-hidden"
          style={{ background: "#000" }}
        >
          <video
            ref={videoRef}
            src={videoPreviewUrl}
            className="max-w-full max-h-full object-contain"
            style={{
              transform: `rotate(${edl.rotation}deg)`,
              transition: "transform 0.3s ease",
            }}
            onTimeUpdate={handleTimeUpdate}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              if (isLooping) {
                const video = videoRef.current;
                if (video && edl.clips.length > 0) {
                  video.currentTime = edl.clips[0].sourceStart;
                  video.play().catch(() => {});
                }
              } else {
                setIsPlaying(false);
              }
            }}
            preload="auto"
            playsInline
          />

          {/* Crop overlay */}
          {edl.cropPreset !== "original" && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ border: `2px dashed ${BRAND.accent}40` }}
            >
              {renderCropOverlay()}
            </div>
          )}
        </div>

        {/* Controls bar */}
        <div
          className="flex items-center gap-2 px-3 shrink-0"
          style={{
            height: 44,
            background: PANEL_BG,
            borderTop: `1px solid ${PANEL_BORDER}`,
          }}
        >
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className="p-1.5 rounded-md transition-colors"
            style={{ color: BRAND.textMain }}
            title="Play/Pause (Space)"
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          {/* Frame step */}
          {!isMobile && (
            <>
              <button
                onClick={() => stepFrame(-1)}
                className="p-1 rounded transition-colors"
                style={{ color: BRAND.textMuted }}
                title="Previous frame (Left arrow)"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <SkipBack size={14} />
              </button>
              <button
                onClick={() => stepFrame(1)}
                className="p-1 rounded transition-colors"
                style={{ color: BRAND.textMuted }}
                title="Next frame (Right arrow)"
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                <SkipForward size={14} />
              </button>
            </>
          )}

          {/* Time display */}
          <div
            className="text-xs font-mono px-2"
            style={{ color: BRAND.textMuted }}
          >
            <span style={{ color: BRAND.textMain }}>
              {formatTime(currentTime, true)}
            </span>
            {" / "}
            {formatTime(totalOutputDuration)}
          </div>

          <div className="flex-1" />

          {/* Speed selector */}
          {!isMobile && (
            <div className="relative">
              <button
                onClick={() => setSpeedDropdownOpen((prev) => !prev)}
                className="px-2 py-1 rounded text-xs font-mono transition-colors"
                style={{
                  color: clipSpeed !== 1 ? BRAND.accent : BRAND.textMuted,
                  border: `1px solid ${PANEL_BORDER}`,
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {clipSpeed}x
              </button>
              {speedDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setSpeedDropdownOpen(false)}
                  />
                  <div
                    className="absolute bottom-full right-0 mb-1 rounded-md overflow-hidden z-50"
                    style={{
                      background: BRAND.panel,
                      border: `1px solid ${PANEL_BORDER}`,
                      minWidth: 80,
                    }}
                  >
                    {SPEED_PRESETS.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          if (selectedClip) {
                            updateClip(selectedClip.id, { speed: s });
                          }
                          setSpeedDropdownOpen(false);
                        }}
                        className="block w-full text-left px-3 py-1.5 text-xs font-mono transition-colors"
                        style={{
                          color:
                            clipSpeed === s ? BRAND.accent : BRAND.textMuted,
                          background:
                            clipSpeed === s ? ACTIVE_TOOL_BG : "transparent",
                        }}
                        onMouseEnter={(e) =>
                          (e.currentTarget.style.background =
                            "rgba(255,255,255,0.06)")
                        }
                        onMouseLeave={(e) =>
                          (e.currentTarget.style.background =
                            clipSpeed === s ? ACTIVE_TOOL_BG : "transparent")
                        }
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Volume */}
          {!isMobile && selectedClip && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => {
                  if (selectedClip) {
                    updateClip(selectedClip.id, {
                      volume: selectedClip.volume === 0 ? 100 : 0,
                    });
                  }
                }}
                className="p-1 rounded transition-colors"
                style={{ color: BRAND.textMuted }}
                title={selectedClip.volume === 0 ? "Unmute" : "Mute"}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {selectedClip.volume === 0 ? (
                  <VolumeX size={14} />
                ) : (
                  <Volume2 size={14} />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={selectedClip.volume}
                onChange={(e) =>
                  updateClip(selectedClip.id, { volume: Number(e.target.value) })
                }
                className="w-16 h-1 accent-purple-600"
                style={{ cursor: "pointer" }}
              />
            </div>
          )}

          {/* Loop */}
          <button
            onClick={toggleLoop}
            className="p-1 rounded transition-colors"
            style={{
              color: isLooping ? BRAND.accent : BRAND.textDim,
            }}
            title="Toggle Loop (L)"
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Repeat size={14} />
          </button>

          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-1 rounded transition-colors"
            style={{ color: BRAND.textMuted }}
            title="Fullscreen"
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
          </button>
        </div>
      </div>
    );
  }

  /* ── Crop overlay helper ── */
  function renderCropOverlay() {
    const preset = CROP_PRESETS.find((p) => p.value === edl.cropPreset);
    if (!preset || preset.ratio === 0) return null;

    return (
      <div className="absolute inset-0 flex items-center justify-center">
        <div
          className="border-2 border-dashed"
          style={{
            borderColor: BRAND.accent,
            aspectRatio: preset.ratio,
            maxWidth: "90%",
            maxHeight: "90%",
            width: preset.ratio > 1 ? "90%" : "auto",
            height: preset.ratio <= 1 ? "90%" : "auto",
          }}
        />
      </div>
    );
  }

  /* ================================================================ */
  /*  Render: Inspector Panel                                          */
  /* ================================================================ */

  function renderInspector() {
    if (isMobile || isTablet) return null;
    if (!showInspector) return null;

    const toolLabel =
      activeTool === "trim"
        ? "Trim / Split"
        : activeTool === "crop"
          ? "Crop & Rotate"
          : activeTool === "speed"
            ? "Speed"
            : activeTool === "audio"
              ? "Audio"
              : activeTool === "chapters"
                ? "Chapters"
                : "Music";

    return (
      <div
        className="flex flex-col shrink-0 overflow-y-auto"
        style={{
          width: 280,
          background: PANEL_BG,
          borderLeft: `1px solid ${PANEL_BORDER}`,
        }}
      >
        {/* Inspector header */}
        <div
          className="flex items-center justify-between px-3 py-2.5 shrink-0"
          style={{ borderBottom: `1px solid ${PANEL_BORDER}` }}
        >
          <span
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: BRAND.textDim }}
          >
            {toolLabel}
          </span>
          {selectedClip && activeTool !== "music" && activeTool !== "chapters" && activeTool !== "crop" && (
            <span
              className="text-xs font-mono px-1.5 py-0.5 rounded"
              style={{ background: ACTIVE_TOOL_BG, color: BRAND.primary }}
            >
              Clip {edl.clips.findIndex((c) => c.id === selectedClip.id) + 1}
            </span>
          )}
        </div>

        <div className="flex-1 p-3 space-y-4">
          {activeTool === "trim" && renderTrimInspector()}
          {activeTool === "crop" && renderCropInspector()}
          {activeTool === "speed" && renderSpeedInspector()}
          {activeTool === "audio" && renderAudioInspector()}
          {activeTool === "chapters" && renderChaptersInspector()}
          {activeTool === "music" && renderMusicInspector()}
        </div>
      </div>
    );
  }

  /* ── Trim inspector ── */
  function renderTrimInspector() {
    if (!selectedClip) {
      return (
        <div className="text-xs text-center py-6" style={{ color: BRAND.textDim }}>
          Select a clip on the timeline to edit its trim points.
        </div>
      );
    }

    const clipDur = selectedClip.sourceEnd - selectedClip.sourceStart;

    return (
      <>
        {/* In point */}
        <div>
          <label className="block text-xs mb-1" style={{ color: BRAND.textDim }}>
            Source Start
          </label>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 px-2 py-1.5 rounded text-xs font-mono"
              style={{
                background: BRAND.input,
                color: BRAND.textMain,
                border: `1px solid ${PANEL_BORDER}`,
              }}
            >
              {formatTime(selectedClip.sourceStart, true)}
            </div>
            <button
              onClick={setClipInPoint}
              className="px-2 py-1.5 rounded text-xs transition-colors"
              style={{
                background: ACTIVE_TOOL_BG,
                color: BRAND.primary,
                border: `1px solid ${BRAND.primary}40`,
              }}
              title="Set Start (I)"
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = `${BRAND.primary}30`)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = ACTIVE_TOOL_BG)
              }
            >
              Set Start
            </button>
          </div>
        </div>

        {/* Out point */}
        <div>
          <label className="block text-xs mb-1" style={{ color: BRAND.textDim }}>
            Source End
          </label>
          <div className="flex items-center gap-2">
            <div
              className="flex-1 px-2 py-1.5 rounded text-xs font-mono"
              style={{
                background: BRAND.input,
                color: BRAND.textMain,
                border: `1px solid ${PANEL_BORDER}`,
              }}
            >
              {formatTime(selectedClip.sourceEnd, true)}
            </div>
            <button
              onClick={setClipOutPoint}
              className="px-2 py-1.5 rounded text-xs transition-colors"
              style={{
                background: ACTIVE_TOOL_BG,
                color: BRAND.primary,
                border: `1px solid ${BRAND.primary}40`,
              }}
              title="Set End (O)"
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = `${BRAND.primary}30`)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = ACTIVE_TOOL_BG)
              }
            >
              Set End
            </button>
          </div>
        </div>

        {/* Duration display */}
        <div>
          <label className="block text-xs mb-1" style={{ color: BRAND.textDim }}>
            Clip Duration
          </label>
          <div
            className="px-2 py-1.5 rounded text-xs font-mono"
            style={{
              background: BRAND.input,
              color: BRAND.accent,
              border: `1px solid ${PANEL_BORDER}`,
            }}
          >
            {formatTime(clipDur, true)}
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${PANEL_BORDER}` }} />

        {/* Split section */}
        <div>
          <label className="block text-xs mb-2" style={{ color: BRAND.textDim }}>
            Split
          </label>
          <button
            onClick={splitClipAtPlayhead}
            className="w-full flex items-center justify-center gap-1.5 py-1.5 rounded text-xs transition-colors"
            style={{
              background: ACTIVE_TOOL_BG,
              color: BRAND.primary,
              border: `1px solid ${BRAND.primary}40`,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = `${BRAND.primary}30`)
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = ACTIVE_TOOL_BG)
            }
          >
            <Scissors size={12} />
            Split at Playhead (S)
          </button>
        </div>

        {/* Clip count */}
        <div>
          <label className="block text-xs mb-1" style={{ color: BRAND.textDim }}>
            Total Clips
          </label>
          <div
            className="text-xs font-mono"
            style={{ color: BRAND.textMuted }}
          >
            {edl.clips.length} clip{edl.clips.length !== 1 ? "s" : ""} |{" "}
            Total output: {formatTime(totalOutputDuration, true)}
          </div>
        </div>
      </>
    );
  }

  /* ── Crop inspector ── */
  function renderCropInspector() {
    return (
      <>
        <div>
          <label className="block text-xs mb-2" style={{ color: BRAND.textDim }}>
            Aspect Ratio
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {CROP_PRESETS.map((preset) => {
              const isActive = edl.cropPreset === preset.value;
              return (
                <button
                  key={preset.value}
                  onClick={() => updateEdl({ cropPreset: preset.value })}
                  className="flex flex-col items-center gap-1 py-2 px-1 rounded-md transition-colors"
                  style={{
                    background: isActive ? ACTIVE_TOOL_BG : "transparent",
                    border: isActive
                      ? `1px solid ${BRAND.primary}`
                      : `1px solid ${PANEL_BORDER}`,
                    color: isActive ? BRAND.textMain : BRAND.textMuted,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  <div
                    className="rounded-sm"
                    style={{
                      width:
                        preset.value === "original"
                          ? 24
                          : preset.ratio > 1
                            ? 28
                            : preset.ratio === 1
                              ? 22
                              : 16,
                      height:
                        preset.value === "original"
                          ? 16
                          : preset.ratio > 1
                            ? Math.round(28 / preset.ratio)
                            : preset.ratio === 1
                              ? 22
                              : 28,
                      border: `1.5px solid ${isActive ? BRAND.primary : BRAND.textDim}`,
                    }}
                  />
                  <span className="text-xs">{preset.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${PANEL_BORDER}` }} />

        {/* Rotation */}
        <div>
          <label className="block text-xs mb-2" style={{ color: BRAND.textDim }}>
            Rotation
          </label>
          <div className="grid grid-cols-4 gap-1">
            {ROTATION_OPTIONS.map((deg) => {
              const isActive = edl.rotation === deg;
              return (
                <button
                  key={deg}
                  onClick={() =>
                    updateEdl({
                      rotation: deg as EdlProject["rotation"],
                    })
                  }
                  className="flex items-center justify-center py-1.5 rounded text-xs font-mono transition-colors"
                  style={{
                    background: isActive ? ACTIVE_TOOL_BG : "transparent",
                    border: isActive
                      ? `1px solid ${BRAND.primary}`
                      : `1px solid ${PANEL_BORDER}`,
                    color: isActive ? BRAND.textMain : BRAND.textMuted,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  {deg}°
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${PANEL_BORDER}` }} />
        <div>
          <label className="block text-xs mb-1" style={{ color: BRAND.textDim }}>
            Source Resolution
          </label>
          <div
            className="text-xs font-mono"
            style={{ color: BRAND.textMuted }}
          >
            {edl.resolution.width} x {edl.resolution.height}
          </div>
        </div>
      </>
    );
  }

  /* ── Speed inspector ── */
  function renderSpeedInspector() {
    if (!selectedClip) {
      return (
        <div className="text-xs text-center py-6" style={{ color: BRAND.textDim }}>
          Select a clip to adjust its playback speed.
        </div>
      );
    }

    const effectiveDuration = (selectedClip.sourceEnd - selectedClip.sourceStart) / selectedClip.speed;

    return (
      <>
        <div>
          <label className="block text-xs mb-1" style={{ color: BRAND.textDim }}>
            Playback Speed (Clip {edl.clips.findIndex((c) => c.id === selectedClip.id) + 1})
          </label>
          <div
            className="text-2xl font-mono font-bold mb-3"
            style={{
              color: selectedClip.speed !== 1 ? BRAND.accent : BRAND.textMain,
            }}
          >
            {selectedClip.speed}x
          </div>

          {/* Slider */}
          <input
            type="range"
            min={0.25}
            max={4}
            step={0.25}
            value={selectedClip.speed}
            onChange={(e) => updateClip(selectedClip.id, { speed: Number(e.target.value) })}
            className="w-full h-1.5 accent-purple-600 mb-3"
            style={{ cursor: "pointer" }}
          />

          <div
            className="flex justify-between text-xs font-mono mb-3"
            style={{ color: BRAND.textDim }}
          >
            <span>0.25x</span>
            <span>4x</span>
          </div>

          {/* Speed presets */}
          <label className="block text-xs mb-1.5" style={{ color: BRAND.textDim }}>
            Presets
          </label>
          <div className="grid grid-cols-4 gap-1">
            {[0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4].map((s) => {
              const isActive = selectedClip.speed === s;
              return (
                <button
                  key={s}
                  onClick={() => updateClip(selectedClip.id, { speed: s })}
                  className="py-1.5 rounded text-xs font-mono transition-colors"
                  style={{
                    background: isActive ? ACTIVE_TOOL_BG : "transparent",
                    border: isActive
                      ? `1px solid ${BRAND.primary}`
                      : `1px solid ${PANEL_BORDER}`,
                    color: isActive ? BRAND.accent : BRAND.textMuted,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  {s}x
                </button>
              );
            })}
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: `1px solid ${PANEL_BORDER}` }} />

        {/* Apply to all */}
        <button
          onClick={() => applySpeedToAll(selectedClip.speed)}
          className="w-full py-1.5 rounded text-xs transition-colors"
          style={{
            color: BRAND.textMuted,
            border: `1px solid ${PANEL_BORDER}`,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "transparent")
          }
        >
          Apply {selectedClip.speed}x to All Clips
        </button>

        {/* Maintain pitch toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: BRAND.textMuted }}>
            Maintain Audio Pitch
          </span>
          <button
            onClick={() => setMaintainPitch((prev) => !prev)}
            className="relative w-9 h-5 rounded-full transition-colors"
            style={{
              background: maintainPitch ? BRAND.primary : "rgba(255,255,255,0.1)",
            }}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
              style={{
                background: "#fff",
                left: maintainPitch ? 18 : 2,
                transition: "left 0.2s ease",
              }}
            />
          </button>
        </div>

        {/* Effective duration */}
        <div>
          <label className="block text-xs mb-1" style={{ color: BRAND.textDim }}>
            Clip Output Duration
          </label>
          <div
            className="text-xs font-mono"
            style={{ color: BRAND.textMuted }}
          >
            {formatTime(effectiveDuration, true)}
          </div>
        </div>
      </>
    );
  }

  /* ── Audio inspector ── */
  function renderAudioInspector() {
    if (!selectedClip) {
      return (
        <div className="text-xs text-center py-6" style={{ color: BRAND.textDim }}>
          Select a clip to adjust its volume.
        </div>
      );
    }

    return (
      <>
        <div>
          <label className="block text-xs mb-1" style={{ color: BRAND.textDim }}>
            Volume (Clip {edl.clips.findIndex((c) => c.id === selectedClip.id) + 1})
          </label>
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() =>
                updateClip(selectedClip.id, {
                  volume: selectedClip.volume === 0 ? 100 : 0,
                })
              }
              className="p-1.5 rounded transition-colors"
              style={{
                color: selectedClip.volume === 0 ? BRAND.error : BRAND.textMain,
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              {selectedClip.volume === 0 ? (
                <VolumeX size={20} />
              ) : (
                <Volume2 size={20} />
              )}
            </button>
            <div
              className="text-2xl font-mono font-bold"
              style={{
                color:
                  selectedClip.volume === 0
                    ? BRAND.error
                    : BRAND.textMain,
              }}
            >
              {selectedClip.volume}%
            </div>
          </div>

          {/* Volume slider */}
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={selectedClip.volume}
            onChange={(e) =>
              updateClip(selectedClip.id, { volume: Number(e.target.value) })
            }
            className="w-full h-1.5 accent-purple-600 mb-2"
            style={{ cursor: "pointer" }}
          />

          <div
            className="flex justify-between text-xs font-mono"
            style={{ color: BRAND.textDim }}
          >
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>

        {/* Quick volume presets */}
        <div style={{ borderTop: `1px solid ${PANEL_BORDER}` }} />
        <div>
          <label className="block text-xs mb-1.5" style={{ color: BRAND.textDim }}>
            Quick Presets
          </label>
          <div className="grid grid-cols-4 gap-1">
            {[0, 25, 50, 75, 100].map((v) => {
              const isActive = selectedClip.volume === v;
              return (
                <button
                  key={v}
                  onClick={() => updateClip(selectedClip.id, { volume: v })}
                  className="py-1.5 rounded text-xs font-mono transition-colors"
                  style={{
                    background: isActive ? ACTIVE_TOOL_BG : "transparent",
                    border: isActive
                      ? `1px solid ${BRAND.primary}`
                      : `1px solid ${PANEL_BORDER}`,
                    color: isActive ? BRAND.textMain : BRAND.textMuted,
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.04)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  {v}%
                </button>
              );
            })}
          </div>
        </div>

        {/* Mute toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: BRAND.textMuted }}>
            Mute Clip
          </span>
          <button
            onClick={() =>
              updateClip(selectedClip.id, {
                volume: selectedClip.volume === 0 ? 100 : 0,
              })
            }
            className="relative w-9 h-5 rounded-full transition-colors"
            style={{
              background: selectedClip.volume === 0 ? BRAND.error : "rgba(255,255,255,0.1)",
            }}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
              style={{
                background: "#fff",
                left: selectedClip.volume === 0 ? 18 : 2,
                transition: "left 0.2s ease",
              }}
            />
          </button>
        </div>
      </>
    );
  }

  /* ── Chapters inspector ── */
  function renderChaptersInspector() {
    return (
      <>
        <button
          onClick={addChapterAtPlayhead}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-xs transition-colors"
          style={{
            background: ACTIVE_TOOL_BG,
            color: BRAND.primary,
            border: `1px solid ${BRAND.primary}40`,
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = `${BRAND.primary}30`)
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = ACTIVE_TOOL_BG)
          }
        >
          <Plus size={14} />
          Add at Playhead (M)
        </button>

        {edl.chapters.length === 0 ? (
          <div
            className="text-xs text-center py-6"
            style={{ color: BRAND.textDim }}
          >
            No chapters yet.
            <br />
            Seek to a position and click
            <br />
            &quot;Add at Playhead&quot; to create one.
          </div>
        ) : (
          <div className="space-y-1.5">
            {edl.chapters.map((chapter, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-2 rounded-md"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${PANEL_BORDER}`,
                }}
              >
                <Diamond
                  size={12}
                  className="mt-1 shrink-0"
                  style={{ color: BRAND.accent }}
                />

                <div className="flex-1 min-w-0">
                  <button
                    onClick={() => seekTo(chapter.time)}
                    className="text-xs font-mono mb-1 hover:underline"
                    style={{ color: BRAND.primary }}
                  >
                    {formatTime(chapter.time, true)}
                  </button>

                  {editingChapterIdx === idx ? (
                    <input
                      autoFocus
                      className="w-full text-xs px-1.5 py-0.5 rounded outline-none"
                      style={{
                        background: BRAND.input,
                        color: BRAND.textMain,
                        border: `1px solid ${BRAND.primary}`,
                      }}
                      value={chapterEditValue}
                      onChange={(e) => setChapterEditValue(e.target.value)}
                      onBlur={() => {
                        commitChapterTitle(idx, chapterEditValue);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          commitChapterTitle(idx, chapterEditValue);
                        }
                      }}
                    />
                  ) : (
                    <button
                      onClick={() => {
                        setEditingChapterIdx(idx);
                        setChapterEditValue(chapter.title);
                      }}
                      className="text-xs text-left w-full truncate"
                      style={{ color: BRAND.textMuted }}
                      title="Click to edit"
                    >
                      {chapter.title}
                    </button>
                  )}
                </div>

                <button
                  onClick={() => removeChapter(idx)}
                  className="p-0.5 rounded shrink-0 transition-colors"
                  style={{ color: BRAND.textDim }}
                  title="Remove chapter"
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = BRAND.error;
                    e.currentTarget.style.background =
                      "rgba(239,68,68,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = BRAND.textDim;
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }

  /* ── Music inspector ── */
  function renderMusicInspector() {
    // If editing an existing track, show the edit form
    if (editingMusicTrackId) {
      const track = edl.musicTracks.find((t) => t.id === editingMusicTrackId);
      if (!track) {
        setEditingMusicTrackId(null);
        return null;
      }
      return renderMusicConfigForm(
        `Edit: ${track.title}`,
        () => confirmEditMusicTrack(),
        () => setEditingMusicTrackId(null),
        "Update Track"
      );
    }

    // If adding a new track, show the config form
    if (addingMusicConfig) {
      return renderMusicConfigForm(
        `Add: ${addingMusicConfig.title}`,
        () => confirmAddMusicTrack(),
        () => setAddingMusicConfig(null),
        "Add to Video"
      );
    }

    return (
      <>
        {/* Search */}
        <div>
          <label className="block text-xs mb-1.5" style={{ color: BRAND.textDim }}>
            Search Music
          </label>
          <div className="relative">
            <Search
              size={14}
              className="absolute left-2 top-1/2 -translate-y-1/2"
              style={{ color: BRAND.textDim }}
            />
            <input
              type="text"
              value={musicSearchQuery}
              onChange={(e) => handleMusicSearch(e.target.value)}
              placeholder="Search tracks..."
              className="w-full text-xs pl-7 pr-2 py-2 rounded outline-none"
              style={{
                background: BRAND.input,
                color: BRAND.textMain,
                border: `1px solid ${PANEL_BORDER}`,
              }}
            />
          </div>
        </div>

        {/* Search results */}
        {musicSearchLoading && (
          <div className="text-xs text-center py-4" style={{ color: BRAND.textDim }}>
            Searching...
          </div>
        )}

        {!musicSearchLoading && musicSearchResults.length > 0 && (
          <div className="space-y-1.5 max-h-80 overflow-y-auto" ref={musicScrollRef} onScroll={handleMusicScroll}>
            {musicSearchResults.map((result) => (
              <div
                key={result.trackId}
                className="p-2 rounded-md"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: `1px solid ${PANEL_BORDER}`,
                }}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-xs font-medium truncate"
                      style={{ color: BRAND.textMain }}
                    >
                      {result.title}
                    </div>
                    <div
                      className="text-xs truncate"
                      style={{ color: BRAND.textDim }}
                    >
                      {result.artist}
                    </div>
                    <div
                      className="text-xs font-mono mt-0.5"
                      style={{ color: BRAND.textDim }}
                    >
                      {formatTime(result.duration)} | {result.bpm} BPM
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <button
                    onClick={() => toggleMusicPreview(result.trackId, result.previewUrl)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
                    style={{
                      color: previewingTrackId === result.trackId ? BRAND.accent : BRAND.textMuted,
                      border: `1px solid ${PANEL_BORDER}`,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    {previewingTrackId === result.trackId ? (
                      <Square size={10} />
                    ) : (
                      <Play size={10} />
                    )}
                    {previewingTrackId === result.trackId ? "Stop" : "Preview"}
                  </button>
                  <button
                    onClick={() => startAddMusicTrack(result)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors"
                    style={{
                      background: ACTIVE_TOOL_BG,
                      color: BRAND.primary,
                      border: `1px solid ${BRAND.primary}40`,
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = `${BRAND.primary}30`)
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = ACTIVE_TOOL_BG)
                    }
                  >
                    <Plus size={10} />
                    Add
                  </button>
                </div>
              </div>
            ))}
            {musicLoadingMore && (
              <div className="text-xs text-center py-3" style={{ color: BRAND.textDim }}>
                Loading more...
              </div>
            )}
            {!musicLoadingMore && musicHasMore && musicSearchResults.length >= 20 && (
              <button
                onClick={handleMusicLoadMore}
                className="w-full text-xs text-center py-2 rounded hover:bg-white/5 transition-colors"
                style={{ color: BRAND.primary }}
              >
                Load more tracks
              </button>
            )}
          </div>
        )}

        {!musicSearchLoading && !musicLoadingMore && musicSearchResults.length === 0 && musicInitialLoaded && (
          <div className="text-xs text-center py-4" style={{ color: BRAND.textDim }}>
            No results found.
          </div>
        )}

        {/* Divider */}
        {edl.musicTracks.length > 0 && (
          <div style={{ borderTop: `1px solid ${PANEL_BORDER}` }} />
        )}

        {/* Attached tracks */}
        {edl.musicTracks.length > 0 && (
          <div>
            <label className="block text-xs mb-1.5" style={{ color: BRAND.textDim }}>
              Attached Tracks ({edl.musicTracks.length})
            </label>
            <div className="space-y-1.5">
              {edl.musicTracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center gap-2 p-2 rounded-md"
                  style={{
                    background:
                      selectedMusicTrackId === track.id
                        ? `${MUSIC_TRACK_COLOR}15`
                        : "rgba(255,255,255,0.02)",
                    border:
                      selectedMusicTrackId === track.id
                        ? `1px solid ${MUSIC_TRACK_COLOR}60`
                        : `1px solid ${PANEL_BORDER}`,
                  }}
                  onClick={() => setSelectedMusicTrackId(track.id)}
                >
                  <Music size={12} style={{ color: MUSIC_TRACK_COLOR, flexShrink: 0 }} />
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-xs font-medium truncate"
                      style={{ color: BRAND.textMain }}
                    >
                      {track.title}
                    </div>
                    <div
                      className="text-xs truncate"
                      style={{ color: BRAND.textDim }}
                    >
                      {track.artist} | Vol: {track.volume}%
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditMusicTrack(track.id);
                    }}
                    className="p-1 rounded transition-colors shrink-0"
                    style={{ color: BRAND.textDim }}
                    title="Edit track"
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background = "transparent")
                    }
                  >
                    <Edit3 size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeMusicTrack(track.id);
                    }}
                    className="p-1 rounded transition-colors shrink-0"
                    style={{ color: BRAND.textDim }}
                    title="Remove track"
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = BRAND.error;
                      e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = BRAND.textDim;
                      e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Hidden audio element for previewing */}
        <audio ref={audioPreviewRef} style={{ display: "none" }} />
      </>
    );
  }

  /* ── Music config form (shared between add and edit) ── */
  function renderMusicConfigForm(
    title: string,
    onConfirm: () => void,
    onCancel: () => void,
    confirmLabel: string
  ) {
    return (
      <>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium" style={{ color: BRAND.textMain }}>
            {title}
          </span>
          <button
            onClick={onCancel}
            className="p-1 rounded transition-colors"
            style={{ color: BRAND.textDim }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <X size={14} />
          </button>
        </div>

        {/* Video start */}
        <div>
          <label className="block text-xs mb-1" style={{ color: BRAND.textDim }}>
            Video Start (seconds)
          </label>
          <input
            type="number"
            min={0}
            max={totalOutputDuration}
            step={0.1}
            value={musicConfigForm.videoStart}
            onChange={(e) =>
              setMusicConfigForm((prev) => ({
                ...prev,
                videoStart: Math.max(0, Number(e.target.value)),
              }))
            }
            className="w-full text-xs px-2 py-1.5 rounded outline-none"
            style={{
              background: BRAND.input,
              color: BRAND.textMain,
              border: `1px solid ${PANEL_BORDER}`,
            }}
          />
        </div>

        {/* Video end */}
        <div>
          <label className="block text-xs mb-1" style={{ color: BRAND.textDim }}>
            Video End (seconds)
          </label>
          <input
            type="number"
            min={0}
            max={totalOutputDuration}
            step={0.1}
            value={musicConfigForm.videoEnd}
            onChange={(e) =>
              setMusicConfigForm((prev) => ({
                ...prev,
                videoEnd: Math.max(prev.videoStart + 0.5, Number(e.target.value)),
              }))
            }
            className="w-full text-xs px-2 py-1.5 rounded outline-none"
            style={{
              background: BRAND.input,
              color: BRAND.textMain,
              border: `1px solid ${PANEL_BORDER}`,
            }}
          />
        </div>

        {/* Track offset */}
        <div>
          <label className="block text-xs mb-1" style={{ color: BRAND.textDim }}>
            Track Offset (seconds)
          </label>
          <input
            type="number"
            min={0}
            step={0.1}
            value={musicConfigForm.trackOffset}
            onChange={(e) =>
              setMusicConfigForm((prev) => ({
                ...prev,
                trackOffset: Math.max(0, Number(e.target.value)),
              }))
            }
            className="w-full text-xs px-2 py-1.5 rounded outline-none"
            style={{
              background: BRAND.input,
              color: BRAND.textMain,
              border: `1px solid ${PANEL_BORDER}`,
            }}
          />
        </div>

        {/* Volume */}
        <div>
          <label className="block text-xs mb-1" style={{ color: BRAND.textDim }}>
            Volume ({musicConfigForm.volume}%)
          </label>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={musicConfigForm.volume}
            onChange={(e) =>
              setMusicConfigForm((prev) => ({
                ...prev,
                volume: Number(e.target.value),
              }))
            }
            className="w-full h-1.5 accent-purple-600"
            style={{ cursor: "pointer" }}
          />
        </div>

        {/* Fade in */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs mb-1" style={{ color: BRAND.textDim }}>
              Fade In (s)
            </label>
            <input
              type="number"
              min={0}
              max={60}
              step={0.5}
              value={musicConfigForm.fadeIn}
              onChange={(e) =>
                setMusicConfigForm((prev) => ({
                  ...prev,
                  fadeIn: clamp(Number(e.target.value), 0, 60),
                }))
              }
              className="w-full text-xs px-2 py-1.5 rounded outline-none"
              style={{
                background: BRAND.input,
                color: BRAND.textMain,
                border: `1px solid ${PANEL_BORDER}`,
              }}
            />
          </div>
          <div>
            <label className="block text-xs mb-1" style={{ color: BRAND.textDim }}>
              Fade Out (s)
            </label>
            <input
              type="number"
              min={0}
              max={60}
              step={0.5}
              value={musicConfigForm.fadeOut}
              onChange={(e) =>
                setMusicConfigForm((prev) => ({
                  ...prev,
                  fadeOut: clamp(Number(e.target.value), 0, 60),
                }))
              }
              className="w-full text-xs px-2 py-1.5 rounded outline-none"
              style={{
                background: BRAND.input,
                color: BRAND.textMain,
                border: `1px solid ${PANEL_BORDER}`,
              }}
            />
          </div>
        </div>

        {/* Loop toggle */}
        <div className="flex items-center justify-between">
          <span className="text-xs" style={{ color: BRAND.textMuted }}>
            Loop Track
          </span>
          <button
            onClick={() =>
              setMusicConfigForm((prev) => ({ ...prev, loop: !prev.loop }))
            }
            className="relative w-9 h-5 rounded-full transition-colors"
            style={{
              background: musicConfigForm.loop ? BRAND.primary : "rgba(255,255,255,0.1)",
            }}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full transition-transform"
              style={{
                background: "#fff",
                left: musicConfigForm.loop ? 18 : 2,
                transition: "left 0.2s ease",
              }}
            />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-2">
          <button
            onClick={onCancel}
            className="flex-1 py-1.5 rounded text-xs transition-colors"
            style={{
              color: BRAND.textMuted,
              border: `1px solid ${PANEL_BORDER}`,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(255,255,255,0.04)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-1.5 rounded text-xs font-medium transition-opacity hover:opacity-90"
            style={{
              background: `linear-gradient(135deg, ${BRAND.primary}, #9333ea)`,
              color: "#fff",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </>
    );
  }

  /* ================================================================ */
  /*  Render: Timeline                                                 */
  /* ================================================================ */

  function renderTimeline() {
    if (isMobile) return null;

    const outDur = totalOutputDuration || duration;
    const tickInterval = outDur > 120 ? 30 : outDur > 60 ? 10 : 5;
    const tickCount = Math.ceil(outDur / tickInterval);

    // Map source time to output timeline position
    const sourceTimeToOutputPct = (srcTime: number): number => {
      let outputPos = 0;
      for (const c of edl.clips) {
        const clipDur = (c.sourceEnd - c.sourceStart) / (c.speed || 1);
        if (srcTime >= c.sourceStart && srcTime <= c.sourceEnd) {
          // Playhead is inside this clip
          const fractInClip = (srcTime - c.sourceStart) / (c.sourceEnd - c.sourceStart);
          outputPos += fractInClip * clipDur;
          break;
        }
        outputPos += clipDur;
      }
      return totalOutputDuration > 0 ? (outputPos / totalOutputDuration) * 100 : 0;
    };

    const playheadPct = sourceTimeToOutputPct(currentTime);

    // Clip colors with slightly different hues per clip index
    const clipColors = [
      { bg: `linear-gradient(90deg, ${BRAND.primary}60, ${BRAND.primary}40)`, border: `${BRAND.primary}80` },
      { bg: `linear-gradient(90deg, #9333ea60, #9333ea40)`, border: "#9333ea80" },
      { bg: `linear-gradient(90deg, #7c3aed60, #7c3aed40)`, border: "#7c3aed80" },
      { bg: `linear-gradient(90deg, #6d28d960, #6d28d940)`, border: "#6d28d980" },
      { bg: `linear-gradient(90deg, #a855f760, #a855f740)`, border: "#a855f780" },
    ];

    return (
      <div
        className="flex flex-col shrink-0"
        style={{
          minHeight: isMobile ? 0 : isTablet ? 160 : 220,
          background: EDITOR_BG,
          borderTop: `1px solid ${PANEL_BORDER}`,
        }}
      >
        {/* Timeline header with zoom controls */}
        <div
          className="flex items-center justify-between px-3 py-1.5 shrink-0"
          style={{ borderBottom: `1px solid ${PANEL_BORDER}` }}
        >
          <span className="text-xs" style={{ color: BRAND.textDim }}>
            Timeline | {edl.clips.length} clip{edl.clips.length !== 1 ? "s" : ""} | {formatTime(totalOutputDuration)}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                setTimelineZoom((prev) => Math.max(prev / 1.5, 0.5))
              }
              className="p-1 rounded transition-colors"
              style={{ color: BRAND.textMuted }}
              title="Zoom Out (-)"
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <Minus size={12} />
            </button>
            <span
              className="text-xs font-mono px-1"
              style={{ color: BRAND.textDim }}
            >
              {Math.round(timelineZoom * 100)}%
            </span>
            <button
              onClick={() =>
                setTimelineZoom((prev) => Math.min(prev * 1.5, 10))
              }
              className="p-1 rounded transition-colors"
              style={{ color: BRAND.textMuted }}
              title="Zoom In (+)"
              onMouseEnter={(e) =>
                (e.currentTarget.style.background = "rgba(255,255,255,0.06)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.background = "transparent")
              }
            >
              <Plus size={12} />
            </button>
          </div>
        </div>

        {/* Scrollable timeline area */}
        <div className="flex-1 overflow-x-auto overflow-y-hidden px-3 py-2">
          <div
            style={{
              width: `${Math.max(100 * timelineZoom, 100)}%`,
              minWidth: "100%",
            }}
          >
            {/* Ruler */}
            <div
              className="relative h-5 mb-1"
              style={{ borderBottom: `1px solid ${PANEL_BORDER}` }}
            >
              {Array.from({ length: tickCount + 1 }, (_, i) => {
                const tickTime = i * tickInterval;
                if (tickTime > outDur) return null;
                const pct = outDur > 0 ? (tickTime / outDur) * 100 : 0;
                return (
                  <div
                    key={i}
                    className="absolute top-0 flex flex-col items-center"
                    style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
                  >
                    <div
                      className="w-px h-2"
                      style={{ background: "rgba(255,255,255,0.15)" }}
                    />
                    <span
                      className="text-xs font-mono mt-0.5"
                      style={{
                        color: BRAND.textDim,
                        fontSize: 9,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {formatTime(tickTime)}
                    </span>
                  </div>
                );
              })}

              {/* Chapter markers on ruler */}
              {edl.chapters.map((chapter, idx) => {
                const pct = (chapter.time / duration) * 100;
                return (
                  <div
                    key={`ruler-chapter-${idx}`}
                    className="absolute z-10 cursor-pointer"
                    style={{
                      left: `${pct}%`,
                      bottom: 0,
                      transform: "translateX(-50%)",
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      seekTo(chapter.time);
                    }}
                    title={chapter.title}
                  >
                    <Diamond
                      size={10}
                      style={{ color: BRAND.accent, fill: BRAND.accent }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Tracks container */}
            <div
              ref={timelineRef}
              className="relative cursor-pointer"
              onClick={handleTimelineClick}
              style={{ minHeight: 120 }}
            >
              {/* ── Video clip track ── */}
              <div className="relative mb-1" style={{ height: 40 }}>
                {/* Full track background */}
                <div
                  className="absolute inset-0 rounded pointer-events-none"
                  style={{ background: TRACK_BG }}
                />

                {/* Individual clips — laid out sequentially (no overlap) */}
                {(() => {
                  let outputOffset = 0;
                  return edl.clips.map((clip, clipIdx) => {
                  const clipDur = (clip.sourceEnd - clip.sourceStart) / (clip.speed || 1);
                  const startPct = totalOutputDuration > 0 ? (outputOffset / totalOutputDuration) * 100 : 0;
                  const widthPct = totalOutputDuration > 0 ? (clipDur / totalOutputDuration) * 100 : 100;
                  outputOffset += clipDur;
                  const isSelected = clip.id === edl.selectedClipId;
                  const colorScheme = clipColors[clipIdx % clipColors.length];

                  return (
                    <div key={clip.id}>
                      {/* Clip block */}
                      <div
                        className="absolute top-0 bottom-0 rounded cursor-pointer"
                        style={{
                          left: `${startPct}%`,
                          width: `${Math.max(widthPct, 0.5)}%`,
                          background: colorScheme.bg,
                          border: isSelected
                            ? `2px solid ${BRAND.primary}`
                            : `1px solid ${colorScheme.border}`,
                          zIndex: isSelected ? 10 : 3,
                          boxShadow: isSelected ? `0 0 8px ${BRAND.primary}40` : "none",
                          pointerEvents: "auto",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          e.preventDefault();
                          selectClip(clip.id);
                        }}
                      >
                        {/* Clip label */}
                        <div
                          className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none overflow-hidden"
                          style={{ color: BRAND.textMain, maxWidth: "calc(100% - 12px)" }}
                        >
                          <Play size={8} className="shrink-0" />
                          <span className="text-xs font-medium opacity-80 truncate" style={{ fontSize: 10 }}>
                            Clip {clipIdx + 1}
                            {clip.speed !== 1 ? ` (${clip.speed}x)` : ""}
                          </span>
                        </div>

                        {/* Start edge handle — only show on selected clip to avoid blocking clicks */}
                        {isSelected && (
                          <div
                            className="absolute top-0 bottom-0 left-0 cursor-ew-resize z-10 flex items-center"
                            style={{ width: 8 }}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              startClipEdgeDrag(clip.id, "start", e);
                            }}
                          >
                            <div
                              className="w-1 h-6 rounded-full mx-auto"
                              style={{ background: BRAND.accent }}
                            />
                          </div>
                        )}

                        {/* End edge handle — only show on selected clip */}
                        {isSelected && (
                          <div
                            className="absolute top-0 bottom-0 right-0 cursor-ew-resize z-10 flex items-center"
                            style={{ width: 8 }}
                            onMouseDown={(e) => {
                              e.stopPropagation();
                              startClipEdgeDrag(clip.id, "end", e);
                            }}
                          >
                            <div
                              className="w-1 h-6 rounded-full mx-auto"
                              style={{ background: BRAND.accent }}
                            />
                          </div>
                        )}
                      </div>

                      {/* Clip action bar (above selected clip) */}
                      {isSelected && (
                        <div
                          className="absolute flex items-center gap-0.5 rounded-md px-1 py-0.5 z-20"
                          style={{
                            left: `${startPct + widthPct / 2}%`,
                            transform: "translateX(-50%)",
                            top: -26,
                            background: BRAND.panel,
                            border: `1px solid ${PANEL_BORDER}`,
                            boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                          }}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              splitClipAtPlayhead();
                            }}
                            className="p-1 rounded transition-colors"
                            style={{ color: BRAND.textMuted }}
                            title="Split (S)"
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <Scissors size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteClip(clip.id);
                            }}
                            className="p-1 rounded transition-colors"
                            style={{ color: BRAND.textMuted }}
                            title="Delete (Del)"
                            onMouseEnter={(e) => {
                              e.currentTarget.style.color = BRAND.error;
                              e.currentTarget.style.background = "rgba(239,68,68,0.15)";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.color = BRAND.textMuted;
                              e.currentTarget.style.background = "transparent";
                            }}
                          >
                            <Trash2 size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              duplicateClip(clip.id);
                            }}
                            className="p-1 rounded transition-colors"
                            style={{ color: BRAND.textMuted }}
                            title="Duplicate (D)"
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <Copy size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTool("speed");
                            }}
                            className="p-1 rounded transition-colors"
                            style={{ color: clip.speed !== 1 ? BRAND.accent : BRAND.textMuted }}
                            title="Speed"
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <Gauge size={12} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveTool("audio");
                            }}
                            className="p-1 rounded transition-colors"
                            style={{ color: clip.volume === 0 ? BRAND.error : BRAND.textMuted }}
                            title="Volume"
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.background = "rgba(255,255,255,0.08)")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.background = "transparent")
                            }
                          >
                            <Volume2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                });
                })()}
              </div>

              {/* ── Audio track (placeholder) ── */}
              <div className="relative mb-1" style={{ height: 28 }}>
                <div
                  className="absolute inset-0 rounded"
                  style={{ background: TRACK_BG }}
                />

                {/* Audio segments matching clips — sequential layout */}
                {(() => {
                  let audioOffset = 0;
                  return edl.clips.map((clip, clipIdx) => {
                  const clipDur = (clip.sourceEnd - clip.sourceStart) / (clip.speed || 1);
                  const startPct = totalOutputDuration > 0 ? (audioOffset / totalOutputDuration) * 100 : 0;
                  const widthPct = totalOutputDuration > 0 ? (clipDur / totalOutputDuration) * 100 : 100;
                  audioOffset += clipDur;

                  return (
                    <div
                      key={`audio-${clip.id}`}
                      className="absolute top-0 bottom-0 rounded"
                      style={{
                        left: `${startPct}%`,
                        width: `${Math.max(widthPct, 0.5)}%`,
                        background: clip.volume === 0
                          ? "rgba(239,68,68,0.15)"
                          : `linear-gradient(90deg, ${BRAND.success}30, ${BRAND.success}20)`,
                        border: clip.volume === 0
                          ? `1px solid ${BRAND.error}30`
                          : `1px solid ${BRAND.success}40`,
                      }}
                    >
                      {clipIdx === 0 && (
                        <div
                          className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none"
                          style={{ color: BRAND.textMuted }}
                        >
                          {clip.volume === 0 ? (
                            <VolumeX size={9} />
                          ) : (
                            <Volume2 size={9} />
                          )}
                          <span className="text-xs opacity-60" style={{ fontSize: 9 }}>
                            Audio
                          </span>
                        </div>
                      )}
                    </div>
                  );
                });
                })()}
              </div>

              {/* ── Music track ── */}
              <div className="relative" style={{ height: edl.musicTracks.length > 0 ? 28 : 20 }}>
                {edl.musicTracks.length > 0 ? (
                  <>
                    <div
                      className="absolute inset-0 rounded"
                      style={{ background: TRACK_BG }}
                    />
                    {edl.musicTracks.map((track) => {
                      // Map videoStart/videoEnd back to source positions for display
                      // For simplicity we use the ratio of videoStart/videoEnd to totalOutputDuration
                      // mapped onto the full source duration
                      const startPct = totalOutputDuration > 0
                        ? (track.videoStart / totalOutputDuration) * 100
                        : 0;
                      const endPct = totalOutputDuration > 0
                        ? (track.videoEnd / totalOutputDuration) * 100
                        : 100;
                      const widthPct = Math.max(endPct - startPct, 1);
                      const isSelected = selectedMusicTrackId === track.id;

                      return (
                        <div
                          key={`music-tl-${track.id}`}
                          className="absolute top-0 bottom-0 rounded cursor-pointer"
                          style={{
                            left: `${startPct}%`,
                            width: `${widthPct}%`,
                            background: `linear-gradient(90deg, ${MUSIC_TRACK_COLOR}40, ${MUSIC_TRACK_COLOR}25)`,
                            border: isSelected
                              ? `2px solid ${MUSIC_TRACK_COLOR}`
                              : `1px solid ${MUSIC_TRACK_COLOR}60`,
                            zIndex: isSelected ? 5 : 1,
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedMusicTrackId(track.id);
                            setActiveTool("music");
                          }}
                        >
                          <div
                            className="absolute left-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none overflow-hidden"
                            style={{ color: BRAND.textMain, maxWidth: "calc(100% - 12px)" }}
                          >
                            <Music size={9} className="shrink-0" />
                            <span className="text-xs truncate" style={{ fontSize: 9, opacity: 0.8 }}>
                              {track.title}
                            </span>
                          </div>

                          {/* Start edge handle */}
                          <div
                            className="absolute top-0 bottom-0 left-0 cursor-ew-resize z-10 flex items-center"
                            style={{ width: 6 }}
                            onMouseDown={(e) => startMusicEdgeDrag(track.id, "start", e)}
                          >
                            <div
                              className="w-0.5 h-5 rounded-full mx-auto"
                              style={{ background: isSelected ? BRAND.accent : "rgba(255,255,255,0.3)" }}
                            />
                          </div>

                          {/* End edge handle */}
                          <div
                            className="absolute top-0 bottom-0 right-0 cursor-ew-resize z-10 flex items-center"
                            style={{ width: 6 }}
                            onMouseDown={(e) => startMusicEdgeDrag(track.id, "end", e)}
                          >
                            <div
                              className="w-0.5 h-5 rounded-full mx-auto"
                              style={{ background: isSelected ? BRAND.accent : "rgba(255,255,255,0.3)" }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <div
                    className="absolute inset-0 rounded flex items-center justify-center"
                    style={{ background: TRACK_BG }}
                  >
                    <span className="text-xs opacity-40" style={{ color: BRAND.textDim, fontSize: 9 }}>
                      Music track — add via Music tool
                    </span>
                  </div>
                )}
              </div>

              {/* ── Playhead ── */}
              <div
                className="absolute top-0 z-30"
                style={{
                  left: `${playheadPct}%`,
                  transform: "translateX(-50%)",
                  height: "calc(100% + 4px)",
                  top: -4,
                  pointerEvents: "auto",
                }}
              >
                {/* Playhead top marker */}
                <div
                  className="cursor-grab active:cursor-grabbing"
                  style={{
                    width: 12,
                    height: 12,
                    background: BRAND.primary,
                    clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                    marginLeft: -0.5,
                  }}
                  onMouseDown={startPlayheadDrag}
                />
                {/* Playhead line */}
                <div
                  style={{
                    width: 1.5,
                    height: "100%",
                    background: BRAND.primary,
                    marginLeft: 5,
                    marginTop: -1,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  Render: Mobile controls (simplified for small screens)           */
  /* ================================================================ */

  function renderMobileControls() {
    if (!isMobile) return null;

    return (
      <div
        className="flex flex-col gap-3 p-3"
        style={{
          background: PANEL_BG,
          borderTop: `1px solid ${PANEL_BORDER}`,
        }}
      >
        {/* Mini scrub bar */}
        <div className="relative">
          <input
            type="range"
            min={0}
            max={duration}
            step={0.01}
            value={currentTime}
            onChange={(e) => seekTo(Number(e.target.value))}
            className="w-full h-1.5 accent-purple-600"
            style={{ cursor: "pointer" }}
          />
          <div
            className="flex justify-between text-xs font-mono mt-1"
            style={{ color: BRAND.textDim }}
          >
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalOutputDuration)}</span>
          </div>
        </div>

        {/* Tool quick-access buttons */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {TOOL_ITEMS.map((tool) => {
            const Icon = tool.icon;
            const isActive = activeTool === tool.id;
            return (
              <button
                key={tool.id}
                onClick={() => setActiveTool(tool.id)}
                className="flex flex-col items-center gap-0.5 p-1.5 rounded-md"
                style={{
                  color: isActive ? BRAND.primary : BRAND.textMuted,
                  background: isActive ? ACTIVE_TOOL_BG : "transparent",
                  minWidth: 44,
                  minHeight: 44,
                }}
              >
                <Icon size={16} />
                <span style={{ fontSize: 9 }}>{tool.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>

        {/* Mobile-specific tool actions */}
        <div
          className="rounded-md p-2"
          style={{
            background: "rgba(255,255,255,0.02)",
            border: `1px solid ${PANEL_BORDER}`,
          }}
        >
          {activeTool === "trim" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={setClipInPoint}
                  className="flex-1 py-2 rounded text-xs text-center"
                  style={{
                    background: ACTIVE_TOOL_BG,
                    color: BRAND.primary,
                    border: `1px solid ${BRAND.primary}40`,
                  }}
                >
                  Set Start
                </button>
                <button
                  onClick={setClipOutPoint}
                  className="flex-1 py-2 rounded text-xs text-center"
                  style={{
                    background: ACTIVE_TOOL_BG,
                    color: BRAND.primary,
                    border: `1px solid ${BRAND.primary}40`,
                  }}
                >
                  Set End
                </button>
                <button
                  onClick={splitClipAtPlayhead}
                  className="py-2 px-3 rounded text-xs"
                  style={{
                    color: BRAND.primary,
                    border: `1px solid ${BRAND.primary}40`,
                  }}
                >
                  Split
                </button>
              </div>
              <div className="text-xs text-center" style={{ color: BRAND.textDim }}>
                {edl.clips.length} clip{edl.clips.length !== 1 ? "s" : ""}
              </div>
            </div>
          )}

          {activeTool === "crop" && (
            <div className="flex items-center gap-1 flex-wrap">
              {CROP_PRESETS.map((preset) => {
                const isActive = edl.cropPreset === preset.value;
                return (
                  <button
                    key={preset.value}
                    onClick={() => updateEdl({ cropPreset: preset.value })}
                    className="py-1.5 px-3 rounded text-xs"
                    style={{
                      background: isActive ? ACTIVE_TOOL_BG : "transparent",
                      border: isActive
                        ? `1px solid ${BRAND.primary}`
                        : `1px solid ${PANEL_BORDER}`,
                      color: isActive ? BRAND.textMain : BRAND.textMuted,
                    }}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          )}

          {activeTool === "speed" && selectedClip && (
            <div className="space-y-2">
              <div
                className="text-center text-sm font-mono font-bold"
                style={{
                  color: selectedClip.speed !== 1 ? BRAND.accent : BRAND.textMain,
                }}
              >
                {selectedClip.speed}x
              </div>
              <input
                type="range"
                min={0.25}
                max={4}
                step={0.25}
                value={selectedClip.speed}
                onChange={(e) =>
                  updateClip(selectedClip.id, { speed: Number(e.target.value) })
                }
                className="w-full h-1.5 accent-purple-600"
                style={{ cursor: "pointer" }}
              />
            </div>
          )}

          {activeTool === "audio" && selectedClip && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    updateClip(selectedClip.id, {
                      volume: selectedClip.volume === 0 ? 100 : 0,
                    })
                  }
                  className="p-1.5 rounded"
                  style={{
                    color:
                      selectedClip.volume === 0 ? BRAND.error : BRAND.textMain,
                  }}
                >
                  {selectedClip.volume === 0 ? (
                    <VolumeX size={18} />
                  ) : (
                    <Volume2 size={18} />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={selectedClip.volume}
                  onChange={(e) =>
                    updateClip(selectedClip.id, {
                      volume: Number(e.target.value),
                    })
                  }
                  className="flex-1 h-1.5 accent-purple-600"
                  style={{ cursor: "pointer" }}
                />
                <span
                  className="text-xs font-mono w-10 text-right"
                  style={{ color: BRAND.textMuted }}
                >
                  {selectedClip.volume}%
                </span>
              </div>
            </div>
          )}

          {activeTool === "chapters" && (
            <div className="space-y-2">
              <button
                onClick={addChapterAtPlayhead}
                className="w-full flex items-center justify-center gap-1.5 py-2 rounded text-xs"
                style={{
                  background: ACTIVE_TOOL_BG,
                  color: BRAND.primary,
                  border: `1px solid ${BRAND.primary}40`,
                }}
              >
                <Plus size={14} />
                Add Chapter at {formatTime(currentTime)}
              </button>
              {edl.chapters.length > 0 && (
                <div className="max-h-28 overflow-y-auto space-y-1">
                  {edl.chapters.map((ch, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between px-2 py-1 rounded text-xs"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        color: BRAND.textMuted,
                      }}
                    >
                      <button
                        onClick={() => seekTo(ch.time)}
                        className="font-mono"
                        style={{ color: BRAND.primary }}
                      >
                        {formatTime(ch.time)}
                      </button>
                      <span className="truncate mx-2 flex-1">{ch.title}</span>
                      <button
                        onClick={() => removeChapter(idx)}
                        style={{ color: BRAND.error }}
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTool === "music" && (
            <div className="space-y-2">
              <div className="text-xs" style={{ color: BRAND.textDim }}>
                {edl.musicTracks.length} music track{edl.musicTracks.length !== 1 ? "s" : ""} attached.
                Use desktop for full music editing.
              </div>
              {edl.musicTracks.map((track) => (
                <div
                  key={track.id}
                  className="flex items-center justify-between px-2 py-1 rounded text-xs"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    color: BRAND.textMuted,
                  }}
                >
                  <span className="truncate flex-1">{track.title}</span>
                  <button
                    onClick={() => removeMusicTrack(track.id)}
                    style={{ color: BRAND.error }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {activeTool === "speed" && !selectedClip && (
            <div className="text-xs text-center py-2" style={{ color: BRAND.textDim }}>
              No clip selected
            </div>
          )}
          {activeTool === "audio" && !selectedClip && (
            <div className="text-xs text-center py-2" style={{ color: BRAND.textDim }}>
              No clip selected
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  Main Layout                                                      */
  /* ================================================================ */

  // Suppress unused variable warnings for helpers used indirectly
  void file;
  void sourceTimeToOutput;
  void getClipOutputStart;
  void getClipOutputDuration;
  void seekToOutputTime;

  return (
    <div
      className="flex flex-col h-[calc(100dvh-56px)] w-full overflow-hidden select-none"
      style={{ background: EDITOR_BG }}
    >
      {/* Toolbar */}
      {renderToolbar()}

      {/* Main content area */}
      {isMobile ? (
        /* ── Mobile layout: Player + controls ── */
        <div className="flex flex-col flex-1 min-h-0">
          {renderVideoPlayer()}
          {renderMobileControls()}
        </div>
      ) : isTablet ? (
        /* ── Tablet layout: Tools + Player on top, Timeline bottom ── */
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-1 min-h-0">
            {renderToolPanel()}
            {renderVideoPlayer()}
          </div>
          {renderTimeline()}
        </div>
      ) : (
        /* ── Desktop / Laptop layout: Full 4-panel ── */
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex flex-1 min-h-0">
            {renderToolPanel()}
            {renderVideoPlayer()}
            {renderInspector()}
          </div>
          {renderTimeline()}
        </div>
      )}

      {/* Keyboard shortcuts hint (desktop only) */}
      {isDesktop && (
        <div
          className="flex items-center justify-center gap-4 px-3 py-1 shrink-0 flex-wrap"
          style={{
            background: PANEL_BG,
            borderTop: `1px solid ${PANEL_BORDER}`,
          }}
        >
          {[
            { key: "Space", action: "Play/Pause" },
            { key: "I", action: "Set Start" },
            { key: "O", action: "Set End" },
            { key: "S", action: "Split" },
            { key: "D", action: "Duplicate" },
            { key: "Del", action: "Delete" },
            { key: "M", action: "Marker" },
            { key: "L", action: "Loop" },
            { key: "\u2190 \u2192", action: "Frame Step" },
            { key: "Ctrl+Z", action: "Undo" },
          ].map(({ key, action }) => (
            <div key={key} className="flex items-center gap-1">
              <kbd
                className="px-1 py-0.5 rounded text-xs font-mono"
                style={{
                  background: "rgba(255,255,255,0.06)",
                  color: BRAND.textDim,
                  border: `1px solid ${PANEL_BORDER}`,
                  fontSize: 9,
                }}
              >
                {key}
              </kbd>
              <span style={{ color: BRAND.textDim, fontSize: 9 }}>
                {action}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Hidden audio element for music preview */}
      <audio ref={audioPreviewRef} style={{ display: "none" }} />
    </div>
  );
}

export default VideoEditorView;
