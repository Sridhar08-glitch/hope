function Badge({ color = "gray", children }) {
  const colors = {
    green: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    red: "bg-red-500/20 text-red-400 border border-red-500/30",
    yellow: "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30",
    blue: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    purple: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
    gray: "bg-white/5 text-slate-300 border border-white/10",
  };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[color]}`}>{children}</span>;
}

export default Badge;
