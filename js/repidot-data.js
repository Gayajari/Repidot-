/* ==========================================================================
   REPIDOT — DATA HELPERS
   Shared read functions over REPIDOT_LOCATIONS / REPIDOT_CATEGORIES /
   REPIDOT_CONTENT. Both /daerah.html and /kategori.html are single
   reusable templates that call into these — no per-location page code.
   ========================================================================== */

var Repidot = (function () {
  var LOCATIONS = LOCATIONS_LIST();
  var CATEGORIES = window.REPIDOT_CATEGORIES || [];

  // Public-facing content merges the seed data with anything created/edited
  // in the admin dashboard (js/admin-store.js writes to the same
  // localStorage key), then keeps published items only — draft/review/
  // archived items stay admin-only. See admin/README.md for how this
  // "publish" step would move server-side in production.
  function LOCATIONS_LIST() {
    var seed = window.REPIDOT_LOCATIONS || [];
    var overrides = readOverrides("repidot_admin_locations");
    return mergeById(seed, overrides);
  }

  function readOverrides(key) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : {};
    } catch (e) { return {}; }
  }

  function mergeById(seed, overrides) {
    var map = {};
    seed.forEach(function (i) { map[i.id] = i; });
    Object.keys(overrides).forEach(function (id) {
      if (overrides[id] === null) delete map[id];
      else map[id] = overrides[id];
    });
    return Object.keys(map).map(function (k) { return map[k]; });
  }

  var CONTENT = mergeById(window.REPIDOT_CONTENT || [], readOverrides("repidot_admin_content"))
    .filter(function (c) { return c.status === "published"; });

  var CHILD_LABEL = {
    country: "Provinsi",
    province: "Kabupaten/Kota",
    regency: "Kecamatan",
    district: "Desa/Kelurahan"
  };

  var LOCATION_FIELD = {
    province: "provinceId",
    regency: "regencyId",
    district: "districtId",
    village: "villageId"
  };

  function getLocationBySlug(slug) {
    for (var i = 0; i < LOCATIONS.length; i++) {
      if (LOCATIONS[i].slug === slug) return LOCATIONS[i];
    }
    return null;
  }

  function getLocationById(id) {
    for (var i = 0; i < LOCATIONS.length; i++) {
      if (LOCATIONS[i].id === id) return LOCATIONS[i];
    }
    return null;
  }

  function getChildren(locationId) {
    return LOCATIONS.filter(function (l) { return l.parentId === locationId; });
  }

  // Returns ancestor chain from Indonesia down to (and including) loc.
  function getAncestors(loc) {
    var chain = [];
    var current = loc;
    while (current) {
      chain.unshift(current);
      current = current.parentId ? getLocationById(current.parentId) : null;
    }
    return chain;
  }

  function getCategoryBySlug(slug) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].slug === slug) return CATEGORIES[i];
    }
    return null;
  }

  // Content whose location field for this location's type matches loc.id.
  function getContentFor(categoryId, loc) {
    var field = LOCATION_FIELD[loc.type];
    if (!field) return [];
    return CONTENT.filter(function (item) {
      return item.categoryId === categoryId && item[field] === loc.id;
    });
  }

  function countContentFor(categoryId, loc) {
    return getContentFor(categoryId, loc).length;
  }

  function getContentById(id) {
    for (var i = 0; i < CONTENT.length; i++) {
      if (CONTENT[i].id === id) return CONTENT[i];
    }
    return null;
  }

  // Related content engine: same category first, then progressively
  // broader location scope (village -> district -> regency -> province),
  // then falls back to same category anywhere. Never repeats an item.
  function getRelatedContent(item, limit) {
    limit = limit || 4;
    var used = { };
    used[item.id] = true;
    var results = [];

    function addFrom(pool) {
      for (var i = 0; i < pool.length && results.length < limit; i++) {
        var c = pool[i];
        if (!used[c.id]) { used[c.id] = true; results.push(c); }
      }
    }

    var sameCategory = CONTENT.filter(function (c) { return c.categoryId === item.categoryId; });

    if (item.villageId) addFrom(sameCategory.filter(function (c) { return c.villageId === item.villageId; }));
    if (results.length < limit && item.districtId) addFrom(sameCategory.filter(function (c) { return c.districtId === item.districtId; }));
    if (results.length < limit && item.regencyId) addFrom(sameCategory.filter(function (c) { return c.regencyId === item.regencyId; }));
    if (results.length < limit && item.provinceId) addFrom(sameCategory.filter(function (c) { return c.provinceId === item.provinceId; }));
    if (results.length < limit) addFrom(sameCategory);

    // Broaden beyond category only if still short (secondary local discovery).
    if (results.length < limit && item.regencyId) {
      var sameRegency = CONTENT.filter(function (c) { return c.regencyId === item.regencyId; });
      addFrom(sameRegency);
    }

    return results;
  }

  function contentUrl(item) {
    return "konten.html?id=" + encodeURIComponent(item.id);
  }

  // Most specific location an item belongs to (village > district > regency > province).
  function getContentLocation(item) {
    var id = item.villageId || item.districtId || item.regencyId || item.provinceId;
    return id ? getLocationById(id) : null;
  }


  function childLabelFor(locationType) {
    return CHILD_LABEL[locationType] || "Wilayah";
  }

  function locationUrl(loc) {
    return "daerah.html?slug=" + encodeURIComponent(loc.slug);
  }

  function categoryLocationUrl(categorySlug, locationSlug) {
    return "kategori.html?cat=" + encodeURIComponent(categorySlug) + "&loc=" + encodeURIComponent(locationSlug);
  }

  /* ========================================================================
     SEARCH — query parsing, ranking and suggestions.
     Runs entirely over the in-memory seed arrays above. In production this
     filtering/scoring would move server-side against indexed fields
     (categoryId, regencyId, districtId, title) so the browser never has to
     hold the full content table — the function signatures here (query in,
     paginated results out) are written so that swap wouldn't change any
     caller in js/page-*.js.
     ======================================================================== */

  var CATEGORY_SYNONYMS = {
    "loker": ["loker", "lowongan kerja", "lowongan", "kerja", "pekerjaan", "karir"],
    "berita": ["berita", "kabar"],
    "wisata": ["wisata", "destinasi", "liburan"],
    "kuliner": ["kuliner", "makanan", "kudapan"],
    "tempat": ["tempat", "fasilitas"],
    "info-publik": ["bantuan sosial", "layanan publik", "info publik", "bansos", "blt", "bpnt", "pkh", "bantuan"],
    "event": ["event", "acara", "festival"],
    "pendidikan": ["pendidikan", "sekolah", "beasiswa"]
  };

  var SPECIFICITY_RANK = { village: 4, district: 3, regency: 2, province: 1, country: 0 };

  var ALL_SYNONYM_PHRASES = (function () {
    var list = [];
    Object.keys(CATEGORY_SYNONYMS).forEach(function (catId) {
      CATEGORY_SYNONYMS[catId].forEach(function (phrase) { list.push({ phrase: phrase, categoryId: catId }); });
    });
    list.sort(function (a, b) { return b.phrase.length - a.phrase.length; });
    return list;
  })();

  var SORTED_LOCATIONS_BY_SPECIFICITY = LOCATIONS
    .filter(function (l) { return l.type !== "country"; })
    .slice()
    .sort(function (a, b) {
      var rankDiff = SPECIFICITY_RANK[b.type] - SPECIFICITY_RANK[a.type];
      return rankDiff !== 0 ? rankDiff : b.name.length - a.name.length;
    });

  function normalizeQuery(str) {
    return String(str || "").toLowerCase().trim().replace(/\s+/g, " ");
  }

  // "Loker Banyumas" -> { category: Loker, location: Banyumas, keywords: "" }
  // "wisata Tambak Banyumas" -> { category: Wisata, location: Tambak (district), keywords: "banyumas" }
  function parseQuery(rawQuery) {
    var text = normalizeQuery(rawQuery);
    var category = null;

    for (var i = 0; i < ALL_SYNONYM_PHRASES.length; i++) {
      var entry = ALL_SYNONYM_PHRASES[i];
      var idx = text.indexOf(entry.phrase);
      if (idx !== -1) {
        category = getCategoryById(entry.categoryId);
        text = (text.slice(0, idx) + " " + text.slice(idx + entry.phrase.length)).replace(/\s+/g, " ").trim();
        break;
      }
    }

    var location = null;
    for (var j = 0; j < SORTED_LOCATIONS_BY_SPECIFICITY.length; j++) {
      var loc = SORTED_LOCATIONS_BY_SPECIFICITY[j];
      var name = loc.name.toLowerCase();
      var pos = text.indexOf(name);
      if (pos !== -1) {
        location = loc;
        text = (text.slice(0, pos) + " " + text.slice(pos + name.length)).replace(/\s+/g, " ").trim();
        break;
      }
    }

    // A query can legitimately name more than one level ("Tambak Banyumas" =
    // district + regency). `location` above is already the most specific
    // match; strip any other real location names left in the text too, so
    // they don't get misread as a leftover keyword.
    if (location) {
      var ancestorNames = getAncestors(location).map(function (a) { return a.name.toLowerCase(); });
      SORTED_LOCATIONS_BY_SPECIFICITY.forEach(function (l) {
        var n = l.name.toLowerCase();
        if (ancestorNames.indexOf(n) === -1) return;
        var p = text.indexOf(n);
        if (p !== -1) text = (text.slice(0, p) + " " + text.slice(p + n.length)).replace(/\s+/g, " ").trim();
      });
    }

    return { category: category, location: location, keywords: text, raw: rawQuery || "" };
  }

  function getCategoryById(id) {
    for (var i = 0; i < CATEGORIES.length; i++) {
      if (CATEGORIES[i].id === id) return CATEGORIES[i];
    }
    return null;
  }

  // Core ranking: exact category (hard filter, never outranked) -> exact
  // location -> keyword match -> parent/broader location.
  function scoreItem(item, ctx) {
    var score = 0;
    var hasLocationCriterion = !!ctx.location;
    var locationMatched = !hasLocationCriterion;

    if (hasLocationCriterion) {
      var field = LOCATION_FIELD[ctx.location.type];
      if (field && item[field] === ctx.location.id) {
        score += 80; // exact location
        locationMatched = true;
      } else {
        var ancestors = getAncestors(ctx.location).slice(0, -1).reverse(); // nearest parent first, country last
        for (var i = 0; i < ancestors.length; i++) {
          var a = ancestors[i];
          if (a.id === "id") break;
          var aField = LOCATION_FIELD[a.type];
          if (aField && item[aField] === a.id) {
            score += Math.max(50 - i * 15, 15); // parent / broader location
            locationMatched = true;
            break;
          }
        }
      }
    }

    if (ctx.keywords) {
      var tokens = ctx.keywords.split(" ").filter(function (t) { return t.length >= 2; });
      var title = item.title.toLowerCase();
      var excerpt = (item.excerpt || "").toLowerCase();
      tokens.forEach(function (t) {
        if (title.indexOf(t) !== -1) score += 15;
        else if (excerpt.indexOf(t) !== -1) score += 8;
      });
    }

    if (!hasLocationCriterion && !ctx.keywords) {
      score += 5; // category-only browse: everything in-category is equally relevant
    }

    return locationMatched ? score : 0;
  }

  // query: free-text string (already contains category/location words, or not)
  // categoryId / locationSlug: explicit filter overrides from the UI, take
  // priority over whatever parseQuery() guessed from the text.
  function searchContent(opts) {
    opts = opts || {};
    var parsed = parseQuery(opts.query || "");
    var category = opts.categoryId ? getCategoryById(opts.categoryId) : parsed.category;
    var location = opts.locationSlug ? getLocationBySlug(opts.locationSlug) : parsed.location;
    var keywords = parsed.keywords;

    var ctx = { location: location, keywords: keywords };
    var pool = category ? CONTENT.filter(function (c) { return c.categoryId === category.id; }) : CONTENT.slice();

    var scored = pool.map(function (item) { return { item: item, score: scoreItem(item, ctx) }; });

    var hasCriteria = !!(category || location || keywords);
    var filtered = hasCriteria ? scored.filter(function (s) { return s.score > 0; }) : scored;

    if (opts.sort === "terbaru") {
      // seed order already reads newest-first, same convention as other pages
    } else {
      filtered.sort(function (a, b) { return b.score - a.score; });
    }

    var page = opts.page && opts.page > 0 ? opts.page : 1;
    var pageSize = opts.pageSize || 6;
    var total = filtered.length;
    var totalPages = Math.max(1, Math.ceil(total / pageSize));
    var start = (page - 1) * pageSize;
    var items = filtered.slice(start, start + pageSize).map(function (s) { return s.item; });

    return {
      items: items, total: total, page: page, pageSize: pageSize, totalPages: totalPages,
      category: category, location: location, keywords: keywords, raw: parsed.raw
    };
  }

  // If a location has zero results, retry one level up (village -> district
  // -> regency -> province) rather than inventing content. Returns the same
  // shape as searchContent plus `broadenedFrom` when it had to widen.
  function searchWithBroadening(opts) {
    var result = searchContent(opts);
    if (result.total > 0 || !result.location) return result;

    var originalLocation = result.location;
    var current = originalLocation;
    while (result.total === 0 && current.parentId && current.parentId !== null) {
      var parent = getLocationById(current.parentId);
      if (!parent || parent.id === "id") break;
      result = searchContent(Object.assign({}, opts, { locationSlug: parent.slug, page: 1 }));
      current = parent;
    }
    if (result.total > 0) result.broadenedFrom = originalLocation;
    return result;
  }

  // Autocomplete while typing. Combines category+location combos and direct
  // location name matches, generated live from the real data (not a
  // hardcoded list) so it scales with the location/category tables.
  function getSuggestions(rawText, limit) {
    limit = limit || 6;
    var text = normalizeQuery(rawText);
    if (!text) return [];
    var out = [];
    var seen = {};

    function push(label, url, type) {
      if (seen[label] || out.length >= limit) return;
      seen[label] = true;
      out.push({ label: label, url: url, type: type });
    }

    ALL_SYNONYM_PHRASES.forEach(function (entry) {
      if (out.length >= limit) return;
      if (entry.phrase.indexOf(text) !== 0 && text.indexOf(entry.phrase) !== 0) return;
      var cat = getCategoryById(entry.categoryId);
      var rest = text.indexOf(entry.phrase) === 0 ? text.slice(entry.phrase.length).trim() : "";
      if (rest) {
        SORTED_LOCATIONS_BY_SPECIFICITY.filter(function (l) { return l.name.toLowerCase().indexOf(rest) === 0; })
          .slice(0, 3)
          .forEach(function (l) { push(cat.name + " " + l.name, categoryLocationUrl(cat.slug, l.slug), "category-location"); });
      } else {
        push(cat.name, categoryLocationUrl(cat.slug, "indonesia"), "category");
      }
    });

    SORTED_LOCATIONS_BY_SPECIFICITY.filter(function (l) { return l.name.toLowerCase().indexOf(text) === 0; })
      .slice(0, limit)
      .forEach(function (l) {
        var parent = l.parentId ? getLocationById(l.parentId) : null;
        push(l.name + (parent && parent.id !== "id" ? ", " + parent.name : ""), locationUrl(l), "location");
      });

    return out.slice(0, limit);
  }

  // Exact "did you mean this place" match for a whole query like "Tambak".
  function findExactLocationMatch(rawText) {
    var text = normalizeQuery(rawText);
    if (!text) return null;
    for (var i = 0; i < LOCATIONS.length; i++) {
      var l = LOCATIONS[i];
      if (l.type !== "country" && l.name.toLowerCase() === text) return l;
    }
    return null;
  }

  function searchUrl(query) {
    return "cari.html?q=" + encodeURIComponent(query);
  }

  /* ========================================================================
     SEO — shared head-tag + structured-data injection for the dynamic
     templates (daerah/kategori/konten/cari all render from query params,
     so their <head> can't be pre-written per-URL — this fills it in once
     the page knows what it's actually showing).
     ======================================================================== */

  function setMeta(attr, key, content) {
    var selector = 'meta[' + attr + '="' + key + '"]';
    var el = document.querySelector(selector);
    if (!el) {
      el = document.createElement("meta");
      el.setAttribute(attr, key);
      document.head.appendChild(el);
    }
    el.setAttribute("content", content);
  }

  // opts: { title, description, path (canonical path+query, no origin),
  //         type ("website"|"article"), robots (default "index, follow"),
  //         breadcrumb: [{name,url}], jsonLd: object or array of objects }
  function applySEO(opts) {
    document.title = opts.title;
    setMeta("name", "description", opts.description);
    setMeta("name", "robots", opts.robots || "index, follow");

    var url = window.location.origin + (opts.path || window.location.pathname);
    var canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = url;

    setMeta("property", "og:type", opts.type || "website");
    setMeta("property", "og:title", opts.title);
    setMeta("property", "og:description", opts.description);
    setMeta("property", "og:url", url);
    setMeta("property", "og:site_name", "Repidot");
    setMeta("name", "twitter:card", "summary");
    setMeta("name", "twitter:title", opts.title);
    setMeta("name", "twitter:description", opts.description);

    var ldList = [];
    if (opts.breadcrumb && opts.breadcrumb.length) {
      ldList.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: opts.breadcrumb.map(function (b, i) {
          return { "@type": "ListItem", position: i + 1, name: b.name, item: window.location.origin + "/" + b.url };
        })
      });
    }
    if (opts.jsonLd) ldList = ldList.concat(Array.isArray(opts.jsonLd) ? opts.jsonLd : [opts.jsonLd]);

    document.querySelectorAll('script[data-seo-ld="1"]').forEach(function (s) { s.remove(); });
    ldList.forEach(function (ld) {
      var s = document.createElement("script");
      s.type = "application/ld+json";
      s.setAttribute("data-seo-ld", "1");
      s.textContent = JSON.stringify(ld);
      document.head.appendChild(s);
    });
  }


  function getParam(name) {
    var params = new URLSearchParams(window.location.search);
    return params.get(name);
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  return {
    LOCATIONS: LOCATIONS,
    CATEGORIES: CATEGORIES,
    CONTENT: CONTENT,
    getLocationBySlug: getLocationBySlug,
    getLocationById: getLocationById,
    getChildren: getChildren,
    getAncestors: getAncestors,
    getCategoryBySlug: getCategoryBySlug,
    getCategoryById: getCategoryById,
    getContentFor: getContentFor,
    countContentFor: countContentFor,
    getContentById: getContentById,
    getRelatedContent: getRelatedContent,
    contentUrl: contentUrl,
    getContentLocation: getContentLocation,
    childLabelFor: childLabelFor,
    locationUrl: locationUrl,
    categoryLocationUrl: categoryLocationUrl,
    searchWithBroadening: searchWithBroadening,
    getSuggestions: getSuggestions,
    findExactLocationMatch: findExactLocationMatch,
    searchUrl: searchUrl,
    applySEO: applySEO,
    getParam: getParam,
    escapeHtml: escapeHtml
  };
})();
