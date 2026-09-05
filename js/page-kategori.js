(function () {
  "use strict";

  var catSlug = Repidot.getParam("cat") || "loker";
  var locSlug = Repidot.getParam("loc") || "indonesia";
  var cat = Repidot.getCategoryBySlug(catSlug);
  var loc = Repidot.getLocationBySlug(locSlug);
  var main = document.getElementById("mainContent");

  if (!cat || !loc) {
    Repidot.applySEO({
      title: "Halaman Tidak Ditemukan — Repidot",
      description: "Kategori atau wilayah yang kamu cari belum tersedia di Repidot.",
      robots: "noindex, follow"
    });
    main.innerHTML =
      '<div class="container"><div class="state-block">' +
      '<h4>Halaman tidak ditemukan</h4>' +
      '<p>Kategori atau wilayah yang kamu cari belum tersedia.</p>' +
      '<a href="index.html" class="btn btn-secondary" style="margin-top:var(--space-2xs);">Kembali ke Beranda</a>' +
      '</div></div>';
    return;
  }

  var ancestors = Repidot.getAncestors(loc); // Indonesia -> ... -> loc
  var allItems = Repidot.getContentFor(cat.id, loc);

  var PAGE_SIZE = 6;
  var page = parseInt(Repidot.getParam("page") || "1", 10) || 1;
  var totalPages = Math.max(1, Math.ceil(allItems.length / PAGE_SIZE));
  page = Math.min(Math.max(page, 1), totalPages);
  var items = allItems.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  var canonicalPath = "kategori.html?cat=" + cat.slug + "&loc=" + loc.slug + (page > 1 ? "&page=" + page : "");

  // ---- SEO: unique title/description per category+location combo ----
  Repidot.applySEO({
    title: cat.heroLabel + " " + loc.name + (page > 1 ? " — Halaman " + page : "") + " — Repidot",
    description: cat.description + " Wilayah: " + loc.name +
      (ancestors.length > 2 ? ", " + ancestors.slice(1, -1).map(function (a) { return a.name; }).join(", ") : "") + ".",
    path: canonicalPath,
    type: "article",
    breadcrumb: [{ name: "Home", url: "index.html" }, { name: cat.name, url: Repidot.categoryLocationUrl(cat.slug, "indonesia") }].concat(
      ancestors.filter(function (a) { return a.id !== "id"; }).map(function (a) { return { name: a.name, url: Repidot.categoryLocationUrl(cat.slug, a.slug) }; })
    )
  });

  // ---- Breadcrumb: Home -> Category -> ancestor chain (skip Indonesia root) ----
  var breadcrumbHtml = '<a href="index.html">Home</a><span class="sep">/</span>' +
    '<a href="' + Repidot.categoryLocationUrl(cat.slug, "indonesia") + '">' + Repidot.escapeHtml(cat.name) + '</a>';
  ancestors.forEach(function (a, i) {
    if (a.id === "id") return;
    breadcrumbHtml += '<span class="sep">/</span>';
    if (i === ancestors.length - 1) {
      breadcrumbHtml += '<span class="current">' + Repidot.escapeHtml(a.name) + '</span>';
    } else {
      breadcrumbHtml += '<a href="' + Repidot.categoryLocationUrl(cat.slug, a.slug) + '">' + Repidot.escapeHtml(a.name) + '</a>';
    }
  });

  // ---- Content grid or empty state ----
  var contentHtml;
  if (items.length > 0) {
    contentHtml = '<div class="card-grid">' + items.map(function (item) {
      return (
        '<a class="card article-card" href="' + Repidot.contentUrl(item) + '">' +
          '<div class="thumb"><span class="badge badge-category">' + Repidot.escapeHtml(cat.name) + '</span></div>' +
          '<div class="body">' +
            '<h3>' + Repidot.escapeHtml(item.title) + '</h3>' +
            '<p style="font-size: var(--fs-small); color: var(--color-text-muted);">' + Repidot.escapeHtml(item.excerpt) + '</p>' +
            '<div class="meta">' +
              '<span class="badge badge-location">' + RepidotIcons.locationDot + Repidot.escapeHtml(loc.name) + '</span>' +
              '<span>&middot;</span><span>' + Repidot.escapeHtml(item.publishedAt) + '</span>' +
            '</div>' +
          '</div>' +
        '</a>'
      );
    }).join("") + '</div>' + buildPagination();
  } else {
    var broaderLevels = ancestors.slice(0, -1).filter(function (a) { return a.id !== "id"; }).reverse();
    var actionsHtml = broaderLevels.map(function (a) {
      return '<a class="btn btn-secondary" href="' + Repidot.categoryLocationUrl(cat.slug, a.slug) + '">Lihat informasi di ' + Repidot.escapeHtml(a.name) + '</a>';
    }).join("");
    contentHtml =
      '<div class="card state-block">' +
        '<span class="icon-wrap">' + RepidotIcons.pin + '</span>' +
        '<h4>Belum ada informasi terbaru di wilayah ini.</h4>' +
        '<p>Coba lihat informasi ' + Repidot.escapeHtml(cat.name.toLowerCase()) + ' di wilayah yang lebih luas.</p>' +
        (actionsHtml ? '<div class="empty-actions">' + actionsHtml + '</div>' : '') +
      '</div>';
  }

  // ---- Pagination ----
  function buildPagination() {
    if (totalPages <= 1) return "";
    var buttons = "";
    for (var p = 1; p <= totalPages; p++) {
      var href = "kategori.html?cat=" + cat.slug + "&loc=" + loc.slug + (p > 1 ? "&page=" + p : "");
      buttons += '<a href="' + href + '"><button type="button"' + (p === page ? ' aria-current="page"' : '') + '>' + p + '</button></a>';
    }
    return '<div class="pagination" style="margin-top: var(--space-lg);">' + buttons + '</div>';
  }

  // ---- Related information: other categories at the same location ----
  var relatedHtml = Repidot.CATEGORIES.filter(function (c) { return c.id !== cat.id; }).map(function (c) {
    var count = Repidot.countContentFor(c.id, loc);
    return (
      '<li><a href="' + Repidot.categoryLocationUrl(c.slug, loc.slug) + '">' +
        '<span class="icon">' + RepidotIcons[c.icon] + '</span>' +
        '<span>' + Repidot.escapeHtml(c.name) + ' ' + Repidot.escapeHtml(loc.name) + '</span>' +
        (count > 0 ? '<span class="badge badge-category" data-tone="neutral" style="margin-left:auto;">' + count + '</span>' : '') +
      '</a></li>'
    );
  }).join("");

  // ---- Location navigation sidebar ----
  var navChainHtml = ancestors.slice().reverse().map(function (a) {
    var isCurrent = a.id === loc.id;
    return (
      '<li class="' + (isCurrent ? "is-current" : "") + '">' +
        '<a href="' + Repidot.categoryLocationUrl(cat.slug, a.slug) + '"><span>' + Repidot.escapeHtml(a.name) + '</span></a>' +
      '</li>'
    );
  }).join("");

  main.innerHTML =
    '<section class="page-hero">' +
      '<div class="container">' +
        '<nav class="breadcrumb" aria-label="Breadcrumb" style="margin-bottom: var(--space-sm);">' + breadcrumbHtml + '</nav>' +
        '<h1>' + Repidot.escapeHtml(cat.heroLabel) + ' ' + Repidot.escapeHtml(loc.name) + '</h1>' +
        '<p class="lead">' + Repidot.escapeHtml(cat.description) + '</p>' +
      '</div>' +
    '</section>' +
    '<section class="section" style="padding-block: var(--space-lg);">' +
      '<div class="container">' +
        '<div class="content-layout">' +
          '<div>' +
            '<div class="filters-bar">' +
              '<button class="filter-chip" type="button" aria-pressed="true">Terbaru</button>' +
              '<button class="filter-chip" type="button" aria-pressed="false">Populer</button>' +
              '<button class="filter-chip" type="button" aria-pressed="false">' + RepidotIcons.pin + Repidot.escapeHtml(loc.name) + '</button>' +
            '</div>' +
            contentHtml +
          '</div>' +
          '<aside class="sidebar-stack">' +
            '<div class="sidebar-card">' +
              '<h4>Informasi ' + Repidot.escapeHtml(loc.name) + '</h4>' +
              '<ul class="related-list">' + relatedHtml + '</ul>' +
            '</div>' +
            '<div class="sidebar-card location-nav-card">' +
              '<h4>Navigasi Wilayah</h4>' +
              '<ul>' + navChainHtml + '</ul>' +
            '</div>' +
          '</aside>' +
        '</div>' +
      '</div>' +
    '</section>';
})();
