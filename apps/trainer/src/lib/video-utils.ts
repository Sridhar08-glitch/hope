/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

/* ================================================================== */
/*  Client-side video metadata extraction + thumbnail generation       */
/*  Uses HTML5 Video element + Canvas API (works in all browsers)     */
/* ================================================================== */

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  aspectRatio: string;
  size: number;
  type: string;
  fileName: string;
}

/**
 * Extract metadata from a video file without uploading it.
 * Creates a hidden <video> element and reads its properties.
 */
export function extractVideoMetadata(file: File): Promise<VideoMetadata> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);
    let resolved = false;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        URL.revokeObjectURL(objectUrl);
        video.removeAttribute("src");
        video.load();
      }
    };

    video.onloadedmetadata = () => {
      const w = video.videoWidth;
      const h = video.videoHeight;
      const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
      const d = gcd(w, h) || 1;

      resolve({
        duration: video.duration || 0,
        width: w,
        height: h,
        aspectRatio: `${w / d}:${h / d}`,
        size: file.size,
        type: file.type,
        fileName: file.name,
      });
      cleanup();
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Failed to read video metadata. The file may be corrupted or in an unsupported format."));
    };

    // Timeout after 15 seconds
    setTimeout(() => {
      if (!resolved) {
        cleanup();
        reject(new Error("Timed out reading video metadata."));
      }
    }, 15000);

    video.src = objectUrl;
  });
}

/**
 * Generate a single thumbnail at a specific time in the video.
 * Returns a Blob (JPEG).
 */
export function generateThumbnail(
  file: File,
  timeSeconds: number,
  width = 320,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);
    let resolved = false;

    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        URL.revokeObjectURL(objectUrl);
        video.removeAttribute("src");
        video.load();
      }
    };

    video.onloadedmetadata = () => {
      // Clamp seek time to valid range
      const seekTo = Math.min(Math.max(timeSeconds, 0), video.duration - 0.1);
      video.currentTime = seekTo;
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement("canvas");
        const scale = width / video.videoWidth;
        canvas.width = width;
        canvas.height = Math.round(video.videoHeight * scale);

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          cleanup();
          reject(new Error("Canvas context not available"));
          return;
        }

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob(
          (blob) => {
            cleanup();
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Failed to generate thumbnail blob"));
            }
          },
          "image/jpeg",
          0.85,
        );
      } catch (err) {
        cleanup();
        reject(err);
      }
    };

    video.onerror = () => {
      cleanup();
      reject(new Error("Failed to load video for thumbnail generation"));
    };

    setTimeout(() => {
      if (!resolved) {
        cleanup();
        reject(new Error("Thumbnail generation timed out"));
      }
    }, 20000);

    video.src = objectUrl;
  });
}

/**
 * Generate multiple thumbnails at evenly-spaced intervals.
 * Returns array of JPEG Blobs.
 */
export async function generateThumbnails(
  file: File,
  count = 5,
  width = 320,
): Promise<Blob[]> {
  // First get the duration
  const meta = await extractVideoMetadata(file);
  if (!meta.duration || meta.duration < 1) {
    return [];
  }

  const interval = meta.duration / (count + 1);
  const times = Array.from({ length: count }, (_, i) => interval * (i + 1));

  const thumbnails: Blob[] = [];
  for (const time of times) {
    try {
      const blob = await generateThumbnail(file, time, width);
      thumbnails.push(blob);
    } catch {
      // Skip failed thumbnails, continue with others
    }
  }

  return thumbnails;
}

/* ── Formatting helpers ── */

export function formatFileSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  if (bytes >= 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${bytes} B`;
}

export function formatDuration(seconds: number): string {
  if (!seconds || !isFinite(seconds)) return "0:00";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function formatUploadSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond >= 1024 * 1024) return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
  if (bytesPerSecond >= 1024) return `${(bytesPerSecond / 1024).toFixed(0)} KB/s`;
  return `${bytesPerSecond.toFixed(0)} B/s`;
}

export function estimateTimeRemaining(bytesRemaining: number, bytesPerSecond: number): string {
  if (!bytesPerSecond || bytesPerSecond <= 0) return "Calculating...";
  const seconds = bytesRemaining / bytesPerSecond;
  if (seconds < 60) return `~${Math.ceil(seconds)}s remaining`;
  if (seconds < 3600) return `~${Math.ceil(seconds / 60)}m ${Math.floor(seconds % 60)}s remaining`;
  const h = Math.floor(seconds / 3600);
  const m = Math.ceil((seconds % 3600) / 60);
  return `~${h}h ${m}m remaining`;
}

/**
 * Auto-generate a title from a filename.
 * "my_workout_video.mp4" → "My Workout Video"
 */
export function titleFromFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, "") // strip extension
    .replace(/[_\-]+/g, " ") // replace underscores/dashes with spaces
    .replace(/([a-z])([A-Z])/g, "$1 $2") // split camelCase
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
