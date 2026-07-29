import { useState } from "react";
import BRAND from "../../constants/brand";
import { InputField } from "../../components/ui";
import adminApi from "../../services/adminApi";

function LoginView({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.login(email, password);
      const token = res?.access || res?.token || res?.access_token;
      if (!token) throw new Error("No token in response");
      onLogin(token, res?.user || res?.admin || {});
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: BRAND.bg }}>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-3xl opacity-20 pointer-events-none" style={{ backgroundColor: BRAND.primary }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none" style={{ backgroundColor: BRAND.accent }} />
      <div className="rounded-2xl shadow-2xl border border-white/5 w-full max-w-sm p-8 relative z-10" style={{ backgroundColor: BRAND.card }}>
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl font-bold shadow-lg" style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}>
            H
          </div>
          <h1 className="text-white text-2xl font-bold">Holora Admin</h1>
          <p className="text-slate-400 text-sm mt-1">Sign in to the dashboard</p>
        </div>
        <form onSubmit={submit}>
          <InputField label="Email" value={email} onChange={setEmail} type="email" required />
          <InputField label="Password" value={password} onChange={setPassword} type="password" required />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full text-sm font-bold rounded-xl py-3 transition-all disabled:opacity-50 shadow-lg"
            style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}
          >
            {loading ? "Signing in…" : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginView;
