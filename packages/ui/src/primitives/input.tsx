"use client";

import { BRAND } from "../theme";

interface InputProps {
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
}

export function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  className = "",
}: InputProps) {
  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-slate-400 text-sm mb-1 font-medium">
        {label}
        {required && " *"}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none transition"
        style={{
          backgroundColor: BRAND.panelLight,
          borderColor: "rgba(126,34,206,0.4)",
        }}
      />
    </div>
  );
}
