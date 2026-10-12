/* VAYNOR — brand + service configuration. */
window.VAYNOR = window.VAYNOR || {};

VAYNOR.config = {
  brand: {
    name: "VAYNOR",
    tagline: "Define your presence.",
    logo: "assets/Vaynor-logo.jpeg",
    currency: "৳",
    locale: "en-BD",
    freeShippingFrom: 1500,
    shippingFlat: 60,
    intro: true
  },
  contact: {
    email: "care@vaynor.shop",
    phone: "+880 1700-000000",
    whatsapp: "8801700000000",
    address: "Dhaka, Bangladesh"
  },
  supabase: {
    url: "https://hddphtxjtcjqqeouxqmh.supabase.co",
    key: "sb_publishable__vvKVbVuGpyS0SR4fAuxrQ_c8Bofd0Y"
  },
  admin: {
    passcode: "VAYNOR-ADMIN"
  },
  storageKeys: {
    cart: "vaynor_cart_v2",
    wishlist: "vaynor_wishlist_v2",
    orders: "vaynor_orders_v2",
    addresses: "vaynor_addresses",
    products: "vaynor_products_admin",
    reviews: "vaynor_reviews",
    discounts: "vaynor_discounts",
    settings: "vaynor_settings",
    adminOk: "vaynor_admin_ok",
    demoUser: "vaynor_demo_user"
  }
};

/* Settings saved from the admin panel override brand defaults at runtime. */
VAYNOR.settings = function () {
  const base = {
    tagline: VAYNOR.config.brand.tagline,
    heroTitle: "Every detail<br><em>has a purpose.</em>",
    currency: VAYNOR.config.brand.currency,
    freeShippingFrom: VAYNOR.config.brand.freeShippingFrom,
    shippingFlat: VAYNOR.config.brand.shippingFlat,
    intro: VAYNOR.config.brand.intro
  };
  try { return Object.assign(base, JSON.parse(localStorage.getItem(VAYNOR.config.storageKeys.settings) || "{}")); }
  catch (e) { return base; }
};
