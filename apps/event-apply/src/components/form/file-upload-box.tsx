"use client";

import { Upload } from "lucide-react";
import { P } from "../../lib/constants";

interface FileUploadBoxProps {
  label: string;
  hint?: string;
  file: File | null;
  onFile: (file: File) => void;
  accept?: string;
}

export function FileUploadBox({
  label,
  hint,
  file,
  onFile,
  accept,
}: FileUploadBoxProps) {
  return (
    <div style={{ width: "100%", marginBottom: 24, position: "relative" }}>
      <label
        style={{
          display: "block",
          fontSize: 13,
          fontWeight: 700,
          color: P.textMuted,
          marginBottom: hint ? 4 : 8,
          letterSpacing: "0.05em",
          fontFamily: "Helvetica, Arial, sans-serif",
          textTransform: "uppercase",
        }}
      >
        {label}
      </label>
      {hint && (
        <p
          style={{
            margin: "0 0 8px",
            fontSize: 13,
            color: P.textDim,
            fontFamily: '"Figtree", sans-serif',
            lineHeight: 1.4,
          }}
        >
          {hint}
        </p>
      )}
      <label
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          padding: "32px 20px",
          borderRadius: 16,
          cursor: "pointer",
          border: `1px dashed ${file ? P.yellow : P.border}`,
          background: file ? P.yellowGlow : P.inputBg,
          color: file ? P.yellow : P.textMuted,
          transition: "all 0.3s ease",
          textAlign: "center",
        }}
      >
        <Upload size={24} />
        <div>
          <div
            style={{
              fontSize: 15,
              fontWeight: 600,
              fontFamily: '"Figtree", sans-serif',
              color: file ? P.yellow : P.text,
              marginBottom: 4,
            }}
          >
            {file ? file.name : "Click to browse files"}
          </div>
          <div style={{ fontSize: 13, fontFamily: "'Figtree', sans-serif" }}>
            {file ? "Attached securely" : "PDF, JPG, PNG (Max 10MB)"}
          </div>
        </div>
        <input
          type="file"
          accept={accept}
          style={{ display: "none" }}
          onChange={(e) => {
            if (e.target.files?.[0]) onFile(e.target.files[0]);
          }}
        />
      </label>
    </div>
  );
}
