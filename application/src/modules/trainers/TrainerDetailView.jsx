import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import BRAND from "../../constants/brand";
import { LoadingSpinner, Btn } from "../../components/ui";
import adminApi from "../../services/adminApi";

function TrainerDetailView({ token, showToast, trainerId, onBack }) {
  const [trainer, setTrainer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [detailTab, setDetailTab] = useState("personal");
  useEffect(() => {
    adminApi.trainers.detail(token, trainerId)
      .then(d => setTrainer(d?.data || d))
      .catch(e => showToast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [token, trainerId, showToast]);

  const tabs = [["personal", "Personal"], ["expertise", "Expertise"], ["services", "Services & Pricing"], ["stats", "Stats"]];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Btn onClick={onBack} color="gray" small><ArrowLeft size={14} className="inline mr-1" />Back</Btn>
        <h2 className="text-white text-xl font-bold">Trainer Detail</h2>
      </div>
      {loading ? <LoadingSpinner /> : !trainer ? <p className="text-slate-400 text-sm">Trainer not found.</p> : (
        <>
          <div className="flex gap-2 border-b border-purple-900/40">
            {tabs.map(([v, l]) => (
              <button key={v} onClick={() => setDetailTab(v)}
                className={`px-4 py-2 text-sm font-medium ${detailTab === v ? "text-amber-400 border-b-2 border-amber-400" : "text-slate-400 hover:text-white"}`}>{l}</button>
            ))}
          </div>
          <div className="rounded-xl p-5 border border-purple-900/40 space-y-3" style={{ backgroundColor: BRAND.card }}>
            {detailTab === "personal" && [
              ["Name", trainer.user_name || trainer.full_name],
              ["Email", trainer.email],
              ["Phone", trainer.phone],
              ["Bio", trainer.bio],
              ["Location", trainer.location],
              ["Verified", trainer.is_verified ? "Yes" : "No"],
              ["Featured", trainer.is_featured ? "Yes" : "No"],
              ["Active", trainer.is_active ? "Yes" : "No"],
              ["Joined", trainer.created_at ? new Date(trainer.created_at).toLocaleDateString() : null],
            ].filter(([, v]) => v != null && v !== "").map(([label, val]) => (
              <div key={label} className="flex gap-4 text-sm">
                <span className="text-slate-400 w-48 shrink-0">{label}</span>
                <span className="text-white break-words">{String(val)}</span>
              </div>
            ))}
            {detailTab === "expertise" && [
              ["Primary Specialty", trainer.primary_specialty],
              ["Secondary Specialties", Array.isArray(trainer.secondary_specialties) ? trainer.secondary_specialties.join(", ") : trainer.secondary_specialties],
              ["Certifications", Array.isArray(trainer.certifications) ? trainer.certifications.join(", ") : trainer.certifications],
              ["Years Experience", trainer.years_of_experience],
              ["Languages", Array.isArray(trainer.languages) ? trainer.languages.join(", ") : trainer.languages],
            ].filter(([, v]) => v != null && v !== "").map(([label, val]) => (
              <div key={label} className="flex gap-4 text-sm">
                <span className="text-slate-400 w-48 shrink-0">{label}</span>
                <span className="text-white break-words">{String(val)}</span>
              </div>
            ))}
            {detailTab === "services" && [
              ["Session Types", Array.isArray(trainer.session_types) ? trainer.session_types.join(", ") : trainer.session_types],
              ["Hourly Rate", trainer.hourly_rate ? `$${trainer.hourly_rate}` : null],
              ["Currency", trainer.currency],
              ["Online Sessions", trainer.offers_online ? "Yes" : "No"],
              ["In-person Sessions", trainer.offers_in_person ? "Yes" : "No"],
            ].filter(([, v]) => v != null && v !== "").map(([label, val]) => (
              <div key={label} className="flex gap-4 text-sm">
                <span className="text-slate-400 w-48 shrink-0">{label}</span>
                <span className="text-white break-words">{String(val)}</span>
              </div>
            ))}
            {detailTab === "stats" && [
              ["Total Bookings", trainer.total_bookings],
              ["Completed Bookings", trainer.completed_bookings],
              ["Avg Rating", trainer.average_rating],
              ["Total Reviews", trainer.total_reviews],
              ["Total Earnings", trainer.total_earnings ? `$${trainer.total_earnings}` : null],
            ].filter(([, v]) => v != null).map(([label, val]) => (
              <div key={label} className="flex gap-4 text-sm">
                <span className="text-slate-400 w-48 shrink-0">{label}</span>
                <span className="text-white break-words">{String(val)}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default TrainerDetailView;
