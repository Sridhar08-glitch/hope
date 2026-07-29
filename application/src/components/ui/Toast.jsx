import { X } from "lucide-react";

function Toast({ message, type, onClose }) {
  if (!message) return null;
  const bg = type === "error" ? "bg-red-600" : "bg-green-600";
  return (
    <div className={`fixed top-4 right-4 z-50 ${bg} text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm border border-white/10`}>
      <span className="flex-1 text-sm font-medium">{message}</span>
      <button onClick={onClose} className="hover:opacity-70"><X size={16} /></button>
    </div>
  );
}

export default Toast;
