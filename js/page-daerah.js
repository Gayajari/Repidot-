(function () {
  "use strict";

  var slug = Repidot.getParam("slug") || "indonesia";
  var loc = Repidot.getLocationBySlug(slug);
  var main = document.getElementById("mainContent");

  if (!loc) {
    Repidot.applySEO({
      title: "Wilayah Tidak Ditemukan — Repidot",
      description: "Wilayah yang kamu cari belum tersedia di Repidot.",
      robots: "noindex, follow"
    });
    main.innerHTML =
      '<div class="container"><div class="state-block">' +
      '<h4>Wilayah tidak ditemukan</h4>' +
      '<p>Wilayah yang kamu cari belum tersedia di Repidot.</p>' +
      '<a href="daerah.html?slug=indonesia" class="btn btn-secondary" style="margin-top:var(--space-2xs);">Kembali ke Indonesia</a>' +
      '</div></div>';
    return;
  }

  var ancestors = Repidot.getAncestors(loc); // [Indonesia, ..., loc]
  var parentChain = ancestors.slice(0, -1).reverse(); // nearest parent first, for subtitle
  var children = Repidot.getChildren(loc.id);
  var childLabel = Repidot.childLabelFor(loc.type);

  // ---- SEO: unique per location, never duplicated across locations ----
  var seoDescription = loc.type === "country"
    ? "Jelajahi informasi loker, berita, wisata, kuliner, dan info publik dari seluruh provinsi di Indonesia."
    : "Informasi loker, berita, wisata, kuliner, tempat, dan info publik terbaru di " + loc.name +
      (parentChain.length ? ", " + parentChain.map(function (p) { return p.name; }).join(", ") : "") + ".";
  Repidot.applySEO({
    title: loc.name + " — Repidot",
    description: seoDescription,
    path: "daerah.html?slug=" + loc.slug,
    breadcrumb: [{ name: "Home", url: "index.html" }].concat(
      ancestors.filter(function (a) { return a.id !== "id"; }).map(function (a) { return { name: a.name, url: Repidot.locationUrl(a) }; })
    )
  });

  // ---- Breadcrumb: Home -> ancestor1 -> ... -> current ----
  var breadcrumbHtml = '<a href="index.html">Home</a>';
  ancestors.forEach(function (a, i) {
    if (a.id === "id") return; // "Indonesia" root folded into Home when it's not the target
    breadcrumbHtml += '<span class="sep">/</span>';
    if (i === ancestors.length - 1) {
      breadcrumbHtml += '<span class="current">' + Repidot.escapeHtml(a.name) + '</span>';
    } else {
      breadcrumbHtml += '<a href="' + Repidot.locationUrl(a) + '">' + Repidot.escapeHtml(a.name) + '</a>';
    }
  });
  if (loc.id === "id") {
    breadcrumbHtml += '<span class="sep">/</span><span class="current">Indonesia</span>';
  }

  // ---- Hero subtitle: "Jawa Tengah, Indonesia" ----
  var subtitle = parentChain.map(function (p) { return p.name; }).join(", ");

  // ---- Overview copy ----
  var overview = loc.type === "country"
    ? "Jelajahi informasi dari seluruh provinsi di Indonesia — mulai dari loker, berita, wisata, kuliner, hingga info publik."
    : "Temukan informasi seputar loker, berita, wisata, kuliner, dan info publik di " + loc.name + ".";

  // ---- Category grid with live counts ----
  var categoryGridHtml = Repidot.CATEGORIES.map(function (cat) {
    var count = Repidot.countContentFor(cat.id, loc);
    return (
      '<a class="category-link-card" href="' + Repidot.categoryLocationUrl(cat.slug, loc.slug) + '">' +
        '<span class="icon">' + RepidotIcons[cat.icon] + '</span>' +
        '<span class="text">' +
          '<span class="name">' + Repidot.escapeHtml(cat.name) + ' ' + Repidot.escapeHtml(loc.name) + '</span>' +
          '<span class="count">' + (count > 0 ? count + " informasi" : "Belum ada") + '</span>' +
        '</span>' +
      '</a>'
    );
  }).join("");

  // ---- Children locations ----
  var childrenSectionHtml = "";
  if (children.length > 0) {
    var childrenGridHtml = children.map(function (c) {
      return (
        '<a class="child-location-card" href="' + Repidot.locationUrl(c) + '">' +
          '<span>' + Repidot.escapeHtml(c.name) + '</span>' +
          RepidotIcons.chevronRight +
        '</a>'
      );
    }).join("");
    childrenSectionHtml =
      '<div class="section-header"><div><h2>' + childLabel + ' di ' + Repidot.escapeHtml(loc.name) + '</h2></div></div>' +
      '<div class="child-location-grid">' + childrenGridHtml + '</div>';
  }

  // ---- Location navigation sidebar (village -> ... -> Indonesia) ----
  var navChainHtml = ancestors.slice().reverse().map(function (a, i) {
    var isCurrent = a.id === loc.id;
    return (
      '<li class="' + (isCurrent ? "is-current" : "") + '">' +
        '<a href="' + Repidot.locationUrl(a) + '">' +
          '<span>' + Repidot.escapeHtml(a.name) + '</span>' +
        '</a>' +
      '</li>'
    );
  }).join("");

  main.innerHTML =
    '<section class="page-hero">' +
      '<div class="container">' +
        '<nav class="breadcrumb" aria-label="Breadcrumb" style="margin-bottom: var(--space-sm);">' + breadcrumbHtml + '</nav>' +
        '<span class="pin">' + RepidotIcons.pin + '</span>' +
        '<h1>' + Repidot.escapeHtml(loc.name) + '</h1>' +
        (subtitle ? '<p class="subtitle">' + Repidot.escapeHtml(subtitle) + '</p>' : '') +
        '<p class="lead">' + overview + '</p>' +
      '</div>' +
    '</section>' +
    '<section class="section" style="padding-block: var(--space-lg);">' +
      '<div class="container">' +
        '<div class="content-layout">' +
          '<div>' +
            '<div class="section-header"><div><h2>Kategori Informasi</h2></div></div>' +
            '<div class="category-link-grid" style="margin-bottom: var(--space-xl);">' + categoryGridHtml + '</div>' +
            childrenSectionHtml +
          '</div>' +
          '<aside class="sidebar-stack">' +
            '<div class="sidebar-card location-nav-card">' +
              '<h4>Navigasi Wilayah</h4>' +
              '<ul>' + navChainHtml + '</ul>' +
            '</div>' +
          '</aside>' +
        '</div>' +
      '</div>' +
    '</section>';
})();
