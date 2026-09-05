(function () {
  "use strict";

  var id = Repidot.getParam("id");
  var item = id ? Repidot.getContentById(id) : null;
  var main = document.getElementById("mainContent");

  if (!item) {
    Repidot.applySEO({
      title: "Konten Tidak Ditemukan — Repidot",
      description: "Konten yang kamu cari mungkin sudah tidak tersedia di Repidot.",
      robots: "noindex, follow"
    });
    main.innerHTML =
      '<div class="container"><div class="state-block">' +
      '<h4>Konten tidak ditemukan</h4>' +
      '<p>Konten yang kamu cari mungkin sudah tidak tersedia.</p>' +
      '<a href="index.html" class="btn btn-secondary" style="margin-top:var(--space-2xs);">Kembali ke Beranda</a>' +
      '</div></div>';
    return;
  }

  var cat = Repidot.getCategoryBySlug(item.categoryId) || Repidot.CATEGORIES.filter(function (c) { return c.id === item.categoryId; })[0];
  var loc = Repidot.getContentLocation(item);
  var ancestors = loc ? Repidot.getAncestors(loc) : [];

  // ============ SEO: title, description, canonical, OG, Twitter, JSON-LD ============
  // Structured data uses only fields we actually have. Real publish/modified
  // dates aren't in this seed data (only relative strings like "2 jam lalu"),
  // so datePosted/datePublished are intentionally omitted rather than faked.
  var ld;
  if (item.job) {
    ld = {
      "@context": "https://schema.org",
      "@type": "JobPosting",
      title: item.title,
      description: item.job.description,
      hiringOrganization: { "@type": "Organization", name: item.job.company },
      employmentType: item.job.jobType,
      jobLocation: loc ? {
        "@type": "Place",
        address: { "@type": "PostalAddress", addressLocality: loc.name, addressCountry: "ID" }
      } : undefined
    };
    if (item.job.salary) {
      ld.baseSalary = { "@type": "MonetaryAmount", currency: "IDR", value: { "@type": "QuantitativeValue", value: item.job.salary } };
    }
  } else if (item.tourism) {
    ld = {
      "@context": "https://schema.org",
      "@type": "TouristAttraction",
      name: item.title,
      description: item.excerpt,
      address: loc ? { "@type": "PostalAddress", addressLocality: loc.name, addressCountry: "ID" } : undefined
    };
  } else {
    ld = {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: item.title,
      description: item.excerpt,
      articleSection: cat ? cat.name : undefined,
      author: item.author ? { "@type": "Organization", name: item.author } : undefined,
      publisher: { "@type": "Organization", name: "Repidot" }
    };
  }

  var seoBreadcrumb = [{ name: "Home", url: "index.html" }, { name: cat.name, url: Repidot.categoryLocationUrl(cat.slug, "indonesia") }]
    .concat(ancestors.filter(function (a) { return a.id !== "id"; }).map(function (a) { return { name: a.name, url: Repidot.categoryLocationUrl(cat.slug, a.slug) }; }))
    .concat([{ name: item.title, url: Repidot.contentUrl(item) }]);

  Repidot.applySEO({
    title: item.title + " — Repidot",
    description: item.excerpt,
    path: "konten.html?id=" + item.id,
    type: item.job ? "website" : "article",
    breadcrumb: seoBreadcrumb,
    jsonLd: ld
  });

  // ============ Breadcrumb ============
  var breadcrumbHtml = '<a href="index.html">Home</a><span class="sep">/</span>' +
    '<a href="' + Repidot.categoryLocationUrl(cat.slug, "indonesia") + '">' + Repidot.escapeHtml(cat.name) + '</a>';
  ancestors.forEach(function (a) {
    if (a.id === "id") return;
    breadcrumbHtml += '<span class="sep">/</span><a href="' + Repidot.categoryLocationUrl(cat.slug, a.slug) + '">' + Repidot.escapeHtml(a.name) + '</a>';
  });
  breadcrumbHtml += '<span class="sep">/</span><span class="current">' + Repidot.escapeHtml(item.title) + '</span>';

  // ============ Meta row ============
  var metaParts = [];
  if (loc) metaParts.push('<span class="badge badge-location">' + RepidotIcons.locationDot + Repidot.escapeHtml(loc.name) + '</span>');
  metaParts.push('<span>Dipublikasikan ' + Repidot.escapeHtml(item.publishedAt) + '</span>');
  if (item.updatedAt && item.updatedAt !== item.publishedAt) metaParts.push('<span>Diperbarui ' + Repidot.escapeHtml(item.updatedAt) + '</span>');
  if (item.author) metaParts.push('<span>' + Repidot.escapeHtml(item.author) + '</span>');
  var metaRowHtml = metaParts.join('<span class="sep-dot"></span>');

  // ============ Prose body ============
  var proseHtml = (item.body || []).map(function (p) { return '<p>' + Repidot.escapeHtml(p) + '</p>'; }).join("");

  // ============ Category-specific block ============
  var specialHtml = "";

  if (item.job) {
    var j = item.job;
    specialHtml =
      '<div class="fact-grid">' +
        factCard("Posisi", item.title) +
        factCard("Perusahaan", j.company) +
        (loc ? factCard("Lokasi", loc.name) : "") +
        factCard("Pendidikan", j.education) +
        (j.salary ? factCard("Gaji", j.salary) : "") +
        factCard("Jenis pekerjaan", j.jobType) +
        factCard("Deadline", j.deadline, true) +
      '</div>' +
      '<h2 class="detail-subheading">Deskripsi Pekerjaan</h2>' +
      '<div class="prose"><p>' + Repidot.escapeHtml(j.description) + '</p></div>' +
      '<h2 class="detail-subheading">Persyaratan</h2>' +
      '<ul class="detail-list">' + j.requirements.map(bulletItem).join("") + '</ul>' +
      '<div class="apply-box">' +
        '<h3 class="detail-subheading" style="margin-top:0;">Cara Melamar</h3>' +
        '<p class="prose" style="font-size: var(--fs-body);">' + Repidot.escapeHtml(j.howToApply) + '</p>' +
        '<button type="button" class="btn btn-primary">Lamar Sekarang</button>' +
      '</div>';
  } else if (item.tourism) {
    var t = item.tourism;
    specialHtml =
      '<h2 class="detail-subheading">Highlight</h2>' +
      '<ul class="detail-list">' + t.highlights.map(bulletItem).join("") + '</ul>' +
      (t.facilities && t.facilities.length ? '<h2 class="detail-subheading">Fasilitas</h2><ul class="detail-list">' + t.facilities.map(bulletItem).join("") + '</ul>' : '') +
      '<div class="fact-grid">' +
        (t.openingHours ? factCard("Jam buka", t.openingHours) : "") +
        (t.price ? factCard("Harga tiket", t.price) : "") +
      '</div>' +
      (t.mapNote ? '<div class="map-note">' + RepidotIcons.pin + '<span>' + Repidot.escapeHtml(t.mapNote) + '</span></div>' : '');
  } else if (item.publicInfo) {
    var p = item.publicInfo;
    specialHtml =
      (p.officialSource ? '<div class="official-banner">' + RepidotIcons.checkCircle + '<span>Sumber Resmi Terverifikasi</span></div>' : '') +
      '<div class="fact-grid">' +
        (p.area ? factCard("Wilayah", p.area) : "") +
      '</div>' +
      (p.eligibility && p.eligibility.length ? '<h2 class="detail-subheading">Siapa yang Berhak</h2><ul class="detail-list">' + p.eligibility.map(bulletItem).join("") + '</ul>' : '') +
      (p.importantDates && p.importantDates.length ? '<h2 class="detail-subheading">Tanggal Penting</h2><ul class="detail-list">' + p.importantDates.map(bulletItem).join("") + '</ul>' : '') +
      (p.notes ? '<h2 class="detail-subheading">Catatan</h2><div class="prose"><p>' + Repidot.escapeHtml(p.notes) + '</p></div>' : '');
  }

  // ============ Trust box ============
  var trustBoxHtml =
    '<div class="trust-box">' +
      (item.source ? '<div class="row"><span class="k">Sumber</span><span class="v">' + Repidot.escapeHtml(item.source) + '</span></div>' : '') +
      '<div class="row"><span class="k">Tanggal</span><span class="v">' + Repidot.escapeHtml(item.publishedAt) + '</span></div>' +
      (item.updatedAt ? '<div class="row"><span class="k">Diperbarui</span><span class="v">' + Repidot.escapeHtml(item.updatedAt) + '</span></div>' : '') +
    '</div>';

  // ============ Related content ("Artikel Terkait") ============
  var related = Repidot.getRelatedContent(item, 4);
  var relatedHtml = related.length
    ? '<div class="card-grid">' + related.map(function (r) { return relatedCard(r); }).join("") + '</div>'
    : '<p style="color: var(--color-text-muted); font-size: var(--fs-small);">Belum ada artikel terkait lainnya.</p>';

  // ============ Contextual sidebar widgets ============
  var sidebarWidgetsHtml = buildSidebarWidgets(item);

  // ============ Explore-location strip ============
  var exploreHtml = "";
  if (loc) {
    exploreHtml =
      '<section class="explore-strip">' +
        '<div class="section-header"><div><h2>Jelajahi ' + Repidot.escapeHtml(loc.name) + '</h2></div></div>' +
        '<div class="category-link-grid">' +
          Repidot.CATEGORIES.map(function (c) {
            return '<a class="category-link-card" href="' + Repidot.categoryLocationUrl(c.slug, loc.slug) + '">' +
              '<span class="icon">' + RepidotIcons[c.icon] + '</span>' +
              '<span class="text"><span class="name">' + Repidot.escapeHtml(c.name) + '</span></span>' +
            '</a>';
          }).join("") +
        '</div>' +
      '</section>';
  }

  // ============ Assemble page ============
  main.innerHTML =
    '<section class="detail-hero">' +
      '<div class="container">' +
        '<nav class="breadcrumb" aria-label="Breadcrumb" style="margin-bottom: var(--space-sm);">' + breadcrumbHtml + '</nav>' +
        '<span class="badge badge-category">' + Repidot.escapeHtml(cat.name) + '</span>' +
        '<h1>' + Repidot.escapeHtml(item.title) + '</h1>' +
        '<div class="detail-meta-row">' + metaRowHtml + '</div>' +
        '<div class="thumb"></div>' +
      '</div>' +
    '</section>' +
    '<section class="section" style="padding-block: var(--space-lg);">' +
      '<div class="container">' +
        '<div class="content-layout">' +
          '<div>' +
            '<div class="prose">' + proseHtml + '</div>' +
            specialHtml +
            trustBoxHtml +
            '<div class="section-header" style="margin-top: var(--space-2xl);"><div><h2>Artikel Terkait</h2></div></div>' +
            relatedHtml +
          '</div>' +
          '<aside class="sidebar-stack">' + sidebarWidgetsHtml + '</aside>' +
        '</div>' +
        exploreHtml +
      '</div>' +
    '</section>';

  // ---- helpers ----
  function factCard(label, value, isDeadline) {
    if (!value) return "";
    return '<div class="fact-card' + (isDeadline ? ' is-deadline' : '') + '"><div class="label">' + Repidot.escapeHtml(label) + '</div><div class="value">' + Repidot.escapeHtml(value) + '</div></div>';
  }

  function bulletItem(text) {
    return '<li>' + RepidotIcons.chevronRight + '<span>' + Repidot.escapeHtml(text) + '</span></li>';
  }

  function relatedCard(r) {
    var rCat = Repidot.CATEGORIES.filter(function (c) { return c.id === r.categoryId; })[0];
    var rLoc = Repidot.getContentLocation(r);
    return '<a class="card article-card" href="' + Repidot.contentUrl(r) + '">' +
      '<div class="thumb"><span class="badge badge-category">' + Repidot.escapeHtml(rCat ? rCat.name : "") + '</span></div>' +
      '<div class="body"><h3>' + Repidot.escapeHtml(r.title) + '</h3>' +
      '<div class="meta">' +
        (rLoc ? '<span class="badge badge-location">' + RepidotIcons.locationDot + Repidot.escapeHtml(rLoc.name) + '</span><span>&middot;</span>' : '') +
        '<span>' + Repidot.escapeHtml(r.publishedAt) + '</span>' +
      '</div></div>' +
    '</a>';
  }

  function widgetItems(categoryId, excludeId, count, fromEnd) {
    var pool = Repidot.CONTENT.filter(function (c) { return c.categoryId === categoryId && c.id !== excludeId; });
    if (fromEnd) pool = pool.slice().reverse();
    return pool.slice(0, count);
  }

  function widgetListHtml(items) {
    return '<ul class="widget-list">' + items.map(function (c) {
      return '<li><a href="' + Repidot.contentUrl(c) + '">' + Repidot.escapeHtml(c.title) + '</a><span class="widget-meta">' + Repidot.escapeHtml(c.publishedAt) + '</span></li>';
    }).join("") + '</ul>';
  }

  function buildSidebarWidgets(item) {
    var catId = item.categoryId;
    var html = "";

    function widgetCard(title, items) {
      if (!items.length) return "";
      return '<div class="sidebar-card"><h4>' + title + '</h4>' + widgetListHtml(items) + '</div>';
    }

    if (catId === "loker") {
      html += widgetCard("Loker Terbaru", widgetItems("loker", item.id, 4, false));
      html += widgetCard("Loker Populer", widgetItems("loker", item.id, 4, true));
    } else if (catId === "wisata") {
      html += widgetCard("Wisata Populer", widgetItems("wisata", item.id, 4, true));
      html += widgetCard("Wisata Terbaru", widgetItems("wisata", item.id, 4, false));
    } else if (catId === "berita") {
      html += widgetCard("Berita Terbaru", widgetItems("berita", item.id, 4, false));
      html += widgetCard("Berita Populer", widgetItems("berita", item.id, 4, true));
    } else if (catId === "info-publik") {
      html += widgetCard("Info Publik Terbaru", widgetItems("info-publik", item.id, 4, false));
    } else {
      var catObj = Repidot.CATEGORIES.filter(function (c) { return c.id === catId; })[0];
      html += widgetCard((catObj ? catObj.name : "Terkait") + " Terbaru", widgetItems(catId, item.id, 4, false));
    }

    if (loc) {
      var navChainHtml = ancestors.slice().reverse().map(function (a) {
        return '<li><a href="' + Repidot.locationUrl(a) + '"><span>' + Repidot.escapeHtml(a.name) + '</span></a></li>';
      }).join("");
      html += '<div class="sidebar-card location-nav-card"><h4>Navigasi Wilayah</h4><ul>' + navChainHtml + '</ul></div>';
    }

    return html;
  }
})();
