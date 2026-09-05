/* ==========================================================================
   REPIDOT — LOCATION DATA MODEL
   Flat list of locations linked by parentId. This is sample/seed data —
   the same shape scales to every village in Indonesia without changing
   any page code (see js/repidot-data.js for how it's consumed).

   type: "country" | "province" | "regency" | "district" | "village"
   ========================================================================== */

window.REPIDOT_LOCATIONS = [
  { id: "id",               name: "Indonesia",         slug: "indonesia",         type: "country",  parentId: null },

  { id: "jateng",           name: "Jawa Tengah",       slug: "jawa-tengah",       type: "province", parentId: "id" },
  { id: "jabar",            name: "Jawa Barat",        slug: "jawa-barat",        type: "province", parentId: "id" },

  { id: "banyumas",         name: "Banyumas",          slug: "banyumas",          type: "regency",  parentId: "jateng" },
  { id: "wonosobo",         name: "Wonosobo",          slug: "wonosobo",          type: "regency",  parentId: "jateng" },
  { id: "bandung",          name: "Kota Bandung",      slug: "bandung",           type: "regency",  parentId: "jabar" },

  { id: "purwokerto-utara", name: "Purwokerto Utara",  slug: "purwokerto-utara",  type: "district", parentId: "banyumas" },
  { id: "tambak",           name: "Tambak",            slug: "tambak",            type: "district", parentId: "banyumas" },
  { id: "baturraden",       name: "Baturraden",        slug: "baturraden",        type: "district", parentId: "banyumas" },
  { id: "coblong",          name: "Coblong",           slug: "coblong",           type: "district", parentId: "bandung" },

  { id: "desa-example",     name: "Desa Example",      slug: "desa-example",      type: "village",  parentId: "tambak" },
  { id: "karangnangka",     name: "Karangnangka",      slug: "karangnangka",      type: "village",  parentId: "tambak" },
  { id: "purwosari",        name: "Purwosari",         slug: "purwosari",         type: "village",  parentId: "baturraden" }
];
