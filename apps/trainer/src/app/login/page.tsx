"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuth } from "@holora/auth";
import { Spinner, Button, BRAND } from "@holora/ui";
import { Shield, Mail, Lock, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, user, logout, isAuthenticated, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // If already authenticated as trainer, redirect to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role === "trainer") {
      router.replace("/");
    }
  }, [isLoading, isAuthenticated, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
    } catch {
      setError("Invalid credentials. Please try again.");
      setSubmitting(false);
    }
  };

  // Show loading while checking auth status
  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ backgroundColor: BRAND.bg }}>
        <Spinner />
      </div>
    );
  }

  // If authenticated but wrong role
  if (user && user.role !== "trainer") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center p-4" style={{ backgroundColor: BRAND.bg }}>
        <div className="w-full max-w-md rounded-2xl p-8 border border-white/5 shadow-2xl text-center"
          style={{ backgroundColor: BRAND.panel }}>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: `${BRAND.error}15` }}>
            <Shield size={20} style={{ color: BRAND.error }} />
          </div>
          <h2 className="text-lg font-semibold text-white mb-2">Access Denied</h2>
          <p className="text-sm mb-6" style={{ color: BRAND.textMuted }}>
            This dashboard is only available for trainer accounts.
          </p>
          <Button color="purple" className="w-full py-3" onClick={() => logout()}>
            Back to Login
          </Button>
        </div>
      </div>
    );
  }

  // If already authenticated as trainer (brief flash before redirect)
  if (isAuthenticated && user?.role === "trainer") {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ backgroundColor: BRAND.bg }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
      {/* Animated background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ x: [0, 60, -30, 0], y: [0, -40, 20, 0], scale: [1, 1.2, 0.9, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute -top-32 -left-32 w-96 h-96 rounded-full blur-[120px] opacity-30"
          style={{ backgroundColor: BRAND.primary }}
        />
        <motion.div
          animate={{ x: [0, -50, 30, 0], y: [0, 50, -20, 0], scale: [1, 0.8, 1.1, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full blur-[120px] opacity-20"
          style={{ backgroundColor: BRAND.accent }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] as [number, number, number, number] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="rounded-3xl p-8 md:p-10 border border-white/10 shadow-2xl backdrop-blur-xl"
          style={{ backgroundColor: `${BRAND.panel}e0` }}>
          {/* Logo */}
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
            className="text-center mb-8">
            <img src="/assets/logo.png" alt="Holora" className="w-20 h-20 object-contain mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-white">Trainer Dashboard</h1>
            <p className="text-sm mt-1.5" style={{ color: BRAND.textMuted }}>Sign in to Holora Performance</p>
          </motion.div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
              <label className="block text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: BRAND.textMuted }}>
                Email Address
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: BRAND.textDim }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="trainer@holora.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white focus:outline-none transition-all duration-200 border"
                  style={{ backgroundColor: BRAND.input, borderColor: "transparent" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = BRAND.primary; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(126,34,206,0.15)`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.boxShadow = "none"; }}
                />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
              <label className="block text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: BRAND.textMuted }}>
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2" style={{ color: BRAND.textDim }} />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Enter your password"
                  className="w-full pl-10 pr-10 py-3 rounded-xl text-sm text-white focus:outline-none transition-all duration-200 border"
                  style={{ backgroundColor: BRAND.input, borderColor: "transparent" }}
                  onFocus={(e) => { e.currentTarget.style.borderColor = BRAND.primary; e.currentTarget.style.boxShadow = `0 0 0 3px rgba(126,34,206,0.15)`; }}
                  onBlur={(e) => { e.currentTarget.style.borderColor = "transparent"; e.currentTarget.style.boxShadow = "none"; }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </motion.div>

            {error && (
              <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
                style={{ backgroundColor: `${BRAND.error}15`, color: BRAND.error }}>
                <Shield size={14} />
                {error}
              </motion.div>
            )}

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Button
                color="purple"
                disabled={submitting}
                className="w-full py-3.5 text-sm font-semibold"
                style={{ background: `linear-gradient(135deg, ${BRAND.primary}, ${BRAND.primaryHover})`, boxShadow: `0 4px 20px ${BRAND.primary}40` }}
              >
                {submitting ? <span className="flex items-center justify-center gap-2"><Spinner /> Signing in...</span> : "Sign In"}
              </Button>
            </motion.div>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs mt-6" style={{ color: BRAND.textDim }}>
          Holora Performance &copy; {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}
