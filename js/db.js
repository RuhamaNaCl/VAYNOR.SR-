/* VAYNOR — data layer. Tries Supabase first (products, orders, auth), falls
   back to seed data + localStorage so the storefront is fully functional as
   a demo with no backend. Nothing here throws if Supabase can't load. */
window.VAYNOR = window.VAYNOR || {};

(function () {
  const K = VAYNOR.config.storageKeys;

  /* ---------- local storage helpers ---------- */
  VAYNOR.ls = {
    get(key, fallback) {
      try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
      catch (e) { return fallback; }
    },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }
  };

  /* ---------- supabase client ---------- */
  let client = null;
  if (window.supabase && window.supabase.createClient && VAYNOR.config.supabase.url) {
    try { client = window.supabase.createClient(VAYNOR.config.supabase.url, VAYNOR.config.supabase.key); }
    catch (e) { console.warn("VAYNOR: Supabase client failed to init; running in demo mode.", e); }
  }
  VAYNOR.supabase = client;
  VAYNOR.online = false; // flipped after first successful query

  VAYNOR.money = function (n) {
    const cur = (VAYNOR.settings().currency || "৳");
    const v = Number(n) || 0;
    return cur + (Number.isInteger(v) ? v.toLocaleString(VAYNOR.config.brand.locale || "en-BD") : v.toFixed(2));
  };

  /* ---------- auth ---------- */
  VAYNOR.user = async function () {
    if (client) {
      try {
        const { data } = await client.auth.getSession();
        if (data && data.session && data.session.user) return { email: data.session.user.email, via: "supabase" };
      } catch (e) { console.warn("VAYNOR: auth lookup failed", e); }
    }
    return VAYNOR.ls.get(K.demoUser, null);
  };

  VAYNOR.signOut = async function () {
    if (client) { try { await client.auth.signOut(); } catch (e) {} }
    localStorage.removeItem(K.demoUser);
  };

  /* ---------- products ---------- */
  function normalize(row, fallback) {
    const base = fallback || {};
    const images = Array.isArray(row.images) && row.images.length
      ? row.images
      : (row.image_url ? [row.image_url] : (base.images || []));
    return Object.assign({}, base, {
      id: String(row.id ?? base.id ?? "product"),
      name: row.name || base.name || "Untitled",
      category: row.category || base.category || "Bracelets",
      price: Number(row.price ?? base.price ?? 0),
      compare_at: row.compare_at_price != null ? Number(row.compare_at_price) : (row.compare_at != null ? Number(row.compare_at) : null),
      stock: Number(row.stock ?? base.stock ?? 0),
      is_active: row.is_active !== false,
      badge: row.badge || base.badge || null,
      rating: Number(row.rating ?? base.rating ?? 0),
      review_count: Number(row.review_count ?? base.review_count ?? 0),
      short: row.short_description || base.short || "",
      description: row.description || base.description || "",
      features: Array.isArray(row.features) ? row.features : (base.features || []),
      specs: (row.specs && typeof row.specs === "object") ? row.specs : (base.specs || {}),
      images
    });
  }

  async function fetchSupabaseProducts() {
    if (!client) throw new Error("no supabase");
    const { data, error } = await client.from("products").select("*");
    if (error) throw error;
    if (!data || !data.length) throw new Error("empty products table");
    VAYNOR.online = true;
    return data.map(row => normalize(row));
  }

  /* Admin edits are stored locally and merged over the catalogue. A null
     value is a tombstone: it hides the row even if it came from Supabase/seed. */
  function adminEdits() { return VAYNOR.ls.get(K.products, {}); }

  VAYNOR.db = {};

  VAYNOR.db.products = async function () {
    let list;
    try {
      list = await fetchSupabaseProducts();
    } catch (e) {
      list = VAYNOR.seedProducts.map(p => Object.assign({}, p));
    }
    const byId = {};
    list.forEach(p => (byId[p.id] = p));
    const edits = adminEdits();
    Object.keys(edits).forEach(id => {
      if (edits[id] === null) delete byId[id];
      else byId[id] = normalize(Object.assign({}, byId[id] || {}, edits[id]), byId[id]);
    });
    return Object.values(byId);
  };

  VAYNOR.db.product = async function (id) {
    const list = await VAYNOR.db.products();
    return list.find(p => p.id === id) || list[0] || null;
  };

  VAYNOR.db.saveProduct = function (id, patch) {
    const edits = adminEdits();
    edits[id] = Object.assign({}, edits[id] || {}, patch);
    VAYNOR.ls.set(K.products, edits);
  };

  VAYNOR.db.deleteProduct = function (id) {
    const edits = adminEdits();
    edits[id] = null; // tombstone: hides seeded, Supabase and edited rows alike
    VAYNOR.ls.set(K.products, edits);
  };

  /* ---------- reviews ---------- */
  VAYNOR.db.reviews = function (productId) {
    const mine = VAYNOR.ls.get(K.reviews, []);
    return VAYNOR.seedReviews.concat(mine).filter(r => r.approved && (!productId || r.product === productId));
  };
  VAYNOR.db.allReviews = function () { return VAYNOR.seedReviews.concat(VAYNOR.ls.get(K.reviews, [])); };
  VAYNOR.db.addReview = function (review) {
    const mine = VAYNOR.ls.get(K.reviews, []);
    mine.unshift(Object.assign({ id: "u" + Date.now(), approved: true, via: "local" }, review));
    VAYNOR.ls.set(K.reviews, mine);
  };
  VAYNOR.db.setReviewApproved = function (id, approved) {
    const mine = VAYNOR.ls.get(K.reviews, []);
    const idx = mine.findIndex(r => r.id === id);
    if (idx > -1) { mine[idx].approved = approved; VAYNOR.ls.set(K.reviews, mine); }
    else console.info("Seed reviews are read-only in demo mode.");
  };

  /* ---------- discounts ---------- */
  VAYNOR.db.discounts = function () {
    const local = VAYNOR.ls.get(K.discounts, null);
    if (local) return local;
    VAYNOR.ls.set(K.discounts, VAYNOR.seedDiscounts);
    return VAYNOR.seedDiscounts;
  };
  VAYNOR.db.saveDiscounts = function (list) { VAYNOR.ls.set(K.discounts, list); };
  VAYNOR.db.applyPromo = function (code) {
    if (!code) return null;
    const hit = VAYNOR.db.discounts().find(d => d.active && d.code.toUpperCase() === String(code).trim().toUpperCase());
    return hit || null;
  };

  /* ---------- orders ---------- */
  function orderStatusTimeline(status) {
    const flow = ["Received", "Packed", "Shipped", "Delivered"];
    const i = flow.indexOf(status);
    return flow.map((s, idx) => ({ label: s, done: i > -1 ? idx <= i : idx === 0, cancelled: status === "Cancelled" }));
  }
  VAYNOR.orderStatusTimeline = orderStatusTimeline;

  VAYNOR.db.orders = async function () {
    const user = await VAYNOR.user();
    if (user && user.via === "supabase" && client) {
      try {
        const { data, error } = await client.from("orders").select("*").eq("user_email", user.email).order("created_at", { ascending: false });
        if (!error && data && data.length) { VAYNOR.online = true; return data; }
      } catch (e) {}
    }
    return VAYNOR.ls.get(K.orders, []);
  };

  VAYNOR.db.allOrders = async function () {
    // Admin view: Supabase rows (if the table is live) merged with local demo orders.
    const local = VAYNOR.ls.get(K.orders, []);
    if (client) {
      try {
        const { data, error } = await client.from("orders").select("*").order("created_at", { ascending: false });
        if (!error && data && data.length) {
          VAYNOR.online = true;
          const merged = data.slice();
          local.forEach(o => { if (!merged.some(m => m.id === o.id)) merged.unshift(o); });
          return merged;
        }
      } catch (e) {}
    }
    return local;
  };

  VAYNOR.db.placeOrder = async function (order) {
    if (client) {
      try {
        const { error } = await client.from("orders").insert(order);
        if (!error) VAYNOR.online = true;
      } catch (e) {}
    }
    // Always mirror locally so the admin demo sees every order.
    const orders = VAYNOR.ls.get(K.orders, []);
    orders.unshift(order);
    VAYNOR.ls.set(K.orders, orders);
    return order;
  };

  VAYNOR.db.updateOrder = async function (id, patch) {
    const orders = VAYNOR.ls.get(K.orders, []).map(o => (o.id === id ? Object.assign({}, o, patch) : o));
    VAYNOR.ls.set(K.orders, orders);
    if (client && VAYNOR.online) { try { await client.from("orders").update(patch).eq("id", id); } catch (e) {} }
  };

  VAYNOR.db.findOrder = async function (id) {
    const all = await VAYNOR.db.allOrders();
    return all.find(o => String(o.id) === String(id)) || null;
  };

  /* ---------- customers (admin) ---------- */
  VAYNOR.db.customers = async function () {
    const orders = await VAYNOR.db.allOrders();
    const map = {};
    orders.forEach(o => {
      const c = o.customer || {};
      const key = c.email || c.phone || c.name || "guest";
      if (!map[key]) map[key] = { name: c.name || "Guest", email: c.email || "—", phone: c.phone || "—", orders: 0, spend: 0, joined: o.date || o.created_at };
      map[key].orders += 1;
      map[key].spend += Number(o.total || 0);
    });
    return Object.values(map);
  };

  /* ---------- categories ---------- */
  VAYNOR.db.categories = function () {
    const saved = VAYNOR.ls.get("vaynor_categories", null);
    return saved || VAYNOR.categories;
  };
  VAYNOR.db.saveCategories = function (list) { VAYNOR.ls.set("vaynor_categories", list); };
})();
