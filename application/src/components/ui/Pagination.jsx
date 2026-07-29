import { ChevronLeft, ChevronRight } from "lucide-react";

function Pagination({ nextUrl, prevUrl, onNext, onPrev }) {
  return (
    <div className="flex justify-between items-center mt-4 pt-4 border-t border-white/5">
      <button onClick={onPrev} disabled={!prevUrl} className="px-4 py-2 text-sm rounded-xl bg-white/5 hover:bg-white/10 text-white transition disabled:opacity-30 disabled:cursor-not-allowed font-medium flex items-center gap-1">
        <ChevronLeft size={14} /> Prev
      </button>
      <button onClick={onNext} disabled={!nextUrl} className="px-4 py-2 text-sm rounded-xl bg-white/5 hover:bg-white/10 text-white transition disabled:opacity-30 disabled:cursor-not-allowed font-medium flex items-center gap-1">
        Next <ChevronRight size={14} />
      </button>
    </div>
  );
}

export default Pagination;
