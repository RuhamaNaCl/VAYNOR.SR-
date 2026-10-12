/* VAYNOR — checkout: summary + promo + place order (Supabase when live,
   localStorage otherwise). Clears the cart on success. */
window.VAYNOR = window.VAYNOR || {};

(function () {
  let promo = null;

  function totals() {
    return VAYNOR.cart.totals(promo ? promo.percent : 0);
  }

  function renderSummary() {
    const items = VAYNOR.cart.get();
    const box = VAYNOR.$("#checkout-items");
    if (!box) return;
    box.innerHTML = items.length
      ? items.map(x => `
        <div class="cd-line">
          <img src="${VAYNOR.esc(x.img)}" alt="">
          <div class="t"><b>${VAYNOR.esc(x.name)}</b><span>${x.qty} × ${VAYNOR.money(x.price)}</span></div>
          <span class="price">${VAYNOR.money(x.price * x.qty)}</span>
        </div>`).join("")
      : '<p class="muted" style="padding:12px 0">Your bag is empty.</p>';
    const t = totals();
    VAYNOR.$("#sum-sub").textContent = VAYNOR.money(t.subtotal);
    VAYNOR.$("#sum-disc").textContent = t.discount ? "− " + VAYNOR.money(t.discount) : "—";
    VAYNOR.$("#sum-ship").textContent = t.shipping ? VAYNOR.money(t.shipping) : "Free";
    VAYNOR.$("#sum-total").textContent = VAYNOR.money(t.total);
    VAYNOR.$("#place-order-label").textContent = items.length ? "Place order · " + VAYNOR.money(t.total) : "Your bag is empty";
    VAYNOR.$("#place-order").disabled = !items.length;
  }

  function fieldError(input, bad) {
    input.closest(".field").classList.toggle("invalid", bad);
    return !bad;
  }

  document.addEventListener("DOMContentLoaded", () => {
    if (!VAYNOR.$("#checkout-form")) return;
    if (!VAYNOR.cart.get().length) {
      VAYNOR.toast("Your bag is empty. Add something first");
      return VAYNOR.go("cart.html", true);
    }
    renderSummary();
    document.addEventListener("vaynor:cart", renderSummary);

    /* payment method cards */
    VAYNOR.$$("input[name=payment]").forEach(r => r.addEventListener("change", () => {
      VAYNOR.$$(".radio-card").forEach(c => c.classList.toggle("sel", c.contains(r) && r.checked));
    }));

    /* prefilled from account */
    VAYNOR.user().then(u => {
      if (u && u.email && !location.hash.includes("noFill")) VAYNOR.$("#co-email").value = u.email;
      if (u && u.name) VAYNOR.$("#co-name").value = u.name;
    });
    const lastAddr = VAYNOR.ls.get(VAYNOR.config.storageKeys.addresses, [])[0];
    if (lastAddr) {
      VAYNOR.$("#co-phone").value = lastAddr.phone || "";
      VAYNOR.$("#co-address").value = lastAddr.address || "";
      VAYNOR.$("#co-city").value = lastAddr.city || "";
      VAYNOR.$("#co-area").value = lastAddr.area || "";
    }

    /* promo */
    VAYNOR.$("#promo-apply").addEventListener("click", () => {
      const code = VAYNOR.$("#promo-code").value;
      promo = VAYNOR.db.applyPromo(code);
      VAYNOR.$("#promo-note").textContent = promo
        ? "✓ " + promo.label + ", " + promo.percent + "% off applied"
        : (code.trim() ? "That code isn't valid." : "Enter a code first.");
      VAYNOR.$("#promo-note").style.color = promo ? "var(--ok)" : "var(--bad)";
      renderSummary();
    });

    /* submit */
    VAYNOR.$("#checkout-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const f = e.target;
      const ok =
        fieldError(f.querySelector("#co-name"), f.querySelector("#co-name").value.trim().length < 2) &
        fieldError(f.querySelector("#co-phone"), !/^(\+?880|0)1[3-9]\d{8}$/.test(f.querySelector("#co-phone").value.replace(/[\s-]/g, ""))) &
        fieldError(f.querySelector("#co-email"), !/^\S+@\S+\.\S+$/.test(f.querySelector("#co-email").value.trim())) &
        fieldError(f.querySelector("#co-address"), f.querySelector("#co-address").value.trim().length < 6) &
        fieldError(f.querySelector("#co-city"), !f.querySelector("#co-city").value);
      if (!ok) return VAYNOR.toast("Please fix the highlighted fields");
      if (!VAYNOR.cart.get().length) return VAYNOR.toast("Your bag is empty");

      const btn = VAYNOR.$("#place-order");
      btn.disabled = true;
      const label = VAYNOR.$("#place-order-label");
      if (label) label.textContent = "Placing order…";

      const t = totals();
      const user = await VAYNOR.user();
      const id = "VY" + Date.now().toString().slice(-8);
      const order = {
        id,
        created_at: new Date().toISOString(),
        date: new Date().toISOString(),
        user_email: (user && user.email) || null,
        customer: {
          name: f.querySelector("#co-name").value.trim(),
          phone: f.querySelector("#co-phone").value.trim(),
          email: f.querySelector("#co-email").value.trim(),
          address: f.querySelector("#co-address").value.trim(),
          city: f.querySelector("#co-city").value,
          area: f.querySelector("#co-area").value.trim(),
          notes: f.querySelector("#co-notes").value.trim()
        },
        items: VAYNOR.cart.get().map(x => ({ id: x.id, name: x.name, price: x.price, qty: x.qty, img: x.img })),
        subtotal: t.subtotal,
        discount: t.discount,
        promo: promo ? promo.code : null,
        shipping: t.shipping,
        total: t.total,
        payment: f.querySelector("input[name=payment]:checked").value,
        status: "Received"
      };

      await VAYNOR.db.placeOrder(order);
      VAYNOR.cart.clear();
      document.getElementById("checkout-live").style.display = "none";
      const okPanel = document.getElementById("checkout-success");
      okPanel.style.display = "block";
      VAYNOR.$("#success-order-id").textContent = order.id;
      const track = VAYNOR.$("#success-track");
      track.href = "order-details.html?id=" + encodeURIComponent(order.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
})();
