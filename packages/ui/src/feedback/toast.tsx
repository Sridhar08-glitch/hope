"use client";

import { useState, useCallback } from "react";
import { X } from "lucide-react";

interface ToastProps {
  message: string | null;
  type?: "error" | "success";
  onClose: () => void;
}

export function Toast({ message, type = "success", onClose }: ToastProps) {
  if (!message) return null;
  const bg = type === "error" ? "bg-red-600" : "bg-green-600";
  return (
    <div
      className={`fixed top-4 right-4 z-50 ${bg} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm border border-white/10`}
    >
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button onClick={onClose} className="hover:opacity-70">
        <X size={16} />
      </button>
    </div>
  );
}

/**
 * Hook for managing toast state.
 * Usage:
 *   const { toast, showToast, hideToast } = useToast();
 *   showToast("Saved!", "success");
 *   <Toast message={toast.message} type={toast.type} onClose={hideToast} />
 */
export function useToast(autoDismissMs = 4000) {
  const [toast, setToast] = useState<{
    message: string | null;
    type: "error" | "success";
  }>({ message: null, type: "success" });

  const showToast = useCallback(
    (message: string, type: "error" | "success" = "success") => {
      setToast({ message, type });
      if (autoDismissMs > 0) {
        setTimeout(() => setToast({ message: null, type: "success" }), autoDismissMs);
      }
    },
    [autoDismissMs]
  );

  const hideToast = useCallback(() => {
    setToast({ message: null, type: "success" });
  }, []);

  return { toast, showToast, hideToast };
}
