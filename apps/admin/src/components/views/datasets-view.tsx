"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Database, Download } from "lucide-react";
import { BRAND, Spinner } from "@holora/ui";
import type { ApiClient } from "@holora/api-client";
import { PageHeader, TabBar, DataTable, TR, TD, EmptyState, SimplePagination, fadeUp } from "@/components/shared";

interface ViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
}

const TABS = [
  { key: "food-lookups" as const, label: "Food Lookups", icon: Database },
  { key: "meal-photos" as const, label: "Meal Photos", icon: Database },
  { key: "barcode-scans" as const, label: "Barcode Scans", icon: Database },
  { key: "voice-commands" as const, label: "Voice Commands", icon: Database },
  { key: "user-nutrition" as const, label: "User Nutrition", icon: Database },
  { key: "export-logs" as const, label: "Export Logs", icon: Database },
];

type TabKey = (typeof TABS)[number]["key"];

export default function DatasetsView({ api, showToast }: ViewProps) {
  const [tab, setTab] = useState<TabKey>("food-lookups");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);

  const load = useCallback(async (url: string | null = null) => {
    setLoading(true);
    try {
      const res = url ? await api.get<any>(url) : await api.get<any>(`/admin/datasets/${tab}/`);
      setItems(res?.results || (Array.isArray(res) ? res : []));
      setNextUrl(res?.next || null);
      setPrevUrl(res?.previous || null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }, [api, tab, showToast]);

  useEffect(() => { load(); }, [load]);

  async function handleExport() {
    try {
      await api.post(`/admin/datasets/${tab}/export/`, {});
      showToast("Export started", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Export failed", "error");
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Datasets" subtitle="Browse and export training data">
        <button onClick={handleExport} className="px-3 py-1.5 rounded-lg text-[12px] font-medium flex items-center gap-1.5 transition hover:opacity-90" style={{ backgroundColor: BRAND.accent, color: BRAND.bg }}>
          <Download size={13} /> Export
        </button>
      </PageHeader>

      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <TabBar tabs={[...TABS]} active={tab} onChange={setTab} />
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={Database} message="No records in this dataset" />
      ) : (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          <DataTable cols={Object.keys(items[0] || {}).slice(0, 5)}>
            {items.map((item: any, i: number) => (
              <TR key={item.id || i}>
                {Object.values(item).slice(0, 5).map((v: any, j: number) => (
                  <TD key={j}><span className="text-[11px] truncate block max-w-[200px]" style={{ color: BRAND.textMuted }}>{String(v ?? "—").slice(0, 60)}</span></TD>
                ))}
              </TR>
            ))}
          </DataTable>
          <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => load(prevUrl)} onNext={() => load(nextUrl)} count={items.length} />
        </motion.div>
      )}
    </div>
  );
}
