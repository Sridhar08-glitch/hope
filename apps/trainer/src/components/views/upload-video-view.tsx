"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { BRAND, Button, Badge } from "@holora/ui";
import {
  Upload,
  Film,
  FileVideo,
  Check,
  X,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Image,
  Plus,
  Trash2,
  Clock,
  Eye,
  Lock,
  Users as UsersIcon,
  Globe,
  Zap,
  RefreshCw,
  CheckCircle2,
  Loader2,
  Info,
  MonitorPlay,
  Wifi,
  XCircle,
} from "lucide-react";
import { trainerApi } from "@/lib/trainer-api";
import { VideoEditorView } from "@/components/views/video-editor-view";
import {
  extractVideoMetadata,
  generateThumbnails,
  formatFileSize,
  formatDuration,
  formatUploadSpeed,
  estimateTimeRemaining,
  titleFromFilename,
  type VideoMetadata,
} from "@/lib/video-utils";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface UploadVideoViewProps {
  api: any; // ApiClient from useAuth — needed for multi-step upload flow
  showToast: (message: string, type: "success" | "error") => void;
  onComplete: () => void; // Called after successful upload to refresh video list
}

interface MetadataForm {
  title: string;
  description: string;
  visibility: string;
  content_type: string;
  difficulty: string;
  audio_license: string;
  is_short: boolean;
  sport_tags: string[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const ACCEPTED_TYPES = [
  "video/mp4", "video/webm", "video/quicktime", "video/x-msvideo",
  "video/x-matroska", "video/x-ms-wmv", "video/x-flv", "video/3gpp",
  "video/3gpp2", "video/ogg", "video/mpeg", "video/mp2t",
  "video/x-m4v", "video/avi", "video/mxf",
];
const MAX_FILE_SIZE = 5 * 1024 * 1024 * 1024; // 5 GB
const MAX_RETRIES = 3;
const RETRY_DELAYS = [3000, 6000, 12000]; // Exponential backoff: 3s, 6s, 12s

const VISIBILITY_OPTIONS = [
  { value: "public", label: "Public", icon: Globe, description: "Anyone can watch" },
  { value: "subscribers", label: "Subscribers Only", icon: UsersIcon, description: "Only your subscribers" },
  { value: "private", label: "Private", icon: Lock, description: "Only you can see" },
];

const CONTENT_TYPE_OPTIONS = [
  { value: "free", label: "Free" },
  { value: "premium", label: "Premium" },
  { value: "coin_gated", label: "Coin Gated" },
];

const DIFFICULTY_OPTIONS = [
  { value: "beginner", label: "Beginner" },
  { value: "intermediate", label: "Intermediate" },
  { value: "advanced", label: "Advanced" },
  { value: "expert", label: "Expert" },
];


const PROCESSING_PHASES = [
  { key: "VALIDATING", label: "Validating" },
  { key: "SCANNING", label: "Scanning" },
  { key: "MODERATING", label: "Moderating" },
  { key: "TRANSCODING", label: "Transcoding" },
  { key: "MIXING", label: "Audio Mixing" },
  { key: "PACKAGING", label: "Packaging" },
  { key: "THUMBNAILING", label: "Thumbnailing" },
];

const PHASE_INFO: Record<string, { label: string; desc: string }> = {
  VALIDATING: { label: "Validating", desc: "Checking video file integrity" },
  SCANNING: { label: "Copyright Scan", desc: "Scanning for copyrighted audio" },
  MODERATING: { label: "Moderation", desc: "Content review in progress" },
  TRANSCODING: { label: "Transcoding", desc: "Encoding to multiple quality levels" },
  MIXING: { label: "Audio Mixing", desc: "Processing audio tracks" },
  PACKAGING: { label: "Packaging", desc: "Creating HLS streaming segments" },
  THUMBNAILING: { label: "Thumbnails", desc: "Generating video thumbnails" },
};

const STEPS = [
  { num: 1, label: "Select File" },
  { num: 2, label: "Edit Video" },
  { num: 3, label: "Add Details" },
  { num: 4, label: "Upload" },
  { num: 5, label: "Processing" },
];

const DEFAULT_METADATA: MetadataForm = {
  title: "",
  description: "",
  visibility: "public",
  content_type: "free",
  difficulty: "beginner",
  audio_license: "ORIGINAL",
  is_short: false,
  sport_tags: [],
};

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** Return the index of the current phase inside PROCESSING_PHASES, or -1. */
function phaseIndex(status: string | null): number {
  if (!status) return -1;
  const upper = status.toUpperCase();
  return PROCESSING_PHASES.findIndex((p) => upper.includes(p.key));
}

/** Format elapsed time since a timestamp. */
function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Convert a Blob to a File with a given name. */
function blobToFile(blob: Blob, fileName: string): File {
  return new File([blob], fileName, { type: blob.type, lastModified: Date.now() });
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function UploadVideoView({
  api,
  showToast,
  onComplete,
}: UploadVideoViewProps) {
  // ── Step management ──────────────────────────────────────────────
  const [step, setStep] = useState(1);

  // ── File state ───────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [processingStatus, setProcessingStatus] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadComplete, setUploadComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Terminal states where processing finished but publishing needs a trainer
  // action (music-rights declaration, or submit-for-review). Without these the
  // status poll would spin forever, since the backend never reaches "published".
  const [musicConfirmNeeded, setMusicConfirmNeeded] = useState(false);
  const [musicRightsDetails, setMusicRightsDetails] = useState("");
  const [submittingDeclaration, setSubmittingDeclaration] = useState(false);
  const [terminalNotice, setTerminalNotice] = useState<{ title: string; message: string } | null>(null);

  // ── Video analysis state ────────────────────────────────────────
  const [videoMetadata, setVideoMetadata] = useState<VideoMetadata | null>(null);
  const [finalEdl, setFinalEdl] = useState<any>(null);
  const [thumbnailOptions, setThumbnailOptions] = useState<string[]>([]);
  const [selectedThumbnailIdx, setSelectedThumbnailIdx] = useState<number>(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(null);
  const thumbnailBlobsRef = useRef<Blob[]>([]);

  // ── Upload speed tracking ───────────────────────────────────────
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [uploadEta, setUploadEta] = useState("");
  const [bytesUploaded, setBytesUploaded] = useState(0);
  const [totalBytes, setTotalBytes] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  // ── Metadata form ────────────────────────────────────────────────
  const [metadata, setMetadata] = useState<MetadataForm>({ ...DEFAULT_METADATA });
  const [sportTagInput, setSportTagInput] = useState("");

  // ── Thumbnail ────────────────────────────────────────────────────
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [useCustomThumbnail, setUseCustomThumbnail] = useState(false);

  // ── Refs ─────────────────────────────────────────────────────────
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Drag state ───────────────────────────────────────────────────
  const [isDragging, setIsDragging] = useState(false);

  // ── Upload state for presigned URL re-fetch ──────────────────────
  const uploadContextRef = useRef<{
    uploadUrl: string;
    videoId: string;
    r2Key: string;
  } | null>(null);

  // ── Cleanup polling on unmount ───────────────────────────────────
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // ── Cleanup video preview URL ─────────────────────────────────────
  useEffect(() => {
    return () => {
      if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    };
  }, [videoPreviewUrl]);

  // ── Cleanup thumbnail preview URL ────────────────────────────────
  useEffect(() => {
    return () => {
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    };
  }, [thumbnailPreview]);

  // ── Cleanup auto-generated thumbnail object URLs ─────────────────
  useEffect(() => {
    return () => {
      thumbnailOptions.forEach((url) => {
        try { URL.revokeObjectURL(url); } catch { /* ignore */ }
      });
    };
  }, [thumbnailOptions]);

  // ── File selection helpers ───────────────────────────────────────

  const validateFile = useCallback(
    (f: File): boolean => {
      if (!f || f.size === 0) {
        setError("Selected file is empty. Please choose a valid video file.");
        return false;
      }
      if (f.type && !f.type.startsWith("video/") && !ACCEPTED_TYPES.includes(f.type)) {
        setError(
          `Unsupported file type "${f.type}". Please select a video file.`
        );
        return false;
      }
      if (f.size > MAX_FILE_SIZE) {
        setError(
          `File is too large (${formatFileSize(f.size)}). Maximum allowed size is 5 GB.`
        );
        return false;
      }
      return true;
    },
    []
  );

  const analyzeVideo = useCallback(
    async (f: File) => {
      setIsAnalyzing(true);

      // Create preview URL
      const previewUrl = URL.createObjectURL(f);
      setVideoPreviewUrl(previewUrl);

      // Auto-generate title
      const suggestedTitle = titleFromFilename(f.name);
      setMetadata((prev) => ({
        ...prev,
        title: prev.title || suggestedTitle,
      }));

      try {
        // Extract metadata
        const meta = await extractVideoMetadata(f);
        setVideoMetadata(meta);
      } catch {
        // Non-fatal — we can continue without metadata
      }

      // Generate thumbnails in background
      try {
        const blobs = await generateThumbnails(f, 5);
        thumbnailBlobsRef.current = blobs;
        const urls = blobs.map((blob) => URL.createObjectURL(blob));
        setThumbnailOptions(urls);
        if (urls.length > 0) setSelectedThumbnailIdx(0);
      } catch {
        // Non-fatal — thumbnails are optional
      }

      setIsAnalyzing(false);

    },
    []
  );

  const handleFileSelect = useCallback(
    (f: File) => {
      setError(null);
      if (!validateFile(f)) return;
      setFile(f);
      analyzeVideo(f);
    },
    [validateFile, analyzeVideo]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (f) handleFileSelect(f);
    },
    [handleFileSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const f = e.dataTransfer.files?.[0];
      if (f) handleFileSelect(f);
    },
    [handleFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  // ── Custom thumbnail ──────────────────────────────────────────────

  const handleCustomThumbnailSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const f = e.target.files?.[0];
      if (!f) return;
      if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
      setThumbnailFile(f);
      setThumbnailPreview(URL.createObjectURL(f));
      setUseCustomThumbnail(true);
    },
    [thumbnailPreview]
  );

  const removeCustomThumbnail = useCallback(() => {
    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setUseCustomThumbnail(false);
  }, [thumbnailPreview]);

  // ── Sport tags ───────────────────────────────────────────────────

  const addSportTag = useCallback(() => {
    const tag = sportTagInput.trim();
    if (!tag) return;
    if (metadata.sport_tags.includes(tag)) {
      setSportTagInput("");
      return;
    }
    setMetadata((prev) => ({
      ...prev,
      sport_tags: [...prev.sport_tags, tag],
    }));
    setSportTagInput("");
  }, [sportTagInput, metadata.sport_tags]);

  const removeSportTag = useCallback((tag: string) => {
    setMetadata((prev) => ({
      ...prev,
      sport_tags: prev.sport_tags.filter((t) => t !== tag),
    }));
  }, []);

  const handleTagKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addSportTag();
      }
    },
    [addSportTag]
  );

  // ── Metadata field setter ────────────────────────────────────────

  const setField = useCallback(
    (key: keyof MetadataForm, value: string | boolean | string[]) => {
      setMetadata((prev) => ({ ...prev, [key]: value }));
    },
    []
  );

  // ── Cancel upload ────────────────────────────────────────────────

  const cancelUpload = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setIsUploading(false);
    setUploadProgress(0);
    setUploadSpeed(0);
    setUploadEta("");
    setBytesUploaded(0);
    setTotalBytes(0);
    setRetryCount(0);
    setIsRetrying(false);
    setError("Upload cancelled.");
    setStep(3);
  }, []);

  // ── Upload file via XHR with speed tracking ─────────────────────

  const uploadFileToR2 = useCallback(
    (uploadUrl: string, fileToUpload: File): Promise<void> => {
      return new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.open("PUT", uploadUrl);
        // Use video/mp4 to match the presigned URL signature (same as Flutter app).
        // Do NOT send Authorization or other custom headers — presigned URL is self-authenticating.
        xhr.setRequestHeader("Content-Type", "video/mp4");

        const startTime = Date.now();
        let lastLoaded = 0;
        let lastTime = startTime;

        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) {
            const now = Date.now();
            const elapsed = (now - lastTime) / 1000;
            if (elapsed > 0.5) {
              const speed = (e.loaded - lastLoaded) / elapsed;
              setUploadSpeed(speed);
              setUploadEta(estimateTimeRemaining(e.total - e.loaded, speed));
              lastLoaded = e.loaded;
              lastTime = now;
            }
            setUploadProgress(Math.round((e.loaded / e.total) * 100));
            setBytesUploaded(e.loaded);
            setTotalBytes(e.total);
          }
        };

        xhr.onload = () => {
          xhrRef.current = null;
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else if (xhr.status === 403 || xhr.status === 401) {
            reject(new Error(`AUTH_EXPIRED:${xhr.status}`));
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`));
          }
        };

        xhr.onerror = () => {
          xhrRef.current = null;
          reject(new Error("Network error during upload."));
        };

        xhr.ontimeout = () => {
          xhrRef.current = null;
          reject(new Error("Upload timed out."));
        };

        xhr.send(fileToUpload);
      });
    },
    []
  );

  // ── Upload & Process ─────────────────────────────────────────────

  // Poll the video-status endpoint until it reaches a terminal state. Beyond
  // success (published/completed/ready) and failure (failed/error), two states
  // finish processing but block on a trainer action and must also stop the poll:
  // awaiting_music_confirmation (rights declaration) and preview_ready
  // (submit-for-review). Previously unhandled → the spinner ran forever.
  const beginStatusPolling = useCallback((vid: string) => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = setInterval(async () => {
      try {
        const statusResult: any = await trainerApi.studio.getStatus(api, vid);
        const currentStatus = statusResult?.status || statusResult?.pipeline_status;
        if (currentStatus) setProcessingStatus(currentStatus);

        const upper = (currentStatus || "").toUpperCase();
        const stop = () => {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
          setIsProcessing(false);
        };

        if (upper === "PUBLISHED" || upper === "COMPLETED" || upper === "READY") {
          stop();
          setUploadComplete(true);
          showToast("Video published successfully!", "success");
        } else if (upper === "FAILED" || upper === "ERROR") {
          stop();
          setError(
            statusResult?.failure_reason ||
              statusResult?.error_message ||
              "Video processing failed."
          );
        } else if (upper === "AWAITING_MUSIC_CONFIRMATION") {
          stop();
          setMusicConfirmNeeded(true);
        } else if (upper === "PREVIEW_READY") {
          stop();
          setTerminalNotice({
            title: "Preview ready for review",
            message:
              "Your video finished processing and a preview is ready. Submit it for review from My Videos to publish it.",
          });
        }
      } catch {
        // Polling errors are non-fatal — keep trying
      }
    }, 3000);
  }, [api, showToast]);

  // Submit a music-rights declaration for a video parked in
  // awaiting_music_confirmation, then resume polling toward publish.
  const submitMusicDeclaration = useCallback(async (declaration: "own_voice" | "has_rights" | "unsure") => {
    if (!videoId) return;
    if (declaration === "has_rights" && !musicRightsDetails.trim()) {
      showToast("Please describe the rights/license you hold.", "error");
      return;
    }
    setSubmittingDeclaration(true);
    try {
      await trainerApi.studio.musicConfirmation(api, videoId, {
        declaration,
        ...(declaration === "has_rights" ? { details: musicRightsDetails.trim() } : {}),
      });
      setMusicConfirmNeeded(false);
      setMusicRightsDetails("");
      setIsProcessing(true);
      setProcessingStatus("PROCESSING");
      beginStatusPolling(videoId);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to submit declaration.", "error");
    } finally {
      setSubmittingDeclaration(false);
    }
  }, [api, videoId, musicRightsDetails, showToast, beginStatusPolling]);

  const startUpload = useCallback(async () => {
    if (!file) return;
    if (!metadata.title.trim()) {
      setError("Please enter a video title.");
      setStep(3);
      return;
    }

    setStep(4);
    setError(null);
    setMusicConfirmNeeded(false);
    setTerminalNotice(null);
    setMusicRightsDetails("");
    setIsUploading(true);
    setUploadProgress(0);
    setUploadSpeed(0);
    setUploadEta("");
    setBytesUploaded(0);
    setTotalBytes(0);
    setRetryCount(0);
    setIsRetrying(false);

    let currentRetry = 0;
    let uploadUrl = "";
    let newVideoId = "";
    let r2Key = "";

    const getPresignedUrl = async (): Promise<void> => {
      // Always use video/mp4 as content_type (matches Flutter app behavior).
      // The backend's FFmpeg handles any container format regardless of MIME type.
      // This ensures the presigned URL signature matches the PUT Content-Type header.
      const urlResult: any = await trainerApi.studio.getUploadUrl(api, {
        title: metadata.title.trim() || titleFromFilename(file.name),
        filename: file.name,
        content_type: "video/mp4",
        file_size: file.size,
      });

      uploadUrl = urlResult.upload_url;
      newVideoId = urlResult.video_id;
      r2Key = urlResult.r2_key;

      if (!uploadUrl || !newVideoId) {
        throw new Error("Failed to obtain upload URL from server.");
      }

      setVideoId(newVideoId);
      uploadContextRef.current = { uploadUrl, videoId: newVideoId, r2Key };
    };

    try {
      // 1. Get presigned upload URL
      await getPresignedUrl();

      // 2. Upload file to R2 with retry logic
      const attemptUpload = async (): Promise<void> => {
        try {
          await uploadFileToR2(uploadUrl, file);
        } catch (err: any) {
          const errMsg = err instanceof Error ? err.message : String(err);

          if (errMsg.startsWith("AUTH_EXPIRED") && currentRetry < MAX_RETRIES) {
            // Presigned URL expired — get a new one and retry
            currentRetry++;
            setRetryCount(currentRetry);
            setIsRetrying(true);
            setUploadProgress(0);
            setBytesUploaded(0);

            await new Promise<void>((resolve) =>
              setTimeout(resolve, RETRY_DELAYS[currentRetry - 1] || 3000)
            );

            await getPresignedUrl();
            setIsRetrying(false);
            return attemptUpload();
          } else if (currentRetry < MAX_RETRIES) {
            // Other error — retry with backoff
            currentRetry++;
            setRetryCount(currentRetry);
            setIsRetrying(true);

            await new Promise<void>((resolve) =>
              setTimeout(resolve, RETRY_DELAYS[currentRetry - 1] || 3000)
            );

            setIsRetrying(false);
            return attemptUpload();
          } else {
            throw err;
          }
        }
      };

      await attemptUpload();

      setUploadProgress(100);
      setIsUploading(false);

      // 3. Move to processing step
      setStep(5);

      // 4. PATCH metadata
      // NOTE: R2 keys are server-derived and never client-supplied. The raw
      // source key was already stored server-side when the upload URL was
      // issued, so it must not be sent on this PATCH.
      const metaPayload: Record<string, unknown> = {
        title: metadata.title.trim(),
        description: metadata.description.trim(),
        visibility: metadata.visibility,
        content_type: metadata.content_type,
        difficulty: metadata.difficulty,
      };
      if (metadata.sport_tags.length > 0) {
        metaPayload.sport_tags = metadata.sport_tags;
      }
      await trainerApi.studio.updateVideo(api, newVideoId, metaPayload);

      // 5a. Create chapters via backend API (if any in EDL)
      if (finalEdl?.chapters?.length > 0) {
        for (const ch of finalEdl.chapters) {
          try {
            await trainerApi.studio.createChapter(api, newVideoId, {
              title: ch.title,
              start_time_seconds: Math.round(ch.time),
              order: finalEdl.chapters.indexOf(ch) + 1,
            });
          } catch { /* non-fatal */ }
        }
      }

      // 5b. Attach music tracks via backend API (if any in EDL)
      if (finalEdl?.musicTracks?.length > 0) {
        for (const track of finalEdl.musicTracks) {
          try {
            await trainerApi.studioMusic.attachTrack(api, newVideoId, {
              epidemic_sound_track_id: track.trackId,
              video_segment_start: Math.round(track.videoStart),
              video_segment_end: Math.round(track.videoEnd),
              track_start_offset: Math.round(track.trackOffset),
              volume: track.volume / 100,
              fade_in_duration: Math.round(track.fadeIn),
              fade_out_duration: Math.round(track.fadeOut),
              loop: track.loop,
            });
          } catch { /* non-fatal */ }
        }
      }

      // 5c. Upload selected thumbnail
      const thumbnailToUpload = useCustomThumbnail && thumbnailFile
        ? thumbnailFile
        : thumbnailBlobsRef.current[selectedThumbnailIdx]
          ? blobToFile(thumbnailBlobsRef.current[selectedThumbnailIdx], `thumbnail_${newVideoId}.jpg`)
          : null;

      if (thumbnailToUpload) {
        try {
          await trainerApi.studio.uploadThumbnail(api, newVideoId, thumbnailToUpload);
        } catch {
          // Non-fatal — continue with processing even if thumbnail fails
          showToast("Thumbnail upload failed, but the video will still be processed.", "error");
        }
      }

      // 6. Trigger processing
      setIsProcessing(true);
      setProcessingStatus("VALIDATING");
      await trainerApi.studio.processVideo(api, newVideoId);

      // 7. Start polling for status
      beginStatusPolling(newVideoId);
    } catch (err: any) {
      setIsUploading(false);
      setIsProcessing(false);
      setIsRetrying(false);
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
      showToast(
        err instanceof Error ? err.message : "Upload failed.",
        "error"
      );
    }
  }, [
    api, file, metadata, thumbnailFile, useCustomThumbnail,
    selectedThumbnailIdx, showToast, uploadFileToR2, beginStatusPolling,
  ]);

  // ── Reset to start over ──────────────────────────────────────────

  const resetForm = useCallback(() => {
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    pollIntervalRef.current = null;
    if (xhrRef.current) {
      xhrRef.current.abort();
      xhrRef.current = null;
    }
    setStep(1);
    setFile(null);
    setVideoId(null);
    setUploadProgress(0);
    setProcessingStatus(null);
    setIsUploading(false);
    setIsProcessing(false);
    setUploadComplete(false);
    setError(null);
    setMusicConfirmNeeded(false);
    setTerminalNotice(null);
    setMusicRightsDetails("");
    setSubmittingDeclaration(false);
    setMetadata({ ...DEFAULT_METADATA });
    setSportTagInput("");
    setVideoMetadata(null);
    setIsAnalyzing(false);
    setSelectedThumbnailIdx(0);
    setUseCustomThumbnail(false);
    setUploadSpeed(0);
    setUploadEta("");
    setBytesUploaded(0);
    setTotalBytes(0);
    setRetryCount(0);
    setIsRetrying(false);

    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
    setVideoPreviewUrl(null);

    thumbnailOptions.forEach((url) => {
      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
    });
    setThumbnailOptions([]);
    thumbnailBlobsRef.current = [];

    if (thumbnailPreview) URL.revokeObjectURL(thumbnailPreview);
    setThumbnailFile(null);
    setThumbnailPreview(null);

    uploadContextRef.current = null;
  }, [thumbnailPreview, videoPreviewUrl, thumbnailOptions]);

  // ── Move to draft (on failure) ───────────────────────────────────

  const handleMoveToDraft = useCallback(async () => {
    if (!videoId) return;
    try {
      await trainerApi.studio.moveToDraft(api, videoId);
      showToast("Video moved to drafts.", "success");
      onComplete();
    } catch (err: any) {
      showToast(
        err instanceof Error ? err.message : "Failed to move to draft.",
        "error"
      );
    }
  }, [api, videoId, showToast, onComplete]);

  // ── Memoized phase description ────────────────────────────────────
  const currentPhaseInfo = useMemo(() => {
    if (!processingStatus) return null;
    const upper = processingStatus.toUpperCase();
    for (const key of Object.keys(PHASE_INFO)) {
      if (upper.includes(key)) return PHASE_INFO[key];
    }
    return null;
  }, [processingStatus]);

  /* ================================================================ */

  /* ================================================================ */
  /*  Step Indicator                                                    */
  /* ================================================================ */

  function StepIndicator() {
    return (
      <div className="flex items-center justify-center gap-0 mb-8 md:mb-10">
        {STEPS.map((s, idx) => {
          const isCurrent = s.num === step;
          const isComplete = s.num < step;

          return (
            <div key={s.num} className="flex items-center">
              {/* Step dot + label */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-9 h-9 md:w-10 md:h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                    isCurrent
                      ? "shadow-lg shadow-purple-500/30"
                      : ""
                  }`}
                  style={{
                    backgroundColor: isCurrent
                      ? BRAND.primary
                      : isComplete
                      ? BRAND.success
                      : `${BRAND.panelLight}80`,
                    color: isCurrent || isComplete ? "#fff" : BRAND.textDim,
                  }}
                >
                  {isComplete ? <Check size={18} /> : s.num}
                </div>
                <span
                  className="mt-2 text-[11px] md:text-xs font-medium whitespace-nowrap"
                  style={{
                    color: isCurrent
                      ? BRAND.textMain
                      : isComplete
                      ? BRAND.success
                      : BRAND.textDim,
                  }}
                >
                  {s.label}
                </span>
              </div>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div
                  className="w-8 md:w-16 h-0.5 mx-1.5 md:mx-3 rounded-full mt-[-20px] md:mt-[-22px]"
                  style={{
                    backgroundColor:
                      s.num < step ? BRAND.success : `${BRAND.panelLight}60`,
                  }}
                />
              )}
            </div>
          );
        })}
      </div>
    );
  }

  /* ================================================================ */
  /*  Step 1 — Select File + Auto-Analyze                              */
  /* ================================================================ */

  function renderStep1() {
    return (
      <div className="max-w-2xl mx-auto">
        <div
          className="rounded-3xl p-6 md:p-8 border border-purple-900/40 shadow-xl"
          style={{ backgroundColor: BRAND.panel }}
        >
          <div className="text-center mb-6">
            <h2
              className="text-xl md:text-2xl font-bold mb-2"
              style={{ color: BRAND.textMain }}
            >
              Upload Your Video
            </h2>
            <p className="text-sm" style={{ color: BRAND.textMuted }}>
              Select a video file to get started. MP4, WebM, or QuickTime up to 5 GB.
            </p>
          </div>

          {/* Drop zone — only show when no file selected */}
          {!file && (
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`relative min-h-[300px] rounded-3xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
                isDragging
                  ? "border-purple-500/60 bg-purple-500/5"
                  : "border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/5"
              }`}
              style={{ touchAction: "manipulation" }}
            >
              <div
                className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-300 ${
                  isDragging ? "scale-110" : ""
                }`}
                style={{
                  background: `linear-gradient(135deg, ${BRAND.primary}30, ${BRAND.primary}10)`,
                }}
              >
                <Upload
                  size={36}
                  className="md:w-12 md:h-12"
                  style={{ color: BRAND.primary }}
                />
              </div>
              <p
                className="text-base md:text-lg font-semibold mb-1"
                style={{ color: BRAND.textMain }}
              >
                {isDragging ? "Drop your video here" : "Drag & drop your video here"}
              </p>
              <p className="text-sm mb-4" style={{ color: BRAND.textDim }}>
                or
              </p>
              <Button
                color="purple"
                className="px-6 py-2.5"
                style={{
                  background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryHover})`,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <span className="flex items-center gap-2">
                  <Film size={16} /> Browse Files
                </span>
              </Button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={handleInputChange}
          />

          {/* Error */}
          {error && (
            <div
              className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
              style={{
                backgroundColor: `${BRAND.error}15`,
                color: BRAND.error,
              }}
            >
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Analyzing spinner */}
          {file && isAnalyzing && (
            <div className="mt-5 flex flex-col items-center gap-3 py-8">
              <Loader2
                size={32}
                className="animate-spin"
                style={{ color: BRAND.primary }}
              />
              <p className="text-sm font-medium" style={{ color: BRAND.textMuted }}>
                Analyzing video...
              </p>
            </div>
          )}

          {/* Video info card (shown after file selected) */}
          {file && (
            <div
              className="mt-5 rounded-2xl border overflow-hidden"
              style={{
                backgroundColor: BRAND.surface,
                borderColor: `${BRAND.primary}30`,
              }}
            >
              {/* File header */}
              <div className="flex items-center gap-4 p-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${BRAND.primary}20` }}
                >
                  <FileVideo size={24} style={{ color: BRAND.primary }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="font-semibold text-sm truncate"
                    style={{ color: BRAND.textMain }}
                  >
                    {file.name}
                  </p>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    <span className="text-xs" style={{ color: BRAND.textMuted }}>
                      {formatFileSize(file.size)}
                    </span>
                    {videoMetadata && (
                      <>
                        <span className="text-xs" style={{ color: BRAND.textDim }}>|</span>
                        <span className="text-xs" style={{ color: BRAND.textMuted }}>
                          {formatDuration(videoMetadata.duration)}
                        </span>
                        <span className="text-xs" style={{ color: BRAND.textDim }}>|</span>
                        <span className="text-xs" style={{ color: BRAND.textMuted }}>
                          {videoMetadata.width}&times;{videoMetadata.height}
                        </span>
                        <span className="text-xs" style={{ color: BRAND.textDim }}>|</span>
                        <span className="text-xs" style={{ color: BRAND.textMuted }}>
                          {videoMetadata.aspectRatio}
                        </span>
                      </>
                    )}
                    <Badge color="purple">{file.type.split("/")[1]?.toUpperCase()}</Badge>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    // Cleanup
                    if (videoPreviewUrl) URL.revokeObjectURL(videoPreviewUrl);
                    setVideoPreviewUrl(null);
                    thumbnailOptions.forEach((url) => {
                      try { URL.revokeObjectURL(url); } catch { /* ignore */ }
                    });
                    setThumbnailOptions([]);
                    thumbnailBlobsRef.current = [];
                    setVideoMetadata(null);
                    setFile(null);
                    setError(null);
                    setIsAnalyzing(false);
                    setMetadata((prev) => ({ ...prev, title: "" }));
                  }}
                  className="p-2 rounded-lg hover:bg-white/10 transition shrink-0"
                  aria-label="Remove file"
                >
                  <X size={16} style={{ color: BRAND.textMuted }} />
                </button>
              </div>

              {/* Metadata details grid */}
              {videoMetadata && !isAnalyzing && (
                <div
                  className="grid grid-cols-2 sm:grid-cols-3 gap-px mx-4 mb-4 rounded-xl overflow-hidden"
                  style={{ backgroundColor: `${BRAND.panelLight}40` }}
                >
                  <div className="p-3" style={{ backgroundColor: BRAND.panel }}>
                    <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: BRAND.textDim }}>
                      Size
                    </p>
                    <p className="text-xs font-semibold" style={{ color: BRAND.textMain }}>
                      {formatFileSize(videoMetadata.size)}
                    </p>
                  </div>
                  <div className="p-3" style={{ backgroundColor: BRAND.panel }}>
                    <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: BRAND.textDim }}>
                      Duration
                    </p>
                    <p className="text-xs font-semibold" style={{ color: BRAND.textMain }}>
                      {formatDuration(videoMetadata.duration)}
                    </p>
                  </div>
                  <div className="p-3" style={{ backgroundColor: BRAND.panel }}>
                    <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: BRAND.textDim }}>
                      Resolution
                    </p>
                    <p className="text-xs font-semibold" style={{ color: BRAND.textMain }}>
                      {videoMetadata.width}&times;{videoMetadata.height}
                    </p>
                  </div>
                  <div className="p-3" style={{ backgroundColor: BRAND.panel }}>
                    <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: BRAND.textDim }}>
                      Aspect Ratio
                    </p>
                    <p className="text-xs font-semibold" style={{ color: BRAND.textMain }}>
                      {videoMetadata.aspectRatio}
                    </p>
                  </div>
                  <div className="p-3" style={{ backgroundColor: BRAND.panel }}>
                    <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: BRAND.textDim }}>
                      Type
                    </p>
                    <p className="text-xs font-semibold" style={{ color: BRAND.textMain }}>
                      {videoMetadata.type}
                    </p>
                  </div>
                  <div className="p-3" style={{ backgroundColor: BRAND.panel }}>
                    <p className="text-[10px] uppercase tracking-wider mb-0.5" style={{ color: BRAND.textDim }}>
                      Bitrate
                    </p>
                    <p className="text-xs font-semibold" style={{ color: BRAND.textMain }}>
                      {videoMetadata.duration > 0
                        ? formatFileSize(Math.round(videoMetadata.size / videoMetadata.duration)) + "/s"
                        : "N/A"}
                    </p>
                  </div>
                </div>
              )}

              {/* Video preview player */}
              {videoPreviewUrl && !isAnalyzing && (
                <div className="px-4 pb-4">
                  <div className="rounded-xl overflow-hidden border" style={{ borderColor: `${BRAND.panelLight}40` }}>
                    <video
                      src={videoPreviewUrl}
                      controls
                      muted
                      playsInline
                      className="w-full max-h-56 object-contain"
                      style={{ backgroundColor: "#000" }}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Continue button */}
          {file && !error && !isAnalyzing && (
            <div className="mt-6 flex justify-end">
              <Button
                className="px-6 py-3 text-sm font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryHover})`,
                  boxShadow: `0 4px 20px ${BRAND.primary}40`,
                }}
                onClick={() => setStep(2)}
              >
                <span className="flex items-center gap-2">
                  Continue <ChevronRight size={16} />
                </span>
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  Step 2 — Add Details (Enhanced)                                  */
  /* ================================================================ */

  // Hidden audio element for music track preview in Step 3
  function PreviewMusicAudio({ track, api: apiRef }: { track: any; api: any }) {
    const audioRef = useRef<HTMLAudioElement>(null);
    const [src, setSrc] = useState("");

    useEffect(() => {
      if (!apiRef || !track.trackId) return;
      trainerApi.studioMusic.preview(apiRef, track.trackId)
        .then((data: any) => {
          const url = data?.preview_url || data?.url || "";
          if (url) setSrc(url);
        })
        .catch(() => {});
    }, [apiRef, track.trackId]);

    if (!src) return null;
    return (
      <audio
        ref={audioRef}
        id={`preview-music-${track.id}`}
        src={src}
        preload="auto"
        loop={track.loop || false}
        style={{ display: "none" }}
      />
    );
  }

  function renderStep2() {
    // Calculate edited duration from EDL clips
    const editedDuration = finalEdl?.clips
      ? (finalEdl.clips as any[]).reduce((sum: number, c: any) => sum + (c.sourceEnd - c.sourceStart) / (c.speed || 1), 0)
      : videoMetadata?.duration || 0;
    const editedClipCount = finalEdl?.clips?.length || 1;
    const firstClip = finalEdl?.clips?.[0];

    return (
      <div className="max-w-2xl mx-auto">
        <div
          className="rounded-3xl p-6 md:p-8 border border-purple-900/40 shadow-xl"
          style={{ backgroundColor: BRAND.panel }}
        >
          <div className="text-center mb-6">
            <h2
              className="text-xl md:text-2xl font-bold mb-2"
              style={{ color: BRAND.textMain }}
            >
              Video Details
            </h2>
            <p className="text-sm" style={{ color: BRAND.textMuted }}>
              Review your edited video and add details before uploading.
            </p>
          </div>

          {/* Edited video preview — muted original if clip volume=0, plays music tracks */}
          {videoPreviewUrl && (
            <div className="mb-4 rounded-xl overflow-hidden border" style={{ borderColor: `${BRAND.panelLight}40` }}>
              <video
                ref={(el) => {
                  if (el && firstClip && el.readyState >= 1) {
                    if (el.currentTime < firstClip.sourceStart || el.currentTime > firstClip.sourceEnd) {
                      el.currentTime = firstClip.sourceStart;
                    }
                    // Apply original audio volume from EDL
                    el.volume = firstClip.volume != null ? Math.max(0, Math.min(1, firstClip.volume / 100)) : 1;
                  }
                }}
                src={videoPreviewUrl}
                controls
                playsInline
                className="w-full max-h-52 object-contain"
                style={{ backgroundColor: "#000" }}
                onLoadedMetadata={(e) => {
                  const v = e.target as HTMLVideoElement;
                  if (firstClip) {
                    v.currentTime = firstClip.sourceStart;
                    v.volume = firstClip.volume != null ? Math.max(0, Math.min(1, firstClip.volume / 100)) : 1;
                  }
                }}
                onPlay={(e) => {
                  // Start music tracks when video plays
                  const v = e.target as HTMLVideoElement;
                  if (finalEdl?.musicTracks?.length > 0 && api) {
                    finalEdl.musicTracks.forEach((track: any) => {
                      const audioId = `preview-music-${track.id}`;
                      let audio = document.getElementById(audioId) as HTMLAudioElement | null;
                      if (!audio) return;
                      const outputTime = v.currentTime - (firstClip?.sourceStart || 0);
                      if (outputTime >= track.videoStart && outputTime < track.videoEnd) {
                        audio.currentTime = track.trackOffset + (outputTime - track.videoStart);
                        audio.volume = Math.max(0, Math.min(1, (track.volume || 80) / 100));
                        audio.play().catch(() => {});
                      }
                    });
                  }
                }}
                onPause={() => {
                  // Pause all music tracks
                  if (finalEdl?.musicTracks) {
                    finalEdl.musicTracks.forEach((track: any) => {
                      const audio = document.getElementById(`preview-music-${track.id}`) as HTMLAudioElement | null;
                      if (audio) audio.pause();
                    });
                  }
                }}
                onTimeUpdate={(e) => {
                  const v = e.target as HTMLVideoElement;
                  if (firstClip && v.currentTime >= firstClip.sourceEnd) {
                    v.pause();
                    v.currentTime = firstClip.sourceStart;
                  }
                  // Sync music tracks
                  if (finalEdl?.musicTracks && !v.paused) {
                    const outputTime = v.currentTime - (firstClip?.sourceStart || 0);
                    finalEdl.musicTracks.forEach((track: any) => {
                      const audio = document.getElementById(`preview-music-${track.id}`) as HTMLAudioElement | null;
                      if (!audio) return;
                      const inRange = outputTime >= track.videoStart && outputTime < track.videoEnd;
                      if (inRange) {
                        if (audio.paused) audio.play().catch(() => {});
                      } else {
                        if (!audio.paused) audio.pause();
                      }
                    });
                  }
                }}
              >
                Your browser does not support the video tag.
              </video>
              {/* Hidden audio elements for music tracks */}
              {finalEdl?.musicTracks?.map((track: any) => (
                <PreviewMusicAudio key={track.id} track={track} api={api} />
              ))}
            </div>
          )}

          {/* Edited video info */}
          <div
            className="flex items-center justify-center gap-4 mb-6 py-2.5 px-4 rounded-xl text-xs"
            style={{ backgroundColor: BRAND.input, color: BRAND.textMuted }}
          >
            <span>Duration: <strong style={{ color: BRAND.textMain }}>{formatDuration(editedDuration)}</strong></span>
            <span style={{ color: BRAND.textDim }}>|</span>
            <span>Clips: <strong style={{ color: BRAND.textMain }}>{editedClipCount}</strong></span>
            {finalEdl?.musicTracks?.length > 0 && (
              <>
                <span style={{ color: BRAND.textDim }}>|</span>
                <span>Music: <strong style={{ color: BRAND.textMain }}>{finalEdl.musicTracks.length} track{finalEdl.musicTracks.length > 1 ? "s" : ""}</strong></span>
              </>
            )}
            {finalEdl?.cropPreset && finalEdl.cropPreset !== "original" && (
              <>
                <span style={{ color: BRAND.textDim }}>|</span>
                <span>Crop: <strong style={{ color: BRAND.textMain }}>{finalEdl.cropPreset}</strong></span>
              </>
            )}
          </div>

          {/* Thumbnail selector */}
          {(thumbnailOptions.length > 0 || true) && (
            <div className="mb-6">
              <label
                className="block text-sm mb-2 font-medium"
                style={{ color: BRAND.textMuted }}
              >
                Select Thumbnail
              </label>
              <div className="flex gap-3 overflow-x-auto pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
                {thumbnailOptions.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedThumbnailIdx(idx);
                      setUseCustomThumbnail(false);
                    }}
                    className="relative shrink-0 rounded-lg overflow-hidden transition-all duration-200"
                    style={{
                      width: 120,
                      height: 68,
                      borderColor: !useCustomThumbnail && selectedThumbnailIdx === idx ? BRAND.primary : `${BRAND.panelLight}60`,
                      borderWidth: 2,
                      borderStyle: "solid",
                      boxShadow: !useCustomThumbnail && selectedThumbnailIdx === idx
                        ? `0 0 0 2px ${BRAND.primary}`
                        : undefined,
                      opacity: !useCustomThumbnail && selectedThumbnailIdx === idx ? 1 : 0.7,
                    }}
                  >
                    <img
                      src={url}
                      alt={`Thumbnail option ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {!useCustomThumbnail && selectedThumbnailIdx === idx && (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ backgroundColor: `${BRAND.primary}40` }}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: BRAND.primary }}
                        >
                          <Check size={14} color="#fff" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}

                {/* Custom thumbnail upload option */}
                <button
                  onClick={() => thumbnailInputRef.current?.click()}
                  className="relative shrink-0 rounded-lg overflow-hidden transition-all duration-200 flex flex-col items-center justify-center gap-1"
                  style={{
                    width: 120,
                    height: 68,
                    backgroundColor: BRAND.input,
                    borderColor: useCustomThumbnail ? BRAND.primary : `${BRAND.panelLight}60`,
                    borderWidth: 2,
                    borderStyle: "dashed",
                    boxShadow: useCustomThumbnail
                      ? `0 0 0 2px ${BRAND.primary}`
                      : undefined,
                    opacity: useCustomThumbnail ? 1 : 0.7,
                  }}
                >
                  {thumbnailPreview && useCustomThumbnail ? (
                    <>
                      <img
                        src={thumbnailPreview}
                        alt="Custom thumbnail"
                        className="w-full h-full object-cover absolute inset-0"
                      />
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ backgroundColor: `${BRAND.primary}40` }}
                      >
                        <div
                          className="w-6 h-6 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: BRAND.primary }}
                        >
                          <Check size={14} color="#fff" />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <Image size={16} style={{ color: BRAND.textDim }} />
                      <span className="text-[10px]" style={{ color: BRAND.textDim }}>
                        Custom
                      </span>
                    </>
                  )}
                </button>
              </div>

              {/* Remove custom thumbnail button */}
              {useCustomThumbnail && thumbnailPreview && (
                <button
                  onClick={removeCustomThumbnail}
                  className="mt-2 flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
                  style={{ color: BRAND.error }}
                >
                  <Trash2 size={12} /> Remove custom thumbnail
                </button>
              )}

              <input
                ref={thumbnailInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={handleCustomThumbnailSelect}
              />
            </div>
          )}

          <div className="space-y-5">
            {/* Title */}
            <div>
              <label
                className="block text-sm mb-1.5 font-medium"
                style={{ color: BRAND.textMuted }}
              >
                Title <span style={{ color: BRAND.error }}>*</span>
              </label>
              <input
                type="text"
                value={metadata.title}
                onChange={(e) => setField("title", e.target.value)}
                placeholder="Enter video title..."
                className="w-full px-4 py-3 rounded-xl text-sm text-white border-0 outline-none transition-all duration-200"
                style={{ backgroundColor: BRAND.input }}
                maxLength={200}
              />
              {metadata.title && file && (
                <p className="text-xs mt-1" style={{ color: BRAND.textDim }}>
                  {metadata.title.length}/200 characters
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                className="block text-sm mb-1.5 font-medium"
                style={{ color: BRAND.textMuted }}
              >
                Description
              </label>
              <textarea
                value={metadata.description}
                onChange={(e) => setField("description", e.target.value)}
                placeholder="Describe your video..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm text-white border-0 outline-none resize-none transition-all duration-200"
                style={{ backgroundColor: BRAND.input }}
                maxLength={2000}
              />
              {metadata.description && (
                <p className="text-xs mt-1" style={{ color: BRAND.textDim }}>
                  {metadata.description.length}/2000 characters
                </p>
              )}
            </div>

            {/* Visibility & Content Type — two columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm mb-1.5 font-medium"
                  style={{ color: BRAND.textMuted }}
                >
                  Visibility
                </label>
                <select
                  value={metadata.visibility}
                  onChange={(e) => setField("visibility", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white border-0 outline-none appearance-none cursor-pointer"
                  style={{ backgroundColor: BRAND.input }}
                >
                  {VISIBILITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  className="block text-sm mb-1.5 font-medium"
                  style={{ color: BRAND.textMuted }}
                >
                  Content Type
                </label>
                <select
                  value={metadata.content_type}
                  onChange={(e) => setField("content_type", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm text-white border-0 outline-none appearance-none cursor-pointer"
                  style={{ backgroundColor: BRAND.input }}
                >
                  {CONTENT_TYPE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Difficulty */}
            <div>
              <label
                className="block text-sm mb-1.5 font-medium"
                style={{ color: BRAND.textMuted }}
              >
                Difficulty
              </label>
              <select
                value={metadata.difficulty}
                onChange={(e) => setField("difficulty", e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm text-white border-0 outline-none appearance-none cursor-pointer"
                style={{ backgroundColor: BRAND.input }}
              >
                {DIFFICULTY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Sport Tags */}
            <div>
              <label
                className="block text-sm mb-1.5 font-medium"
                style={{ color: BRAND.textMuted }}
              >
                Sport Tags
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sportTagInput}
                  onChange={(e) => setSportTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  placeholder="Type a tag and press Enter..."
                  className="flex-1 px-4 py-3 rounded-xl text-sm text-white border-0 outline-none"
                  style={{ backgroundColor: BRAND.input }}
                />
                <Button
                  color="purple"
                  className="px-3 py-3 shrink-0"
                  onClick={addSportTag}
                  disabled={!sportTagInput.trim()}
                >
                  <Plus size={16} />
                </Button>
              </div>
              {metadata.sport_tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {metadata.sport_tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
                      style={{
                        backgroundColor: `${BRAND.primary}20`,
                        color: BRAND.textMain,
                      }}
                    >
                      {tag}
                      <button
                        onClick={() => removeSportTag(tag)}
                        className="hover:opacity-70 transition"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div
                className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm"
                style={{
                  backgroundColor: `${BRAND.error}15`,
                  color: BRAND.error,
                }}
              >
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex items-center justify-between pt-2">
              <Button
                color="gray"
                className="px-5 py-2.5"
                onClick={() => {
                  setError(null);
                  setStep(2);
                }}
              >
                <span className="flex items-center gap-2">
                  <ChevronLeft size={16} /> Back
                </span>
              </Button>

              <Button
                className="px-6 py-2.5 text-sm font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryHover})`,
                  boxShadow: `0 4px 20px ${BRAND.primary}40`,
                }}
                onClick={() => {
                  if (!metadata.title.trim()) {
                    setError("Title is required.");
                    return;
                  }
                  setError(null);
                  startUpload();
                }}
              >
                <span className="flex items-center gap-2">
                  <Upload size={16} /> Upload & Process
                </span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  Step 3 — Upload (Enhanced with speed, ETA, retry)                */
  /* ================================================================ */

  function renderStep3() {
    // ── Error state (after upload) ─────────────────────────────────
    if (error && !isUploading) {
      return (
        <div className="max-w-2xl mx-auto">
          <div
            className="rounded-3xl p-8 md:p-12 border border-purple-900/40 shadow-xl text-center"
            style={{ backgroundColor: BRAND.panel }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: `${BRAND.error}20` }}
            >
              <XCircle size={44} style={{ color: BRAND.error }} />
            </div>
            <h2
              className="text-xl md:text-2xl font-bold mb-3"
              style={{ color: BRAND.textMain }}
            >
              Upload Failed
            </h2>
            <p
              className="text-sm mb-8 max-w-md mx-auto"
              style={{ color: BRAND.textMuted }}
            >
              {error}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                color="gray"
                className="w-full sm:w-auto px-6 py-3"
                onClick={() => {
                  setError(null);
                  setStep(3);
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <ChevronLeft size={16} /> Edit Details
                </span>
              </Button>
              <Button
                className="w-full sm:w-auto px-6 py-3 font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryHover})`,
                }}
                onClick={() => {
                  setError(null);
                  startUpload();
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw size={16} /> Retry Upload
                </span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // ── Active upload ───────────────────────────────────────────────
    return (
      <div className="max-w-2xl mx-auto">
        <div
          className="rounded-3xl p-6 md:p-8 border border-purple-900/40 shadow-xl"
          style={{ backgroundColor: BRAND.panel }}
        >
          <div className="text-center py-6">
            {/* Circular progress */}
            <div className="relative w-40 h-40 md:w-48 md:h-48 mx-auto mb-6">
              <svg
                className="w-full h-full -rotate-90"
                viewBox="0 0 160 160"
              >
                {/* Background circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  strokeWidth="8"
                  stroke={`${BRAND.panelLight}60`}
                />
                {/* Progress circle */}
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  fill="none"
                  strokeWidth="8"
                  stroke={BRAND.primary}
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 70}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 70 * (1 - uploadProgress / 100)
                  }`}
                  style={{
                    transition: "stroke-dashoffset 0.3s ease",
                    filter: `drop-shadow(0 0 6px ${BRAND.primary}80)`,
                  }}
                />
              </svg>
              {/* Percentage text */}
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  className="text-3xl md:text-4xl font-black"
                  style={{ color: BRAND.textMain }}
                >
                  {uploadProgress}%
                </span>
              </div>
            </div>

            {/* Linear progress bar */}
            <div
              className="mx-auto max-w-sm h-3 rounded-full overflow-hidden mb-4"
              style={{ backgroundColor: `${BRAND.panelLight}60` }}
            >
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${uploadProgress}%`,
                  background: `linear-gradient(90deg, ${BRAND.primary}, ${BRAND.accent})`,
                }}
              />
            </div>

            {/* Speed and size info */}
            <div className="flex items-center justify-center gap-4 text-xs mb-2 flex-wrap" style={{ color: BRAND.textMuted }}>
              {totalBytes > 0 && (
                <span>
                  {formatFileSize(bytesUploaded)} / {formatFileSize(totalBytes)}
                </span>
              )}
              {uploadSpeed > 0 && (
                <>
                  <span style={{ color: BRAND.textDim }}>&middot;</span>
                  <span className="flex items-center gap-1">
                    <Wifi size={12} />
                    {formatUploadSpeed(uploadSpeed)}
                  </span>
                </>
              )}
            </div>

            {/* ETA */}
            {uploadEta && (
              <p className="text-xs mb-4" style={{ color: BRAND.textDim }}>
                {uploadEta}
              </p>
            )}

            {/* Retry indicator */}
            {isRetrying && (
              <div
                className="flex items-center justify-center gap-2 mb-4 py-2 px-4 rounded-lg mx-auto w-fit"
                style={{
                  backgroundColor: `${BRAND.warning}15`,
                  color: BRAND.warning,
                }}
              >
                <RefreshCw size={14} className="animate-spin" />
                <span className="text-xs font-medium">
                  Retrying... (attempt {retryCount}/{MAX_RETRIES})
                </span>
              </div>
            )}

            {/* Status text */}
            <p
              className="text-base font-semibold mb-2"
              style={{ color: BRAND.textMain }}
            >
              {isRetrying ? "Reconnecting..." : "Uploading to cloud..."}
            </p>
            {file && (
              <div className="flex items-center justify-center gap-3 text-xs" style={{ color: BRAND.textMuted }}>
                <FileVideo size={14} />
                <span className="truncate max-w-[200px]">{file.name}</span>
              </div>
            )}

            {/* Cancel button */}
            <div className="mt-6">
              <button
                onClick={cancelUpload}
                className="px-5 py-2.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/10"
                style={{
                  color: BRAND.textMuted,
                  borderWidth: 1,
                  borderStyle: "solid",
                  borderColor: `${BRAND.panelLight}80`,
                }}
              >
                <span className="flex items-center gap-2">
                  <XCircle size={16} /> Cancel Upload
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  Step 4 — Processing Pipeline (Enhanced)                          */
  /* ================================================================ */

  function renderStep4() {
    const currentPhaseIdx = phaseIndex(processingStatus);

    // ── Success state ──────────────────────────────────────────────
    if (uploadComplete) {
      return (
        <div className="max-w-2xl mx-auto">
          <div
            className="rounded-3xl p-8 md:p-12 border border-purple-900/40 shadow-xl text-center"
            style={{ backgroundColor: BRAND.panel }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: `${BRAND.success}20` }}
            >
              <CheckCircle2 size={44} style={{ color: BRAND.success }} />
            </div>
            <h2
              className="text-2xl md:text-3xl font-bold mb-3"
              style={{ color: BRAND.textMain }}
            >
              Video Published Successfully!
            </h2>
            <p className="text-sm mb-8" style={{ color: BRAND.textMuted }}>
              Your video is now live and available for viewers.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                color="gray"
                className="w-full sm:w-auto px-6 py-3"
                onClick={resetForm}
              >
                <span className="flex items-center justify-center gap-2">
                  <Plus size={16} /> Upload Another
                </span>
              </Button>
              <Button
                className="w-full sm:w-auto px-6 py-3 font-semibold"
                style={{
                  background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryHover})`,
                  boxShadow: `0 4px 20px ${BRAND.primary}40`,
                }}
                onClick={onComplete}
              >
                <span className="flex items-center justify-center gap-2">
                  <Eye size={16} /> View My Videos
                </span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // ── Error state (processing failure) ────────────────────────────
    if (error && !isProcessing) {
      return (
        <div className="max-w-2xl mx-auto">
          <div
            className="rounded-3xl p-8 md:p-12 border border-purple-900/40 shadow-xl text-center"
            style={{ backgroundColor: BRAND.panel }}
          >
            <div
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
              style={{ backgroundColor: `${BRAND.error}20` }}
            >
              <AlertCircle size={44} style={{ color: BRAND.error }} />
            </div>
            <h2
              className="text-xl md:text-2xl font-bold mb-3"
              style={{ color: BRAND.textMain }}
            >
              Processing Failed
            </h2>
            <p
              className="text-sm mb-8 max-w-md mx-auto"
              style={{ color: BRAND.textMuted }}
            >
              {error}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                color="gray"
                className="w-full sm:w-auto px-6 py-3"
                onClick={resetForm}
              >
                <span className="flex items-center justify-center gap-2">
                  <RefreshCw size={16} /> Try Again
                </span>
              </Button>
              {videoId && (
                <Button
                  color="yellow"
                  className="w-full sm:w-auto px-6 py-3"
                  onClick={handleMoveToDraft}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Film size={16} /> Move to Draft
                  </span>
                </Button>
              )}
            </div>
          </div>
        </div>
      );
    }

    // ── Music-rights confirmation required (awaiting_music_confirmation) ──
    if (musicConfirmNeeded) {
      return (
        <div className="max-w-2xl mx-auto">
          <div className="rounded-3xl p-8 md:p-10 border border-purple-900/40 shadow-xl" style={{ backgroundColor: BRAND.panel }}>
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${BRAND.warning}20` }}>
                <Info size={40} style={{ color: BRAND.warning }} />
              </div>
              <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ color: BRAND.textMain }}>Confirm music rights</h2>
              <p className="text-sm max-w-md mx-auto" style={{ color: BRAND.textMuted }}>
                We detected audio that needs a rights confirmation before this video can publish. How is the audio in your video licensed?
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <Button color="gray" className="w-full px-6 py-3" disabled={submittingDeclaration} onClick={() => submitMusicDeclaration("own_voice")}>
                It&apos;s my own voice / original audio
              </Button>
              <div className="rounded-2xl p-4 border border-purple-900/40" style={{ backgroundColor: BRAND.surface }}>
                <p className="text-sm font-semibold mb-2" style={{ color: BRAND.textMain }}>I have the rights / a license</p>
                <textarea
                  value={musicRightsDetails}
                  onChange={(e) => setMusicRightsDetails(e.target.value)}
                  placeholder="Describe the license or rights you hold (required)"
                  rows={2}
                  className="w-full rounded-lg px-3 py-2 text-sm mb-3 outline-none"
                  style={{ backgroundColor: BRAND.input, color: BRAND.textMain, border: `1px solid ${BRAND.panelLight}` }}
                />
                <Button className="w-full px-6 py-2.5 font-semibold" style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryHover})` }} disabled={submittingDeclaration} onClick={() => submitMusicDeclaration("has_rights")}>
                  Submit rights declaration
                </Button>
              </div>
              <Button color="gray" className="w-full px-6 py-3" disabled={submittingDeclaration} onClick={() => submitMusicDeclaration("unsure")}>
                I&apos;m not sure
              </Button>
            </div>
            {submittingDeclaration && (
              <div className="flex items-center justify-center gap-2 mt-5" style={{ color: BRAND.textMuted }}>
                <Loader2 size={16} className="animate-spin" /> <span className="text-xs">Submitting…</span>
              </div>
            )}
          </div>
        </div>
      );
    }

    // ── Processing finished, trainer action needed (e.g. preview_ready) ──
    if (terminalNotice) {
      return (
        <div className="max-w-2xl mx-auto">
          <div className="rounded-3xl p-8 md:p-12 border border-purple-900/40 shadow-xl text-center" style={{ backgroundColor: BRAND.panel }}>
            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${BRAND.info}20` }}>
              <Info size={44} style={{ color: BRAND.info }} />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: BRAND.textMain }}>{terminalNotice.title}</h2>
            <p className="text-sm mb-8" style={{ color: BRAND.textMuted }}>{terminalNotice.message}</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button color="gray" className="w-full sm:w-auto px-6 py-3" onClick={resetForm}>
                <span className="flex items-center justify-center gap-2"><Plus size={16} /> Upload Another</span>
              </Button>
              <Button className="w-full sm:w-auto px-6 py-3 font-semibold" style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryHover})` }} onClick={onComplete}>
                <span className="flex items-center justify-center gap-2"><Eye size={16} /> View My Videos</span>
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // ── Active processing ───────────────────────────────────────────
    return (
      <div className="max-w-2xl mx-auto">
        <div
          className="rounded-3xl p-6 md:p-8 border border-purple-900/40 shadow-xl"
          style={{ backgroundColor: BRAND.panel }}
        >
          <div className="py-6">
            <div className="text-center mb-8">
              <div className="w-14 h-14 mx-auto mb-4 relative">
                <Loader2
                  size={56}
                  className="animate-spin"
                  style={{ color: BRAND.primary }}
                />
              </div>
              <p
                className="text-base font-semibold mb-1"
                style={{ color: BRAND.textMain }}
              >
                Processing Your Video
              </p>
              <p className="text-sm" style={{ color: BRAND.textMuted }}>
                This may take a few minutes depending on the file size.
              </p>
            </div>

            {/* Processing pipeline visualization */}
            <div className="relative">
              {/* Desktop horizontal layout */}
              <div className="hidden md:flex items-start justify-between px-2">
                {PROCESSING_PHASES.map((phase, idx) => {
                  const isComplete = idx < currentPhaseIdx;
                  const isCurrent = idx === currentPhaseIdx;

                  return (
                    <div key={phase.key} className="flex flex-col items-center flex-1">
                      {/* Dot */}
                      <div className="relative">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                            isCurrent ? "ring-4 ring-purple-500/20" : ""
                          }`}
                          style={{
                            backgroundColor: isComplete
                              ? BRAND.success
                              : isCurrent
                              ? BRAND.primary
                              : `${BRAND.panelLight}60`,
                            color:
                              isComplete || isCurrent
                                ? "#fff"
                                : BRAND.textDim,
                          }}
                        >
                          {isComplete ? (
                            <Check size={14} />
                          ) : isCurrent ? (
                            <Loader2
                              size={14}
                              className="animate-spin"
                            />
                          ) : (
                            <span className="w-2 h-2 rounded-full bg-current" />
                          )}
                        </div>
                        {/* Pulse ring for current phase */}
                        {isCurrent && (
                          <div
                            className="absolute inset-0 rounded-full animate-ping"
                            style={{
                              backgroundColor: `${BRAND.primary}30`,
                            }}
                          />
                        )}
                      </div>
                      {/* Label */}
                      <span
                        className="mt-2 text-[10px] font-medium text-center leading-tight"
                        style={{
                          color: isComplete
                            ? BRAND.success
                            : isCurrent
                            ? BRAND.textMain
                            : BRAND.textDim,
                        }}
                      >
                        {phase.label}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Connector lines (desktop) */}
              <div className="hidden md:block absolute top-4 left-0 right-0 px-8">
                <div className="flex">
                  {PROCESSING_PHASES.slice(0, -1).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex-1 h-0.5 mx-1"
                      style={{
                        backgroundColor:
                          idx < currentPhaseIdx
                            ? BRAND.success
                            : `${BRAND.panelLight}60`,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Mobile vertical layout */}
              <div className="md:hidden space-y-3 pl-2">
                {PROCESSING_PHASES.map((phase, idx) => {
                  const isComplete = idx < currentPhaseIdx;
                  const isCurrent = idx === currentPhaseIdx;
                  const info = PHASE_INFO[phase.key];

                  return (
                    <div key={phase.key} className="flex items-center gap-3">
                      <div className="relative shrink-0">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                            isCurrent ? "ring-4 ring-purple-500/20" : ""
                          }`}
                          style={{
                            backgroundColor: isComplete
                              ? BRAND.success
                              : isCurrent
                              ? BRAND.primary
                              : `${BRAND.panelLight}60`,
                            color:
                              isComplete || isCurrent
                                ? "#fff"
                                : BRAND.textDim,
                          }}
                        >
                          {isComplete ? (
                            <Check size={12} />
                          ) : isCurrent ? (
                            <Loader2
                              size={12}
                              className="animate-spin"
                            />
                          ) : (
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                          )}
                        </div>
                        {isCurrent && (
                          <div
                            className="absolute inset-0 rounded-full animate-ping"
                            style={{
                              backgroundColor: `${BRAND.primary}30`,
                            }}
                          />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span
                          className="text-xs font-medium"
                          style={{
                            color: isComplete
                              ? BRAND.success
                              : isCurrent
                              ? BRAND.textMain
                              : BRAND.textDim,
                          }}
                        >
                          {phase.label}
                        </span>
                        {isCurrent && info && (
                          <p className="text-[10px] mt-0.5" style={{ color: BRAND.textDim }}>
                            {info.desc}
                          </p>
                        )}
                      </div>
                      {isCurrent && (
                        <Badge color="purple" className="ml-auto shrink-0">
                          In Progress
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Current phase description (desktop) */}
            {currentPhaseInfo && (
              <div
                className="mt-6 text-center hidden md:block"
              >
                <div
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-lg text-xs"
                  style={{
                    backgroundColor: `${BRAND.primary}15`,
                    color: BRAND.textMuted,
                  }}
                >
                  <Clock size={12} />
                  <span>
                    <strong style={{ color: BRAND.textMain }}>
                      {currentPhaseInfo.label}
                    </strong>
                    {" — "}
                    {currentPhaseInfo.desc}
                  </span>
                </div>
              </div>
            )}

            {/* Raw status (fallback if no phase matched) */}
            {processingStatus && !currentPhaseInfo && (
              <div
                className="mt-6 text-center"
              >
                <div
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-lg text-xs"
                  style={{
                    backgroundColor: `${BRAND.primary}15`,
                    color: BRAND.textMuted,
                  }}
                >
                  <Clock size={12} />
                  <span>
                    Current stage:{" "}
                    <strong style={{ color: BRAND.textMain }}>
                      {processingStatus}
                    </strong>
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ================================================================ */
  /*  Main Render                                                      */
  /* ================================================================ */

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-3xl border border-purple-900/40 shadow-lg"
        style={{ backgroundColor: BRAND.panel }}
      >
        <div>
          <h2
            className="text-xl font-bold px-2"
            style={{ color: BRAND.textMain }}
          >
            Upload Video
          </h2>
          <p
            className="text-xs px-2 mt-1"
            style={{ color: BRAND.textMuted }}
          >
            Share your training content with the world.
          </p>
        </div>
        <div className="flex items-center gap-2 px-2">
          <Badge color="purple">
            <span className="flex items-center gap-1">
              <Zap size={10} /> Studio
            </span>
          </Badge>
          {file && videoMetadata && (
            <Badge color="gray">
              <span className="flex items-center gap-1">
                <MonitorPlay size={10} />
                {videoMetadata.width}&times;{videoMetadata.height}
              </span>
            </Badge>
          )}
        </div>
      </div>

      {/* Step indicator */}
      <StepIndicator />

      {/* Step content */}
      {step === 1 && renderStep1()}
      {step === 2 && file && videoPreviewUrl && videoMetadata && (
        <VideoEditorView
          file={file}
          videoPreviewUrl={videoPreviewUrl}
          metadata={{ duration: videoMetadata.duration, width: videoMetadata.width, height: videoMetadata.height }}
          api={api}
          onPublish={(edl) => {
            setFinalEdl(edl);
            setStep(3);
          }}
          onSaveDraft={(edl) => {
            setFinalEdl(edl);
          }}
          onBack={() => setStep(1)}
          showToast={showToast}
        />
      )}
      {step === 2 && (!file || !videoPreviewUrl || !videoMetadata) && (
        <div className="text-center py-20" style={{ color: BRAND.textMuted }}>
          <p>Please select a video file first.</p>
          <Button color="purple" className="mt-4" onClick={() => setStep(1)}>Go Back</Button>
        </div>
      )}
      {step === 3 && renderStep2()}
      {step === 4 && renderStep3()}
      {step === 5 && renderStep4()}
    </div>
  );
}
