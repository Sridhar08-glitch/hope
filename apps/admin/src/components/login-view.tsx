"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@holora/auth";
import { Button, Spinner } from "@holora/ui";
import { BRAND } from "@holora/ui";
import { Lock, Mail, AlertCircle, Eye, EyeOff } from "lucide-react";

const ease = [0.25, 0.46, 0.45, 0.94] as [number, number, number, number];

export function LoginView() {
  const { adminLogin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await adminLogin(email, password);
    } catch {
      setError("Invalid credentials or insufficient permissions.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ backgroundColor: BRAND.bg }}
    >
      {/* Background gradient accents */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-[0.07]"
          style={{
            background: `radial-gradient(circle, ${BRAND.accent}, transparent 70%)`,
            filter: "blur(60px)",
            transform: "translate(30%, -30%)",
          }}
        />
        <div
          className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full opacity-[0.05]"
          style={{
            background: `radial-gradient(circle, ${BRAND.primary}, transparent 70%)`,
            filter: "blur(60px)",
            transform: "translate(-30%, 30%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease }}
        className="w-full max-w-[380px] relative z-10"
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1, duration: 0.4, ease }}
          className="text-center mb-8"
        >
          <img
            src="/assets/logo.png"
            alt="Holora Performance"
            className="w-12 h-12 rounded-xl object-cover mx-auto mb-4 shadow-lg"
          />
          <h1
            className="text-[15px] font-bold tracking-[0.2em]"
            style={{ color: BRAND.textMain }}
          >
            HOLORA
          </h1>
          <p
            className="text-[10px] tracking-[0.25em] mt-0.5"
            style={{ color: BRAND.textDim }}
          >
            PERFORMANCE
          </p>
        </motion.div>

        {/* Form card */}
        <div
          className="rounded-2xl p-6 md:p-8"
          style={{
            backgroundColor: BRAND.surface,
            border: `1px solid rgba(126, 34, 206, 0.1)`,
          }}
        >
          <p
            className="text-[13px] font-medium mb-5"
            style={{ color: BRAND.textMuted }}
          >
            Sign in to the admin console
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                className="block text-[11px] font-medium uppercase tracking-wider mb-1.5"
                style={{ color: BRAND.textDim }}
              >
                Email
              </label>
              <div className="relative">
                <Mail
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: BRAND.textDim }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@holora.com"
                  autoComplete="email"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg text-[13px] outline-none transition-all border"
                  style={{
                    backgroundColor: BRAND.input,
                    color: BRAND.textMain,
                    borderColor: "transparent",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = BRAND.accent;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "transparent";
                  }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-[11px] font-medium uppercase tracking-wider mb-1.5"
                style={{ color: BRAND.textDim }}
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: BRAND.textDim }}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter password"
                  autoComplete="current-password"
                  className="w-full pl-9 pr-9 py-2.5 rounded-lg text-[13px] outline-none transition-all border"
                  style={{
                    backgroundColor: BRAND.input,
                    color: BRAND.textMain,
                    borderColor: "transparent",
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = BRAND.accent;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "transparent";
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color: BRAND.textDim }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = BRAND.textMuted; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = BRAND.textDim; }}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px]"
                style={{
                  backgroundColor: `${BRAND.error}10`,
                  color: BRAND.error,
                  border: `1px solid ${BRAND.error}20`,
                }}
              >
                <AlertCircle size={13} />
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-[13px] font-semibold transition-all disabled:opacity-50"
              style={{
                backgroundColor: BRAND.accent,
                color: BRAND.bg,
              }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Spinner /> Signing in...
                </span>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <p
          className="text-center text-[11px] mt-4"
          style={{ color: BRAND.textDim }}
        >
          Admin access only. All actions are logged.
        </p>
      </motion.div>
    </div>
  );
}
