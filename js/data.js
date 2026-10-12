/* VAYNOR: seed data used whenever Supabase is unavailable, so the whole
   store works as a self-contained demo. Once the Supabase schema is live
   (see supabase/schema.sql), real tables take priority automatically. */
window.VAYNOR = window.VAYNOR || {};

VAYNOR.seedProducts = [
  {
    id: "vaynor-bracelet",
    name: "VAYNOR Bracelet",
    category: "Bracelets",
    price: 2490,
    compare_at: null,
    badge: "Signature",
    stock: 42,
    is_active: true,
    rating: 4.8,
    review_count: 36,
    images: [
      "assets/images/bracelet-main.jpg",
      "assets/images/bracelet-clasp.jpg",
      "assets/images/bracelet-detail.jpg",
      "assets/images/bracelet-box.jpg"
    ],
    short: "A dark, understated woven bracelet with a neodymium magnetic clasp. Designed in Dhaka for everyday wear.",
    description: "The VAYNOR Bracelet is our first and only piece, and we intend for it to be the last one you reach for. A woven 316L stainless steel chain carries a gunmetal PVD finish that catches light without asking for attention, while a flush magnetic closure makes putting it on a one-handed ritual. It wears quietly with a white shirt or a weekend tee, a detail that feels like you.",
    features: [
      "Neodymium magnetic clasp: opens and closes one-handed, sits flush against the wrist",
      "Woven 316L stainless steel with gunmetal PVD coating, hypoallergenic and tarnish-resistant",
      "Tapered 6 mm profile that layers with a watch without snagging",
      "Splash-proof braided core. Rain, chai and wristwash friendly",
      "Arrives in a matte magnetic-closure box with a micro-fibre cloth"
    ],
    specs: {
      "Material": "316L stainless steel, gunmetal PVD",
      "Clasp": "Neodymium magnetic, flush-set",
      "Length": "19 cm (fits 16.5–19.5 cm wrists)",
      "Weight": "24 g",
      "Finish": "Matte gunmetal with polished clasp",
      "Water": "Splash-proof, not for swimming"
    }
  },
  {
    id: "vaynor-box",
    name: "VAYNOR Gift Box",
    category: "Accessories",
    price: 490,
    compare_at: null,
    badge: null,
    stock: 120,
    is_active: true,
    rating: 4.9,
    review_count: 11,
    images: ["assets/images/bracelet-box.jpg"],
    short: "The signature matte-black presentation box with velvet bed. Sold separately for gifting a piece you already own.",
    description: "Some gifts deserve the ceremony. Our magnetic-closure box, velvet insert and engraved care card sold separately for any bracelet.",
    features: ["Matte soft-touch finish", "Magnetic lid with velvet bed", "Includes engraved care card"],
    specs: { "Size": "11 × 11 × 4.5 cm", "Colour": "Matte black" }
  },
  {
    id: "vaynor-care-kit",
    name: "VAYNOR Care Kit",
    category: "Accessories",
    price: 390,
    compare_at: 590,
    badge: "Low stock",
    stock: 8,
    is_active: true,
    rating: 4.6,
    review_count: 7,
    images: ["assets/images/bracelet-detail.jpg"],
    short: "Micro-fibre cloth, soft brush and a seal-refresh balm to keep the gunmetal finish living its best life.",
    description: "Three months of easy care for any VAYNOR piece. The balm refreshes the PVD seal; the brush lifts dust out of the weave.",
    features: ["Cloth + brush + balm", "3-month supply", "Pocket tin"],
    specs: { "Contents": "15 ml balm, brush, 2 cloths" }
  }
];

VAYNOR.seedReviews = [
  { id: "r1", product: "vaynor-bracelet", author: "Tasnim R.", rating: 5, date: "2026-09-14", approved: true, text: "The clasp is genuinely one-handed and it never feels like it will fall off. Wore it for six weeks straight: gym, rain, Dhaka traffic. Not a single mark on it." },
  { id: "r2", product: "vaynor-bracelet", author: "Arif H.", rating: 5, date: "2026-08-30", approved: true, text: "Exactly what the photos promise: dark, quiet, premium. Got asked twice at work what brand it is, which is the most I've ever talked about jewellery." },
  { id: "r3", product: "vaynor-bracelet", author: "Nusrat J.", rating: 4, date: "2026-08-12", approved: true, text: "Bought it as a gift for my husband. The box alone made it feel expensive. Wish the chain came in a shorter size for slim wrists, otherwise perfect." },
  { id: "r4", product: "vaynor-gift-box", author: "Farhan K.", rating: 5, date: "2026-09-02", approved: true, text: "Presentation is on another level for the price." }
];

VAYNOR.seedDiscounts = [
  { code: "VAYNOR10", percent: 10, label: "Intro offer", active: true }
];

VAYNOR.categories = ["Bracelets", "Accessories"];
