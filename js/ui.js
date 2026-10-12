/* VAYNOR — shared UI: chrome (header/footer/mobile nav), cart drawer,
   toasts, scroll-reveal, intro splash, helpers. Injected into every page. */
window.VAYNOR = window.VAYNOR || {};

(function () {
  VAYNOR.$ = (sel, root) => (root || document).querySelector(sel);
  VAYNOR.$$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  VAYNOR.esc = (value) => String(value ?? "").replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[ch]));
  VAYNOR.query = (name) => new URLSearchParams(location.search).get(name);

  /* ---------- toasts ---------- */
  VAYNOR.toast = function (msg, ms) {
    let host = VAYNOR.$(".toast-host");
    if (!host) { host = document.createElement("div"); host.className = "toast-host"; document.body.appendChild(host); }
    const t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    t.innerHTML = '<span class="tdot"></span><span>' + VAYNOR.esc(msg) + "</span>";
    host.appendChild(t);
    setTimeout(() => { t.classList.add("leaving"); setTimeout(() => t.remove(), 350); }, ms || 2600);
  };

  /* ---------- chrome ---------- */
  const C = VAYNOR.config;
  const page = document.body.dataset.page || "";
  const nav = [
    ["index", "Home", "index.html"],
    ["shop", "Shop", "shop.html"],
    ["product", "Product", "product.html"],
    ["about", "About", "about.html"],
    ["contact", "Contact", "contact.html"]
  ];
  const svg = {
    bag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M6 8h12l-1 12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="8" r="3.4"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></svg>',
    menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4 7h16M4 12h16M4 17h10"/></svg>'
  };

  function headerHTML() {
    return `
      <a class="brand" href="index.html" aria-label="VAYNOR home">
        <img src="${C.brand.logo}" alt="VAYNOR">
      </a>
      <nav class="main-nav" aria-label="Primary">
        ${nav.map(([id, label, href]) => `<a href="${href}" ${page === id ? 'aria-current="page"' : ""}>${label}</a>`).join("")}
      </nav>
      <div class="header-actions">
        <a class="account-link" href="account.html">Account</a>
        <button class="icon-btn" data-open-cart aria-label="Open bag">
          ${svg.bag}<span class="dot" data-cart-count>0</span>
        </button>
        <button class="icon-btn nav-toggle" data-open-nav aria-label="Open menu" style="display:none">${svg.menu}</button>
      </div>`;
  }

  function footerHTML() {
    const s = VAYNOR.settings();
    return `
      <div class="wrap">
        <div class="cols">
          <div>
            <h4>The House of VAYNOR</h4>
            <p style="max-width:34ch">${VAYNOR.esc(s.tagline)} One bracelet, made properly. Designed in Dhaka, worn everywhere.</p>
            <div class="wordmark">VAYNOR</div>
          </div>
          <div>
            <h4>Shop</h4>
            <ul>
              <li><a href="shop.html">All pieces</a></li>
              <li><a href="product.html">The Bracelet</a></li>
              <li><a href="wishlist.html">Wishlist</a></li>
              <li><a href="cart.html">Your bag</a></li>
            </ul>
          </div>
          <div>
            <h4>Account</h4>
            <ul>
              <li><a href="account.html">My account</a></li>
              <li><a href="orders.html">Orders</a></li>
              <li><a href="addresses.html">Addresses</a></li>
              <li><a href="login.html">Sign in</a></li>
            </ul>
          </div>
          <div>
            <h4>Care</h4>
            <ul>
              <li><a href="contact.html">${VAYNOR.esc(C.contact.email)}</a></li>
              <li><a href="tel:${VAYNOR.esc(C.contact.phone.replace(/\s|-/g, ""))}">${VAYNOR.esc(C.contact.phone)}</a></li>
              <li><a href="https://wa.me/${VAYNOR.esc(C.contact.whatsapp)}" target="_blank" rel="noopener">WhatsApp us</a></li>
              <li>${VAYNOR.esc(C.contact.address)}</li>
            </ul>
            <div class="pay-badges"><span>bKash</span><span>Nagad</span><span> Cash on delivery</span></div>
          </div>
        </div>
        <div class="legal">
          <span>© <span data-year>${new Date().getFullYear()}</span> VAYNOR. All rights reserved.</span>
          <span>Discover. Choose. Order.</span>
        </div>
      </div>`;
  }

  function mountChrome() {
    const header = VAYNOR.$("[data-chrome=header]");
    if (header) { header.className = "site-header"; header.innerHTML = headerHTML(); }
    const footer = VAYNOR.$("[data-chrome=footer]");
    if (footer) { footer.className = "site-footer"; footer.innerHTML = footerHTML(); }

    document.body.insertAdjacentHTML("beforeend", `
      <div class="nav-scrim" data-close-overlays></div>
      <aside class="mobile-nav" id="mobile-nav" aria-label="Menu">
        <button class="icon-btn close-x" data-close-overlays aria-label="Close menu">✕</button>
        ${nav.map(([id, label, href]) => `<a href="${href}" ${page === id ? 'aria-current="page"' : ""}>${label}</a>`).join("")}
        <a href="login.html">Account</a>
        <a href="cart.html">Your bag</a>
        <a href="wishlist.html">Wishlist</a>
      </aside>
      <div class="cart-scrim" data-close-overlays></div>
      <aside class="cart-drawer" id="cart-drawer" aria-label="Shopping bag">
        <div class="cd-head"><b style="font-family:var(--font-display);font-size:1.15rem">Your bag</b><button class="icon-btn" data-close-overlays aria-label="Close bag">✕</button></div>
        <div class="cd-body" id="drawer-items"></div>
        <div class="cd-foot">
          <div class="sum-line total" style="border:0;padding:0;margin:0"><span>Subtotal</span><b data-drawer-total></b></div>
          <a class="btn block" href="checkout.html">Checkout</a>
          <a class="btn ghost block sm" href="cart.html">View full bag</a>
        </div>
      </aside>`);

    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-open-cart]")) toggleOverlay(true);
      if (e.target.closest("[data-open-nav]")) { VAYNOR.$("#mobile-nav").classList.add("open"); VAYNOR.$(".nav-scrim").classList.add("open"); }
      if (e.target.closest("[data-close-overlays]")) toggleOverlay(false, true);
      const back = e.target.closest("[data-back]");
      if (back) {
        e.preventDefault();
        if (history.length > 1) history.back();
        else location.href = back.dataset.back || "shop.html";
      }
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") toggleOverlay(false, true); });
  }

  function toggleOverlay(open, alsoNav) {
    const drawer = VAYNOR.$("#cart-drawer");
    if (drawer) drawer.classList.toggle("open", !!open);
    VAYNOR.$$(".cart-scrim").forEach(s => s.classList.toggle("open", !!open));
    if (alsoNav) {
      VAYNOR.$("#mobile-nav")?.classList.remove("open");
      VAYNOR.$(".nav-scrim")?.classList.remove("open");
    }
  }
  VAYNOR.openCartDrawer = () => toggleOverlay(true);
  VAYNOR.closeOverlays = () => toggleOverlay(false, true);

  /* ---------- scroll reveal ---------- */
  function initReveal() {
    const els = VAYNOR.$$("[data-reveal]");
    if (!els.length) return;
    if (!("IntersectionObserver" in window) || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach(el => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { threshold: 0.12 });
    els.forEach(el => io.observe(el));
  }

  /* ---------- intro splash (home only) ---------- */
  function intro() {
    if (!document.body.hasAttribute("data-intro") || VAYNOR.settings().intro === false) return;
    const s = VAYNOR.settings();
    const el = document.createElement("div");
    el.className = "intro-splash";
    el.innerHTML = `
      <div>
        <img class="is-logo" src="${VAYNOR.config.brand.logo}" alt="VAYNOR">
        <div class="is-line"></div>
        <p>${VAYNOR.esc(s.tagline)}</p>
        <button class="skip" id="intro-skip">Skip</button>
      </div>`;
    document.body.appendChild(el);
    const done = () => el.remove();
    el.querySelector("#intro-skip").addEventListener("click", done);
    setTimeout(done, 2200);
  }

  document.addEventListener("DOMContentLoaded", () => {
    mountChrome();
    initReveal();
    intro();
    VAYNOR.$$("[data-year]").forEach(y => (y.textContent = new Date().getFullYear()));
    const s = VAYNOR.settings();
    VAYNOR.$$("[data-bind]").forEach(el => {
      const v = s[el.dataset.bind];
      if (v == null) return;
      if (el.dataset.bind === "heroTitle") el.innerHTML = v;
      else if (el.dataset.bind === "freeShippingFrom" || el.dataset.bind === "shippingFlat") el.textContent = VAYNOR.money(v);
      else el.textContent = v;
    });
  });
})();
