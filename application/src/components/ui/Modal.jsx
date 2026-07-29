import { X } from "lucide-react";
import BRAND from "../../constants/brand";

function Modal({ title, onClose, children, wide }) {
  return (
    <div className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className={`rounded-2xl shadow-2xl border border-white/5 ${wide ? "w-full max-w-3xl" : "w-full max-w-lg"} max-h-[90vh] overflow-y-auto`} style={{ backgroundColor: BRAND.card }}>
        <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: BRAND.panelLight }}>
          <h3 className="text-white font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition"><X size={20} /></button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
