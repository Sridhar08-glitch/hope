"use client";

import { useTokenFromUrl } from "@holora/auth";
import { TrainerForm } from "../components/trainer-form";

export default function TrainerApplyPage() {
  const { isReady } = useTokenFromUrl();

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
          className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white"
        />
      </div>
    );
  }

  return <TrainerForm />;
}
