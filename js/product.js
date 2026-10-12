/* VAYNOR — product detail page: gallery, qty, add-to-cart, accordions, reviews. */
window.VAYNOR = window.VAYNOR || {};

(function () {
  let product = null;

  function stars(rating) {
    const full = Math.round(Number(rating) || 0);
    return '<span class="stars" aria-label="' + rating + ' out of 5">' + "★".repeat(full) + "☆".repeat(5 - full) + "</span>";
  }

  function renderReviews() {
    const box = VAYNOR.$("#review-list");
    if (!box) return;
    const list = VAYNOR.db.reviews(product.id);
    box.innerHTML = list.length
      ? list.map(r => `
        <div class="review">
          <div class="who"><b>${VAYNOR.esc(r.author)}</b><small class="muted">${VAYNOR.esc((r.date || "").slice(0, 10))}</small></div>
          <span class="stars">${"★".repeat(Number(r.rating) || 5)}</span>
          <p style="margin:6px 0 0;color:var(--muted)">${VAYNOR.esc(r.text)}</p>
        </div>`).join("")
      : '<p class="muted">No reviews yet. Be the first.</p>';
  }

  function paint(p) {
    product = p;
    document.title = p.name + " | VAYNOR";

    const imgs = (p.images && p.images.length) ? p.images : ["assets/images/bracelet-main.jpg"];
    VAYNOR.$("#gallery-main").innerHTML = `<img src="${VAYNOR.esc(imgs[0])}" alt="${VAYNOR.esc(p.name)}">`;
    VAYNOR.$("#gallery-thumbs").innerHTML = imgs.map((src, i) =>
      `<button class="${i === 0 ? "on" : ""}" data-img="${VAYNOR.esc(src)}" aria-label="View image ${i + 1}"><img src="${VAYNOR.esc(src)}" alt=""></button>`).join("");
    VAYNOR.$("#gallery-thumbs").addEventListener("click", (e) => {
      const b = e.target.closest("[data-img]");
      if (!b) return;
      VAYNOR.$("#gallery-main img").src = b.dataset.img;
      VAYNOR.$$("#gallery-thumbs button").forEach(x => x.classList.toggle("on", x === b));
    });

    VAYNOR.$("#p-name").textContent = p.name;
    VAYNOR.$("#p-price").textContent = VAYNOR.money(p.price);
    VAYNOR.$("#p-was").textContent = p.compare_at ? VAYNOR.money(p.compare_at) : "";
    VAYNOR.$("#p-short").textContent = p.short;
    VAYNOR.$("#p-rating").innerHTML = stars(p.rating) + ` <span class="muted">${p.rating} · ${p.review_count} reviews</span>`;
    VAYNOR.$("#p-stock").innerHTML = p.stock > 0
      ? `<span class="badge received">In stock · ${p.stock} left</span>`
      : `<span class="badge cancelled">Sold out</span>`;
    VAYNOR.$("#p-features").innerHTML = p.features.map(f => `<li>${VAYNOR.esc(f)}</li>`).join("");
    VAYNOR.$("#p-description").textContent = p.description;
    VAYNOR.$("#p-specs").innerHTML = Object.entries(p.specs || {}).map(([k, v]) => `<tr><td>${VAYNOR.esc(k)}</td><td>${VAYNOR.esc(v)}</td></tr>`).join("");

    const wish = VAYNOR.$("#p-wish");
    if (wish) { wish.classList.toggle("on", VAYNOR.wish.has(p.id)); wish.dataset.wish = p.id; }

    VAYNOR.$("#add-main").addEventListener("click", () => {
      const qty = Number(VAYNOR.$("#p-qty").textContent || 1);
      VAYNOR.cart.add(p, qty);
    });
    VAYNOR.$("#buy-now")?.addEventListener("click", () => {
      VAYNOR.cart.add(p, Number(VAYNOR.$("#p-qty").textContent || 1));
      location.href = "checkout.html";
    });

    renderReviews();
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const want = VAYNOR.query("id");
    const list = await VAYNOR.db.products();
    const p = want
      ? list.find(x => x.id === want)
      : (list.find(x => x.id === "vaynor-bracelet") || list[0]);
    if (want && !p) return VAYNOR.go("shop.html?notice=not-found", true);
    if (!p) return;
    paint(p);

    // qty stepper
    VAYNOR.$$("[data-step]").forEach(b => b.addEventListener("click", () => {
      const el = VAYNOR.$("#p-qty");
      el.textContent = Math.max(1, Math.min(10, Number(el.textContent) + Number(b.dataset.step)));
    }));

    // accordions
    VAYNOR.$$(".acc-item > button").forEach(btn => btn.addEventListener("click", () => {
      btn.parentElement.classList.toggle("open");
    }));

    // review form
    VAYNOR.$("#review-form")?.addEventListener("submit", (e) => {
      e.preventDefault();
      const f = e.target;
      const text = f.querySelector("[name=review-text]").value.trim();
      if (text.length < 8) return VAYNOR.toast("Tell us a little more");
      VAYNOR.db.addReview({
        product: p.id,
        author: (f.querySelector("[name=review-name]").value.trim() || "Verified buyer").slice(0, 40),
        rating: Number(f.querySelector("[name=review-rating]").value || 5),
        text,
        date: new Date().toISOString()
      });
      f.reset();
      renderReviews();
      VAYNOR.toast("Thanks, review published");
    });

    // breadcrumbs + related
    VAYNOR.$$("#related-grid").length &&
      VAYNOR.db.products().then(all => {
        const rel = all.filter(x => x.is_active && x.id !== p.id).slice(0, 3);
        const grid = VAYNOR.$("#related-grid");
        if (grid && rel.length) {
          grid.innerHTML = rel.map(r => `
            <article class="p-card">
              <div class="ph"><a href="product.html?id=${encodeURIComponent(r.id)}"><img src="${VAYNOR.esc(r.images[0] || "")}" alt="${VAYNOR.esc(r.name)}" loading="lazy"></a></div>
              <div class="body"><h3>${VAYNOR.esc(r.name)}</h3>
                <div class="meta"><span class="price">${VAYNOR.money(r.price)}</span>
                <a class="add-mini" href="product.html?id=${encodeURIComponent(r.id)}">View</a></div>
              </div>
            </article>`).join("");
        }
      });
  });
})();
