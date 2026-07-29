"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Coins,
  Percent,
  Truck,
  Globe2,
  MapPin,
  Layers,
  Settings2,
  BellRing,
  RefreshCcw,
  Users2,
  Plus,
  Pencil,
  Trash2,
  Star,
} from "lucide-react";
import { BRAND } from "@holora/ui";
import { formatDate } from "@holora/utils";
import { motion } from "framer-motion";
import type { ApiClient } from "@holora/api-client";
import { createAdminApi, type AdminApi } from "@/lib/admin-api";
import {
  PageHeader,
  TabBar,
  DataTable,
  TR,
  TD,
  Modal,
  ConfirmDialog,
  EmptyState,
  StatusBadge,
  SimplePagination,
  PrimaryButton,
  GhostButton,
  FormField,
  inputStyle,
  fadeUp,
} from "@/components/shared";

interface ViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
}

type Tab =
  | "currencies"
  | "tax"
  | "shipping"
  | "regions"
  | "pincodes"
  | "variants"
  | "settings"
  | "notify"
  | "replacements"
  | "customers";

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: "currencies", label: "Currencies", icon: Coins },
  { key: "tax", label: "Tax Rates", icon: Percent },
  { key: "shipping", label: "Shipping", icon: Truck },
  { key: "regions", label: "Regions", icon: Globe2 },
  { key: "pincodes", label: "Pincodes", icon: MapPin },
  { key: "variants", label: "Variants", icon: Layers },
  { key: "settings", label: "Settings", icon: Settings2 },
  { key: "notify", label: "Back-in-stock", icon: BellRing },
  { key: "replacements", label: "Replacements", icon: RefreshCcw },
  { key: "customers", label: "Customers", icon: Users2 },
];

/* ── field/column specs ─────────────────────────────────────────────── */

type FieldType = "text" | "number" | "checkbox" | "select" | "json";
interface FieldSpec {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  step?: string;
  required?: boolean;
}
interface ColSpec {
  key: string;
  label: string;
  render?: (row: any) => React.ReactNode;
}

const bool = (v: any) => <StatusBadge status={v ? "active" : "inactive"} />;

export default function ShopConfigView({ api, showToast }: ViewProps) {
  const adminApi = useMemo(() => createAdminApi(api), [api]);
  const [tab, setTab] = useState<Tab>("currencies");

  return (
    <div className="space-y-4">
      <PageHeader
        title="Store Configuration"
        subtitle="Currencies, tax, shipping, regions, pincodes, variants and store settings."
      />
      <TabBar tabs={TABS} active={tab} onChange={setTab} />
      <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible">
        {tab === "currencies" && <CurrenciesTab adminApi={adminApi} showToast={showToast} />}
        {tab === "tax" && <TaxTab adminApi={adminApi} showToast={showToast} />}
        {tab === "shipping" && <ShippingTab adminApi={adminApi} showToast={showToast} />}
        {tab === "regions" && <RegionsTab adminApi={adminApi} showToast={showToast} />}
        {tab === "pincodes" && <PincodesTab adminApi={adminApi} showToast={showToast} />}
        {tab === "variants" && <VariantsTab adminApi={adminApi} showToast={showToast} />}
        {tab === "settings" && <SettingsTab adminApi={adminApi} showToast={showToast} />}
        {tab === "notify" && <NotifyTab adminApi={adminApi} showToast={showToast} />}
        {tab === "replacements" && <ReplacementsTab adminApi={adminApi} showToast={showToast} />}
        {tab === "customers" && <CustomersTab adminApi={adminApi} showToast={showToast} />}
      </motion.div>
    </div>
  );
}

interface TabProps {
  adminApi: AdminApi;
  showToast: (message: string, type: "success" | "error") => void;
}

/* ══════════════════ Generic CRUD table (raw-array resources) ══════════════════ */

function CrudTable({
  columns,
  fields,
  load,
  create,
  update,
  del,
  emptyIcon,
  emptyLabel,
  canCreate = true,
  canEdit = true,
  canDelete = true,
  extraActions,
  showToast,
}: {
  columns: ColSpec[];
  fields: FieldSpec[];
  load: () => Promise<any>;
  create?: (data: any) => Promise<any>;
  update?: (id: any, data: any) => Promise<any>;
  del?: (id: any) => Promise<any>;
  emptyIcon: any;
  emptyLabel: string;
  canCreate?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  extraActions?: React.ReactNode;
  showToast: (m: string, t: "success" | "error") => void;
}) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null); // row or {} for new
  const [confirmDel, setConfirmDel] = useState<any | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await load();
      setRows(Array.isArray(data) ? data : data?.results || []);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }, [load, showToast]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const cols = [...columns.map((c) => c.label), ...(canEdit || canDelete ? [""] : [])];

  return (
    <div className="space-y-3">
      {(canCreate || extraActions) && (
        <div className="flex flex-wrap justify-end gap-2">
          {extraActions}
          {canCreate && create && <PrimaryButton onClick={() => setEditing({})}>
            <Plus size={13} className="inline mr-1" /> New
          </PrimaryButton>}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState icon={emptyIcon} message={emptyLabel} />
      ) : (
        <DataTable cols={cols}>
          {rows.map((r) => (
            <TR key={r.id}>
              {columns.map((c) => (
                <TD key={c.key}>{c.render ? c.render(r) : String(r[c.key] ?? "—")}</TD>
              ))}
              {(canEdit || canDelete) && (
                <TD>
                  <div className="flex gap-2">
                    {canEdit && update && (
                      <button onClick={() => setEditing(r)} style={{ color: BRAND.info }} aria-label="Edit">
                        <Pencil size={14} />
                      </button>
                    )}
                    {canDelete && del && (
                      <button onClick={() => setConfirmDel(r)} style={{ color: BRAND.error }} aria-label="Delete">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </TD>
              )}
            </TR>
          ))}
        </DataTable>
      )}

      {editing && (
        <RecordForm
          fields={fields}
          initial={editing}
          isNew={!editing.id}
          onClose={() => setEditing(null)}
          onSubmit={async (payload) => {
            try {
              if (editing.id && update) await update(editing.id, payload);
              else if (create) await create(payload);
              showToast("Saved", "success");
              setEditing(null);
              refresh();
            } catch (err) {
              showToast(err instanceof Error ? err.message : "Save failed", "error");
            }
          }}
        />
      )}

      {confirmDel && del && (
        <ConfirmDialog
          message="Delete this record? This cannot be undone."
          confirmLabel="Delete"
          onCancel={() => setConfirmDel(null)}
          onConfirm={async () => {
            try {
              await del(confirmDel.id);
              showToast("Deleted", "success");
              setConfirmDel(null);
              refresh();
            } catch (err) {
              showToast(err instanceof Error ? err.message : "Delete failed", "error");
            }
          }}
        />
      )}
    </div>
  );
}

function RecordForm({
  fields,
  initial,
  isNew,
  onClose,
  onSubmit,
}: {
  fields: FieldSpec[];
  initial: any;
  isNew: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => void;
}) {
  const [form, setForm] = useState<Record<string, any>>(() => {
    const f: Record<string, any> = {};
    fields.forEach((fld) => {
      const v = initial[fld.key];
      f[fld.key] = fld.type === "json" && v != null ? JSON.stringify(v) : v ?? (fld.type === "checkbox" ? false : "");
    });
    return f;
  });
  const [err, setErr] = useState<string | null>(null);

  const submit = () => {
    const payload: Record<string, any> = {};
    for (const fld of fields) {
      const raw = form[fld.key];
      if (fld.type === "checkbox") payload[fld.key] = !!raw;
      else if (fld.type === "json") {
        if (raw === "" || raw == null) continue;
        try {
          payload[fld.key] = JSON.parse(raw);
        } catch {
          setErr(`"${fld.label}" must be valid JSON`);
          return;
        }
      } else if (raw === "" || raw == null) {
        if (fld.required) {
          setErr(`"${fld.label}" is required`);
          return;
        }
        continue;
      } else payload[fld.key] = raw;
    }
    setErr(null);
    onSubmit(payload);
  };

  return (
    <Modal wide title={isNew ? "New record" : "Edit record"} onClose={onClose}>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {fields.map((fld) => (
          <div key={fld.key} className={fld.type === "json" ? "sm:col-span-2" : ""}>
            <FormField label={`${fld.label}${fld.required ? " *" : ""}`}>
              {fld.type === "checkbox" ? (
                <label className="flex items-center gap-2 text-[12px]" style={{ color: BRAND.textMuted }}>
                  <input
                    type="checkbox"
                    checked={!!form[fld.key]}
                    onChange={(e) => setForm((s) => ({ ...s, [fld.key]: e.target.checked }))}
                  />
                  {form[fld.key] ? "Enabled" : "Disabled"}
                </label>
              ) : fld.type === "select" ? (
                <select
                  value={form[fld.key] ?? ""}
                  onChange={(e) => setForm((s) => ({ ...s, [fld.key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-[12px]"
                  style={inputStyle}
                >
                  <option value="">—</option>
                  {(fld.options || []).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : fld.type === "json" ? (
                <textarea
                  value={form[fld.key] ?? ""}
                  onChange={(e) => setForm((s) => ({ ...s, [fld.key]: e.target.value }))}
                  rows={2}
                  placeholder='e.g. ["US","GB"]'
                  className="w-full px-3 py-2 rounded-lg text-[12px] font-mono resize-none"
                  style={inputStyle}
                />
              ) : (
                <input
                  type={fld.type === "number" ? "number" : "text"}
                  step={fld.step}
                  value={form[fld.key] ?? ""}
                  onChange={(e) => setForm((s) => ({ ...s, [fld.key]: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg text-[12px]"
                  style={inputStyle}
                />
              )}
            </FormField>
          </div>
        ))}
      </div>
      {err && (
        <p className="text-[12px] mt-3" style={{ color: BRAND.error }}>
          {err}
        </p>
      )}
      <div className="flex justify-end gap-2 mt-4">
        <GhostButton onClick={onClose}>Cancel</GhostButton>
        <PrimaryButton onClick={submit}>Save</PrimaryButton>
      </div>
    </Modal>
  );
}

/* ══════════════════ Config tabs ══════════════════ */

function CurrenciesTab({ adminApi, showToast }: TabProps) {
  const c = adminApi.shop.currencies;
  const [busy, setBusy] = useState(false);
  return (
    <CrudTable
      showToast={showToast}
      emptyIcon={Coins}
      emptyLabel="No currencies configured."
      load={() => c.list()}
      create={(d) => c.create(d)}
      update={(id, d) => c.update(id, d)}
      del={(id) => c.delete(id)}
      extraActions={
        <GhostButton
          onClick={async () => {
            setBusy(true);
            try {
              await c.updateRates();
              showToast("Exchange rates refreshed", "success");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "Failed", "error");
            } finally {
              setBusy(false);
            }
          }}
        >
          <RefreshCcw size={12} className={`inline mr-1 ${busy ? "animate-spin" : ""}`} /> Update rates
        </GhostButton>
      }
      columns={[
        { key: "code", label: "Code" },
        { key: "symbol", label: "Symbol" },
        { key: "name", label: "Name" },
        { key: "rate_to_base", label: "Rate → base" },
        { key: "is_base", label: "Base", render: (r) => (r.is_base ? <Star size={13} style={{ color: BRAND.accent }} /> : "—") },
        { key: "is_active", label: "Active", render: (r) => bool(r.is_active) },
      ]}
      fields={[
        { key: "code", label: "Code (ISO)", type: "text", required: true },
        { key: "symbol", label: "Symbol", type: "text", required: true },
        { key: "name", label: "Name", type: "text", required: true },
        { key: "rate_to_base", label: "Rate to base", type: "number", step: "0.000001" },
        { key: "decimal_places", label: "Decimal places", type: "number" },
        { key: "thousand_separator", label: "Thousand separator", type: "text" },
        { key: "is_base", label: "Is base", type: "checkbox" },
        { key: "is_active", label: "Active", type: "checkbox" },
      ]}
    />
  );
}

function TaxTab({ adminApi, showToast }: TabProps) {
  const t = adminApi.shop.taxRates;
  return (
    <CrudTable
      showToast={showToast}
      emptyIcon={Percent}
      emptyLabel="No tax rates configured."
      load={() => t.list()}
      create={(d) => t.create(d)}
      update={(id, d) => t.update(id, d)}
      del={(id) => t.delete(id)}
      columns={[
        { key: "country_code", label: "Country" },
        { key: "rate_percent", label: "Rate %" },
        { key: "is_active", label: "Active", render: (r) => bool(r.is_active) },
      ]}
      fields={[
        { key: "country_code", label: "Country code (2)", type: "text", required: true },
        { key: "rate_percent", label: "Rate percent", type: "number", step: "0.01" },
        { key: "is_active", label: "Active", type: "checkbox" },
      ]}
    />
  );
}

function ShippingTab({ adminApi, showToast }: TabProps) {
  const s = adminApi.shop.shippingRules;
  return (
    <CrudTable
      showToast={showToast}
      emptyIcon={Truck}
      emptyLabel="No shipping rules configured."
      load={() => s.list()}
      create={(d) => s.create(d)}
      update={(id, d) => s.update(id, d)}
      del={(id) => s.delete(id)}
      columns={[
        { key: "zone_name", label: "Zone" },
        { key: "zone_type", label: "Type" },
        { key: "base_cost", label: "Base" },
        { key: "cost_per_kg", label: "Per kg" },
        { key: "is_active", label: "Active", render: (r) => bool(r.is_active) },
      ]}
      fields={[
        { key: "zone_name", label: "Zone name", type: "text", required: true },
        { key: "zone_type", label: "Zone type", type: "select", options: ["domestic", "regional", "international"] },
        { key: "countries", label: "Countries (JSON array)", type: "json" },
        { key: "region_tiers", label: "Region tiers (JSON array)", type: "json" },
        { key: "base_cost", label: "Base cost", type: "number", step: "0.01" },
        { key: "cost_per_kg", label: "Cost per kg", type: "number", step: "0.01" },
        { key: "free_shipping_threshold", label: "Free-ship threshold", type: "number", step: "0.01" },
        { key: "has_express", label: "Has express", type: "checkbox" },
        { key: "express_multiplier", label: "Express multiplier", type: "number", step: "0.01" },
        { key: "estimated_days_min", label: "Est. days min", type: "number" },
        { key: "estimated_days_max", label: "Est. days max", type: "number" },
        { key: "is_active", label: "Active", type: "checkbox" },
        { key: "sort_order", label: "Sort order", type: "number" },
      ]}
    />
  );
}

function RegionsTab({ adminApi, showToast }: TabProps) {
  const r = adminApi.shop.regions;
  return (
    <CrudTable
      showToast={showToast}
      emptyIcon={Globe2}
      emptyLabel="No region tiers configured."
      load={() => r.list()}
      create={(d) => r.create(d)}
      update={(id, d) => r.update(id, d)}
      del={(id) => r.delete(id)}
      extraActions={
        <GhostButton
          onClick={async () => {
            try {
              await r.createDefault();
              showToast("Default region tiers created", "success");
            } catch (err) {
              showToast(err instanceof Error ? err.message : "Failed", "error");
            }
          }}
        >
          Seed defaults
        </GhostButton>
      }
      columns={[
        { key: "code", label: "Code" },
        { key: "name", label: "Name" },
        { key: "price_multiplier", label: "×Price" },
        { key: "discount_percent", label: "Disc %" },
        { key: "is_active", label: "Active", render: (row) => bool(row.is_active) },
      ]}
      fields={[
        { key: "code", label: "Code", type: "select", options: ["TIER_1", "TIER_2", "TIER_3", "TIER_4", "TIER_5", "TIER_6"], required: true },
        { key: "name", label: "Name", type: "text", required: true },
        { key: "description", label: "Description", type: "text" },
        { key: "countries", label: "Countries (JSON array)", type: "json" },
        { key: "price_multiplier", label: "Price multiplier", type: "number", step: "0.01" },
        { key: "discount_percent", label: "Discount percent", type: "number", step: "0.01" },
        { key: "can_view_products", label: "Can view products", type: "checkbox" },
        { key: "can_purchase", label: "Can purchase", type: "checkbox" },
        { key: "block_vpn_users", label: "Block VPN users", type: "checkbox" },
        { key: "is_active", label: "Active", type: "checkbox" },
        { key: "sort_order", label: "Sort order", type: "number" },
      ]}
    />
  );
}

function PincodesTab({ adminApi, showToast }: TabProps) {
  const p = adminApi.shop.pincodes;
  return (
    <CrudTable
      showToast={showToast}
      emptyIcon={MapPin}
      emptyLabel="No serviceable pincodes."
      load={() => p.list()}
      create={(d) => p.create(d)}
      update={(id, d) => p.update(id, d)}
      del={(id) => p.delete(id)}
      columns={[
        { key: "pincode", label: "Pincode" },
        { key: "city", label: "City" },
        { key: "state", label: "State" },
        { key: "country", label: "Country" },
        { key: "is_active", label: "Active", render: (r) => bool(r.is_active) },
      ]}
      fields={[
        { key: "pincode", label: "Pincode", type: "text", required: true },
        { key: "city", label: "City", type: "text" },
        { key: "state", label: "State", type: "text" },
        { key: "country", label: "Country (2)", type: "text" },
        { key: "standard_days", label: "Standard days", type: "number" },
        { key: "express_days", label: "Express days", type: "number" },
        { key: "same_day_available", label: "Same-day available", type: "checkbox" },
        { key: "cod_available", label: "COD available", type: "checkbox" },
        { key: "standard_price", label: "Standard price", type: "number", step: "0.01" },
        { key: "express_price", label: "Express price", type: "number", step: "0.01" },
        { key: "same_day_price", label: "Same-day price", type: "number", step: "0.01" },
        { key: "is_active", label: "Active", type: "checkbox" },
      ]}
    />
  );
}

function VariantsTab({ adminApi, showToast }: TabProps) {
  const v = adminApi.shop.variants;
  return (
    <>
      <p className="text-[11px] mb-2" style={{ color: BRAND.textDim }}>
        Variants are created from a product; here you can edit stock, price and status of existing variants.
      </p>
      <CrudTable
        showToast={showToast}
        emptyIcon={Layers}
        emptyLabel="No product variants."
        canCreate={false}
        load={() => v.list()}
        update={(id, d) => v.update(id, d)}
        del={(id) => v.delete(id)}
        columns={[
          { key: "id", label: "ID" },
          { key: "sku", label: "SKU" },
          { key: "attributes", label: "Attributes", render: (r) => <span className="font-mono text-[11px]">{JSON.stringify(r.attributes)}</span> },
          { key: "price_modifier", label: "±Price" },
          { key: "stock", label: "Stock" },
          { key: "is_active", label: "Active", render: (r) => bool(r.is_active) },
        ]}
        fields={[
          { key: "sku", label: "SKU", type: "text" },
          { key: "barcode", label: "Barcode", type: "text" },
          { key: "attributes", label: "Attributes (JSON)", type: "json" },
          { key: "price_modifier", label: "Price modifier", type: "number", step: "0.01" },
          { key: "stock", label: "Stock", type: "number" },
          { key: "is_active", label: "Active", type: "checkbox" },
          { key: "sort_order", label: "Sort order", type: "number" },
        ]}
      />
    </>
  );
}

function SettingsTab({ adminApi, showToast }: TabProps) {
  const s = adminApi.shop.storeSettings;
  return (
    <>
      <p className="text-[11px] mb-2" style={{ color: BRAND.textDim }}>
        Store settings are key/value entries. Add new keys here (in-place editing is not supported by the API yet).
      </p>
      <CrudTable
        showToast={showToast}
        emptyIcon={Settings2}
        emptyLabel="No store settings."
        canEdit={false}
        canDelete={false}
        load={() => s.list()}
        create={(d) => s.create(d)}
        columns={[
          { key: "key", label: "Key" },
          { key: "value", label: "Value" },
          { key: "description", label: "Description" },
        ]}
        fields={[
          { key: "key", label: "Key", type: "text", required: true },
          { key: "value", label: "Value", type: "text" },
          { key: "description", label: "Description", type: "text" },
        ]}
      />
    </>
  );
}

/* ══════════════════ Paginated operational tabs ══════════════════ */

function usePaginated(loader: (params: Record<string, string>) => Promise<any>, showToast: (m: string, t: "success" | "error") => void, extraParams: Record<string, string> = {}) {
  const [rows, setRows] = useState<any[]>([]);
  const [meta, setMeta] = useState<{ count: number; next: string | null; previous: string | null }>({ count: 0, next: null, previous: null });
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const key = JSON.stringify(extraParams);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res: any = await loader({ page: String(page), ...extraParams });
      setRows(res?.results || []);
      setMeta({ count: res?.count ?? 0, next: res?.next ?? null, previous: res?.previous ?? null });
    } catch (err) {
      showToast(err instanceof Error ? err.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loader, page, key, showToast]);
  useEffect(() => {
    load();
  }, [load]);
  return { rows, meta, page, setPage, loading, reload: load };
}

function NotifyTab({ adminApi, showToast }: TabProps) {
  const { rows, meta, page, setPage, loading, reload } = usePaginated((p) => adminApi.shop.notify.list(p), showToast);
  if (loading) return <Loading />;
  if (rows.length === 0) return <EmptyState icon={BellRing} message="No back-in-stock subscriptions." />;
  return (
    <>
      <DataTable cols={["Product", "Email", "Notified", "Requested", ""]}>
        {rows.map((n) => (
          <TR key={n.id}>
            <TD>{n.product_name || `#${n.product}`}</TD>
            <TD>{n.user_email || n.email}</TD>
            <TD>{n.is_notified ? <StatusBadge status="completed" /> : <StatusBadge status="pending" />}</TD>
            <TD>{formatDate(n.created_at)}</TD>
            <TD>
              <div className="flex gap-2">
                {!n.is_notified && (
                  <button
                    onClick={async () => {
                      try {
                        await adminApi.shop.notify.resend(n.id);
                        showToast("Notification sent", "success");
                        reload();
                      } catch (err) {
                        showToast(err instanceof Error ? err.message : "Failed", "error");
                      }
                    }}
                    style={{ color: BRAND.info }}
                  >
                    <BellRing size={14} />
                  </button>
                )}
                <button
                  onClick={async () => {
                    try {
                      await adminApi.shop.notify.delete(n.id);
                      reload();
                    } catch (err) {
                      showToast(err instanceof Error ? err.message : "Failed", "error");
                    }
                  }}
                  style={{ color: BRAND.error }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </TD>
          </TR>
        ))}
      </DataTable>
      <SimplePagination count={meta.count} prevUrl={meta.previous} nextUrl={meta.next} onPrev={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => p + 1)} />
    </>
  );
}

const REPLACEMENT_STATUSES = ["pending", "approved", "dispatched", "delivered", "rejected"];

function ReplacementsTab({ adminApi, showToast }: TabProps) {
  const { rows, meta, page, setPage, loading, reload } = usePaginated((p) => adminApi.shop.replacements.list(p), showToast);
  const [edit, setEdit] = useState<any | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  if (loading) return <Loading />;
  return (
    <>
      {rows.length === 0 ? (
        <EmptyState icon={RefreshCcw} message="No replacement requests." />
      ) : (
        <>
          <DataTable cols={["#", "Return", "New order", "Status", "Tracking", ""]}>
            {rows.map((r) => (
              <TR key={r.id}>
                <TD>{r.id}</TD>
                <TD>{r.return_request_id ?? r.return_request}</TD>
                <TD>{r.new_order_id || "—"}</TD>
                <TD>
                  <StatusBadge status={r.status} />
                </TD>
                <TD>{r.tracking_number || "—"}</TD>
                <TD>
                  <button onClick={() => { setEdit(r); setForm({ status: r.status, new_order_id: r.new_order_id || "", tracking_number: r.tracking_number || "" }); }} style={{ color: BRAND.info }}>
                    <Pencil size={14} />
                  </button>
                </TD>
              </TR>
            ))}
          </DataTable>
          <SimplePagination count={meta.count} prevUrl={meta.previous} nextUrl={meta.next} onPrev={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => p + 1)} />
        </>
      )}

      {edit && (
        <Modal title={`Replacement #${edit.id}`} onClose={() => setEdit(null)}>
          <div className="space-y-3">
            <FormField label="Status">
              <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-[12px]" style={inputStyle}>
                {REPLACEMENT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </FormField>
            <FormField label="New order ID">
              <input value={form.new_order_id} onChange={(e) => setForm((f) => ({ ...f, new_order_id: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-[12px]" style={inputStyle} />
            </FormField>
            <FormField label="Tracking number">
              <input value={form.tracking_number} onChange={(e) => setForm((f) => ({ ...f, tracking_number: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-[12px]" style={inputStyle} />
            </FormField>
            <div className="flex justify-end gap-2">
              <GhostButton onClick={() => setEdit(null)}>Cancel</GhostButton>
              <PrimaryButton
                onClick={async () => {
                  try {
                    await adminApi.shop.replacements.update(edit.id, form);
                    showToast("Replacement updated", "success");
                    setEdit(null);
                    reload();
                  } catch (err) {
                    showToast(err instanceof Error ? err.message : "Update failed", "error");
                  }
                }}
              >
                Save
              </PrimaryButton>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}

function CustomersTab({ adminApi, showToast }: TabProps) {
  const [search, setSearch] = useState("");
  const { rows, meta, page, setPage, loading } = usePaginated((p) => adminApi.shop.customers.list(p), showToast, search ? { search } : {});
  return (
    <div className="space-y-3">
      <input
        value={search}
        onChange={(e) => { setPage(1); setSearch(e.target.value); }}
        placeholder="Search email / name…"
        className="px-2.5 py-1.5 rounded-lg text-[12px] w-64"
        style={inputStyle}
      />
      {loading ? (
        <Loading />
      ) : rows.length === 0 ? (
        <EmptyState icon={Users2} message="No customers found." />
      ) : (
        <>
          <DataTable cols={["Email", "Name", "Orders", "Spent", "Joined"]}>
            {rows.map((c) => (
              <TR key={c.id}>
                <TD>{c.email}</TD>
                <TD>{c.full_name || "—"}</TD>
                <TD>{c.total_orders}</TD>
                <TD>{c.total_spent}</TD>
                <TD>{formatDate(c.date_joined)}</TD>
              </TR>
            ))}
          </DataTable>
          <SimplePagination count={meta.count} prevUrl={meta.previous} nextUrl={meta.next} onPrev={() => setPage((p) => Math.max(1, p - 1))} onNext={() => setPage((p) => p + 1)} />
        </>
      )}
    </div>
  );
}

/* ── shared ── */

function Loading() {
  return (
    <div className="py-10 text-center text-[12px]" style={{ color: BRAND.textDim }}>
      Loading…
    </div>
  );
}
