import { useState, useEffect, useCallback } from "react";
import { Plus, Edit, Trash2, Check, ShoppingCart, Layers, Clock, Coins, Copy, XCircle, RotateCcw, Download, RefreshCw, Settings, Globe, Truck, Percent, Tag, Users, Package, ArrowLeftRight } from "lucide-react";
import BRAND from "../../constants/brand";
import { LoadingSpinner, TableWrap, TR, TD, Badge, Btn, StatCard, Pagination, Modal, ConfirmModal, InputField } from "../../components/ui";
import adminApi from "../../services/adminApi";

function ShopView({ token, showToast }) {
  const [tab, setTab] = useState("dashboard");
  const [dashData, setDashData] = useState(null);
  const [dashLoading, setDashLoading] = useState(true);

  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productsNext, setProductsNext] = useState(null);
  const [productsPrev, setProductsPrev] = useState(null);
  const [editProduct, setEditProduct] = useState(null);
  const [confirmDelProduct, setConfirmDelProduct] = useState(null);
  const [productForm, setProductForm] = useState({ name: "", description: "", category: "", price: "", stock_quantity: "", sku: "", is_active: true });

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ordersNext, setOrdersNext] = useState(null);
  const [ordersPrev, setOrdersPrev] = useState(null);
  const [editOrder, setEditOrder] = useState(null);
  const [orderStatus, setOrderStatus] = useState("");

  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsNext, setReviewsNext] = useState(null);
  const [reviewsPrev, setReviewsPrev] = useState(null);
  const [confirmDelReview, setConfirmDelReview] = useState(null);

  const [carts, setCarts] = useState([]);
  const [cartsLoading, setCartsLoading] = useState(false);
  const [cartsNext, setCartsNext] = useState(null);
  const [cartsPrev, setCartsPrev] = useState(null);

  const [coins, setCoins] = useState([]);
  const [coinsLoading, setCoinsLoading] = useState(false);
  const [coinsNext, setCoinsNext] = useState(null);
  const [coinsPrev, setCoinsPrev] = useState(null);

  const [wishlists, setWishlists] = useState([]);
  const [wishlistsLoading, setWishlistsLoading] = useState(false);
  const [wishlistsNext, setWishlistsNext] = useState(null);
  const [wishlistsPrev, setWishlistsPrev] = useState(null);

  const [cartItems, setCartItems] = useState([]);
  const [cartItemsLoading, setCartItemsLoading] = useState(false);
  const [cartItemsNext, setCartItemsNext] = useState(null);
  const [cartItemsPrev, setCartItemsPrev] = useState(null);

  const [orderItems, setOrderItems] = useState([]);
  const [orderItemsLoading, setOrderItemsLoading] = useState(false);
  const [orderItemsNext, setOrderItemsNext] = useState(null);
  const [orderItemsPrev, setOrderItemsPrev] = useState(null);

  const [variants, setVariants] = useState([]);
  const [variantsLoading, setVariantsLoading] = useState(false);
  const [confirmDelVariant, setConfirmDelVariant] = useState(null);
  const [editVariant, setEditVariant] = useState(null);
  const [variantForm, setVariantForm] = useState({ size: "", color: "", price_modifier: "", stock: "", sku: "", is_active: true });

  const [coupons, setCoupons] = useState([]);
  const [couponsLoading, setCouponsLoading] = useState(false);
  const [confirmDelCoupon, setConfirmDelCoupon] = useState(null);
  const [editCoupon, setEditCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({ code: "", discount_type: "percent", discount_value: "", min_order_amount: "", max_uses: "", is_active: true });

  const [shipping, setShipping] = useState([]);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [confirmDelShipping, setConfirmDelShipping] = useState(null);
  const [editShipping, setEditShipping] = useState(null);
  const [shippingForm, setShippingForm] = useState({ name: "", min_weight: "", max_weight: "", price: "", region: "", is_active: true });

  const [taxRates, setTaxRates] = useState([]);
  const [taxRatesLoading, setTaxRatesLoading] = useState(false);
  const [confirmDelTax, setConfirmDelTax] = useState(null);
  const [editTax, setEditTax] = useState(null);
  const [taxForm, setTaxForm] = useState({ name: "", rate: "", country: "", is_active: true });

  const [currencies, setCurrencies] = useState([]);
  const [currenciesLoading, setCurrenciesLoading] = useState(false);

  const [regions, setRegions] = useState([]);
  const [regionsLoading, setRegionsLoading] = useState(false);

  const [returns, setReturns] = useState([]);
  const [returnsLoading, setReturnsLoading] = useState(false);
  const [confirmDelReturn, setConfirmDelReturn] = useState(null);
  const [editReturn, setEditReturn] = useState(null);
  const [returnStatus, setReturnStatus] = useState("");

  const [shopSettings, setShopSettings] = useState([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [confirmDelSetting, setConfirmDelSetting] = useState(null);
  const [editSetting, setEditSetting] = useState(null);
  const [settingForm, setSettingForm] = useState({ key: "", value: "" });

  const [customers, setCustomers] = useState([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  const loadDash = useCallback(async () => {
    setDashLoading(true);
    try { setDashData(await adminApi.shop.dashboard(token)); }
    catch (err) { showToast(err.message, "error"); }
    finally { setDashLoading(false); }
  }, [token, showToast]);

  const loadProducts = useCallback(async (url = null) => {
    setProductsLoading(true);
    try {
      const res = url ? await adminApi.shop.products.listUrl(token, url) : await adminApi.shop.products.list(token);
      setProducts(res?.results || []); setProductsNext(res?.next || null); setProductsPrev(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    finally { setProductsLoading(false); }
  }, [token, showToast]);

  const loadOrders = useCallback(async (url = null) => {
    setOrdersLoading(true);
    try {
      const res = url ? await adminApi.shop.orders.listUrl(token, url) : await adminApi.shop.orders.list(token);
      setOrders(res?.results || []); setOrdersNext(res?.next || null); setOrdersPrev(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    finally { setOrdersLoading(false); }
  }, [token, showToast]);

  const loadReviews = useCallback(async (url = null) => {
    setReviewsLoading(true);
    try {
      const res = url ? await adminApi.shop.reviews.listUrl(token, url) : await adminApi.shop.reviews.list(token);
      setReviews(res?.results || []); setReviewsNext(res?.next || null); setReviewsPrev(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    finally { setReviewsLoading(false); }
  }, [token, showToast]);

  const loadCarts = useCallback(async (url = null) => {
    setCartsLoading(true);
    try {
      const res = url ? await adminApi.shop.carts.listUrl(token, url) : await adminApi.shop.carts.list(token);
      setCarts(res?.results || []); setCartsNext(res?.next || null); setCartsPrev(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    finally { setCartsLoading(false); }
  }, [token, showToast]);

  const loadCoins = useCallback(async (url = null) => {
    setCoinsLoading(true);
    try {
      const res = url ? await adminApi.shop.coinTransactions.listUrl(token, url) : await adminApi.shop.coinTransactions.list(token);
      setCoins(res?.results || []); setCoinsNext(res?.next || null); setCoinsPrev(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    finally { setCoinsLoading(false); }
  }, [token, showToast]);

  const loadWishlists = useCallback(async (url = null) => {
    setWishlistsLoading(true);
    try {
      const res = url ? await adminApi.shop.wishlists.listUrl(token, url) : await adminApi.shop.wishlists.list(token);
      setWishlists(res?.results || []); setWishlistsNext(res?.next || null); setWishlistsPrev(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    finally { setWishlistsLoading(false); }
  }, [token, showToast]);

  const loadCartItems = useCallback(async (url = null) => {
    setCartItemsLoading(true);
    try {
      const res = url ? await adminApi.shop.cartItems.listUrl(token, url) : await adminApi.shop.cartItems.list(token);
      setCartItems(res?.results || []); setCartItemsNext(res?.next || null); setCartItemsPrev(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    finally { setCartItemsLoading(false); }
  }, [token, showToast]);

  const loadOrderItems = useCallback(async (url = null) => {
    setOrderItemsLoading(true);
    try {
      const res = url ? await adminApi.shop.orderItems.listUrl(token, url) : await adminApi.shop.orderItems.list(token);
      setOrderItems(res?.results || []); setOrderItemsNext(res?.next || null); setOrderItemsPrev(res?.previous || null);
    } catch (err) { showToast(err.message, "error"); }
    finally { setOrderItemsLoading(false); }
  }, [token, showToast]);

  const loadVariants = useCallback(async () => {
    setVariantsLoading(true);
    try { const res = await adminApi.shop.variants.list(token); setVariants(Array.isArray(res) ? res : res?.results || []); }
    catch (err) { showToast(err.message, "error"); }
    finally { setVariantsLoading(false); }
  }, [token, showToast]);

  const loadCoupons = useCallback(async () => {
    setCouponsLoading(true);
    try { const res = await adminApi.shop.coupons.list(token); setCoupons(Array.isArray(res) ? res : res?.results || []); }
    catch (err) { showToast(err.message, "error"); }
    finally { setCouponsLoading(false); }
  }, [token, showToast]);

  const loadShipping = useCallback(async () => {
    setShippingLoading(true);
    try { const res = await adminApi.shop.shippingRules.list(token); setShipping(Array.isArray(res) ? res : res?.results || []); }
    catch (err) { showToast(err.message, "error"); }
    finally { setShippingLoading(false); }
  }, [token, showToast]);

  const loadTaxRates = useCallback(async () => {
    setTaxRatesLoading(true);
    try { const res = await adminApi.shop.taxRates.list(token); setTaxRates(Array.isArray(res) ? res : res?.results || []); }
    catch (err) { showToast(err.message, "error"); }
    finally { setTaxRatesLoading(false); }
  }, [token, showToast]);

  const loadCurrencies = useCallback(async () => {
    setCurrenciesLoading(true);
    try { const res = await adminApi.shop.currencies.list(token); setCurrencies(Array.isArray(res) ? res : res?.results || []); }
    catch (err) { showToast(err.message, "error"); }
    finally { setCurrenciesLoading(false); }
  }, [token, showToast]);

  const loadRegions = useCallback(async () => {
    setRegionsLoading(true);
    try { const res = await adminApi.shop.regions.list(token); setRegions(Array.isArray(res) ? res : res?.results || []); }
    catch (err) { showToast(err.message, "error"); }
    finally { setRegionsLoading(false); }
  }, [token, showToast]);

  const loadReturns = useCallback(async () => {
    setReturnsLoading(true);
    try { const res = await adminApi.shop.returns.list(token); setReturns(Array.isArray(res) ? res : res?.results || []); }
    catch (err) { showToast(err.message, "error"); }
    finally { setReturnsLoading(false); }
  }, [token, showToast]);

  const loadSettings = useCallback(async () => {
    setSettingsLoading(true);
    try { const res = await adminApi.shop.settings.list(token); setShopSettings(Array.isArray(res) ? res : res?.results || []); }
    catch (err) { showToast(err.message, "error"); }
    finally { setSettingsLoading(false); }
  }, [token, showToast]);

  const loadCustomers = useCallback(async () => {
    setCustomersLoading(true);
    try { const res = await adminApi.shop.customers(token); setCustomers(Array.isArray(res) ? res : res?.results || []); }
    catch (err) { showToast(err.message, "error"); }
    finally { setCustomersLoading(false); }
  }, [token, showToast]);

  useEffect(() => { if (tab === "dashboard") loadDash(); }, [tab, loadDash]);
  useEffect(() => { if (tab === "products") loadProducts(); }, [tab, loadProducts]);
  useEffect(() => { if (tab === "orders") loadOrders(); }, [tab, loadOrders]);
  useEffect(() => { if (tab === "reviews") loadReviews(); }, [tab, loadReviews]);
  useEffect(() => { if (tab === "carts") loadCarts(); }, [tab, loadCarts]);
  useEffect(() => { if (tab === "coins") loadCoins(); }, [tab, loadCoins]);
  useEffect(() => { if (tab === "wishlists") loadWishlists(); }, [tab, loadWishlists]);
  useEffect(() => { if (tab === "cartItems") loadCartItems(); }, [tab, loadCartItems]);
  useEffect(() => { if (tab === "orderItems") loadOrderItems(); }, [tab, loadOrderItems]);
  useEffect(() => { if (tab === "variants") loadVariants(); }, [tab, loadVariants]);
  useEffect(() => { if (tab === "coupons") loadCoupons(); }, [tab, loadCoupons]);
  useEffect(() => { if (tab === "shipping") loadShipping(); }, [tab, loadShipping]);
  useEffect(() => { if (tab === "taxRates") loadTaxRates(); }, [tab, loadTaxRates]);
  useEffect(() => { if (tab === "currencies") loadCurrencies(); }, [tab, loadCurrencies]);
  useEffect(() => { if (tab === "regions") loadRegions(); }, [tab, loadRegions]);
  useEffect(() => { if (tab === "returns") loadReturns(); }, [tab, loadReturns]);
  useEffect(() => { if (tab === "settings") loadSettings(); }, [tab, loadSettings]);
  useEffect(() => { if (tab === "customers") loadCustomers(); }, [tab, loadCustomers]);

  async function saveProduct() {
    try {
      const data = { ...productForm, price: parseFloat(productForm.price), stock_quantity: parseInt(productForm.stock_quantity, 10) };
      if (editProduct?.id) {
        await adminApi.shop.products.update(token, editProduct.id, data);
        showToast("Product updated", "success");
      } else {
        await adminApi.shop.products.create(token, data);
        showToast("Product created", "success");
      }
      setEditProduct(null); setProductForm({ name: "", category: "", price: "", stock_quantity: "", is_active: true }); loadProducts();
    } catch (err) { showToast(err.message, "error"); }
  }

  async function deleteProduct(id) {
    try { await adminApi.shop.products.delete(token, id); showToast("Deleted", "success"); setConfirmDelProduct(null); loadProducts(); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function updateOrderStatus(id, status) {
    try { await adminApi.shop.orders.update(token, id, { status }); showToast("Status updated", "success"); setEditOrder(null); loadOrders(); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function approveReview(id) {
    try { await adminApi.shop.reviews.update(token, id, { is_approved: true }); showToast("Approved", "success"); loadReviews(); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function deleteReview(id) {
    try { await adminApi.shop.reviews.delete(token, id); showToast("Deleted", "success"); setConfirmDelReview(null); loadReviews(); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function duplicateProduct(id) {
    try { await adminApi.shop.products.duplicate(token, id); showToast("Product duplicated", "success"); loadProducts(); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function cancelOrder(id) {
    try { await adminApi.shop.orders.cancel(token, id); showToast("Order cancelled", "success"); loadOrders(); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function refundOrder(id) {
    try { await adminApi.shop.orders.refund(token, id); showToast("Order refunded", "success"); loadOrders(); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function exportData(type) {
    try { const res = await adminApi.shop.exports[type](token); const url = res?.url || res?.download_url; if (url) window.open(url, "_blank"); else showToast("Export started", "success"); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function saveVariant() {
    try {
      const data = { attributes: { size: variantForm.size, color: variantForm.color }, price_modifier: parseFloat(variantForm.price_modifier) || 0, stock: parseInt(variantForm.stock, 10) || 0, sku: variantForm.sku, is_active: variantForm.is_active };
      await adminApi.shop.variants.create(token, data);
      showToast("Variant created", "success"); setEditVariant(null); setVariantForm({ size: "", color: "", price_modifier: "", stock: "", sku: "", is_active: true }); loadVariants();
    } catch (err) { showToast(err.message, "error"); }
  }

  async function deleteVariant(id) {
    try { await adminApi.shop.variants.delete(token, id); showToast("Deleted", "success"); setConfirmDelVariant(null); loadVariants(); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function saveCoupon() {
    try {
      const data = { ...couponForm, discount_value: parseFloat(couponForm.discount_value) || 0, min_order_amount: parseFloat(couponForm.min_order_amount) || 0, max_uses: parseInt(couponForm.max_uses, 10) || 0 };
      await adminApi.shop.coupons.create(token, data);
      showToast("Coupon created", "success"); setEditCoupon(null); setCouponForm({ code: "", discount_type: "percent", discount_value: "", min_order_amount: "", max_uses: "", is_active: true }); loadCoupons();
    } catch (err) { showToast(err.message, "error"); }
  }

  async function deleteCoupon(id) {
    try { await adminApi.shop.coupons.delete(token, id); showToast("Deleted", "success"); setConfirmDelCoupon(null); loadCoupons(); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function saveShippingRule() {
    try {
      const data = { ...shippingForm, min_weight: parseFloat(shippingForm.min_weight) || 0, max_weight: parseFloat(shippingForm.max_weight) || 0, price: parseFloat(shippingForm.price) || 0 };
      await adminApi.shop.shippingRules.create(token, data);
      showToast("Shipping rule created", "success"); setEditShipping(null); setShippingForm({ name: "", min_weight: "", max_weight: "", price: "", region: "", is_active: true }); loadShipping();
    } catch (err) { showToast(err.message, "error"); }
  }

  async function deleteShippingRule(id) {
    try { await adminApi.shop.shippingRules.delete(token, id); showToast("Deleted", "success"); setConfirmDelShipping(null); loadShipping(); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function saveTaxRate() {
    try {
      const data = { ...taxForm, rate: parseFloat(taxForm.rate) || 0 };
      await adminApi.shop.taxRates.create(token, data);
      showToast("Tax rate created", "success"); setEditTax(null); setTaxForm({ name: "", rate: "", country: "", is_active: true }); loadTaxRates();
    } catch (err) { showToast(err.message, "error"); }
  }

  async function deleteTaxRate(id) {
    try { await adminApi.shop.taxRates.delete(token, id); showToast("Deleted", "success"); setConfirmDelTax(null); loadTaxRates(); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function setBaseCurrency(id) {
    try { await adminApi.shop.currencies.setBase(token, id); showToast("Base currency set", "success"); loadCurrencies(); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function updateCurrencyRates() {
    try { await adminApi.shop.currencies.updateRates(token); showToast("Rates updated", "success"); loadCurrencies(); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function createDefaultRegions() {
    try { await adminApi.shop.regions.createDefault(token); showToast("Default regions created", "success"); loadRegions(); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function updateReturn(id, status) {
    try { await adminApi.shop.returns.update(token, id, { status }); showToast("Return updated", "success"); setEditReturn(null); loadReturns(); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function deleteReturn(id) {
    try { await adminApi.shop.returns.delete(token, id); showToast("Deleted", "success"); setConfirmDelReturn(null); loadReturns(); }
    catch (err) { showToast(err.message, "error"); }
  }

  async function saveSetting() {
    try {
      await adminApi.shop.settings.create(token, { key: settingForm.key, value: settingForm.value });
      showToast("Setting saved", "success"); setEditSetting(null); setSettingForm({ key: "", value: "" }); loadSettings();
    } catch (err) { showToast(err.message, "error"); }
  }

  async function deleteSetting(key) {
    try { await adminApi.shop.settings.delete(token, key); showToast("Deleted", "success"); setConfirmDelSetting(null); loadSettings(); }
    catch (err) { showToast(err.message, "error"); }
  }

  const orderStatusColor = (s) => ({ pending: "yellow", confirmed: "blue", processing: "purple", shipped: "cyan", delivered: "green", cancelled: "red", refunded: "gray" }[s] || "gray");
  const coinTypeColor = (t) => ({ earned: "green", redeemed: "yellow", expired: "red" }[t] || "gray");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-white text-xl font-bold">Shop & Orders</h2>
        <div className="flex gap-2 flex-wrap">
        {tab === "products" && <>
          <Btn onClick={() => { setEditProduct({}); setProductForm({ name: "", description: "", category: "", price: "", stock_quantity: "", sku: "", is_active: true }); }}><Plus size={14} className="mr-1" />New Product</Btn>
          <Btn onClick={() => exportData("products")}><Download size={14} className="mr-1" />Export</Btn>
        </>}
        {tab === "orders" && <Btn onClick={() => exportData("orders")}><Download size={14} className="mr-1" />Export Orders</Btn>}
        {tab === "customers" && <Btn onClick={() => exportData("customers")}><Download size={14} className="mr-1" />Export Customers</Btn>}
        {tab === "variants" && <Btn onClick={() => { setEditVariant({}); setVariantForm({ size: "", color: "", price_modifier: "", stock: "", sku: "", is_active: true }); }}><Plus size={14} className="mr-1" />New Variant</Btn>}
        {tab === "coupons" && <Btn onClick={() => { setEditCoupon({}); setCouponForm({ code: "", discount_type: "percent", discount_value: "", min_order_amount: "", max_uses: "", is_active: true }); }}><Plus size={14} className="mr-1" />New Coupon</Btn>}
        {tab === "shipping" && <Btn onClick={() => { setEditShipping({}); setShippingForm({ name: "", min_weight: "", max_weight: "", price: "", region: "", is_active: true }); }}><Plus size={14} className="mr-1" />New Rule</Btn>}
        {tab === "taxRates" && <Btn onClick={() => { setEditTax({}); setTaxForm({ name: "", rate: "", country: "", is_active: true }); }}><Plus size={14} className="mr-1" />New Tax Rate</Btn>}
        {tab === "currencies" && <Btn onClick={() => updateCurrencyRates()}><RefreshCw size={14} className="mr-1" />Update Rates</Btn>}
        {tab === "regions" && <Btn onClick={() => createDefaultRegions()}><Plus size={14} className="mr-1" />Create Defaults</Btn>}
        {tab === "settings" && <Btn onClick={() => { setEditSetting({}); setSettingForm({ key: "", value: "" }); }}><Plus size={14} className="mr-1" />New Setting</Btn>}
        </div>
      </div>
      <div className="flex gap-2 border-b border-purple-900/40 flex-wrap">
        {[["dashboard", "Dashboard"], ["products", "Products"], ["orders", "Orders"], ["reviews", "Reviews"], ["carts", "Carts"], ["wishlists", "Wishlists"], ["cartItems", "Cart Items"], ["orderItems", "Order Items"], ["coins", "Coins"], ["variants", "Variants"], ["coupons", "Coupons"], ["shipping", "Shipping"], ["taxRates", "Tax Rates"], ["currencies", "Currencies"], ["regions", "Regions"], ["returns", "Returns"], ["settings", "Settings"], ["customers", "Customers"]].map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)}
            className={`px-4 py-2 text-sm font-medium ${tab === v ? "text-amber-400 border-b-2 border-amber-400" : "text-slate-400 hover:text-white"}`}>{l}</button>
        ))}
      </div>

      {tab === "dashboard" && (
        dashLoading ? <LoadingSpinner /> : dashData ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Products" value={dashData.total_products} icon={ShoppingCart} color={BRAND.primary} />
            <StatCard label="Total Orders" value={dashData.total_orders} icon={Layers} color={BRAND.info} />
            <StatCard label="Pending Orders" value={dashData.pending_orders} icon={Clock} color={BRAND.warning} />
            <StatCard label="Total Revenue" value={dashData.total_revenue ? `$${dashData.total_revenue}` : undefined} icon={Coins} color={BRAND.accent} />
          </div>
        ) : <p className="text-slate-500">No data</p>
      )}

      {tab === "products" && (
        productsLoading ? <LoadingSpinner /> : (
          <>
            <TableWrap cols={["Name", "Category", "Price (€)", "Stock", "Active", "Featured", "Actions"]}>
              {products.map(p => (
                <TR key={p.id}>
                  <TD><span className="text-white font-medium">{p.name}</span></TD>
                  <TD>{p.category || "—"}</TD>
                  <TD>{p.price}</TD>
                  <TD>{p.stock_quantity}</TD>
                  <TD><Badge color={p.is_active ? "green" : "gray"}>{p.is_active ? "Yes" : "No"}</Badge></TD>
                  <TD><Badge color={p.is_featured ? "yellow" : "gray"}>{p.is_featured ? "Yes" : "No"}</Badge></TD>
                  <TD className="flex gap-1">
                    <Btn small onClick={() => { setEditProduct(p); setProductForm({ name: p.name, description: p.description || "", category: p.category || "", price: p.price, stock_quantity: p.stock_quantity, sku: p.sku || "", is_active: p.is_active }); }}><Edit size={12} /></Btn>
                    <Btn small onClick={() => duplicateProduct(p.id)}><Copy size={12} /></Btn>
                    <Btn small color="red" onClick={() => setConfirmDelProduct(p.id)}><Trash2 size={12} /></Btn>
                  </TD>
                </TR>
              ))}
            </TableWrap>
            <Pagination nextUrl={productsNext} prevUrl={productsPrev} onNext={() => loadProducts(productsNext)} onPrev={() => loadProducts(productsPrev)} />
          </>
        )
      )}

      {tab === "orders" && (
        ordersLoading ? <LoadingSpinner /> : (
          <>
            <TableWrap cols={["Order #", "User", "Total", "Status", "Payment", "Date", "Actions"]}>
              {orders.map(o => (
                <TR key={o.id}>
                  <TD><span className="text-white font-mono text-xs">{o.order_number}</span></TD>
                  <TD>{o.user_email || o.user || "—"}</TD>
                  <TD>{o.total_amount ? `€${o.total_amount}` : "—"}</TD>
                  <TD><Badge color={orderStatusColor(o.status)}>{o.status}</Badge></TD>
                  <TD><Badge color={o.payment_status === "paid" ? "green" : "red"}>{o.payment_status}</Badge></TD>
                  <TD>{o.created_at ? new Date(o.created_at).toLocaleDateString() : "—"}</TD>
                  <TD className="flex gap-1">
                    <Btn small onClick={() => { setEditOrder(o); setOrderStatus(o.status); }}><Edit size={12} /></Btn>
                    {o.status !== "cancelled" && <Btn small color="red" onClick={() => cancelOrder(o.id)}><XCircle size={12} /></Btn>}
                    {o.status !== "refunded" && <Btn small onClick={() => refundOrder(o.id)}><RotateCcw size={12} /></Btn>}
                  </TD>
                </TR>
              ))}
            </TableWrap>
            <Pagination nextUrl={ordersNext} prevUrl={ordersPrev} onNext={() => loadOrders(ordersNext)} onPrev={() => loadOrders(ordersPrev)} />
          </>
        )
      )}

      {tab === "reviews" && (
        reviewsLoading ? <LoadingSpinner /> : (
          <>
            <TableWrap cols={["Product", "User", "Rating", "Text", "Approved", "Actions"]}>
              {reviews.map(r => (
                <TR key={r.id}>
                  <TD>{r.product_name || r.product || "—"}</TD>
                  <TD>{r.user_email || r.user || "—"}</TD>
                  <TD><span className="text-amber-400">{r.rating} ★</span></TD>
                  <TD><span className="text-slate-300 text-xs max-w-xs truncate block">{r.review_text || r.text || "—"}</span></TD>
                  <TD><Badge color={r.is_approved ? "green" : "gray"}>{r.is_approved ? "Yes" : "No"}</Badge></TD>
                  <TD className="flex gap-1">
                    {!r.is_approved && <Btn small onClick={() => approveReview(r.id)}><Check size={12} /></Btn>}
                    <Btn small color="red" onClick={() => setConfirmDelReview(r.id)}><Trash2 size={12} /></Btn>
                  </TD>
                </TR>
              ))}
            </TableWrap>
            <Pagination nextUrl={reviewsNext} prevUrl={reviewsPrev} onNext={() => loadReviews(reviewsNext)} onPrev={() => loadReviews(reviewsPrev)} />
          </>
        )
      )}

      {tab === "carts" && (
        cartsLoading ? <LoadingSpinner /> : (
          <>
            <TableWrap cols={["User", "Items", "Subtotal", "Updated"]}>
              {carts.map(c => (
                <TR key={c.id}>
                  <TD>{c.user_email || c.user || "—"}</TD>
                  <TD>{c.item_count ?? c.items?.length ?? "—"}</TD>
                  <TD>{c.subtotal ? `€${c.subtotal}` : "—"}</TD>
                  <TD>{c.updated_at ? new Date(c.updated_at).toLocaleDateString() : "—"}</TD>
                </TR>
              ))}
            </TableWrap>
            <Pagination nextUrl={cartsNext} prevUrl={cartsPrev} onNext={() => loadCarts(cartsNext)} onPrev={() => loadCarts(cartsPrev)} />
          </>
        )
      )}

      {tab === "coins" && (
        coinsLoading ? <LoadingSpinner /> : (
          <>
            <TableWrap cols={["User", "Order #", "Type", "Coins", "EUR Value", "Date"]}>
              {coins.map(c => (
                <TR key={c.id}>
                  <TD>{c.user_email || c.user || "—"}</TD>
                  <TD><span className="text-xs font-mono">{c.order_number || "—"}</span></TD>
                  <TD><Badge color={coinTypeColor(c.transaction_type)}>{c.transaction_type}</Badge></TD>
                  <TD>{c.coins}</TD>
                  <TD>{c.eur_value ? `€${c.eur_value}` : "—"}</TD>
                  <TD>{c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</TD>
                </TR>
              ))}
            </TableWrap>
            <Pagination nextUrl={coinsNext} prevUrl={coinsPrev} onNext={() => loadCoins(coinsNext)} onPrev={() => loadCoins(coinsPrev)} />
          </>
        )
      )}

      {tab === "wishlists" && (
        wishlistsLoading ? <LoadingSpinner /> : (
          <>
            <TableWrap cols={["User", "Product", "Added"]}>
              {wishlists.map(w => (
                <TR key={w.id}>
                  <TD>{w.user_email || w.user || "—"}</TD>
                  <TD>{w.product_name || w.product || "—"}</TD>
                  <TD>{w.created_at ? new Date(w.created_at).toLocaleDateString() : "—"}</TD>
                </TR>
              ))}
            </TableWrap>
            <Pagination nextUrl={wishlistsNext} prevUrl={wishlistsPrev} onNext={() => loadWishlists(wishlistsNext)} onPrev={() => loadWishlists(wishlistsPrev)} />
          </>
        )
      )}

      {tab === "cartItems" && (
        cartItemsLoading ? <LoadingSpinner /> : (
          <>
            <TableWrap cols={["Cart", "User", "Product", "Qty", "Price", "Added"]}>
              {cartItems.map(i => (
                <TR key={i.id}>
                  <TD><span className="font-mono text-xs text-slate-400">{i.cart || "—"}</span></TD>
                  <TD>{i.user_email || i.user || "—"}</TD>
                  <TD>{i.product_name || i.product || "—"}</TD>
                  <TD>{i.quantity ?? "—"}</TD>
                  <TD>{i.price ? `€${i.price}` : "—"}</TD>
                  <TD>{i.added_at ? new Date(i.added_at).toLocaleDateString() : "—"}</TD>
                </TR>
              ))}
            </TableWrap>
            <Pagination nextUrl={cartItemsNext} prevUrl={cartItemsPrev} onNext={() => loadCartItems(cartItemsNext)} onPrev={() => loadCartItems(cartItemsPrev)} />
          </>
        )
      )}

      {tab === "orderItems" && (
        orderItemsLoading ? <LoadingSpinner /> : (
          <>
            <TableWrap cols={["Order #", "Product", "Qty", "Unit Price", "Total", "Date"]}>
              {orderItems.map(i => (
                <TR key={i.id}>
                  <TD><span className="font-mono text-xs text-white">{i.order_number || i.order || "—"}</span></TD>
                  <TD>{i.product_name || i.product || "—"}</TD>
                  <TD>{i.quantity ?? "—"}</TD>
                  <TD>{i.unit_price ? `€${i.unit_price}` : "—"}</TD>
                  <TD>{i.total_price ? `€${i.total_price}` : "—"}</TD>
                  <TD>{i.created_at ? new Date(i.created_at).toLocaleDateString() : "—"}</TD>
                </TR>
              ))}
            </TableWrap>
            <Pagination nextUrl={orderItemsNext} prevUrl={orderItemsPrev} onNext={() => loadOrderItems(orderItemsNext)} onPrev={() => loadOrderItems(orderItemsPrev)} />
          </>
        )
      )}

      {tab === "variants" && (
        variantsLoading ? <LoadingSpinner /> : (
          <>
            <TableWrap cols={["SKU", "Size", "Color", "Price Modifier", "Stock", "Active", "Actions"]}>
              {variants.map(v => (
                <TR key={v.id}>
                  <TD><span className="text-white font-mono text-xs">{v.sku || "—"}</span></TD>
                  <TD>{v.attributes?.size || "—"}</TD>
                  <TD>{v.attributes?.color || "—"}</TD>
                  <TD>{v.price_modifier}</TD>
                  <TD>{v.stock}</TD>
                  <TD><Badge color={v.is_active ? "green" : "gray"}>{v.is_active ? "Yes" : "No"}</Badge></TD>
                  <TD><Btn small color="red" onClick={() => setConfirmDelVariant(v.id)}><Trash2 size={12} /></Btn></TD>
                </TR>
              ))}
            </TableWrap>
          </>
        )
      )}

      {tab === "coupons" && (
        couponsLoading ? <LoadingSpinner /> : (
          <>
            <TableWrap cols={["Code", "Type", "Value", "Min Order", "Max Uses", "Uses", "Active", "Actions"]}>
              {coupons.map(c => (
                <TR key={c.id}>
                  <TD><span className="text-white font-mono text-xs">{c.code}</span></TD>
                  <TD>{c.discount_type || "—"}</TD>
                  <TD>{c.discount_value}</TD>
                  <TD>{c.min_order_amount ? `€${c.min_order_amount}` : "—"}</TD>
                  <TD>{c.max_uses ?? "—"}</TD>
                  <TD>{c.times_used ?? c.uses ?? "—"}</TD>
                  <TD><Badge color={c.is_active ? "green" : "gray"}>{c.is_active ? "Yes" : "No"}</Badge></TD>
                  <TD><Btn small color="red" onClick={() => setConfirmDelCoupon(c.id)}><Trash2 size={12} /></Btn></TD>
                </TR>
              ))}
            </TableWrap>
          </>
        )
      )}

      {tab === "shipping" && (
        shippingLoading ? <LoadingSpinner /> : (
          <>
            <TableWrap cols={["Name", "Min Weight", "Max Weight", "Price", "Region", "Active", "Actions"]}>
              {shipping.map(s => (
                <TR key={s.id}>
                  <TD><span className="text-white font-medium">{s.name}</span></TD>
                  <TD>{s.min_weight ?? "—"}</TD>
                  <TD>{s.max_weight ?? "—"}</TD>
                  <TD>{s.price ? `€${s.price}` : "—"}</TD>
                  <TD>{s.region || "—"}</TD>
                  <TD><Badge color={s.is_active ? "green" : "gray"}>{s.is_active ? "Yes" : "No"}</Badge></TD>
                  <TD><Btn small color="red" onClick={() => setConfirmDelShipping(s.id)}><Trash2 size={12} /></Btn></TD>
                </TR>
              ))}
            </TableWrap>
          </>
        )
      )}

      {tab === "taxRates" && (
        taxRatesLoading ? <LoadingSpinner /> : (
          <>
            <TableWrap cols={["Name", "Rate (%)", "Country", "Active", "Actions"]}>
              {taxRates.map(t => (
                <TR key={t.id}>
                  <TD><span className="text-white font-medium">{t.name}</span></TD>
                  <TD>{t.rate}%</TD>
                  <TD>{t.country || "—"}</TD>
                  <TD><Badge color={t.is_active ? "green" : "gray"}>{t.is_active ? "Yes" : "No"}</Badge></TD>
                  <TD><Btn small color="red" onClick={() => setConfirmDelTax(t.id)}><Trash2 size={12} /></Btn></TD>
                </TR>
              ))}
            </TableWrap>
          </>
        )
      )}

      {tab === "currencies" && (
        currenciesLoading ? <LoadingSpinner /> : (
          <>
            <TableWrap cols={["Code", "Symbol", "Name", "Rate to Base", "Base", "Active", "Actions"]}>
              {currencies.map(c => (
                <TR key={c.id}>
                  <TD><span className="text-white font-mono font-medium">{c.code}</span></TD>
                  <TD>{c.symbol || "—"}</TD>
                  <TD>{c.name || "—"}</TD>
                  <TD>{c.rate_to_base}</TD>
                  <TD><Badge color={c.is_base ? "yellow" : "gray"}>{c.is_base ? "Base" : "No"}</Badge></TD>
                  <TD><Badge color={c.is_active ? "green" : "gray"}>{c.is_active ? "Yes" : "No"}</Badge></TD>
                  <TD>{!c.is_base && <Btn small onClick={() => setBaseCurrency(c.id)}>Set Base</Btn>}</TD>
                </TR>
              ))}
            </TableWrap>
          </>
        )
      )}

      {tab === "regions" && (
        regionsLoading ? <LoadingSpinner /> : (
          <>
            <TableWrap cols={["Code", "Name", "Countries", "Price Multiplier", "Discount %"]}>
              {regions.map(r => (
                <TR key={r.id}>
                  <TD><span className="text-white font-mono text-xs">{r.code}</span></TD>
                  <TD><span className="text-white font-medium">{r.name}</span></TD>
                  <TD>{r.country_count ?? r.countries?.length ?? "—"}</TD>
                  <TD>{r.price_multiplier ?? "—"}</TD>
                  <TD>{r.discount_percent != null ? `${r.discount_percent}%` : "—"}</TD>
                </TR>
              ))}
            </TableWrap>
          </>
        )
      )}

      {tab === "returns" && (
        returnsLoading ? <LoadingSpinner /> : (
          <>
            <TableWrap cols={["Order #", "User", "Reason", "Status", "Date", "Actions"]}>
              {returns.map(r => (
                <TR key={r.id}>
                  <TD><span className="text-white font-mono text-xs">{r.order_number || r.order || "—"}</span></TD>
                  <TD>{r.user_email || r.user || "—"}</TD>
                  <TD><span className="text-slate-300 text-xs max-w-xs truncate block">{r.reason || "—"}</span></TD>
                  <TD><Badge color={r.status === "approved" ? "green" : r.status === "rejected" ? "red" : "yellow"}>{r.status || "—"}</Badge></TD>
                  <TD>{r.created_at ? new Date(r.created_at).toLocaleDateString() : "—"}</TD>
                  <TD className="flex gap-1">
                    <Btn small onClick={() => { setEditReturn(r); setReturnStatus(r.status || ""); }}><Edit size={12} /></Btn>
                    <Btn small color="red" onClick={() => setConfirmDelReturn(r.id)}><Trash2 size={12} /></Btn>
                  </TD>
                </TR>
              ))}
            </TableWrap>
          </>
        )
      )}

      {tab === "settings" && (
        settingsLoading ? <LoadingSpinner /> : (
          <>
            <TableWrap cols={["Key", "Value", "Actions"]}>
              {shopSettings.map(s => (
                <TR key={s.key || s.id}>
                  <TD><span className="text-white font-mono text-xs">{s.key}</span></TD>
                  <TD><span className="text-slate-300 text-sm">{typeof s.value === "object" ? JSON.stringify(s.value) : String(s.value)}</span></TD>
                  <TD><Btn small color="red" onClick={() => setConfirmDelSetting(s.key || s.id)}><Trash2 size={12} /></Btn></TD>
                </TR>
              ))}
            </TableWrap>
          </>
        )
      )}

      {tab === "customers" && (
        customersLoading ? <LoadingSpinner /> : (
          <>
            <TableWrap cols={["Email", "Name", "Orders", "Total Spent", "Joined"]}>
              {customers.map(c => (
                <TR key={c.id}>
                  <TD><span className="text-white text-sm">{c.email || "—"}</span></TD>
                  <TD>{c.first_name || c.name || "—"} {c.last_name || ""}</TD>
                  <TD>{c.order_count ?? c.total_orders ?? "—"}</TD>
                  <TD>{c.total_spent != null ? `€${c.total_spent}` : "—"}</TD>
                  <TD>{c.date_joined || c.created_at ? new Date(c.date_joined || c.created_at).toLocaleDateString() : "—"}</TD>
                </TR>
              ))}
            </TableWrap>
          </>
        )
      )}

      {editProduct !== null && (
        <Modal title={editProduct.id ? "Edit Product" : "New Product"} onClose={() => setEditProduct(null)}>
          <InputField label="Name" value={productForm.name} onChange={v => setProductForm(f => ({ ...f, name: v }))} />
          <InputField label="Description" value={productForm.description} onChange={v => setProductForm(f => ({ ...f, description: v }))} />
          <InputField label="Category" value={productForm.category} onChange={v => setProductForm(f => ({ ...f, category: v }))} />
          <InputField label="Price" value={productForm.price} onChange={v => setProductForm(f => ({ ...f, price: v }))} />
          <InputField label="Stock Quantity" value={productForm.stock_quantity} onChange={v => setProductForm(f => ({ ...f, stock_quantity: v }))} />
          <InputField label="SKU" value={productForm.sku} onChange={v => setProductForm(f => ({ ...f, sku: v }))} />
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={productForm.is_active} onChange={e => setProductForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-purple-500" />
            <label className="text-slate-300 text-sm">Active</label>
          </div>
          <Btn onClick={saveProduct}>{editProduct.id ? "Update" : "Create"}</Btn>
        </Modal>
      )}

      {editOrder && (
        <Modal title={`Update Order #${editOrder.order_number}`} onClose={() => setEditOrder(null)}>
          <div className="space-y-1">
            <label className="text-slate-300 text-xs font-medium">Status</label>
            <select value={orderStatus} onChange={e => setOrderStatus(e.target.value)} className="w-full bg-white/5 border border-purple-900/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
              {["pending", "confirmed", "processing", "shipped", "delivered", "cancelled", "refunded"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Btn onClick={() => updateOrderStatus(editOrder.id, orderStatus)}>Update Status</Btn>
        </Modal>
      )}

      {confirmDelProduct && <ConfirmModal message="Delete this product?" onConfirm={() => deleteProduct(confirmDelProduct)} onCancel={() => setConfirmDelProduct(null)} />}
      {confirmDelReview && <ConfirmModal message="Delete this review?" onConfirm={() => deleteReview(confirmDelReview)} onCancel={() => setConfirmDelReview(null)} />}

      {editVariant !== null && (
        <Modal title="New Variant" onClose={() => setEditVariant(null)}>
          <InputField label="Size" value={variantForm.size} onChange={v => setVariantForm(f => ({ ...f, size: v }))} />
          <InputField label="Color" value={variantForm.color} onChange={v => setVariantForm(f => ({ ...f, color: v }))} />
          <InputField label="Price Modifier" value={variantForm.price_modifier} onChange={v => setVariantForm(f => ({ ...f, price_modifier: v }))} />
          <InputField label="Stock" value={variantForm.stock} onChange={v => setVariantForm(f => ({ ...f, stock: v }))} />
          <InputField label="SKU" value={variantForm.sku} onChange={v => setVariantForm(f => ({ ...f, sku: v }))} />
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={variantForm.is_active} onChange={e => setVariantForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-purple-500" />
            <label className="text-slate-300 text-sm">Active</label>
          </div>
          <Btn onClick={saveVariant}>Create</Btn>
        </Modal>
      )}
      {confirmDelVariant && <ConfirmModal message="Delete this variant?" onConfirm={() => deleteVariant(confirmDelVariant)} onCancel={() => setConfirmDelVariant(null)} />}

      {editCoupon !== null && (
        <Modal title="New Coupon" onClose={() => setEditCoupon(null)}>
          <InputField label="Code" value={couponForm.code} onChange={v => setCouponForm(f => ({ ...f, code: v }))} />
          <div className="space-y-1">
            <label className="text-slate-300 text-xs font-medium">Discount Type</label>
            <select value={couponForm.discount_type} onChange={e => setCouponForm(f => ({ ...f, discount_type: e.target.value }))} className="w-full bg-white/5 border border-purple-900/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
              <option value="percent">Percent</option>
              <option value="fixed">Fixed</option>
            </select>
          </div>
          <InputField label="Discount Value" value={couponForm.discount_value} onChange={v => setCouponForm(f => ({ ...f, discount_value: v }))} />
          <InputField label="Min Order Amount" value={couponForm.min_order_amount} onChange={v => setCouponForm(f => ({ ...f, min_order_amount: v }))} />
          <InputField label="Max Uses" value={couponForm.max_uses} onChange={v => setCouponForm(f => ({ ...f, max_uses: v }))} />
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={couponForm.is_active} onChange={e => setCouponForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-purple-500" />
            <label className="text-slate-300 text-sm">Active</label>
          </div>
          <Btn onClick={saveCoupon}>Create</Btn>
        </Modal>
      )}
      {confirmDelCoupon && <ConfirmModal message="Delete this coupon?" onConfirm={() => deleteCoupon(confirmDelCoupon)} onCancel={() => setConfirmDelCoupon(null)} />}

      {editShipping !== null && (
        <Modal title="New Shipping Rule" onClose={() => setEditShipping(null)}>
          <InputField label="Name" value={shippingForm.name} onChange={v => setShippingForm(f => ({ ...f, name: v }))} />
          <InputField label="Min Weight" value={shippingForm.min_weight} onChange={v => setShippingForm(f => ({ ...f, min_weight: v }))} />
          <InputField label="Max Weight" value={shippingForm.max_weight} onChange={v => setShippingForm(f => ({ ...f, max_weight: v }))} />
          <InputField label="Price" value={shippingForm.price} onChange={v => setShippingForm(f => ({ ...f, price: v }))} />
          <InputField label="Region" value={shippingForm.region} onChange={v => setShippingForm(f => ({ ...f, region: v }))} />
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={shippingForm.is_active} onChange={e => setShippingForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-purple-500" />
            <label className="text-slate-300 text-sm">Active</label>
          </div>
          <Btn onClick={saveShippingRule}>Create</Btn>
        </Modal>
      )}
      {confirmDelShipping && <ConfirmModal message="Delete this shipping rule?" onConfirm={() => deleteShippingRule(confirmDelShipping)} onCancel={() => setConfirmDelShipping(null)} />}

      {editTax !== null && (
        <Modal title="New Tax Rate" onClose={() => setEditTax(null)}>
          <InputField label="Name" value={taxForm.name} onChange={v => setTaxForm(f => ({ ...f, name: v }))} />
          <InputField label="Rate (%)" value={taxForm.rate} onChange={v => setTaxForm(f => ({ ...f, rate: v }))} />
          <InputField label="Country" value={taxForm.country} onChange={v => setTaxForm(f => ({ ...f, country: v }))} />
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={taxForm.is_active} onChange={e => setTaxForm(f => ({ ...f, is_active: e.target.checked }))} className="accent-purple-500" />
            <label className="text-slate-300 text-sm">Active</label>
          </div>
          <Btn onClick={saveTaxRate}>Create</Btn>
        </Modal>
      )}
      {confirmDelTax && <ConfirmModal message="Delete this tax rate?" onConfirm={() => deleteTaxRate(confirmDelTax)} onCancel={() => setConfirmDelTax(null)} />}

      {editReturn !== null && (
        <Modal title={`Update Return`} onClose={() => setEditReturn(null)}>
          <div className="space-y-1">
            <label className="text-slate-300 text-xs font-medium">Status</label>
            <select value={returnStatus} onChange={e => setReturnStatus(e.target.value)} className="w-full bg-white/5 border border-purple-900/40 rounded-lg px-3 py-2 text-white text-sm focus:outline-none">
              {["pending", "approved", "rejected", "completed"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <Btn onClick={() => updateReturn(editReturn.id, returnStatus)}>Update Status</Btn>
        </Modal>
      )}
      {confirmDelReturn && <ConfirmModal message="Delete this return?" onConfirm={() => deleteReturn(confirmDelReturn)} onCancel={() => setConfirmDelReturn(null)} />}

      {editSetting !== null && (
        <Modal title="New Setting" onClose={() => setEditSetting(null)}>
          <InputField label="Key" value={settingForm.key} onChange={v => setSettingForm(f => ({ ...f, key: v }))} />
          <InputField label="Value" value={settingForm.value} onChange={v => setSettingForm(f => ({ ...f, value: v }))} />
          <Btn onClick={saveSetting}>Save</Btn>
        </Modal>
      )}
      {confirmDelSetting && <ConfirmModal message="Delete this setting?" onConfirm={() => deleteSetting(confirmDelSetting)} onCancel={() => setConfirmDelSetting(null)} />}
    </div>
  );
}

export default ShopView;
