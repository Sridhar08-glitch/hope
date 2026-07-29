"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Trash2, BookOpen } from "lucide-react";
import { BRAND, Spinner } from "@holora/ui";
import type { ApiClient } from "@holora/api-client";
import { PageHeader, TabBar, DataTable, TR, TD, EmptyState, ConfirmDialog, SimplePagination, fadeUp, cardStyle } from "@/components/shared";

interface ViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
}

export default function ContentView({ api, showToast }: ViewProps) {
  type Tab = "workout" | "meal";
  const [tab, setTab] = useState<Tab>("workout");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [confirmDel, setConfirmDel] = useState<string | null>(null);

  const load = useCallback(async (url: string | null = null) => {
    setLoading(true);
    try {
      const endpoint = tab === "workout" ? "/admin/workout-plans/" : "/admin/trainer-meal-plans/";
      const res = url ? await api.get<any>(url) : await api.get<any>(endpoint);
      setItems(res?.results || []);
      setNextUrl(res?.next || null);
      setPrevUrl(res?.previous || null);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }, [api, tab, showToast]);

  useEffect(() => { load(); }, [load]);

  async function doDelete(id: string) {
    try {
      const endpoint = tab === "workout" ? `/admin/workout-plans/${id}/` : `/admin/trainer-meal-plans/${id}/`;
      await api.del(endpoint);
      showToast("Deleted", "success");
      setConfirmDel(null);
      load();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Delete failed", "error");
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader title="Content Plans" subtitle="Workout plans and meal plans from trainers" />

      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <TabBar
          tabs={[
            { key: "workout" as Tab, label: "Workout Plans", icon: BookOpen },
            { key: "meal" as Tab, label: "Meal Plans", icon: BookOpen },
          ]}
          active={tab}
          onChange={setTab}
        />
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : items.length === 0 ? (
        <EmptyState icon={BookOpen} message={`No ${tab === "workout" ? "workout" : "meal"} plans yet`} />
      ) : (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          <DataTable cols={["Name", "Trainer", "Difficulty", ""]}>
            {items.map((p: any) => (
              <TR key={p.id}>
                <TD><span className="font-medium">{p.name || p.plan_name || `Plan #${p.id}`}</span></TD>
                <TD><span style={{ color: BRAND.textMuted }}>{p.trainer_name || p.trainer || "—"}</span></TD>
                <TD><span style={{ color: BRAND.textMuted }}>{p.difficulty_level || p.difficulty || "—"}</span></TD>
                <TD className="text-right">
                  <button onClick={() => setConfirmDel(p.id)} className="p-1.5 rounded-md hover:bg-red-500/5 transition" aria-label="Delete">
                    <Trash2 size={13} style={{ color: BRAND.error }} />
                  </button>
                </TD>
              </TR>
            ))}
          </DataTable>
          <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => load(prevUrl)} onNext={() => load(nextUrl)} count={items.length} />
        </motion.div>
      )}

      {confirmDel && (
        <ConfirmDialog message="Delete this plan?" onConfirm={() => doDelete(confirmDel)} onCancel={() => setConfirmDel(null)} confirmLabel="Delete" />
      )}
    </div>
  );
}
