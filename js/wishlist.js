/* VAYNOR — wishlist store (localStorage) + heart buttons. */
window.VAYNOR = window.VAYNOR || {};

(function () {
  const KEY = VAYNOR.config.storageKeys.wishlist;

  const Wish = VAYNOR.wish = {
    get() { return VAYNOR.ls.get(KEY, []); },
    has(id) { return Wish.get().includes(id); },
    toggle(id) {
      let list = Wish.get();
      const on = !list.includes(id);
      list = on ? list.concat(id) : list.filter(x => x !== id);
      VAYNOR.ls.set(KEY, list);
      document.dispatchEvent(new CustomEvent("vaynor:wish"));
      VAYNOR.toast(on ? "Saved to wishlist" : "Removed from wishlist");
      return on;
    }
  };

  const heart = '<svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.7-9.5-9A5.4 5.4 0 0 1 12 6.3 5.4 5.4 0 0 1 21.5 12c-2 4.3-9.5 9-9.5 9Z"/></svg>';

  function paint(scope) {
    VAYNOR.$$("[data-wish]", scope).forEach(btn => btn.classList.toggle("on", Wish.has(btn.dataset.wish)));
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-wish]");
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    btn.classList.toggle("on", Wish.toggle(btn.dataset.wish));
    document.dispatchEvent(new CustomEvent("vaynor:wish"));
  });

  document.addEventListener("vaynor:wish", () => paint());
  document.addEventListener("DOMContentLoaded", () => paint());
})();
