import { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import BRAND from "../../constants/brand";
import { LoadingSpinner, Btn } from "../../components/ui";
import adminApi from "../../services/adminApi";

function EventDetailView({ token, showToast, eventId, onBack }) {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    adminApi.events.detail(token, eventId)
      .then(d => setEvent(d?.data || d))
      .catch(e => showToast(e.message, "error"))
      .finally(() => setLoading(false));
  }, [token, eventId, showToast]);
  const fields = event ? [
    ["Title", event.title],
    ["Description", event.description],
    ["Organizer", event.organizer_name || event.organizer],
    ["Date", event.event_date ? new Date(event.event_date).toLocaleString() : null],
    ["Location", event.location],
    ["Category", event.category_name || event.category],
    ["Status", event.status],
    ["Max Participants", event.max_participants],
    ["Current Participants", event.current_participants_count],
    ["Created", event.created_at ? new Date(event.created_at).toLocaleString() : null],
    ["Updated", event.updated_at ? new Date(event.updated_at).toLocaleString() : null],
  ] : [];
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Btn onClick={onBack} color="gray" small><ArrowLeft size={14} className="inline mr-1" />Back</Btn>
        <h2 className="text-white text-xl font-bold">Event Detail</h2>
      </div>
      {loading ? <LoadingSpinner /> : event ? (
        <div className="rounded-xl p-5 border border-purple-900/40 space-y-3" style={{ backgroundColor: BRAND.card }}>
          {fields.filter(([, v]) => v != null && v !== "").map(([label, val]) => (
            <div key={label} className="flex gap-4 text-sm">
              <span className="text-slate-400 w-48 shrink-0">{label}</span>
              <span className="text-white break-words">{String(val)}</span>
            </div>
          ))}
        </div>
      ) : <p className="text-slate-400 text-sm">Event not found.</p>}
    </div>
  );
}

export default EventDetailView;
