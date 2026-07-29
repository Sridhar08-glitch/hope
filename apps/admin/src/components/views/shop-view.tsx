"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Plus,
  Edit,
  Trash2,
  Check,
  ShoppingCart,
  Copy,
  XCircle,
  RotateCcw,
  Download,
  RefreshCw,
  Package,
} from "lucide-react";
import { BRAND, Spinner } from "@holora/ui";
import { motion } from "framer-motion";
import type { ApiClient } from "@holora/api-client";
import {
  PageHeader,
  TabBar,
  DataTable,
  TR,
  TD,
  Modal,
  ConfirmDialog,
  EmptyState,
  StatCard,
  StatusBadge,
  SimplePagination,
  PrimaryButton,
  GhostButton,
  FormField,
  inputStyle,
  fadeUp,
} from "@/components/shared";

/* ── Types ─────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyItem = Record<string, any>;

interface PaginatedRes<T> {
  results?: T[];
  next?: string | null;
  previous?: string | null;
}

interface ShopViewProps {
  api: ApiClient;
  showToast: (message: string, type: "success" | "error") => void;
}

type Tab = "products" | "orders" | "reviews" | "coupons" | "returns";

/* ── Main View ─────────────────────────────────────── */

export default function ShopView({ api, showToast }: ShopViewProps) {
  const [tab, setTab] = useState<Tab>("products");

  /* ── Products state ── */
  const [products, setProducts] = useState<AnyItem[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsNext, setProductsNext] = useState<string | null>(null);
  const [productsPrev, setProductsPrev] = useState<string | null>(null);
  const [editProduct, setEditProduct] = useState<AnyItem | null>(null);
  const [confirmDelProduct, setConfirmDelProduct] = useState<string | null>(null);
  const [productForm, setProductForm] = useState({ name: "", description: "", category: "", price: "", stock_quantity: "", sku: "", is_active: true });

  /* ── Orders state ── */
  const [orders, setOrders] = useState<AnyItem[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersNext, setOrdersNext] = useState<string | null>(null);
  const [ordersPrev, setOrdersPrev] = useState<string | null>(null);
  const [editOrder, setEditOrder] = useState<AnyItem | null>(null);
  const [orderStatus, setOrderStatus] = useState("");

  /* ── Reviews state ── */
  const [reviews, setReviews] = useState<AnyItem[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsNext, setReviewsNext] = useState<string | null>(null);
  const [reviewsPrev, setReviewsPrev] = useState<string | null>(null);
  const [confirmDelReview, setConfirmDelReview] = useState<string | null>(null);

  /* ── Coupons state ── */
  const [coupons, setCoupons] = useState<AnyItem[]>([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [confirmDelCoupon, setConfirmDelCoupon] = useState<string | null>(null);
  const [editCoupon, setEditCoupon] = useState<AnyItem | null>(null);
  const [couponForm, setCouponForm] = useState({ code: "", discount_type: "percent", discount_value: "", min_order_amount: "", max_uses: "", is_active: true });

  /* ── Returns state ── */
  const [returns, setReturns] = useState<AnyItem[]>([]);
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [confirmDelReturn, setConfirmDelReturn] = useState<string | null>(null);
  const [editReturn, setEditReturn] = useState<AnyItem | null>(null);
  const [returnStatus, setReturnStatus] = useState("");

  /* ── Dashboard state ── */
  const [dashData, setDashData] = useState<AnyItem | null>(null);
  const [dashLoading, setDashLoading] = useState(true);

  /* ── Generic loader ── */
  function mkLoader(path: string, setter: (d: AnyItem[]) => void, loadingSetter: (l: boolean) => void, nextSetter?: (u: string | null) => void, prevSetter?: (u: string | null) => void) {
    return async (url: string | null = null) => {
      loadingSetter(true);
      try {
        const res: PaginatedRes<AnyItem> = url ? await api.get(url) : await api.get(path);
        setter(res?.results || (Array.isArray(res) ? (res as AnyItem[]) : []));
        nextSetter?.(res?.next || null);
        prevSetter?.(res?.previous || null);
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : "Load failed", "error");
      } finally {
        loadingSetter(false);
      }
    };
  }

  const loadDash = useCallback(async () => { setDashLoading(true); try { setDashData(await api.get("/admin/shop/dashboard/")); } catch (err: unknown) { showToast(err instanceof Error ? err.message : "Load failed", "error"); } finally { setDashLoading(false); } }, [api, showToast]);
  const loadProducts = useCallback(mkLoader("/admin/shop/products/", setProducts, setProductsLoading, setProductsNext, setProductsPrev), [api, showToast]);
  const loadOrders = useCallback(mkLoader("/admin/shop/orders/", setOrders, setOrdersLoading, setOrdersNext, setOrdersPrev), [api, showToast]);
  const loadReviews = useCallback(mkLoader("/admin/shop/reviews/", setReviews, setReviewsLoading, setReviewsNext, setReviewsPrev), [api, showToast]);
  const loadCoupons = useCallback(mkLoader("/admin/shop/coupons/", setCoupons, setCouponsLoading), [api, showToast]);
  const loadReturns = useCallback(mkLoader("/admin/shop/returns/", setReturns, setReturnsLoading), [api, showToast]);

  useEffect(() => { loadDash(); }, [loadDash]);
  useEffect(() => { if (tab === "products") loadProducts(); }, [tab, loadProducts]);
  useEffect(() => { if (tab === "orders") loadOrders(); }, [tab, loadOrders]);
  useEffect(() => { if (tab === "reviews") loadReviews(); }, [tab, loadReviews]);
  useEffect(() => { if (tab === "coupons") loadCoupons(); }, [tab, loadCoupons]);
  useEffect(() => { if (tab === "returns") loadReturns(); }, [tab, loadReturns]);

  /* ── Actions ── */
  async function saveProduct() {
    try {
      const data = { ...productForm, price: parseFloat(productForm.price), stock_quantity: parseInt(productForm.stock_quantity, 10) };
      if (editProduct?.id) { await api.put(`/admin/shop/products/${editProduct.id}/`, data); showToast("Product updated", "success"); }
      else { await api.post("/admin/shop/products/", data); showToast("Product created", "success"); }
      setEditProduct(null);
      setProductForm({ name: "", description: "", category: "", price: "", stock_quantity: "", sku: "", is_active: true });
      loadProducts();
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : "Save failed", "error"); }
  }

  async function deleteProduct(id: string) {
    try { await api.del(`/admin/shop/products/${id}/`); showToast("Deleted", "success"); setConfirmDelProduct(null); loadProducts(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Delete failed", "error"); }
  }

  async function duplicateProduct(id: string) {
    try { await api.post(`/admin/shop/products/${id}/duplicate/`); showToast("Product duplicated", "success"); loadProducts(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Duplicate failed", "error"); }
  }

  async function updateOrderStatus(id: string, status: string) {
    try { await api.put(`/admin/shop/orders/${id}/`, { status }); showToast("Status updated", "success"); setEditOrder(null); loadOrders(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Update failed", "error"); }
  }

  async function cancelOrder(id: string) {
    try { await api.post(`/admin/shop/orders/${id}/cancel/`); showToast("Order cancelled", "success"); loadOrders(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Cancel failed", "error"); }
  }

  async function refundOrder(id: string) {
    try { await api.post(`/admin/shop/orders/${id}/refund/`); showToast("Order refunded", "success"); loadOrders(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Refund failed", "error"); }
  }

  async function approveReview(id: string) {
    try { await api.put(`/admin/shop/reviews/${id}/`, { is_approved: true }); showToast("Approved", "success"); loadReviews(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Approve failed", "error"); }
  }

  async function deleteReview(id: string) {
    try { await api.del(`/admin/shop/reviews/${id}/`); showToast("Deleted", "success"); setConfirmDelReview(null); loadReviews(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Delete failed", "error"); }
  }

  async function saveCoupon() {
    try {
      const data = { ...couponForm, discount_value: parseFloat(couponForm.discount_value) || 0, min_order_amount: parseFloat(couponForm.min_order_amount) || 0, max_uses: parseInt(couponForm.max_uses, 10) || 0 };
      await api.post("/admin/shop/coupons/", data);
      showToast("Coupon created", "success");
      setEditCoupon(null);
      setCouponForm({ code: "", discount_type: "percent", discount_value: "", min_order_amount: "", max_uses: "", is_active: true });
      loadCoupons();
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : "Save failed", "error"); }
  }

  async function deleteCoupon(id: string) {
    try { await api.del(`/admin/shop/coupons/${id}/`); showToast("Deleted", "success"); setConfirmDelCoupon(null); loadCoupons(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Delete failed", "error"); }
  }

  async function updateReturn(id: string, status: string) {
    try { await api.put(`/admin/shop/returns/${id}/`, { status }); showToast("Return updated", "success"); setEditReturn(null); loadReturns(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Update failed", "error"); }
  }

  async function deleteReturn(id: string) {
    try { await api.del(`/admin/shop/returns/${id}/`); showToast("Deleted", "success"); setConfirmDelReturn(null); loadReturns(); }
    catch (err: unknown) { showToast(err instanceof Error ? err.message : "Delete failed", "error"); }
  }

  async function exportData(type: string) {
    try {
      const res = await api.get<{ url?: string; download_url?: string }>(`/admin/shop/exports/${type}/`);
      const url = res?.url || res?.download_url;
      if (url) window.open(url, "_blank"); else showToast("Export started", "success");
    } catch (err: unknown) { showToast(err instanceof Error ? err.message : "Export failed", "error"); }
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "products", label: "Products" },
    { key: "orders", label: "Orders" },
    { key: "reviews", label: "Reviews" },
    { key: "coupons", label: "Coupons" },
    { key: "returns", label: "Returns" },
  ];

  return (
    <div className="space-y-5">
      <PageHeader title="Shop & Orders" subtitle="Manage products, orders, reviews, coupons, and returns">
        {tab === "products" && (
          <>
            <PrimaryButton onClick={() => { setEditProduct({}); setProductForm({ name: "", description: "", category: "", price: "", stock_quantity: "", sku: "", is_active: true }); }}>
              <Plus size={13} className="mr-1 inline" />New Product
            </PrimaryButton>
            <GhostButton onClick={() => exportData("products")}><Download size={13} className="mr-1 inline" />Export</GhostButton>
          </>
        )}
        {tab === "orders" && <GhostButton onClick={() => exportData("orders")}><Download size={13} className="mr-1 inline" />Export</GhostButton>}
        {tab === "coupons" && (
          <PrimaryButton onClick={() => { setEditCoupon({}); setCouponForm({ code: "", discount_type: "percent", discount_value: "", min_order_amount: "", max_uses: "", is_active: true }); }}>
            <Plus size={13} className="mr-1 inline" />New Coupon
          </PrimaryButton>
        )}
      </PageHeader>

      {/* Dashboard stats */}
      {dashLoading ? <Spinner /> : dashData && (
        <motion.div custom={1} variants={fadeUp} initial="hidden" animate="visible" className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard label="Total Products" value={dashData.total_products ?? 0} />
          <StatCard label="Total Orders" value={dashData.total_orders ?? 0} />
          <StatCard label="Pending Orders" value={dashData.pending_orders ?? 0} color={BRAND.warning} />
          <StatCard label="Revenue" value={dashData.total_revenue ? `$${dashData.total_revenue}` : "--"} color={BRAND.success} />
        </motion.div>
      )}

      <TabBar tabs={tabs} active={tab} onChange={setTab} />

      {/* ── Products ── */}
      {tab === "products" && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          {productsLoading ? <Spinner /> : products.length === 0 ? <EmptyState icon={Package} message="No products yet" /> : (
            <>
              <DataTable cols={["Name", "Category", "Price", "Stock", "Active", "Actions"]}>
                {products.map(p => (
                  <TR key={p.id}>
                    <TD><span className="text-[12px] font-medium" style={{ color: BRAND.textMain }}>{p.name}</span></TD>
                    <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{p.category || "\u2014"}</span></TD>
                    <TD><span className="text-[12px]">{p.price}</span></TD>
                    <TD><span className="text-[12px]">{p.stock_quantity}</span></TD>
                    <TD><StatusBadge status={p.is_active ? "active" : "inactive"} /></TD>
                    <TD>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditProduct(p); setProductForm({ name: p.name, description: p.description || "", category: p.category || "", price: p.price, stock_quantity: p.stock_quantity, sku: p.sku || "", is_active: p.is_active }); }} className="p-1 rounded hover:bg-white/5 transition"><Edit size={13} style={{ color: BRAND.textMuted }} /></button>
                        <button onClick={() => duplicateProduct(p.id)} className="p-1 rounded hover:bg-white/5 transition"><Copy size={13} style={{ color: BRAND.textMuted }} /></button>
                        <button onClick={() => setConfirmDelProduct(p.id)} className="p-1 rounded hover:bg-white/5 transition"><Trash2 size={13} style={{ color: BRAND.error }} /></button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </DataTable>
              <SimplePagination prevUrl={productsPrev} nextUrl={productsNext} onPrev={() => loadProducts(productsPrev)} onNext={() => loadProducts(productsNext)} count={products.length} />
            </>
          )}
        </motion.div>
      )}

      {/* ── Orders ── */}
      {tab === "orders" && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          {ordersLoading ? <Spinner /> : orders.length === 0 ? <EmptyState icon={ShoppingCart} message="No orders found" /> : (
            <>
              <DataTable cols={["Order #", "User", "Total", "Status", "Payment", "Date", "Actions"]}>
                {orders.map(o => (
                  <TR key={o.id}>
                    <TD><span className="text-[11px] font-mono">{o.order_number}</span></TD>
                    <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{o.user_email || o.user || "\u2014"}</span></TD>
                    <TD><span className="text-[12px]">{o.total_amount ? `\u20ac${o.total_amount}` : "\u2014"}</span></TD>
                    <TD><StatusBadge status={o.status} /></TD>
                    <TD><StatusBadge status={o.payment_status === "paid" ? "completed" : "pending"} /></TD>
                    <TD><span className="text-[10px]" style={{ color: BRAND.textDim }}>{o.created_at ? new Date(o.created_at).toLocaleDateString() : "\u2014"}</span></TD>
                    <TD>
                      <div className="flex gap-1">
                        <button onClick={() => { setEditOrder(o); setOrderStatus(o.status); }} className="p-1 rounded hover:bg-white/5 transition"><Edit size={13} style={{ color: BRAND.textMuted }} /></button>
                        {o.status !== "cancelled" && <button onClick={() => cancelOrder(o.id)} className="p-1 rounded hover:bg-white/5 transition"><XCircle size={13} style={{ color: BRAND.error }} /></button>}
                        {o.status !== "refunded" && <button onClick={() => refundOrder(o.id)} className="p-1 rounded hover:bg-white/5 transition"><RotateCcw size={13} style={{ color: BRAND.info }} /></button>}
                      </div>
                    </TD>
                  </TR>
                ))}
              </DataTable>
              <SimplePagination prevUrl={ordersPrev} nextUrl={ordersNext} onPrev={() => loadOrders(ordersPrev)} onNext={() => loadOrders(ordersNext)} count={orders.length} />
            </>
          )}
        </motion.div>
      )}

      {/* ── Reviews ── */}
      {tab === "reviews" && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          {reviewsLoading ? <Spinner /> : reviews.length === 0 ? <EmptyState icon={ShoppingCart} message="No reviews found" /> : (
            <>
              <DataTable cols={["Product", "User", "Rating", "Text", "Approved", "Actions"]}>
                {reviews.map(r => (
                  <TR key={r.id}>
                    <TD><span className="text-[12px]">{r.product_name || r.product || "\u2014"}</span></TD>
                    <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{r.user_email || r.user || "\u2014"}</span></TD>
                    <TD><span className="text-[12px]" style={{ color: BRAND.warning }}>{r.rating} &#9733;</span></TD>
                    <TD><span className="text-[11px] max-w-[180px] truncate block" style={{ color: BRAND.textDim }}>{r.review_text || r.text || "\u2014"}</span></TD>
                    <TD><StatusBadge status={r.is_approved ? "approved" : "pending"} /></TD>
                    <TD>
                      <div className="flex gap-1">
                        {!r.is_approved && <button onClick={() => approveReview(r.id)} className="p-1 rounded hover:bg-white/5 transition"><Check size={13} style={{ color: BRAND.success }} /></button>}
                        <button onClick={() => setConfirmDelReview(r.id)} className="p-1 rounded hover:bg-white/5 transition"><Trash2 size={13} style={{ color: BRAND.error }} /></button>
                      </div>
                    </TD>
                  </TR>
                ))}
              </DataTable>
              <SimplePagination prevUrl={reviewsPrev} nextUrl={reviewsNext} onPrev={() => loadReviews(reviewsPrev)} onNext={() => loadReviews(reviewsNext)} count={reviews.length} />
            </>
          )}
        </motion.div>
      )}

      {/* ── Coupons ── */}
      {tab === "coupons" && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          {couponsLoading ? <Spinner /> : coupons.length === 0 ? <EmptyState icon={ShoppingCart} message="No coupons yet" /> : (
            <DataTable cols={["Code", "Type", "Value", "Min Order", "Max Uses", "Uses", "Active", "Actions"]}>
              {coupons.map(c => (
                <TR key={c.id}>
                  <TD><span className="text-[11px] font-mono">{c.code}</span></TD>
                  <TD><span className="text-[11px]">{c.discount_type || "\u2014"}</span></TD>
                  <TD><span className="text-[12px]">{c.discount_value}</span></TD>
                  <TD><span className="text-[11px]">{c.min_order_amount ? `\u20ac${c.min_order_amount}` : "\u2014"}</span></TD>
                  <TD><span className="text-[11px]">{c.max_uses ?? "\u2014"}</span></TD>
                  <TD><span className="text-[11px]">{c.times_used ?? c.uses ?? "\u2014"}</span></TD>
                  <TD><StatusBadge status={c.is_active ? "active" : "inactive"} /></TD>
                  <TD><button onClick={() => setConfirmDelCoupon(c.id)} className="p-1 rounded hover:bg-white/5 transition"><Trash2 size={13} style={{ color: BRAND.error }} /></button></TD>
                </TR>
              ))}
            </DataTable>
          )}
        </motion.div>
      )}

      {/* ── Returns ── */}
      {tab === "returns" && (
        <motion.div custom={2} variants={fadeUp} initial="hidden" animate="visible">
          {returnsLoading ? <Spinner /> : returns.length === 0 ? <EmptyState icon={RotateCcw} message="No returns found" /> : (
            <DataTable cols={["Order #", "User", "Reason", "Status", "Date", "Actions"]}>
              {returns.map(r => (
                <TR key={r.id}>
                  <TD><span className="text-[11px] font-mono">{r.order_number || r.order || "\u2014"}</span></TD>
                  <TD><span className="text-[11px]" style={{ color: BRAND.textDim }}>{r.user_email || r.user || "\u2014"}</span></TD>
                  <TD><span className="text-[11px] max-w-[180px] truncate block" style={{ color: BRAND.textDim }}>{r.reason || "\u2014"}</span></TD>
                  <TD><StatusBadge status={r.status || "pending"} /></TD>
                  <TD><span className="text-[10px]" style={{ color: BRAND.textDim }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "\u2014"}</span></TD>
                  <TD>
                    <div className="flex gap-1">
                      <button onClick={() => { setEditReturn(r); setReturnStatus(r.status || ""); }} className="p-1 rounded hover:bg-white/5 transition"><Edit size={13} style={{ color: BRAND.textMuted }} /></button>
                      <button onClick={() => setConfirmDelReturn(r.id)} className="p-1 rounded hover:bg-white/5 transition"><Trash2 size={13} style={{ color: BRAND.error }} /></button>
                    </div>
                  </TD>
                </TR>
              ))}
            </DataTable>
          )}
        </motion.div>
      )}

      {/* ── Modals ── */}

      {editProduct !== null && (
        <Modal title={editProduct.id ? "Edit Product" : "New Product"} onClose={() => setEditProduct(null)}>
          <div className="space-y-3">
            <FormField label="Name"><input className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={inputStyle} value={productForm.name} onChange={e => setProductForm(f => ({ ...f, name: e.target.value }))} /></FormField>
            <FormField label="Description"><input className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={inputStyle} value={productForm.description} onChange={e => setProductForm(f => ({ ...f, description: e.target.value }))} /></FormField>
            <FormField label="Category"><input className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={inputStyle} value={productForm.category} onChange={e => setProductForm(f => ({ ...f, category: e.target.value }))} /></FormField>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Price"><input className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={inputStyle} value={productForm.price} onChange={e => setProductForm(f => ({ ...f, price: e.target.value }))} /></FormField>
              <FormField label="Stock Quantity"><input className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={inputStyle} value={productForm.stock_quantity} onChange={e => setProductForm(f => ({ ...f, stock_quantity: e.target.value }))} /></FormField>
            </div>
            <FormField label="SKU"><input className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={inputStyle} value={productForm.sku} onChange={e => setProductForm(f => ({ ...f, sku: e.target.value }))} /></FormField>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={productForm.is_active} onChange={e => setProductForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-purple-500" />
              <span className="text-[11px]" style={{ color: BRAND.textDim }}>Active</span>
            </div>
            <PrimaryButton onClick={saveProduct}>{editProduct.id ? "Update" : "Create"}</PrimaryButton>
          </div>
        </Modal>
      )}

      {editOrder && (
        <Modal title={`Update Order #${editOrder.order_number}`} onClose={() => setEditOrder(null)}>
          <div className="space-y-3">
            <FormField label="Status">
              <select value={orderStatus} onChange={e => setOrderStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={inputStyle}>
                {["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
            <PrimaryButton onClick={() => updateOrderStatus(editOrder.id, orderStatus)}>Update Status</PrimaryButton>
          </div>
        </Modal>
      )}

      {editCoupon !== null && (
        <Modal title="New Coupon" onClose={() => setEditCoupon(null)}>
          <div className="space-y-3">
            <FormField label="Code"><input className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={inputStyle} value={couponForm.code} onChange={e => setCouponForm(f => ({ ...f, code: e.target.value }))} /></FormField>
            <FormField label="Discount Type">
              <select value={couponForm.discount_type} onChange={e => setCouponForm(f => ({ ...f, discount_type: e.target.value }))} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={inputStyle}>
                <option value="percent">Percent</option>
                <option value="fixed">Fixed</option>
              </select>
            </FormField>
            <FormField label="Discount Value"><input className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={inputStyle} value={couponForm.discount_value} onChange={e => setCouponForm(f => ({ ...f, discount_value: e.target.value }))} /></FormField>
            <FormField label="Min Order Amount"><input className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={inputStyle} value={couponForm.min_order_amount} onChange={e => setCouponForm(f => ({ ...f, min_order_amount: e.target.value }))} /></FormField>
            <FormField label="Max Uses"><input className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={inputStyle} value={couponForm.max_uses} onChange={e => setCouponForm(f => ({ ...f, max_uses: e.target.value }))} /></FormField>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={couponForm.is_active} onChange={e => setCouponForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-purple-500" />
              <span className="text-[11px]" style={{ color: BRAND.textDim }}>Active</span>
            </div>
            <PrimaryButton onClick={saveCoupon}>Create</PrimaryButton>
          </div>
        </Modal>
      )}

      {editReturn !== null && (
        <Modal title="Update Return" onClose={() => setEditReturn(null)}>
          <div className="space-y-3">
            <FormField label="Status">
              <select value={returnStatus} onChange={e => setReturnStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg text-[12px] outline-none" style={inputStyle}>
                {["pending", "approved", "rejected", "completed"].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </FormField>
            <PrimaryButton onClick={() => editReturn && updateReturn(editReturn.id, returnStatus)}>Update Status</PrimaryButton>
          </div>
        </Modal>
      )}

      {confirmDelProduct && <ConfirmDialog message="Delete this product?" onConfirm={() => deleteProduct(confirmDelProduct)} onCancel={() => setConfirmDelProduct(null)} />}
      {confirmDelReview && <ConfirmDialog message="Delete this review?" onConfirm={() => deleteReview(confirmDelReview)} onCancel={() => setConfirmDelReview(null)} />}
      {confirmDelCoupon && <ConfirmDialog message="Delete this coupon?" onConfirm={() => deleteCoupon(confirmDelCoupon)} onCancel={() => setConfirmDelCoupon(null)} />}
      {confirmDelReturn && <ConfirmDialog message="Delete this return?" onConfirm={() => deleteReturn(confirmDelReturn)} onCancel={() => setConfirmDelReturn(null)} />}
    </div>
  );
}
