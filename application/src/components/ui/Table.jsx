import BRAND from "../../constants/brand";

function TableWrap({ cols, children }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-white/5 shadow-xl">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-slate-400 text-xs uppercase tracking-wider" style={{ backgroundColor: BRAND.panelLight }}>
            {cols.map((c, i) => <th key={i} className="px-4 py-3 text-left font-medium whitespace-nowrap">{c}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">{children}</tbody>
      </table>
    </div>
  );
}

function TR({ children }) {
  return <tr className="text-slate-300 hover:bg-black/20 transition-colors" style={{ backgroundColor: BRAND.card }}>{children}</tr>;
}

function TD({ children }) {
  return <td className="px-4 py-3 whitespace-nowrap">{children}</td>;
}

export { TableWrap, TR, TD };
