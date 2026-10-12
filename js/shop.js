/* VAYNOR — shop grid with category chips + search, wishlist hearts. */
window.VAYNOR = window.VAYNOR || {};

(function () {
  let all = [];
  let filter = { cat: "All", q: "" };

  function cardHTML(p) {
    const on = VAYNOR.wish.has(p.id);
    return `
      <article class="p-card" data-reveal>
        <div class="ph">
          ${p.badge ? `<span class="flag">${VAYNOR.esc(p.badge)}</span>` : ""}
          <button class="wish ${on ? "on" : ""}" data-wish="${VAYNOR.esc(p.id)}" aria-label="Save ${VAYNOR.esc(p.name)}">
            <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.7-9.5-9A5.4 5.4 0 0 1 12 6.3 5.4 5.4 0 0 1 21.5 12c-2 4.3-9.5 9-9.5 9Z"/></svg>
          </button>
          <a href="product.html?id=${encodeURIComponent(p.id)}"><img src="${VAYNOR.esc(p.images[0] || "")}" alt="${VAYNOR.esc(p.name)}" loading="lazy"></a>
        </div>
        <div class="body">
          <h3><a href="product.html?id=${encodeURIComponent(p.id)}">${VAYNOR.esc(p.name)}</a></h3>
          <span class="muted small">${VAYNOR.esc(p.category)}</span>
          <div class="meta">
            <span class="price">${VAYNOR.money(p.price)}</span>
            <button class="add-mini" data-add-to-cart="${VAYNOR.esc(p.id)}">Add to bag</button>
          </div>
        </div>
      </article>`;
  }

  function render() {
    const grid = VAYNOR.$("#shop-grid");
    if (!grid) return;
    let list = all.filter(p => p.is_active);
    if (filter.cat !== "All") list = list.filter(p => p.category === filter.cat);
    if (filter.q) {
      const q = filter.q.toLowerCase();
      list = list.filter(p => (p.name + " " + p.short + " " + p.category).toLowerCase().includes(q));
    }
    VAYNOR.$("#shop-count").textContent = list.length + (list.length === 1 ? " piece" : " pieces");
    grid.innerHTML = list.length
      ? list.map(cardHTML).join("")
      : `<div class="empty-state" style="grid-column:1/-1"><p class="lead">Nothing matches. Try another search.</p><a class="btn ghost" href="shop.html">Clear</a></div>`;
    // re-arm reveal for freshly injected nodes
    VAYNOR.$$("#shop-grid [data-reveal]:not(.in)").forEach(el => el.classList.add("in"));
  }

  document.addEventListener("DOMContentLoaded", async () => {
    all = await VAYNOR.db.products();
    const chips = VAYNOR.$("#shop-chips");
    const cats = ["All", ...new Set(all.filter(p => p.is_active).map(p => p.category))];
    chips.innerHTML = cats.map(c => `<button class="chip-btn ${c === "All" ? "on" : ""}" data-cat="${VAYNOR.esc(c)}">${VAYNOR.esc(c)}</button>`).join("");
    chips.addEventListener("click", (e) => {
      const b = e.target.closest("[data-cat]");
      if (!b) return;
      filter.cat = b.dataset.cat;
      VAYNOR.$$("[data-cat]", chips).forEach(x => x.classList.toggle("on", x === b));
      render();
    });

    const search = VAYNOR.$("#shop-search");
    if (filter.q) search.value = filter.q;
    search?.addEventListener("input", () => { filter.q = search.value.trim(); render(); });

    // Deep link: shop.html?q=...
    const q = VAYNOR.query("q");
    if (q) { filter.q = q; search.value = q; }

    render();
  });

  document.addEventListener("vaynor:wish", () => {
    VAYNOR.$$("#shop-grid .wish").forEach(btn => btn.classList.toggle("on", VAYNOR.wish.has(btn.dataset.wish)));
  });
})();
