"use client";

import { useState, useRef, useEffect } from "react";
import { Search, ChevronDown, Check } from "lucide-react";
import { P } from "../../lib/constants";

export interface SelectOption {
  label: string;
  value: string;
}

interface SearchSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: (string | SelectOption)[];
  placeholder?: string;
  disabled?: boolean;
}

// IMPORTANT: Do NOT use `useEffect([open])` to call setQ — that causes infinite
// re-renders in React 19. Reset q in click handlers only.
// Do NOT use `autoFocus` — in React 19 StrictMode double-invocation it triggers
// browser focus events during commit phase. Use imperative ref.focus() in an
// effect that calls NO setState.
export function SearchSelect({
  value,
  onChange,
  options,
  placeholder,
  disabled = false,
}: SearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on outside click — resets q in handler, NOT in a [open] setState effect
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQ("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Imperatively focus the search input when dropdown opens — NO setState here
  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const getOptionValue = (o: string | SelectOption): string =>
    typeof o === "string" ? o : o.value;
  const getOptionLabel = (o: string | SelectOption): string =>
    typeof o === "string" ? o : o.label;

  const displayVal = options.find((o) => getOptionValue(o) === value);
  const filtered = options.filter((o) =>
    getOptionLabel(o).toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div ref={wrapRef} style={{ position: "relative", width: "100%" }}>
      <div
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          width: "100%",
          background: disabled ? "rgba(255,255,255,0.02)" : P.inputBg,
          border: `1px solid ${open ? P.borderFocus : P.border}`,
          borderRadius: 12,
          padding: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.3s ease",
          boxShadow: open ? `0 0 0 3px ${P.yellowGlow}` : "none",
          opacity: disabled ? 0.5 : 1,
          boxSizing: "border-box" as const,
        }}
      >
        <span
          style={{
            color: displayVal ? P.text : P.textMuted,
            fontSize: 15,
            fontFamily: '"Figtree", sans-serif',
          }}
        >
          {displayVal ? getOptionLabel(displayVal) : placeholder}
        </span>
        <span
          style={{
            color: P.textMuted,
            transition: "transform 0.3s",
            transform: open ? "rotate(180deg)" : "none",
            flexShrink: 0,
          }}
        >
          <ChevronDown size={16} />
        </span>
      </div>

      {open && !disabled && (
        <div
          style={{
            position: "absolute",
            zIndex: 999,
            top: "calc(100% + 8px)",
            left: 0,
            right: 0,
            background: P.surface,
            border: `1px solid ${P.border}`,
            borderRadius: 16,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 24px 48px rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              padding: 12,
              borderBottom: `1px solid ${P.border}`,
              position: "relative",
            }}
          >
            <span
              style={{
                position: "absolute",
                left: 24,
                top: "50%",
                transform: "translateY(-50%)",
                color: P.textMuted,
                pointerEvents: "none",
              }}
            >
              <Search size={18} />
            </span>
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search..."
              onClick={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                background: P.inputBg,
                border: "none",
                borderRadius: 8,
                padding: "12px 16px 12px 40px",
                color: P.text,
                fontSize: 14,
                outline: "none",
                fontFamily: '"Figtree", sans-serif',
                boxSizing: "border-box" as const,
              }}
            />
          </div>
          <div
            style={{ maxHeight: 260, overflowY: "auto", padding: 8 }}
            className="custom-scroll"
          >
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: 16,
                  color: P.textMuted,
                  textAlign: "center",
                  fontSize: 14,
                  fontFamily: '"Figtree", sans-serif',
                }}
              >
                No results found.
              </div>
            ) : (
              filtered.map((o) => {
                const v = getOptionValue(o);
                const l = getOptionLabel(o);
                const isSel = value === v;
                return (
                  <div
                    key={v}
                    onClick={() => {
                      onChange(v);
                      setOpen(false);
                      setQ("");
                    }}
                    style={{
                      padding: "12px 16px",
                      fontSize: 15,
                      cursor: "pointer",
                      borderRadius: 8,
                      background: isSel
                        ? "rgba(244,190,105,0.1)"
                        : "transparent",
                      color: isSel ? P.yellow : P.text,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      fontFamily: '"Figtree", sans-serif',
                      fontWeight: isSel ? 600 : 400,
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSel)
                        (e.currentTarget as HTMLDivElement).style.background =
                          "rgba(255,255,255,0.05)";
                    }}
                    onMouseLeave={(e) => {
                      if (!isSel)
                        (e.currentTarget as HTMLDivElement).style.background =
                          "transparent";
                    }}
                  >
                    {l}
                    {isSel && <Check size={14} strokeWidth={3} />}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
