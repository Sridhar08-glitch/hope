import { useState, useEffect } from "react";
import { ChevronLeft } from "lucide-react";
import BRAND from "../../constants/brand";
import { LoadingSpinner, Badge } from "../../components/ui";
import adminApi from "../../services/adminApi";

function TrainerAppDetailView({ token, showToast, appId, onBack }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("personal");

  useEffect(() => {
    setLoading(true);
    adminApi.trainers.applications.detail(token, appId)
      .then(setData)
      .catch(err => { showToast(err.message, "error"); onBack(); })
      .finally(() => setLoading(false));
  }, [token, appId, onBack, showToast]);

  function Row({ label, value }) {
    if (value === undefined || value === null || value === "") return null;
    return (
      <div className="flex justify-between items-start py-3 border-b border-purple-900/30 gap-4">
        <span className="text-slate-400 text-sm font-medium shrink-0 w-48">{label}</span>
        <span className="text-white text-sm text-right break-all">{String(value)}</span>
      </div>
    );
  }

  const statusColor = { approved: "green", rejected: "red", pending: "yellow" };
  const tabs = [
    { id: "personal", label: "Personal Info" },
    { id: "expertise", label: "Expertise" },
    { id: "services", label: "Services & Pricing" },
    { id: "schedule", label: "Schedule" },
    { id: "other", label: "Other" },
  ];

  if (loading) return <LoadingSpinner />;
  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Back button + header */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-400 hover:text-white text-sm transition">
          <ChevronLeft size={18} /> Back to Applications
        </button>
      </div>

      <div className="rounded-2xl border border-white/5 p-6" style={{ backgroundColor: BRAND.card }}>
        {/* Profile header */}
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-purple-900/40">
          {data.profile_image
            ? <img src={data.profile_image} alt="" className="w-20 h-20 rounded-full object-cover border-2 border-purple-700" />
            : <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-2 border-purple-700" style={{ backgroundColor: BRAND.panelLight, color: BRAND.accent }}>{(data.full_name || "?")[0]}</div>
          }
          <div>
            <h2 className="text-white font-bold text-xl mb-1">{data.full_name || data.user_name || "—"}</h2>
            <p className="text-slate-400 text-sm mb-2">{data.email}</p>
            <Badge color={statusColor[data.status] || "gray"}>{data.status}</Badge>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-purple-900/40 mb-6 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`px-5 py-2.5 text-sm font-medium whitespace-nowrap transition ${tab === t.id ? "text-amber-400 border-b-2 border-amber-400" : "text-slate-400 hover:text-white"}`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div className="rounded-xl p-5" style={{ backgroundColor: BRAND.cardLight }}>
          {tab === "personal" && (
            <>
              <Row label="Phone" value={data.phone} />
              <Row label="Nationality" value={data.nationality} />
              <Row label="Country" value={data.country} />
              <Row label="City" value={data.city} />
              <Row label="Experience" value={data.experience !== undefined ? `${data.experience} years` : undefined} />
              {data.bio && (
                <div className="mt-4 pt-4 border-t border-purple-900/30">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Bio</div>
                  <p className="text-white text-sm leading-relaxed">{data.bio}</p>
                </div>
              )}
            </>
          )}

          {tab === "expertise" && (
            <>
              <Row label="Primary Specialty" value={data.primary_specialty} />
              <Row label="Secondary Specialties" value={Array.isArray(data.secondary_specialties) ? data.secondary_specialties.join(", ") : data.secondary_specialties} />
              <Row label="Languages" value={Array.isArray(data.languages) ? data.languages.join(", ") : data.languages} />
            </>
          )}

          {tab === "services" && (
            <>
              <Row label="Gym Training" value={data.supports_gym_training !== undefined ? (data.supports_gym_training ? "Yes" : "No") : undefined} />
              <Row label="Gym Session Price" value={data.gym_session_price !== undefined ? `${data.gym_session_price} QAR` : undefined} />
              <Row label="Virtual Training" value={data.supports_virtual_training !== undefined ? (data.supports_virtual_training ? "Yes" : "No") : undefined} />
              <Row label="Virtual Session Price" value={data.virtual_session_price !== undefined ? `${data.virtual_session_price} QAR` : undefined} />
              <Row label="Home Training" value={data.supports_home_training !== undefined ? (data.supports_home_training ? "Yes" : "No") : undefined} />
              <Row label="Home Training Price" value={data.home_training_price !== undefined ? `${data.home_training_price} QAR` : undefined} />
              <Row label="Training Plans" value={data.supports_training_plan !== undefined ? (data.supports_training_plan ? "Yes" : "No") : undefined} />
              <Row label="Training Plan Price" value={data.training_plan_price !== undefined ? `${data.training_plan_price} QAR` : undefined} />
            </>
          )}

          {tab === "schedule" && (
            data.schedule && Object.keys(data.schedule).length > 0
              ? Object.entries(data.schedule).map(([day, hours]) => (
                  <Row key={day} label={day.charAt(0).toUpperCase() + day.slice(1)} value={Array.isArray(hours) ? `${hours[0]} – ${hours[1]}` : JSON.stringify(hours)} />
                ))
              : <p className="text-slate-400 text-sm">No schedule provided.</p>
          )}

          {tab === "other" && (
            <>
              <Row label="Submitted" value={data.created_at ? new Date(data.created_at).toLocaleString() : undefined} />
              <Row label="Updated" value={data.updated_at ? new Date(data.updated_at).toLocaleString() : undefined} />
              {data.rejection_reason && (
                <div className="mt-4 pt-4 border-t border-purple-900/30">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-2">Rejection Reason</div>
                  <p className="text-red-400 text-sm">{data.rejection_reason}</p>
                </div>
              )}
              {data.certificates && (
                <div className="mt-4 pt-4 border-t border-purple-900/30">
                  <a href={data.certificates} target="_blank" rel="noreferrer"
                    className="text-amber-400 text-sm underline hover:text-amber-300">View Certificates</a>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default TrainerAppDetailView;
