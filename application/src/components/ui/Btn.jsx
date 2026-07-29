function Btn({ onClick, color = "purple", children, small, disabled }) {
  const colors = {
    purple: "bg-purple-700 hover:bg-purple-600",
    red: "bg-red-600/80 hover:bg-red-600",
    green: "bg-emerald-700 hover:bg-emerald-600",
    gray: "hover:bg-white/10 border border-white/10",
    yellow: "bg-amber-600 hover:bg-amber-500",
    blue: "bg-blue-700 hover:bg-blue-600",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${colors[color]} text-white rounded-lg font-medium transition-colors disabled:opacity-50 ${small ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm"}`}
    >
      {children}
    </button>
  );
}

export default Btn;
