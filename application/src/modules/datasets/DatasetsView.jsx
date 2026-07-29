import { useState, useEffect, useCallback } from "react";
import adminApi from "../../services/adminApi";
import BRAND from "../../constants/brand";
import { Database, Download, Upload, FileText, Camera, Barcode, Mic, Apple, ScrollText } from "lucide-react";

const TABS = [
  { id: "food-lookups", label: "Food Lookups", icon: Apple },
  { id: "meal-photos", label: "Meal Photos", icon: Camera },
  { id: "barcode-scans", label: "Barcode Scans", icon: Barcode },
  { id: "voice-commands", label: "Voice Commands", icon: Mic },
  { id: "user-nutrition", label: "User Nutrition", icon: FileText },
  { id: "export-logs", label: "Export Logs", icon: ScrollText },
];

const API_MAP = {
  "food-lookups": { list: "foodLookups", export: "exportFoodLookups" },
  "meal-photos": { list: "mealPhotos", export: "exportMealPhotos" },
  "barcode-scans": { list: "barcodeScans", export: "exportBarcodeScans" },
  "voice-commands": { list: "voiceCommands", export: "exportVoiceCommands" },
  "user-nutrition": { list: "userNutrition", export: "exportUserNutrition" },
  "export-logs": { list: "exportLogs" },
};

export default function DatasetsView({ token, showToast }) {
  const [tab, setTab] = useState("food-lookups");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [nextUrl, setNextUrl] = useState(null);
  const [prevUrl, setPrevUrl] = useState(null);

  const load = useCallback(async (url = null) => {
    setLoading(true);
    try {
      const fn = API_MAP[tab]?.list;
      if (!fn) return;
      const res = url
        ? await adminApi.datasets[fn](token, {})
        : await adminApi.datasets[fn](token);
      const data = res?.results || res || [];
      setItems(Array.isArray(data) ? data : []);
      setNextUrl(res?.next || null);
      setPrevUrl(res?.previous || null);
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  }, [token, tab, showToast]);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    const exportFn = API_MAP[tab]?.export;
    if (!exportFn) return;
    try {
      await adminApi.datasets[exportFn](token, {});
      showToast("Export started", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  const handleImportFoods = async () => {
    try {
      await adminApi.datasets.importFoods(token, {});
      showToast("Food import started", "success");
    } catch (err) {
      showToast(err.message, "error");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Database size={24} style={{ color: BRAND.accent }} />
          <h2 className="text-xl font-bold" style={{ color: BRAND.textMain }}>Dataset Management</h2>
        </div>
        <div className="flex gap-2">
          {API_MAP[tab]?.export && (
            <button onClick={handleExport} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ backgroundColor: BRAND.primary, color: '#fff' }}>
              <Download size={16} /> Export Dataset
            </button>
          )}
          {tab === "food-lookups" && (
            <button onClick={handleImportFoods} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
              style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}>
              <Upload size={16} /> Import Foods
            </button>
          )}
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
            style={{ backgroundColor: tab === t.id ? BRAND.primary : BRAND.panel, color: tab === t.id ? '#fff' : BRAND.textMuted, border: `1px solid ${BRAND.panelLight}` }}>
            <t.icon size={15} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12" style={{ color: BRAND.textMuted }}>Loading...</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: BRAND.panelLight }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: BRAND.panelLight }}>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: BRAND.textMuted }}>ID</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: BRAND.textMuted }}>User</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: BRAND.textMuted }}>Details</th>
                <th className="text-left px-4 py-3 font-semibold" style={{ color: BRAND.textMuted }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={4} className="text-center px-4 py-8" style={{ color: BRAND.textMuted }}>No records found</td></tr>
              ) : items.map((item, i) => (
                <tr key={item.id || i} className="border-t" style={{ borderColor: BRAND.panelLight }}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: BRAND.textMuted }}>{String(item.id || i).slice(0, 8)}</td>
                  <td className="px-4 py-3" style={{ color: BRAND.textMain }}>{item.user_email || item.user || item.user_id || '-'}</td>
                  <td className="px-4 py-3 max-w-xs truncate" style={{ color: BRAND.textMain }}>
                    {item.query || item.food_name || item.barcode || item.command || item.name || JSON.stringify(item).slice(0, 80)}
                  </td>
                  <td className="px-4 py-3 text-xs" style={{ color: BRAND.textMuted }}>
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex gap-3">
        {prevUrl && <button onClick={() => load(prevUrl)} className="px-4 py-2 rounded-xl text-sm" style={{ backgroundColor: BRAND.panel, color: BRAND.textMuted, border: `1px solid ${BRAND.panelLight}` }}>Previous</button>}
        {nextUrl && <button onClick={() => load(nextUrl)} className="px-4 py-2 rounded-xl text-sm" style={{ backgroundColor: BRAND.primary, color: '#fff' }}>Next</button>}
      </div>
    </div>
  );
}
