import BRAND from "../../constants/brand";

function StatCard({ label, value, sub }) {
  return (
    <div className="rounded-2xl p-5 border border-white/5 shadow-xl" style={{ backgroundColor: BRAND.card }}>
      <p className="text-slate-400 text-sm mb-1">{label}</p>
      <p className="text-white text-2xl font-bold">{value ?? "—"}</p>
      {sub && <p className="text-slate-500 text-xs mt-1">{sub}</p>}
    </div>
  );
}

export default StatCard;
