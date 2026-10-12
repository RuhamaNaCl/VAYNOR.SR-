/* VAYNOR — central redirect system.
   · Auth gates: any page with <body data-protected> sends guests to
     login.html?next=<page>; after sign-in the user returns there.
   · Safe hand-off: ?next= only accepts plain "page.html" names — no
     protocols, no paths — so nobody can weaponize it as an open redirect.
   · VAYNOR.go(url, replace) is the single navigation funnel; every
     automatic redirect goes through it (and logs to window.__navLog,
     which the test harness asserts against).
   · ?notice=<key> shows a toast on the target page, then cleans the URL.
   · 404 auto-redirects home with a countdown; offline returns on reconnect.
   · Already-signed-in visitors on login/register bounce to their next page. */
window.VAYNOR = window.VAYNOR || {};

(function () {
  const NOTICES = {
    "login-required": "Please sign in to continue",
    "cart-empty": "Your bag is empty. Add something first",
    "not-found": "That piece isn't in the collection, showing everything we have",
    "order-not-found": "We couldn't find that order",
    "admin-required": "Admin passcode required",
    "signed-out": "Signed out. See you soon"
  };

  /* ---------- navigation funnel ---------- */
  VAYNOR.go = function (url, replace) {
    if (Array.isArray(window.__navLog)) window.__navLog.push(url);
    if (replace) location.replace(url);
    else location.href = url;
  };

  /* ---------- safe ?next= resolver ---------- */
  VAYNOR.safeNext = function (next, fallback) {
    const n = String(next || "");
    return /^[A-Za-z0-9_-]+\.html$/.test(n) ? n : fallback;
  };

  /* ---------- ?notice= toast, then URL cleanup ---------- */
  function showNotice() {
    const key = VAYNOR.query("notice");
    if (!key) return;
    if (NOTICES[key]) VAYNOR.toast(NOTICES[key]);
    try {
      const u = new URL(location.href);
      u.searchParams.delete("notice");
      history.replaceState(null, "", u.pathname + (u.searchParams.toString() ? "?" + u.searchParams : ""));
    } catch (e) {}
  }

  function currentPage() { return location.pathname.split("/").pop() || "index.html"; }

  /* ---------- 404: countdown home ---------- */
  function notFoundCountdown() {
    const host = VAYNOR.$(".center");
    if (!host) return;
    let n = 10;
    const p = document.createElement("p");
    p.className = "muted small";
    p.style.marginTop = "22px";
    host.appendChild(p);
    function draw() {
      p.innerHTML = 'Taking you home in <b style="color:var(--ivory)">' + n + "s</b> · " +
        '<button class="rm" data-stop-countdown style="color:var(--muted);text-decoration:underline">Stay on this page</button>';
    }
    draw();
    const iv = setInterval(() => {
      n -= 1;
      if (n <= 0) { clearInterval(iv); VAYNOR.go("index.html", true); return; }
      draw();
    }, 1000);
    document.addEventListener("click", (e) => {
      if (e.target.closest("[data-stop-countdown]")) { clearInterval(iv); p.textContent = "Countdown cancelled. You can navigate whenever you're ready."; }
    });
  }

  /* ---------- offline: return when reconnected ---------- */
  function offlineWatcher() {
    const note = document.createElement("p");
    note.className = "muted small";
    note.style.marginTop = "16px";
    note.textContent = navigator.onLine ? "Connection looks back. Refreshing now." : "We'll bring you back automatically when you reconnect.";
    document.querySelector(".center")?.appendChild(note);
    window.addEventListener("online", () => VAYNOR.go("index.html", true));
    if (navigator.onLine) setTimeout(() => VAYNOR.go("index.html", true), 1200);
  }

  /* ---------- boot ---------- */
  document.addEventListener("DOMContentLoaded", async () => {
    showNotice();
    const page = currentPage();
    const user = await VAYNOR.user();

    // protected pages (account, addresses) — guests hop to login with a return path
    if (document.body.hasAttribute("data-protected") && !user) {
      VAYNOR.toast(NOTICES["login-required"]);
      return VAYNOR.go("login.html?next=" + encodeURIComponent(page), true);
    }

    // signed-in users don't need the login pages
    if ((page === "login.html" || page === "register.html") && user) {
      return VAYNOR.go(VAYNOR.safeNext(VAYNOR.query("next"), "account.html"), true);
    }

    if (page === "404.html") notFoundCountdown();
    if (page === "offline.html") offlineWatcher();
  });
})();
