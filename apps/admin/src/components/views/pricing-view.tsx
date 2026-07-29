"use client";

import { useState, useEffect, useCallback } from "react";
import { Gauge, Layers, Globe, Award, Tag, Coins, MapPin, Zap, Trophy, Settings } from "lucide-react";
import { motion } from "framer-motion";
import { BRAND, Spinner } from "@holora/ui";
import type { ApiClient } from "@holora/api-client";
import {
  PageHeader, TabBar, DataTable, TR, TD, Modal, ConfirmDialog,
  EmptyState, StatCard, StatusBadge, SimplePagination,
  PrimaryButton, GhostButton, FormField, inputStyle, fadeUp, cardStyle,
} from "@/components/shared";

interface ViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
}

type Tab = "engine" | "tiers" | "countries" | "founderPasses" | "campaigns" | "coinPackages" | "germany" | "launchDiscounts" | "founderCampaigns" | "coinConfig";

const TAB_ENDPOINTS: Record<string, string> = {
  engine: "/admin/pricing/engine-status/",
  tiers: "/admin/pricing/tiers/",
  countries: "/admin/pricing/countries/",
  founderPasses: "/admin/pricing/founder-passes/",
  campaigns: "/admin/pricing/campaigns/",
  coinPackages: "/admin/pricing/coin-packages/",
  germany: "/admin/pricing/germany/",
  launchDiscounts: "/admin/pricing/launch-discounts/",
  founderCampaigns: "/admin/pricing/founder-campaigns/",
  coinConfig: "/admin/pricing/coin-config/",
};

const SINGULAR: Record<string, boolean> = { engine: false, germany: true, coinConfig: true };

export default function PricingView({ api, showToast }: ViewProps) {
  const [tab, setTab] = useState<Tab>("engine");
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextUrl, setNextUrl] = useState<string | null>(null);
  const [prevUrl, setPrevUrl] = useState<string | null>(null);
  const [singleData, setSingleData] = useState<any>(null);
  const [editing, setEditing] = useState<any>(null);
  const [editForm, setEditForm] = useState<Record<string, any>>({});
  const [previewForm, setPreviewForm] = useState<Record<string, string>>({});
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ endpoint: string; id: string; label: string } | null>(null);

  /* ── Load data ──────────────────────────────────── */
  const loadData = useCallback(async (url?: string) => {
    setLoading(true);
    setPreviewResult(null);
    try {
      if (url) {
        const res = await api.get<any>(url);
        setItems(res?.results || res || []);
        setNextUrl(res?.next || null);
        setPrevUrl(res?.previous || null);
      } else if (SINGULAR[tab]) {
        const s = await api.get<any>(TAB_ENDPOINTS[tab]);
        setSingleData(s);
        setLoading(false);
        return;
      } else {
        const res = await api.get<any>(TAB_ENDPOINTS[tab]);
        setItems(res?.results || res || []);
        setNextUrl(res?.next || null);
        setPrevUrl(res?.previous || null);
      }
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load data", "error");
      setSingleData(null);
      setItems([]);
    }
    setLoading(false);
  }, [tab, api, showToast]);

  useEffect(() => { setSingleData(null); setItems([]); loadData(); }, [loadData]);

  /* ── CRUD actions ───────────────────────────────── */
  const handleDelete = async (endpoint: string, id: string, label: string) => {
    try { await api.del(`${endpoint}${id}/`); showToast(`${label} deleted`, "success"); setDeleteConfirm(null); loadData(); }
    catch (err) { showToast(err instanceof Error ? err.message : "Delete failed", "error"); }
  };

  const openEdit = async (endpoint: string, id: string, fields: string[], label: string) => {
    try {
      const data = await api.get<any>(`${endpoint}${id}/`);
      setEditing({ endpoint, id, fields, label });
      setEditForm(data || {});
    } catch (err) { showToast(err instanceof Error ? err.message : "Load failed", "error"); }
  };

  const saveEdit = async () => {
    try {
      await api.put(`${editing.endpoint}${editing.id}/`, editForm);
      showToast(`${editing.label} updated`, "success");
      setEditing(null);
      loadData();
    } catch (err) { showToast(err instanceof Error ? err.message : "Save failed", "error"); }
  };

  const saveSingular = async () => {
    try {
      const endpoint = tab === "germany" ? "/admin/pricing/germany/" : "/admin/pricing/coin-config/";
      await api.put(endpoint, editForm);
      showToast(`${editing.label} updated`, "success");
      setEditing(null);
      loadData();
    } catch (err) { showToast(err instanceof Error ? err.message : "Save failed", "error"); }
  };

  const handlePreview = async (endpoint: string, data: any) => {
    try { setPreviewResult(await api.post<any>(endpoint, data)); }
    catch (err) { showToast(err instanceof Error ? err.message : "Preview failed", "error"); }
  };

  /* ── KV grid for singular endpoints ─────────────── */
  const KVGrid = ({ data, onEdit }: { data: any; onEdit?: (data: any) => void }) => (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Object.entries(data).map(([key, value]) => (
          <div key={key} className="rounded-lg p-3" style={cardStyle}>
            <p className="text-[10px] uppercase tracking-wider font-medium mb-0.5" style={{ color: BRAND.textDim }}>{key.replace(/_/g, " ")}</p>
            <p className="text-[16px] font-bold" style={{ color: BRAND.textMain }}>
              {typeof value === "boolean" ? (value ? "Active" : "Inactive") : typeof value === "number" ? value.toLocaleString() : String(value ?? "-")}
            </p>
          </div>
        ))}
      </div>
      {onEdit && <div className="mt-3"><PrimaryButton onClick={() => onEdit(data)}>Edit</PrimaryButton></div>}
    </div>
  );

  /* ── Preview section ────────────────────────────── */
  const PreviewSection = ({ fields, endpoint, label }: { fields: string[]; endpoint: string; label: string }) => (
    <div className="mt-5 rounded-xl p-4" style={cardStyle}>
      <p className="text-[12px] font-semibold mb-3" style={{ color: BRAND.textMain }}>{label}</p>
      <div className="flex flex-wrap gap-3 items-end">
        {fields.map(f => (
          <FormField key={f} label={f.replace(/_/g, " ")}>
            <input className="rounded-lg px-3 py-1.5 text-[12px] outline-none w-40" style={inputStyle}
              value={previewForm[f] ?? ""} onChange={e => setPreviewForm(p => ({ ...p, [f]: e.target.value }))} />
          </FormField>
        ))}
        <PrimaryButton onClick={() => handlePreview(endpoint, previewForm)}>Preview</PrimaryButton>
      </div>
      {previewResult && (
        <pre className="mt-3 p-3 rounded-lg text-[11px] overflow-auto" style={{ ...inputStyle, color: BRAND.accent, maxHeight: 200 }}>
          {JSON.stringify(previewResult, null, 2)}
        </pre>
      )}
    </div>
  );

  /* ── Render per tab ─────────────────────────────── */
  const renderTab = () => {
    if (tab === "engine") return singleData ? (
      <>
        <KVGrid data={singleData} />
        <PreviewSection fields={["tier_code", "country_code", "plan_id"]} endpoint="/admin/pricing/preview/" label="Price Preview" />
      </>
    ) : null;

    if (tab === "tiers") return items.length === 0 ? <EmptyState icon={Layers} message="No tiers found" /> : (
      <>
        <DataTable cols={["Code", "Name", "Multiplier"]}>
          {items.map((r: any, i: number) => (
            <TR key={r.id || i}>
              <TD><span className="text-[12px] font-semibold" style={{ color: BRAND.accent }}>{r.code}</span></TD>
              <TD>{r.name}</TD>
              <TD>{r.multiplier}</TD>
            </TR>
          ))}
        </DataTable>
        <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl!)} onNext={() => loadData(nextUrl!)} count={items.length} />
      </>
    );

    if (tab === "countries") return items.length === 0 ? <EmptyState icon={Globe} message="No countries found" /> : (
      <>
        <DataTable cols={["Country", "Tier", "Currency", "Actions"]}>
          {items.map((r: any, i: number) => (
            <TR key={r.id || i}>
              <TD>{r.country}</TD>
              <TD>{r.tier}</TD>
              <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{r.currency}</span></TD>
              <TD><GhostButton onClick={() => openEdit("/admin/pricing/countries/", r.code || r.country_code, ["country", "tier", "currency"], "Country")}>Edit</GhostButton></TD>
            </TR>
          ))}
        </DataTable>
        <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl!)} onNext={() => loadData(nextUrl!)} count={items.length} />
      </>
    );

    if (tab === "founderPasses") return items.length === 0 ? <EmptyState icon={Award} message="No founder passes" /> : (
      <>
        <DataTable cols={["User", "Plan", "Status", "Actions"]}>
          {items.map((r: any, i: number) => (
            <TR key={r.id || i}>
              <TD>{r.user}</TD>
              <TD>{r.plan}</TD>
              <TD><StatusBadge status={r.status || "pending"} /></TD>
              <TD>
                <div className="flex gap-1">
                  <GhostButton onClick={() => openEdit("/admin/pricing/founder-passes/", r.id, ["user", "plan", "status"], "Founder Pass")}>Edit</GhostButton>
                  <GhostButton onClick={() => setDeleteConfirm({ endpoint: "/admin/pricing/founder-passes/", id: r.id, label: "Founder pass" })}><span style={{ color: BRAND.error }}>Delete</span></GhostButton>
                </div>
              </TD>
            </TR>
          ))}
        </DataTable>
        <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl!)} onNext={() => loadData(nextUrl!)} count={items.length} />
      </>
    );

    if (tab === "campaigns") return items.length === 0 ? <EmptyState icon={Tag} message="No campaigns found" /> : (
      <>
        <DataTable cols={["Name", "Discount", "Dates", "Active", "Actions"]}>
          {items.map((r: any, i: number) => (
            <TR key={r.id || i}>
              <TD>{r.name}</TD>
              <TD><span className="text-[12px] font-semibold" style={{ color: BRAND.accent }}>{r.discount}%</span></TD>
              <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{r.start_date} - {r.end_date}</span></TD>
              <TD><StatusBadge status={r.active ? "active" : "inactive"} /></TD>
              <TD>
                <div className="flex gap-1">
                  <GhostButton onClick={() => openEdit("/admin/pricing/campaigns/", r.id, ["name", "discount", "start_date", "end_date", "active"], "Campaign")}>Edit</GhostButton>
                  <GhostButton onClick={() => setDeleteConfirm({ endpoint: "/admin/pricing/campaigns/", id: r.id, label: "Campaign" })}><span style={{ color: BRAND.error }}>Delete</span></GhostButton>
                </div>
              </TD>
            </TR>
          ))}
        </DataTable>
        <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl!)} onNext={() => loadData(nextUrl!)} count={items.length} />
      </>
    );

    if (tab === "coinPackages") return items.length === 0 ? <EmptyState icon={Coins} message="No coin packages" /> : (
      <>
        <DataTable cols={["Name", "Coins", "Price"]}>
          {items.map((r: any, i: number) => (
            <TR key={r.id || i}>
              <TD>{r.name}</TD>
              <TD><span className="text-[12px] font-semibold" style={{ color: BRAND.accent }}>{r.coins}</span></TD>
              <TD>{r.price}</TD>
            </TR>
          ))}
        </DataTable>
        <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl!)} onNext={() => loadData(nextUrl!)} count={items.length} />
      </>
    );

    if (tab === "germany") return singleData ? (
      <>
        <KVGrid data={singleData} onEdit={(d) => { setEditing({ endpoint: null, id: null, fields: Object.keys(d), label: "Germany Pricing" }); setEditForm(d); }} />
        <PreviewSection fields={["plan_id", "price"]} endpoint="/admin/pricing/germany/preview/" label="Germany Price Preview" />
      </>
    ) : null;

    if (tab === "launchDiscounts") return items.length === 0 ? <EmptyState icon={Zap} message="No launch discounts" /> : (
      <>
        <DataTable cols={["ID", "Name", "Discount %", "Active", "Actions"]}>
          {items.map((r: any, i: number) => (
            <TR key={r.id || i}>
              <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{r.id}</span></TD>
              <TD>{r.name}</TD>
              <TD><span className="text-[12px] font-semibold" style={{ color: BRAND.accent }}>{r.discount_percent}</span></TD>
              <TD><StatusBadge status={r.active ? "active" : "inactive"} /></TD>
              <TD><GhostButton onClick={() => setDeleteConfirm({ endpoint: "/admin/pricing/launch-discounts/", id: r.id, label: "Launch discount" })}><span style={{ color: BRAND.error }}>Delete</span></GhostButton></TD>
            </TR>
          ))}
        </DataTable>
        <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl!)} onNext={() => loadData(nextUrl!)} count={items.length} />
      </>
    );

    if (tab === "founderCampaigns") return items.length === 0 ? <EmptyState icon={Trophy} message="No founder campaigns" /> : (
      <>
        <DataTable cols={["ID", "Name", "Discount", "Active", "Actions"]}>
          {items.map((r: any, i: number) => (
            <TR key={r.id || i}>
              <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{r.id}</span></TD>
              <TD>{r.name}</TD>
              <TD><span className="text-[12px] font-semibold" style={{ color: BRAND.accent }}>{r.discount}</span></TD>
              <TD><StatusBadge status={r.active ? "active" : "inactive"} /></TD>
              <TD><GhostButton onClick={() => setDeleteConfirm({ endpoint: "/admin/pricing/founder-campaigns/", id: r.id, label: "Founder campaign" })}><span style={{ color: BRAND.error }}>Delete</span></GhostButton></TD>
            </TR>
          ))}
        </DataTable>
        <SimplePagination prevUrl={prevUrl} nextUrl={nextUrl} onPrev={() => loadData(prevUrl!)} onNext={() => loadData(nextUrl!)} count={items.length} />
      </>
    );

    if (tab === "coinConfig") return singleData ? (
      <KVGrid data={singleData} onEdit={(d) => { setEditing({ endpoint: null, id: null, fields: Object.keys(d), label: "Coin Config" }); setEditForm(d); }} />
    ) : null;

    return null;
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Pricing Engine" subtitle="Tiers, countries, campaigns, coin packages and pricing configuration" />

      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
        <TabBar<Tab>
          tabs={[
            { key: "engine", label: "Engine Status", icon: Gauge },
            { key: "tiers", label: "Tiers", icon: Layers },
            { key: "countries", label: "Countries", icon: Globe },
            { key: "founderPasses", label: "Founder Passes", icon: Award },
            { key: "campaigns", label: "Campaigns", icon: Tag },
            { key: "coinPackages", label: "Coin Packages", icon: Coins },
            { key: "germany", label: "Germany", icon: MapPin },
            { key: "launchDiscounts", label: "Launch Discounts", icon: Zap },
            { key: "founderCampaigns", label: "Founder Campaigns", icon: Trophy },
            { key: "coinConfig", label: "Coin Config", icon: Settings },
          ]}
          active={tab}
          onChange={setTab}
        />
      </motion.div>

      {loading ? <div className="flex justify-center py-10"><Spinner /></div> : (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          {renderTab()}
        </motion.div>
      )}

      {/* ── Edit Modal ────────────────────────────── */}
      {editing && (
        <Modal title={`Edit ${editing.label}`} onClose={() => setEditing(null)}>
          <div className="space-y-3">
            {(editing.fields || Object.keys(editForm)).map((k: string) => (
              <FormField key={k} label={k.replace(/_/g, " ")}>
                <input className="w-full rounded-lg px-3 py-1.5 text-[12px] outline-none" style={inputStyle}
                  value={editForm[k] ?? ""} onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))} />
              </FormField>
            ))}
            <div className="flex justify-end gap-2 pt-2">
              <GhostButton onClick={() => setEditing(null)}>Cancel</GhostButton>
              <PrimaryButton onClick={editing.endpoint ? saveEdit : saveSingular}>Save</PrimaryButton>
            </div>
          </div>
        </Modal>
      )}

      {/* ── Delete Confirm ────────────────────────── */}
      {deleteConfirm && (
        <ConfirmDialog
          message={`Delete this ${deleteConfirm.label.toLowerCase()}?`}
          confirmLabel="Delete"
          onConfirm={() => handleDelete(deleteConfirm.endpoint, deleteConfirm.id, deleteConfirm.label)}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
}
