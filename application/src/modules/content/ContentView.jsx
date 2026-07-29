import { useState, useEffect, useCallback } from "react";
import { Trash2 } from "lucide-react";
import { LoadingSpinner, TableWrap, TR, TD, Btn, Pagination, ConfirmModal } from "../../components/ui";
import adminApi from "../../services/adminApi";

function ContentView({ token, showToast }) {
  const [tab, setTab] = useState("workout");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = useCallback(async (url = null) => {
    setLoading(true);
    try {
      const api = tab === "workout" ? adminApi.workoutPlans : adminApi.trainerMealPlans;
      const res = url ? await api.listUrl(token, url) : await api.list(token);
      setItems(res?.results || []);
      setNextUrl(res?.next || null);
      setPrevUrl(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    finally { setLoading(false); }
  }, [token, tab, showToast]);

  useEffect(() => { load(); }, [load]);

  async function doDelete(id) {
    try {
      const api = tab === "workout" ? adminApi.workoutPlans : adminApi.trainerMealPlans;
      await api.delete(token, id); showToast("Deleted", "success"); setConfirmDel(null); load();
    } catch (err) { showToast(err.message, "error"); }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-white text-xl font-bold">Content Plans</h2>
      <div className="flex gap-2 border-b border-purple-900/40">
        {[["workout", "Workout Plans"], ["meal", "Trainer Meal Plans"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-2 text-sm font-medium ${tab === v ? "text-amber-400 border-b-2 border-amber-400" : "text-slate-400 hover:text-white"}`}>{l}</button>
        ))}
      </div>
      {loading ? <LoadingSpinner /> : (
        <>
          <TableWrap cols={["Name", "Trainer", "Difficulty", "Actions"]}>
            {items.map(p => (
              <TR key={p.id}>
                <TD><span className="text-white">{p.name || p.plan_name || `Plan #${p.id}`}</span></TD>
                <TD>{p.trainer_name || p.trainer || "—"}</TD>
                <TD>{p.difficulty_level || p.difficulty || "—"}</TD>
                <TD><Btn onClick={() => setConfirmDel(p.id)} color="red" small><Trash2 size={12} /></Btn></TD>
              </TR>
            ))}
          </TableWrap>
          <Pagination nextUrl={nextUrl} prevUrl={prevUrl} onNext={() => load(nextUrl)} onPrev={() => load(prevUrl)} />
        </>
      )}
      {confirmDel && <ConfirmModal message="Delete this plan?" onConfirm={() => doDelete(confirmDel)} onCancel={() => setConfirmDel(null)} />}
    </div>
  );
}

export default ContentView;
