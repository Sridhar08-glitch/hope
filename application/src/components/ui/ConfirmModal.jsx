import { AlertTriangle } from "lucide-react";
import BRAND from "../../constants/brand";

function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="rounded-2xl shadow-2xl border border-white/5 w-full max-w-sm p-6" style={{ backgroundColor: BRAND.card }}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-amber-500/20 rounded-xl">
            <AlertTriangle className="text-amber-400" size={22} />
          </div>
          <p className="text-white font-medium">{message}</p>
        </div>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm rounded-xl text-white hover:opacity-80 transition font-medium" style={{ backgroundColor: BRAND.panelLight }}>Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm bg-red-600 text-white rounded-xl hover:bg-red-700 transition font-medium">Confirm</button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
