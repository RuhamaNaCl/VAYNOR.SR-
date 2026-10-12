/* VAYNOR ADMIN — guard, shell, and every admin screen.
   Demo-friendly: passcode unlocks local data mode; if Supabase tables are
   live, orders/products queries go through them. */
window.VAYNOR = window.VAYNOR || {};

(function () {
  const K = VAYNOR.config.storageKeys;
  const page = () => document.body.dataset.page || "";

  const svg = {
    dash: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/></svg>',
    box: '<svg viewBox="0 0 24 24"><path d="M3 8.5 12 4l9 4.5v7L12 20l-9-4.5v-7Z"/><path d="M3 8.5 12 13l9-4.5M12 13v7"/></svg>',
    cart: '<svg viewBox="0 0 24 24"><circle cx="9" cy="20" r="1.4"/><circle cx="17" cy="20" r="1.4"/><path d="M3 4h2l2.6 12h10L20 8H6"/></svg>',
    users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M16 5.6a3.2 3.2 0 0 1 0 5.8M17.5 19a5.5 5.5 0 0 0-2-4.3"/></svg>',
    tag: '<svg viewBox="0 0 24 24"><path d="M3 11V4h7l11 11-7 7L3 11Z"/><circle cx="7.5" cy="7.5" r="1.2"/></svg>',
    pct: '<svg viewBox="0 0 24 24"><path d="M5 19 19 5"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/></svg>',
    card: '<svg viewBox="0 0 24 24"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M3 10h18"/></svg>',
    star: '<svg viewBox="0 0 24 24"><path d="m12 4 2.4 4.9 5.4.8-3.9 3.8.9 5.4L12 16.4 7.2 18.9l.9-5.4L4.2 9.7l5.4-.8L12 4Z"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 3v2.6M12 18.4V21M3 12h2.6M18.4 12H21M5.6 5.6l1.9 1.9M16.5 16.5l1.9 1.9M18.4 5.6l-1.9 1.9M7.5 16.5l-1.9 1.9"/></svg>',
    home: '<svg viewBox="0 0 24 24"><path d="M4 11 12 4l8 7v8a1.5 1.5 0 0 1-1.5 1.5H14v-6h-4v6H5.5A1.5 1.5 0 0 1 4 19v-8Z"/></svg>'
  };

  const NAV = [
    ["dashboard", "Dashboard", "index.html", "dash"],
    ["products", "Products", "products.html", "box"],
    ["orders", "Orders", "orders.html", "cart"],
    ["customers", "Customers", "customers.html", "users"],
    ["categories", "Categories", "categories.html", "tag"],
    ["discounts", "Discounts", "discounts.html", "pct"],
    ["payments", "Payments", "payments.html", "card"],
    ["reviews", "Reviews", "reviews.html", "star"],
    ["settings", "Settings", "settings.html", "gear"]
  ];

  /* ---------- guard ---------- */
  async function authorized() {
    if (VAYNOR.ls.get(K.adminOk, false) === true) return true;
    if (VAYNOR.supabase) {
      try {
        const { data } = await VAYNOR.supabase.auth.getSession();
        if (data && data.session) return true;
      } catch (e) {}
    }
    return false;
  }

  function mountShell(active) {
    const shell = document.createElement("div");
    shell.className = "admin-shell";
    shell.innerHTML = `
      <aside class="admin-side">
        <div class="logo"><img src="../${VAYNOR.config.brand.logo}" alt="VAYNOR"><small>Admin</small></div>
        ${NAV.map(([id, label, href, ic]) =>
          `<a href="${href}" class="${id === active ? "on" : ""}">${svg[ic]}<span>${label}</span></a>`).join("")}
        <div class="spacer"></div>
        <a class="backlink" href="../index.html">${svg.home}<span>View storefront</span></a>
        <a href="#" data-admin-out><span>Sign out</span></a>
      </aside>
      <main class="admin-main"><div id="admin-content"></div></main>`;
    document.body.appendChild(shell);
    document.querySelector("[data-admin-out]")?.addEventListener("click", async (e) => {
      e.preventDefault();
      localStorage.removeItem(K.adminOk);
      if (VAYNOR.supabase) { try { await VAYNOR.supabase.auth.signOut(); } catch (err) {} }
      VAYNOR.go("login.html?notice=signed-out", true);
    });
    return shell.querySelector("#admin-content");
  }

  function head(title, crumbs, actions) {
    return `<div class="admin-top"><div><div class="crumbs">${crumbs}</div><h1>${title}</h1></div>
      <div style="display:flex;gap:10px;align-items:center">${actions || ""}
      <span class="badge-mode"><i></i>${VAYNOR.online ? "Supabase live" : "Demo mode"}</span></div></div>`;
  }

  /* ---------- pages ---------- */
  async function pageDashboard(root) {
    const [products, orders] = await Promise.all([VAYNOR.db.products(), VAYNOR.db.allOrders()]);
    const revenue = orders.reduce((s, o) => s + (Number(o.total) || 0), 0);
    const pending = orders.filter(o => (o.status || "Received") !== "Delivered").length;
    const custs = await VAYNOR.db.customers();
    const stars = VAYNOR.db.allReviews();
    const avg = stars.length ? (stars.reduce((s, r) => s + (Number(r.rating) || 0), 0) / stars.length).toFixed(1) : "—";
    root.innerHTML = head("Dashboard", "VAYNOR · overview", `<a class="mini-btn ok" href="orders.html">Manage orders →</a>`) + `
      <div class="stat-grid">
        <div class="stat"><div class="lbl">Revenue (all time)</div><div class="val">${VAYNOR.money(revenue)}</div><div class="sub"><span class="up">▲ ${orders.length} orders placed</span></div></div>
        <div class="stat"><div class="lbl">Open orders</div><div class="val">${pending}</div><div class="sub">${orders.length - pending} delivered</div></div>
        <div class="stat"><div class="lbl">Products</div><div class="val">${products.filter(p => p.is_active).length}</div><div class="sub">${products.filter(p => !p.is_active).length} draft</div></div>
        <div class="stat"><div class="lbl">Customers</div><div class="val">${custs.length}</div><div class="sub">★ ${avg} avg rating</div></div>
      </div>
      <div class="grid-2" style="align-items:start">
        <div class="panel">
          <div class="p-head"><h3>Recent orders</h3><a class="mini-btn" href="orders.html">All</a></div>
          <div class="table-wrap"><table class="a-table">
            <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>${orders.slice(0, 6).map(o => `
              <tr><td><a href="order-details.html?id=${encodeURIComponent(o.id)}" style="font-family:monospace">${VAYNOR.esc(o.id)}</a></td>
              <td>${VAYNOR.esc((o.customer || {}).name || "Guest")}</td>
              <td>${VAYNOR.money(o.total)}</td>
              <td><span class="badge ${String(o.status || "received").toLowerCase()}">${VAYNOR.esc(o.status || "Received")}</span></td></tr>`).join("")
              || '<tr><td colspan="4" class="muted">No orders yet. Place one from the storefront to see it here.</td></tr>'}
            </tbody></table></div>
        </div>
        <div class="panel">
          <div class="p-head"><h3>Catalogue health</h3></div>
          <div class="p-body"><table class="a-table">
            <thead><tr><th>Product</th><th>Price</th><th>Stock</th></tr></thead>
            <tbody>${products.map(p => `<tr><td><div class="t-name"><img src="${VAYNOR.esc((p.images || [])[0] || "")}" alt="">${VAYNOR.esc(p.name)}</div></td>
              <td>${VAYNOR.money(p.price)}</td>
              <td>${p.stock < 10 ? '<span class="badge cancelled">' + p.stock + " left</span>" : '<span class="badge delivered">' + p.stock + "</span>"}</td></tr>`).join("")}
            </tbody></table></div>
        </div>
      </div>`;
  }

  async function pageProducts(root) {
    const products = await VAYNOR.db.products();
    root.innerHTML = head("Products", "Catalogue", `<a class="btn sm" href="product-edit.html">+ New product</a>`) + `
      <div class="panel"><div class="table-wrap"><table class="a-table">
        <thead><tr><th>Name</th><th>Category</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead>
        <tbody>${products.map(p => `
          <tr>
            <td><div class="t-name"><img src="${VAYNOR.esc((p.images || [])[0] || "")}" alt="">
              <div><b>${VAYNOR.esc(p.name)}</b><br><small class="muted">${VAYNOR.esc(p.id)}</small></div></div></td>
            <td>${VAYNOR.esc(p.category || "—")}</td>
            <td>${VAYNOR.money(p.price)}</td>
            <td>${p.stock}</td>
            <td>${p.is_active ? '<span class="badge delivered">Published</span>' : '<span class="badge received">Draft</span>'}</td>
            <td><div class="actions">
              <a class="mini-btn" href="product-edit.html?id=${encodeURIComponent(p.id)}">Edit</a>
              <button class="mini-btn danger" data-del="${VAYNOR.esc(p.id)}">Delete</button>
            </div></td>
          </tr>`).join("")}</tbody>
      </table></div></div>
      <p class="card-note">Edits are saved to this browser's demo layer; wire the Supabase <code>products</code> table to persist for everyone.</p>`;
    root.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => {
      if (!confirm("Hide " + b.dataset.del + " from the storefront?")) return;
      VAYNOR.db.deleteProduct(b.dataset.del);
      pageProducts(root);
      VAYNOR.toast("Product removed");
    }));
  }

  function pageProductEdit(root) {
    const id = VAYNOR.query("id") || "";
    VAYNOR.db.product(id || "__none__").then(existing => {
      const p = (id && existing && existing.id === id) ? existing : null;
      document.querySelector(".admin-top h1") && (document.title = (p ? "Edit" : "New") + " product | VAYNOR Admin");
      root.innerHTML = head(p ? "Edit product" : "New product", `<a href="products.html">Products</a> · ${p ? VAYNOR.esc(p.name) : "draft"}`) + `
        <form class="panel" id="p-form" style="max-width:760px"><div class="p-body pad">
          <div class="field-row">
            <div class="field"><label>Name</label><input name="name" value="${VAYNOR.esc(p?.name || "")}" required></div>
            <div class="field"><label>Category</label><input name="category" list="cats" value="${VAYNOR.esc(p?.category || "")}"><datalist id="cats">${VAYNOR.db.categories().map(c => `<option>${VAYNOR.esc(c)}</option>`).join("")}</datalist></div>
          </div>
          <div class="field-row">
            <div class="field"><label>Price (${VAYNOR.settings().currency})</label><input name="price" type="number" min="0" step="10" value="${p?.price ?? 2490}" required></div>
            <div class="field"><label>Compare-at price</label><input name="compare_at" type="number" min="0" step="10" value="${p?.compare_at ?? ""}"></div>
          </div>
          <div class="field-row">
            <div class="field"><label>Stock</label><input name="stock" type="number" min="0" value="${p?.stock ?? 10}"></div>
            <div class="field"><label>Badge (optional)</label><input name="badge" value="${VAYNOR.esc(p?.badge || "")}" placeholder="e.g. New"></div>
          </div>
          <div class="field"><label>Image paths (one per line)</label><textarea name="images" rows="3">${VAYNOR.esc((p?.images || ["assets/images/bracelet-main.jpg"]).join("\n"))}</textarea></div>
          <div class="field"><label>Short description</label><textarea name="short" rows="2">${VAYNOR.esc(p?.short || "")}</textarea></div>
          <div class="field"><label>Full description</label><textarea name="description" rows="4">${VAYNOR.esc(p?.description || "")}</textarea></div>
          <div class="field"><label>Features (one per line)</label><textarea name="features" rows="3">${VAYNOR.esc((p?.features || []).join("\n"))}</textarea></div>
          <label class="radio-card sel" style="margin:6px 0 18px"><input type="checkbox" name="is_active" ${p?.is_active !== false ? "checked" : ""}> Published (visible in the shop)</label>
          <div style="display:flex;gap:10px">
            <button class="btn" type="submit">${p ? "Save changes" : "Create product"}</button>
            <a class="btn ghost" href="products.html">Back</a>
          </div>
        </div></form>`;
      document.getElementById("p-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const f = e.target;
        const nid = p ? p.id : ("vaynor-" + Date.now().toString(36).slice(-5));
        VAYNOR.db.saveProduct(nid, {
          id: nid,
          name: f.querySelector("[name=name]").value.trim(),
          category: f.querySelector("[name=category]").value.trim() || "Bracelets",
          price: Number(f.querySelector("[name=price]").value) || 0,
          compare_at: f.querySelector("[name=compare_at]").value ? Number(f.querySelector("[name=compare_at]").value) : null,
          stock: Number(f.querySelector("[name=stock]").value) || 0,
          badge: f.querySelector("[name=badge]").value.trim() || null,
          images: f.querySelector("[name=images]").value.split("\n").map(s => s.trim()).filter(Boolean),
          short: f.querySelector("[name=short]").value.trim(),
          description: f.querySelector("[name=description]").value.trim(),
          features: f.querySelector("[name=features]").value.split("\n").map(s => s.trim()).filter(Boolean),
          is_active: f.querySelector("[name=is_active]").checked
        });
        VAYNOR.toast("Product saved");
        setTimeout(() => (location.href = "products.html"), 500);
      });
    });
  }

  async function pageOrders(root, detail) {
    const orders = await VAYNOR.db.allOrders();
    if (detail) {
      const o = orders.find(x => String(x.id) === String(detail));
      root.innerHTML = head("Order " + (o ? o.id : ""), `<a href="orders.html">Orders</a> · ${detail}`);
      root.innerHTML += o ? `
        <div class="grid-2" style="align-items:start">
          <div class="panel"><div class="p-head"><h3>Items</h3></div><div class="p-body"><table class="a-table">
            <tbody>${(o.items || []).map(i => `<tr><td><div class="t-name"><img src="${VAYNOR.esc(i.img || "")}">${VAYNOR.esc(i.name)}</div></td><td>${i.qty} × ${VAYNOR.money(i.price)}</td><td>${VAYNOR.money(i.qty * i.price)}</td></tr>`).join("")}</tbody>
          </table><div style="padding:0 20px 16px" class="sum-line total"><span>Total</span><b>${VAYNOR.money(o.total)}</b></div></div></div>
          <div class="panel"><div class="p-head"><h3>Fulfilment</h3></div><div class="p-body pad">
            <div class="field"><label>Status</label><select id="o-status" class="a-input" style="width:100%">
              ${["Received", "Packed", "Shipped", "Delivered", "Cancelled"].map(s => `<option ${o.status === s ? "selected" : ""}>${s}</option>`).join("")}
            </select></div>
            <p class="muted" style="font-size:13.5px">${VAYNOR.esc((o.customer || {}).name || "Guest")}<br>${VAYNOR.esc((o.customer || {}).phone || "")}<br>${VAYNOR.esc((o.customer || {}).address || "")}, ${VAYNOR.esc((o.customer || {}).city || "")}</p>
            <p class="small muted">Payment: ${VAYNOR.esc(o.payment || "Cash on delivery")}${o.promo ? " · promo " + VAYNOR.esc(o.promo) : ""}<br>Placed ${new Date(o.created_at || o.date).toLocaleString()}</p>
            <button class="btn sm" id="o-save">Save fulfilment</button>
          </div></div>
        </div>` : '<p class="lead">Order not found.</p>';
      document.getElementById("o-save")?.addEventListener("click", async () => {
        const st = document.getElementById("o-status").value;
        await VAYNOR.db.updateOrder(o.id, { status: st });
        VAYNOR.toast("Order marked " + st);
      });
      return;
    }
    root.innerHTML = head("Orders", "Fulfilment") + `
      <div class="panel"><div class="table-wrap"><table class="a-table">
        <thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Payment</th><th>Placed</th><th>Status</th></tr></thead>
        <tbody>${orders.map(o => `
          <tr>
            <td><a href="order-details.html?id=${encodeURIComponent(o.id)}" style="font-family:monospace;color:var(--brass-2)">${VAYNOR.esc(o.id)}</a></td>
            <td>${VAYNOR.esc((o.customer || {}).name || "Guest")}<br><small class="muted">${VAYNOR.esc((o.customer || {}).phone || "")}</small></td>
            <td>${VAYNOR.money(o.total)}</td>
            <td>${VAYNOR.esc(o.payment || "COD")}</td>
            <td class="muted small">${new Date(o.created_at || o.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</td>
            <td><select class="a-select" data-status="${VAYNOR.esc(o.id)}">
              ${["Received", "Packed", "Shipped", "Delivered", "Cancelled"].map(s => `<option ${o.status === s ? "selected" : ""}>${s}</option>`).join("")}
            </select></td>
          </tr>`).join("") || '<tr><td colspan="6" class="muted" style="padding:18px 20px">No orders yet. Place a demo order from the storefront checkout and it lands here.</td></tr>'}
        </tbody>
      </table></div></div>`;
    root.querySelectorAll("[data-status]").forEach(sel => sel.addEventListener("change", async () => {
      await VAYNOR.db.updateOrder(sel.dataset.status, { status: sel.value });
      VAYNOR.toast(sel.dataset.status + " → " + sel.value);
    }));
  }

  async function pageCustomers(root) {
    const list = await VAYNOR.db.customers();
    root.innerHTML = head("Customers", "Relationships") + `
      <div class="panel"><div class="table-wrap"><table class="a-table">
        <thead><tr><th>Name</th><th>Contact</th><th>Orders</th><th>Lifetime value</th><th>Joined</th></tr></thead>
        <tbody>${list.map(c => `<tr><td><b>${VAYNOR.esc(c.name)}</b></td>
          <td>${VAYNOR.esc(c.email)}<br><small class="muted">${VAYNOR.esc(c.phone)}</small></td>
          <td>${c.orders}</td><td>${VAYNOR.money(c.spend)}</td>
          <td class="muted small">${new Date(c.joined).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</td></tr>`).join("")
          || '<tr><td colspan="5" class="muted" style="padding:18px 20px">Customers appear here after their first order.</td></tr>'}
        </tbody></table></div></div>`;
  }

  function pageCategories(root) {
    const list = VAYNOR.db.categories();
    const draw = () => {
      root.innerHTML = head("Categories", "Catalogue structure") + `
        <div class="panel" style="max-width:560px"><div class="p-body pad">
          ${list.map((c, i) => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:11px 4px;border-bottom:1px solid var(--line)">
              <span>${VAYNOR.esc(c)}</span>
              <button class="mini-btn danger" data-i="${i}">Remove</button>
            </div>`).join("")}
          <form id="cat-form" style="display:flex;gap:10px;margin-top:16px">
            <input class="a-input" style="flex:1" name="c" placeholder="New category name" required>
            <button class="btn sm">Add</button>
          </form>
        </div></div>`;
      root.querySelectorAll("[data-i]").forEach(b => b.addEventListener("click", () => {
        list.splice(Number(b.dataset.i), 1);
        VAYNOR.db.saveCategories(list);
        draw();
      }));
      root.querySelector("#cat-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const v = e.target.querySelector("[name=c]").value.trim();
        if (v && !list.includes(v)) { list.push(v); VAYNOR.db.saveCategories(list); draw(); VAYNOR.toast("Category added"); }
      });
    };
    draw();
  }

  function pageDiscounts(root) {
    const draw = () => {
      const list = VAYNOR.db.discounts();
      root.innerHTML = head("Discounts", "Promo codes") + `
        <div class="panel" style="max-width:640px"><div class="table-wrap"><table class="a-table">
          <thead><tr><th>Code</th><th>Percent</th><th>Label</th><th>Active</th><th></th></tr></thead>
          <tbody>${list.map((d, i) => `<tr>
            <td style="font-family:monospace">${VAYNOR.esc(d.code)}</td><td>${d.percent}%</td><td class="muted">${VAYNOR.esc(d.label || "")}</td>
            <td><label class="switch"><input type="checkbox" data-on="${i}" ${d.active ? "checked" : ""}><i></i></label></td>
            <td><button class="mini-btn danger" data-x="${i}">Delete</button></td></tr>`).join("")}
          </tbody></table></div>
          <form id="d-form" class="p-body pad" style="display:flex;gap:10px;flex-wrap:wrap;border-top:1px solid var(--line)">
            <input class="a-input" name="code" placeholder="CODE" required style="flex:1;min-width:120px">
            <input class="a-input" name="pct" type="number" min="1" max="90" placeholder="%" required style="width:90px">
            <input class="a-input" name="label" placeholder="Label" style="flex:1;min-width:140px">
            <button class="btn sm">Create</button>
          </form>
        </div>
        <p class="card-note">Codes work in the storefront checkout promo box (demo layer).</p>`;
      root.querySelectorAll("[data-on]").forEach(ch => ch.addEventListener("change", () => {
        const l = VAYNOR.db.discounts(); l[Number(ch.dataset.on)].active = ch.checked; VAYNOR.db.saveDiscounts(l);
      }));
      root.querySelectorAll("[data-x]").forEach(b => b.addEventListener("click", () => {
        const l = VAYNOR.db.discounts(); l.splice(Number(b.dataset.x), 1); VAYNOR.db.saveDiscounts(l); draw();
      }));
      root.querySelector("#d-form").addEventListener("submit", (e) => {
        e.preventDefault();
        const f = e.target;
        const code = f.querySelector("[name=code]").value.trim().toUpperCase();
        if (!code) return;
        const l = VAYNOR.db.discounts();
        if (l.some(d => d.code === code)) return VAYNOR.toast("Code already exists");
        l.push({ code, percent: Math.max(1, Math.min(90, Number(f.querySelector("[name=pct]").value) || 0)), label: f.querySelector("[name=label]").value.trim() || "Promo", active: true });
        VAYNOR.db.saveDiscounts(l);
        draw();
        VAYNOR.toast("Code " + code + " created");
      });
    };
    draw();
  }

  async function pagePayments(root) {
    const orders = await VAYNOR.db.allOrders();
    const byMethod = {};
    orders.forEach(o => {
      const m = o.payment || "Cash on delivery";
      byMethod[m] = (byMethod[m] || 0) + Number(o.total || 0);
    });
    const paid = orders.filter(o => o.payment && o.payment !== "Cash on delivery" && o.status !== "Cancelled");
    root.innerHTML = head("Payments", "Money in") + `
      <div class="stat-grid">
        <div class="stat"><div class="lbl">Collected (bKash/Nagad)</div><div class="val">${VAYNOR.money(paid.reduce((s, o) => s + Number(o.total || 0), 0))}</div></div>
        <div class="stat"><div class="lbl">Awaiting COD cash</div><div class="val">${VAYNOR.money(orders.filter(o => (!o.payment || o.payment === "Cash on delivery") && o.status !== "Cancelled" && o.status !== "Delivered").reduce((s, o) => s + Number(o.total || 0), 0))}</div></div>
        <div class="stat"><div class="lbl">Delivered & settled</div><div class="val">${VAYNOR.money(orders.filter(o => o.status === "Delivered").reduce((s, o) => s + Number(o.total || 0), 0))}</div></div>
      </div>
      <div class="panel"><div class="p-head"><h3>By method</h3></div><div class="p-body"><table class="a-table">
        <tbody>${Object.entries(byMethod).map(([m, v]) => `<tr><td>${VAYNOR.esc(m)}</td><td>${VAYNOR.money(v)}</td>
          <td><button class="mini-btn" data-mark="${VAYNOR.esc(m)}">Mark newest as paid</button></td></tr>`).join("")
          || '<tr><td class="muted" style="padding:18px 20px">No payments yet.</td></tr>'}</tbody>
      </table></div></div>`;
    root.querySelectorAll("[data-mark]").forEach(b => b.addEventListener("click", async () => {
      const hit = orders.find(o => (o.payment || "Cash on delivery") === b.dataset.mark);
      if (!hit) return;
      await VAYNOR.db.updateOrder(hit.id, { status: hit.status === "Received" ? "Packed" : hit.status });
      VAYNOR.toast(hit.id + " marked as paid, moved to fulfilment");
    }));
  }

  function pageReviews(root) {
    const draw = () => {
      const list = VAYNOR.db.allReviews();
      root.innerHTML = head("Reviews", "Social proof") + `
        <div class="panel"><div class="table-wrap"><table class="a-table">
          <thead><tr><th>Reviewer</th><th>Rating</th><th>Text</th><th>Shown</th><th></th></tr></thead>
          <tbody>${list.map(r => `<tr>
            <td><b>${VAYNOR.esc(r.author)}</b><br><small class="muted">${VAYNOR.esc((r.date || "").slice(0, 10))} · ${VAYNOR.esc(r.product)}</small></td>
            <td style="color:var(--brass)">${"★".repeat(Number(r.rating) || 5)}</td>
            <td style="max-width:380px" class="muted">${VAYNOR.esc(r.text)}</td>
            <td>${r.approved ? '<span class="badge delivered">Visible</span>' : '<span class="badge received">Hidden</span>'}</td>
            <td>${r.via === "local" ? `<button class="mini-btn" data-tog="${VAYNOR.esc(r.id)}" data-to="${r.approved ? 0 : 1}">${r.approved ? "Hide" : "Approve"}</button>` : '<span class="muted small">seed data</span>'}</td>
          </tr>`).join("")}</tbody></table></div></div>`;
      root.querySelectorAll("[data-tog]").forEach(b => b.addEventListener("click", () => {
        VAYNOR.db.setReviewApproved(b.dataset.tog, b.dataset.to === "1");
        draw();
      }));
    };
    draw();
  }

  function pageSettings(root) {
    const s = VAYNOR.settings();
    root.innerHTML = head("Settings", "Storefront overrides") + `
      <form class="panel" style="max-width:720px" id="s-form"><div class="p-body pad">
        <div class="field"><label>Brand tagline</label><input name="tagline" value="${VAYNOR.esc(s.tagline)}"></div>
        <div class="field"><label>Hero headline (HTML allowed, e.g. &lt;em&gt;)</label><textarea name="heroTitle" rows="2">${VAYNOR.esc(s.heroTitle)}</textarea></div>
        <div class="field-row">
          <div class="field"><label>Currency symbol</label><input name="currency" value="${VAYNOR.esc(s.currency)}"></div>
          <div class="field"><label>Free shipping from</label><input name="freeShippingFrom" type="number" value="${s.freeShippingFrom}"></div>
        </div>
        <div class="field-row">
          <div class="field"><label>Flat shipping (below threshold)</label><input name="shippingFlat" type="number" value="${s.shippingFlat}"></div>
          <div class="field"><label>Demo intro splash</label><select name="intro"><option value="1">On</option><option value="0">Off</option></select></div>
        </div>
        <button class="btn">Save settings</button> <a class="btn ghost" href="../index.html">Preview storefront</a>
      </div></form>`;
    if (VAYNOR.settings().intro === false) root.querySelector('[name=intro]').value = "0";
    root.querySelector("#s-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target;
      VAYNOR.ls.set(K.settings, {
        tagline: f.querySelector("[name=tagline]").value.trim(),
        heroTitle: f.querySelector("[name=heroTitle]").value.trim(),
        currency: f.querySelector("[name=currency]").value.trim() || "৳",
        freeShippingFrom: Number(f.querySelector("[name=freeShippingFrom]").value) || 0,
        shippingFlat: Number(f.querySelector("[name=shippingFlat]").value) || 0,
        intro: f.querySelector("[name=intro]").value === "1"
      });
      VAYNOR.toast("Settings saved");
    });
  }

  function pageLogin(root) {
    root.innerHTML = `
      <div class="admin-login-box">
        <img src="../${VAYNOR.config.brand.logo}" alt="VAYNOR">
        <p class="eyebrow">Store Operations</p>
        <h2 style="font-family:var(--font-display)">Admin sign-in</h2>
        <p class="muted small">Demo passcode unlocks the local data layer. With Supabase configured, your authenticated session also works.</p>
        <form id="adm-form" style="margin-top:18px;text-align:left">
          <div class="field"><label>Passcode</label><input name="code" type="password" placeholder="VAYNOR-ADMIN" autocomplete="off"></div>
          <button class="btn block" type="submit">Enter dashboard</button>
        </form>
        <p class="card-note" style="margin-top:14px">Hint for the demo: the passcode lives in <code>js/config.js</code>.</p>
      </div>`;
    document.getElementById("adm-form").addEventListener("submit", (e) => {
      e.preventDefault();
      if (e.target.querySelector("[name=code]").value.trim() === VAYNOR.config.admin.passcode) {
        VAYNOR.ls.set(K.adminOk, true);
        VAYNOR.go(VAYNOR.safeNext(VAYNOR.query("next"), "index.html"), true);
      } else VAYNOR.toast("Wrong passcode");
    });
  }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", async () => {
    const p = page();
    if (p === "admin-login") { mountShellMini(); pageLogin(document.getElementById("admin-content")); return; }
    if (!(await authorized())) {
      VAYNOR.toast("Admin passcode required");
      VAYNOR.go("login.html?next=" + encodeURIComponent(location.pathname.split("/").pop() || "index.html"), true);
      return;
    }
    const root = mountShell(p);
    if (p === "dashboard") await pageDashboard(root);
    if (p === "products") await pageProducts(root);
    if (p === "product-edit") pageProductEdit(root);
    if (p === "orders") await pageOrders(root);
    if (p === "order-details") await pageOrders(root, VAYNOR.query("id"));
    if (p === "customers") await pageCustomers(root);
    if (p === "categories") pageCategories(root);
    if (p === "discounts") pageDiscounts(root);
    if (p === "payments") await pagePayments(root);
    if (p === "reviews") pageReviews(root);
    if (p === "settings") pageSettings(root);
  });

  function mountShellMini() {
    document.body.insertAdjacentHTML("afterbegin",
      '<main class="admin-main" style="padding:0"><div id="admin-content" style="min-height:100vh;display:grid;place-items:center"></div></main>');
    document.body.classList.add("admin-body");
    document.querySelector("body").insertAdjacentHTML("beforeend", '<div class="toast-host"></div>');
  }
})();
