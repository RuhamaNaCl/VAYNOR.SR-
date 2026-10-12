/* VAYNOR — auth pages. Uses Supabase email auth when reachable; otherwise
   falls back to a local demo account so the flow is testable end-to-end. */
window.VAYNOR = window.VAYNOR || {};

(function () {
  const K = VAYNOR.config.storageKeys;

  function setModeNotice(el, mode) {
    if (!el) return;
    if (mode === "supabase") {
      el.className = "notice ok";
      el.textContent = "Connected to Supabase. Accounts are real.";
    } else {
      el.className = "notice info";
      el.textContent = "Demo mode: the Supabase project isn't responding, so your account is stored in this browser only.";
    }
  }

  async function supabaseOk() {
    const client = VAYNOR.supabase;
    if (!client) return false;
    try { const { data } = await client.auth.getSession(); return !!data; } catch (e) { return false; }
  }

  function validate(form) {
    let ok = true;
    VAYNOR.$$(".field", form).forEach(f => f.classList.remove("invalid"));
    const email = form.querySelector("[name=email]");
    if (email && !/^\S+@\S+\.\S+$/.test(email.value.trim())) {
      email.closest(".field").classList.add("invalid");
      ok = false;
    }
    const pass = form.querySelector("[name=password]");
    if (pass && pass.value.length < 6) {
      pass.closest(".field").classList.add("invalid");
      ok = false;
    }
    const name = form.querySelector("[name=name]");
    if (name && !name.value.trim()) { name.closest(".field").classList.add("invalid"); ok = false; }
    return ok;
  }

  document.addEventListener("DOMContentLoaded", async () => {
    const live = await supabaseOk();
    const client = live ? VAYNOR.supabase : null;

    setModeNotice(VAYNOR.$("#auth-mode"), client ? "supabase" : "demo");

    const loginForm = VAYNOR.$("#login-form");
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!validate(loginForm)) return VAYNOR.toast("Check the highlighted fields");
        const email = loginForm.querySelector("[name=email]").value.trim();
        const password = loginForm.querySelector("[name=password]").value;
        if (client) {
          const { data, error } = await client.auth.signInWithPassword({ email, password });
          if (error) { VAYNOR.toast(error.message); return; }
          if (!data.user) { VAYNOR.toast("Login failed"); return; }
        } else {
          VAYNOR.ls.set(K.demoUser, { email, via: "demo", name: email.split("@")[0] });
        }
        VAYNOR.toast("Welcome back");
        const back = VAYNOR.safeNext(VAYNOR.query("next"), "account.html");
        setTimeout(() => VAYNOR.go(back, true), 550);
      });
    }

    const regForm = VAYNOR.$("#register-form");
    if (regForm) {
      regForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (!validate(regForm)) return VAYNOR.toast("Check the highlighted fields");
        const email = regForm.querySelector("[name=email]").value.trim();
        const password = regForm.querySelector("[name=password]").value;
        const pass2 = regForm.querySelector("[name=password2]");
        if (pass2.value !== password) {
          pass2.closest(".field").classList.add("invalid");
          return VAYNOR.toast("Passwords don't match");
        }
        const fullName = regForm.querySelector("[name=name]").value.trim();
        if (client) {
          const { data, error } = await client.auth.signUp({ email, password, options: { data: { name: fullName } } });
          if (error) { VAYNOR.toast(error.message); return; }
          if (data.user && !data.session) { VAYNOR.toast("Check your inbox to confirm your email"); return; }
        } else {
          VAYNOR.ls.set(K.demoUser, { email, via: "demo", name: fullName });
        }
        VAYNOR.toast("Account created");
        const backR = VAYNOR.safeNext(VAYNOR.query("next"), "account.html");
        setTimeout(() => VAYNOR.go(backR, true), 650);
      });
    }

    /* Google sign-in — Supabase only. */
    VAYNOR.$$("[data-google]").forEach(btn => btn.addEventListener("click", async () => {
      if (!client) return VAYNOR.toast("Google sign-in needs the Supabase connection");
      const { error } = await client.auth.signInWithOAuth({ provider: "google" });
      if (error) VAYNOR.toast(error.message);
    }));

    /* Sign-out buttons anywhere. */
    VAYNOR.$$("[data-signout]").forEach(btn => btn.addEventListener("click", async (e) => {
      e.preventDefault();
      await VAYNOR.signOut();
      VAYNOR.toast("Signed out");
      setTimeout(() => VAYNOR.go("index.html?notice=signed-out", true), 550);
    }));
  });
})();
