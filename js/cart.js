/* VAYNOR — cart store + drawer rendering. Cart lives in localStorage and
   every mutation fires a `vaynor:cart` event so badges/summaries update. */
window.VAYNOR = window.VAYNOR || {};

(function () {
  const KEY = VAYNOR.config.storageKeys.cart;

  const Cart = VAYNOR.cart = {
    get() { return VAYNOR.ls.get(KEY, []); },
    save(items) {
      VAYNOR.ls.set(KEY, items);
      document.dispatchEvent(new CustomEvent("vaynor:cart"));
    },
    count() { return Cart.get().reduce((s, x) => s + x.qty, 0); },
    subtotal() { return Cart.get().reduce((s, x) => s + x.price * x.qty, 0); },
    add(product, qty) {
      qty = Math.max(1, qty || 1);
      const items = Cart.get();
      const hit = items.find(x => x.id === product.id);
      if (hit) hit.qty = Math.min(10, hit.qty + qty);
      else items.push({ id: product.id, name: product.name, price: product.price, img: (product.images && product.images[0]) || "", qty });
      Cart.save(items);
      VAYNOR.toast(product.name + " added to your bag");
      VAYNOR.openCartDrawer();
    },
    setQty(id, qty) {
      let items = Cart.get();
      const hit = items.find(x => x.id === id);
      if (!hit) return;
      if (qty <= 0) items = items.filter(x => x.id !== id);
      else hit.qty = Math.min(10, qty);
      Cart.save(items);
    },
    remove(id) { Cart.save(Cart.get().filter(x => x.id !== id)); },
    clear() { Cart.save([]); },
    totals(discountPercent) {
      const s = VAYNOR.settings();
      const subtotal = Cart.subtotal();
      const discount = subtotal * (Number(discountPercent) || 0) / 100;
      const shipping = subtotal - discount === 0 ? 0 : (subtotal - discount >= s.freeShippingFrom ? 0 : s.shippingFlat);
      return { subtotal, discount, shipping, total: Math.max(0, subtotal - discount + shipping) };
    }
  };

  /* ---------- rendering ---------- */
  function badge() {
    const n = Cart.count();
    VAYNOR.$$("[data-cart-count]").forEach(el => {
      el.textContent = n || "";
      el.dataset.zero = n ? "0" : "1";
    });
  }

  function drawer() {
    const box = VAYNOR.$("#drawer-items");
    if (!box) return;
    const items = Cart.get();
    if (!items.length) {
      box.innerHTML = `<p class="muted" style="padding:34px 6px;text-align:center">Your bag is empty.<br><a href="shop.html" style="color:var(--brass)">Browse the collection →</a></p>`;
      VAYNOR.$("[data-drawer-total]").textContent = "";
      return;
    }
    box.innerHTML = items.map(x => `
      <div class="cd-line">
        <img src="${VAYNOR.esc(x.img)}" alt="">
        <div class="t"><b>${VAYNOR.esc(x.name)}</b><span>${x.qty} × ${VAYNOR.money(x.price)}</span></div>
        <button class="mini-btn" data-drawer-remove="${VAYNOR.esc(x.id)}" aria-label="Remove ${VAYNOR.esc(x.name)}">✕</button>
      </div>`).join("");
    const tot = Cart.totals();
    VAYNOR.$("[data-drawer-total]").textContent = VAYNOR.money(tot.subtotal);
  }

  function bind() {
    document.addEventListener("click", (e) => {
      const addBtn = e.target.closest("[data-add-to-cart]");
      if (addBtn) {
        e.preventDefault();
        VAYNOR.db.product(addBtn.dataset.addToCart).then(p => p && Cart.add(p, Number(addBtn.dataset.qty || 1)));
      }
      const rm = e.target.closest("[data-drawer-remove]");
      if (rm) { Cart.remove(rm.dataset.drawerRemove); }
    });
    document.addEventListener("vaynor:cart", () => { badge(); drawer(); });
  }

  /* ---------- full cart page ---------- */
  function renderPage() {
    const root = VAYNOR.$("#cart-root");
    if (!root) return;
    const items = Cart.get();
    if (!items.length) {
      root.innerHTML = `<div class="empty-state"><div class="big-ico">${'<svg viewBox="0 0 24 24"><path d="M6 8h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>'}</div>
        <h2>Your bag is empty</h2><p class="lead">One bracelet. A lot of thought. Add it and it lives here.</p>
        <a class="btn" href="shop.html">Browse the collection</a></div>`;
      return;
    }
    root.innerHTML = items.map(x => `
      <div class="cart-line" data-line="${VAYNOR.esc(x.id)}">
        <img src="${VAYNOR.esc(x.img)}" alt="">
        <div class="t"><h3>${VAYNOR.esc(x.name)}</h3><span class="muted">${VAYNOR.money(x.price)} each</span><br>
          <button class="rm" data-cart-remove="${VAYNOR.esc(x.id)}">Remove</button></div>
        <div class="qty">
          <button data-cart-step="-1" aria-label="Decrease">−</button><b>${x.qty}</b><button data-cart-step="1" aria-label="Increase">+</button>
        </div>
        <div class="line-price">${VAYNOR.money(x.price * x.qty)}</div>
      </div>`).join("");
  }

  document.addEventListener("click", (e) => {
    const rm = e.target.closest("[data-cart-remove]");
    if (rm) { Cart.remove(rm.dataset.cartRemove); renderPage(); return; }
    const step = e.target.closest("[data-cart-step]");
    if (step) {
      const id = step.closest("[data-line]").dataset.line;
      const item = Cart.get().find(x => x.id === id);
      if (item) { Cart.setQty(id, item.qty + Number(step.dataset.cartStep)); renderPage(); }
    }
  });

  document.addEventListener("DOMContentLoaded", () => { bind(); badge(); drawer(); renderPage(); document.addEventListener("vaynor:cart", renderPage); });
})();
