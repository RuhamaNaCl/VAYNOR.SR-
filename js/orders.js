/* VAYNOR — account pages: orders list, order details, account dashboard,
   addresses CRUD, wishlist page, contact form. */
window.VAYNOR = window.VAYNOR || {};

(function () {
  const page = () => document.body.dataset.page;

  function badge(status) { return `<span class="badge ${String(status || "received").toLowerCase()}">${VAYNOR.esc(status || "Received")}</span>`; }

  function moneyHead(el, txt) { if (el) el.textContent = txt; }

  async function renderOrders() {
    const box = VAYNOR.$("#orders-list");
    if (!box) return;
    const list = await VAYNOR.db.orders();
    box.innerHTML = list.length
      ? list.map(o => {
          const items = o.items || [];
          return `
          <a class="order-card" style="display:block" href="order-details.html?id=${encodeURIComponent(o.id)}">
            <div class="oc-head">
              <div><b style="font-family:monospace;letter-spacing:.06em">${VAYNOR.esc(o.id)}</b>
                <span class="muted small"> · ${new Date(o.created_at || o.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span></div>
              ${badge(o.status)}
            </div>
            <div class="oc-body">
              ${items.map(i => `<img src="${VAYNOR.esc(i.img || "")}" alt="">`).join("")}
              <div class="t" style="flex:1;min-width:140px">${VAYNOR.esc(items.map(i => i.qty + "× " + i.name).join(", ") || "—")}</div>
              <b style="font-family:var(--font-display);font-size:1.05rem">${VAYNOR.money(o.total)}</b>
              <span class="muted small">View →</span>
            </div>
          </a>`;
        }).join("")
      : `<div class="empty-state"><div class="big-ico"><svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg></div>
         <h2>Nothing here yet</h2><p class="lead">When you place an order it will appear right here.</p><a class="btn" href="shop.html">Start shopping</a></div>`;
  }

  async function renderOrderDetail() {
    const box = VAYNOR.$("#order-detail");
    if (!box) return;
    const wanted = VAYNOR.query("id");
    if (!wanted) return VAYNOR.go("orders.html", true);
    const o = await VAYNOR.db.findOrder(wanted);
    if (!o) return VAYNOR.go("orders.html?notice=order-not-found", true);
    const steps = VAYNOR.orderStatusTimeline(o.status || "Received");
    const c = o.customer || {};
    box.innerHTML = `
      <div class="grid-2" style="align-items:start">
        <div>
          <h3 style="font-family:var(--font-display);margin-bottom:14px">Progress</h3>
          <div class="timeline">
            ${steps.map(s => `
              <div class="tl ${s.done ? "done" : ""}">
                <div class="dotcol"><i></i><span></span></div>
                <div class="txt"><b>${VAYNOR.esc(s.label)}</b><small>${s.done ? "Completed" : "Waiting"}</small></div>
              </div>`).join("")}
          </div>
          <p class="muted small" style="margin-top:14px">${o.payment ? "Payment: " + VAYNOR.esc(o.payment) : "Payment: Cash on delivery"}</p>
        </div>
        <div>
          <h3 style="font-family:var(--font-display)">Delivering to</h3>
          <p class="muted">${VAYNOR.esc(c.name || "—")}<br>${VAYNOR.esc(c.address || "")}${c.area ? ", " + VAYNOR.esc(c.area) : ""}<br>${VAYNOR.esc(c.city || "")}<br>${VAYNOR.esc(c.phone || "")}${c.notes ? "<br><small>Notes: " + VAYNOR.esc(c.notes) + "</small>" : ""}</p>
          <h3 style="font-family:var(--font-display);margin-top:22px">Items</h3>
          ${(o.items || []).map(i => `
            <div class="cd-line">
              <img src="${VAYNOR.esc(i.img || "")}" alt="">
              <div class="t"><b>${VAYNOR.esc(i.name)}</b><span>${i.qty} × ${VAYNOR.money(i.price)}</span></div>
              <span>${VAYNOR.money(i.price * i.qty)}</span>
            </div>`).join("")}
          <div class="sum-line"><span>Subtotal</span><b>${VAYNOR.money(o.subtotal || o.total)}</b></div>
          ${o.discount ? `<div class="sum-line"><span>Discount (${VAYNOR.esc(o.promo || "promo")})</span><b>− ${VAYNOR.money(o.discount)}</b></div>` : ""}
          <div class="sum-line"><span>Shipping</span><b>${o.shipping ? VAYNOR.money(o.shipping) : "Free"}</b></div>
          <div class="sum-line total"><span>Total</span><b>${VAYNOR.money(o.total)}</b></div>
          <button class="btn ghost sm" onclick="window.print()">Print receipt</button>
        </div>
      </div>`;
    moneyHead(VAYNOR.$("#detail-id"), o.id);
    VAYNOR.$("#detail-badge").innerHTML = badge(o.status);
  }

  async function renderAccount() {
    const root = VAYNOR.$("#account-root");
    if (!root) return;
    const user = await VAYNOR.user();
    if (!user) return; // redirects.js sends guests to login.html?next=account.html
    const initial = (user.name || user.email || "V").trim().charAt(0).toUpperCase();
    VAYNOR.$("#acct-initial").textContent = initial;
    VAYNOR.$("#acct-name").textContent = user.name || "VAYNOR member";
    VAYNOR.$("#acct-email").textContent = user.email;
    VAYNOR.$("#acct-mode").textContent = user.via === "supabase" ? "Live · Supabase" : "Demo · this browser";
    const orders = await VAYNOR.db.orders();
    VAYNOR.$("#acct-orders").textContent = orders.length;
    VAYNOR.$("#acct-spend").textContent = VAYNOR.money(orders.reduce((s, o) => s + (Number(o.total) || 0), 0));
    VAYNOR.$("#acct-wish").textContent = VAYNOR.wish.get().length;
    VAYNOR.$("#acct-addr").textContent = VAYNOR.ls.get(VAYNOR.config.storageKeys.addresses, []).length;
  }

  /* ---------- addresses ---------- */
  function addrList() { return VAYNOR.ls.get(VAYNOR.config.storageKeys.addresses, []); }

  function renderAddresses() {
    const box = VAYNOR.$("#addr-list");
    if (!box) return;
    const list = addrList();
    box.innerHTML = list.length
      ? list.map((a, i) => `
        <div class="card">
          <div style="display:flex;justify-content:space-between;gap:10px;align-items:center">
            <h3 style="margin:0">${VAYNOR.esc(a.label || "Address " + (i + 1))}</h3>
            <button class="mini-btn danger" data-addr-del="${i}">Delete</button>
          </div>
          <p style="margin-top:10px">${VAYNOR.esc(a.name)} · ${VAYNOR.esc(a.phone)}<br>${VAYNOR.esc(a.address)}${a.area ? ", " + VAYNOR.esc(a.area) : ""}<br>${VAYNOR.esc(a.city)}</p>
        </div>`).join("")
      : '<p class="muted">No saved addresses yet. Add one and checkout will prefill from it.</p>';
  }

  function bindAddresses() {
    const form = VAYNOR.$("#addr-form");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = form;
      if (!f.querySelector("[name=addr-name]").value.trim() || !f.querySelector("[name=addr-address]").value.trim()) return VAYNOR.toast("Name and address are required");
      const list = addrList();
      list.unshift({
        label: f.querySelector("[name=addr-label]").value.trim() || "Address " + (list.length + 1),
        name: f.querySelector("[name=addr-name]").value.trim(),
        phone: f.querySelector("[name=addr-phone]").value.trim(),
        address: f.querySelector("[name=addr-address]").value.trim(),
        area: f.querySelector("[name=addr-area]").value.trim(),
        city: f.querySelector("[name=addr-city]").value
      });
      VAYNOR.ls.set(VAYNOR.config.storageKeys.addresses, list);
      f.reset();
      renderAddresses();
      VAYNOR.toast("Address saved");
    });
    document.addEventListener("click", (e) => {
      const del = e.target.closest("[data-addr-del]");
      if (!del) return;
      const list = addrList();
      list.splice(Number(del.dataset.addrDel), 1);
      VAYNOR.ls.set(VAYNOR.config.storageKeys.addresses, list);
      renderAddresses();
    });
    renderAddresses();
  }

  /* ---------- wishlist page ---------- */
  async function renderWishlist() {
    const grid = VAYNOR.$("#wish-grid");
    if (!grid) return;
    const ids = VAYNOR.wish.get();
    if (!ids.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="big-ico"><svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.7-9.5-9A5.4 5.4 0 0 1 12 6.3 5.4 5.4 0 0 1 21.5 12c-2 4.3-9.5 9-9.5 9Z"/></svg></div><h2>No saved pieces yet</h2><p class="lead">Tap the heart on anything you love and it waits for you here.</p><a class="btn" href="shop.html">Browse the collection</a></div>`;
      return;
    }
    const all = await VAYNOR.db.products();
    const list = ids.map(id => all.find(p => p.id === id)).filter(Boolean);
    grid.innerHTML = list.map(p => `
      <article class="p-card">
        <div class="ph">
          <button class="wish on" data-wish="${VAYNOR.esc(p.id)}" aria-label="Remove"><svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.7-9.5-9A5.4 5.4 0 0 1 12 6.3 5.4 5.4 0 0 1 21.5 12c-2 4.3-9.5 9-9.5 9Z"/></svg></button>
          <a href="product.html?id=${encodeURIComponent(p.id)}"><img src="${VAYNOR.esc(p.images[0] || "")}" alt="${VAYNOR.esc(p.name)}"></a>
        </div>
        <div class="body"><h3>${VAYNOR.esc(p.name)}</h3><div class="meta">
          <span class="price">${VAYNOR.money(p.price)}</span>
          <button class="add-mini" data-add-to-cart="${VAYNOR.esc(p.id)}">Add to bag</button>
        </div></div>
      </article>`).join("");
  }

  document.addEventListener("vaynor:wish", () => { if (page() === "wishlist") renderWishlist(); });

  document.addEventListener("DOMContentLoaded", () => {
    const p = page();
    if (p === "orders") renderOrders();
    if (p === "order-details") renderOrderDetail();
    if (p === "account") renderAccount();
    if (p === "addresses") bindAddresses();
    if (p === "wishlist") renderWishlist();

    /* contact form — demo mailto handoff */
    VAYNOR.$("#contact-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target;
      const name = f.querySelector("[name=c-name]").value.trim();
      const msg = f.querySelector("[name=c-message]").value.trim();
      if (name.length < 2 || msg.length < 10) return VAYNOR.toast("Add your name and a fuller message");
      const to = VAYNOR.config.contact.email;
      location.href = "mailto:" + to + "?subject=" + encodeURIComponent("VAYNOR enquiry from " + name) + "&body=" + encodeURIComponent(msg + "\n\n" + name + " (" + f.querySelector("[name=c-email]").value + ")");
      VAYNOR.toast("Opening your email app to " + to);
      f.reset();
    });
  });
})();
