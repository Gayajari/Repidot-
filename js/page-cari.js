(function () {
  "use strict";

  var main = document.getElementById("mainContent");
  var RECENT_KEY = "repidot_recent_searches";
  var PAGE_SIZE = 6;

  // ---------------- URL state ----------------

  function readState() {
    return {
      q: Repidot.getParam("q") || "",
      cat: Repidot.getParam("cat") || "",
      loc: Repidot.getParam("loc") || "",
      sort: Repidot.getParam("sort") || "relevansi",
      page: parseInt(Repidot.getParam("page") || "1", 10) || 1
    };
  }

  function stateToUrl(state) {
    var params = new URLSearchParams();
    if (state.q) params.set("q", state.q);
    if (state.cat) params.set("cat", state.cat);
    if (state.loc) params.set("loc", state.loc);
    if (state.sort && state.sort !== "relevansi") params.set("sort", state.sort);
    if (state.page && state.page > 1) params.set("page", String(state.page));
    var qs = params.toString();
    return "cari.html" + (qs ? "?" + qs : "");
  }

  // ---------------- Recent searches (client-only, localStorage) ----------------

  function getRecentSearches() {
    try {
      var raw = window.localStorage.getItem(RECENT_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveRecentSearch(q) {
    if (!q) return;
    try {
      var list = getRecentSearches().filter(function (s) { return s.toLowerCase() !== q.toLowerCase(); });
      list.unshift(q);
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, 5)));
    } catch (e) { /* localStorage unavailable — recent searches simply won't persist */ }
  }

  // ---------------- Render ----------------

  var state = readState();
  if (state.q) saveRecentSearch(state.q);
  render(state);

  function render(state) {
    var result = Repidot.searchWithBroadening({
      query: state.q, categoryId: state.cat || null, locationSlug: state.loc || null,
      sort: state.sort, page: state.page, pageSize: PAGE_SIZE
    });

    var title = (state.q ? state.q + " — " : "") + "Cari — Repidot";
    var description = state.q
      ? 'Hasil pencarian untuk "' + state.q + '" di Repidot' + (result.category ? " — kategori " + result.category.name : "") + (result.location ? " di " + result.location.name : "") + "."
      : "Cari loker, berita, wisata, kuliner, dan info publik berdasarkan kata kunci, kategori, atau wilayah di Repidot.";
    // Search results are query-driven and can multiply into endless filter
    // combinations, so this stays out of the index — the actual content
    // lives at its real daerah/kategori/konten URL, which IS indexed.
    Repidot.applySEO({ title: title, description: description, robots: "noindex, follow" });

    var exactLocation = !state.cat && !state.loc ? Repidot.findExactLocationMatch(state.q) : null;

    main.innerHTML =
      buildHero(state) +
      '<section class="section" style="padding-block: var(--space-lg);">' +
        '<div class="container">' +
          (exactLocation ? buildLocationMatchCard(exactLocation) : "") +
          buildContextRow(result, state) +
          '<div class="content-layout" style="margin-top: var(--space-md);">' +
            '<div>' +
              buildResultsToolbar(result) +
              buildBroadenNotice(result) +
              buildResultsGrid(result) +
              buildPagination(result, state) +
            '</div>' +
            '<aside class="sidebar-stack">' +
              '<div class="filters-panel-desktop sidebar-card">' + buildFiltersForm(state) + '</div>' +
            '</aside>' +
          '</div>' +
          buildSecondaryDiscovery(result) +
        '</div>' +
      '</section>' +
      buildFiltersSheet(state);

    wireInteractions(state, result);
  }

  // ---------------- Section builders ----------------

  function buildHero(state) {
    var recents = getRecentSearches();
    var suggested = ["Loker Banyumas", "Wisata Dieng", "Bansos Banyumas", "Kuliner Bandung", "Event Jawa Tengah"];
    return (
      '<section class="search-hero">' +
        '<div class="container">' +
          '<h1>Cari Informasi</h1>' +
          '<form class="hero-search search-hero-form" id="searchForm" role="search" autocomplete="off">' +
            '<label class="search-field" style="flex:1; position:relative;">' +
              RepidotIcons.search +
              '<input type="search" id="searchInput" name="q" value="' + Repidot.escapeHtml(state.q) + '" placeholder="Cari loker, wisata, tempat, atau daerah..." aria-label="Cari informasi" />' +
            '</label>' +
            '<button type="submit" class="btn btn-primary">Cari</button>' +
            '<ul class="suggestions-dropdown" id="suggestionsList"></ul>' +
          '</form>' +
          (suggested.length ? '<div class="chip-row"><span class="label">Saran:</span>' +
            suggested.map(function (s) { return '<a class="tag-pill" href="' + Repidot.searchUrl(s) + '">' + RepidotIcons.search + Repidot.escapeHtml(s) + '</a>'; }).join("") +
          '</div>' : "") +
          (recents.length ? '<div class="chip-row"><span class="label">Pencarian terakhir:</span>' +
            recents.map(function (s) { return '<a class="tag-pill" href="' + Repidot.searchUrl(s) + '">' + RepidotIcons.history + Repidot.escapeHtml(s) + '</a>'; }).join("") +
          '</div>' : "") +
        '</div>' +
      '</section>'
    );
  }

  function buildLocationMatchCard(loc) {
    var ancestors = Repidot.getAncestors(loc).slice(0, -1).reverse().filter(function (a) { return a.id !== "id"; });
    var subtitle = ancestors.map(function (a) { return a.name; }).join(", ");
    return (
      '<a class="location-match-card" href="' + Repidot.locationUrl(loc) + '">' +
        '<div class="info">' +
          '<span class="pin">' + RepidotIcons.pin + '</span>' +
          '<div><h3>' + Repidot.escapeHtml(loc.name) + '</h3>' +
          '<p>' + Repidot.escapeHtml(subtitle) + '</p></div>' +
        '</div>' +
        '<span>' + RepidotIcons.chevronRight + '</span>' +
      '</a>'
    );
  }

  function buildContextRow(result, state) {
    var chips = [];
    if (result.category) chips.push(contextChip("Kategori", result.category.name, removeParamUrl(state, "cat")));
    if (result.location) chips.push(contextChip("Lokasi", result.location.name, removeParamUrl(state, "loc")));
    if (result.keywords) chips.push(contextChip("Kata kunci", result.keywords, removeParamUrl(state, "q", result.keywords)));
    if (!chips.length) return "";
    return '<div class="context-row">' + chips.join("") + '</div>';
  }

  function contextChip(label, value, removeUrl) {
    return (
      '<span class="context-chip">' +
        '<span class="k">' + label + ':</span> ' + Repidot.escapeHtml(value) +
        '<a href="' + removeUrl + '" aria-label="Hapus filter ' + label + '"><button type="button">' + RepidotIcons.close + '</button></a>' +
      '</span>'
    );
  }

  // Removing a chip: clear that param, but for "q" we only strip the
  // matched keyword portion, not the whole typed query.
  function removeParamUrl(state, key) {
    var next = { q: state.q, cat: state.cat, loc: state.loc, sort: state.sort, page: 1 };
    if (key === "cat") next.cat = "";
    if (key === "loc") next.loc = "";
    if (key === "q") next.q = "";
    return stateToUrl(next);
  }

  function buildResultsToolbar(result) {
    return (
      '<div class="results-toolbar">' +
        '<span class="results-count">' +
          (result.total > 0
            ? 'Menampilkan ' + result.items.length + ' dari ' + result.total + ' hasil untuk: <strong>' + Repidot.escapeHtml(result.raw || (result.category ? result.category.name : "") + (result.location ? " " + result.location.name : "")) + '</strong>'
            : 'Tidak ada hasil untuk pencarianmu') +
        '</span>' +
        '<button type="button" class="btn btn-secondary filters-toggle" id="openFilters">' + RepidotIcons.filter + 'Filter</button>' +
      '</div>'
    );
  }

  function buildBroadenNotice(result) {
    if (!result.broadenedFrom) return "";
    return (
      '<div class="broaden-notice">' + RepidotIcons.search +
      '<span>Tidak ada hasil di ' + Repidot.escapeHtml(result.broadenedFrom.name) + '. Menampilkan hasil dari wilayah yang lebih luas: <strong>' + Repidot.escapeHtml(result.location.name) + '</strong>.</span>' +
      '</div>'
    );
  }

  function buildResultsGrid(result) {
    if (result.items.length === 0) {
      return (
        '<div class="card state-block">' +
          '<span class="icon-wrap">' + RepidotIcons.search + '</span>' +
          '<h4>Tidak ada hasil ditemukan</h4>' +
          '<p>Coba kata kunci lain, atau gunakan pencarian yang lebih luas — misalnya hanya nama daerah atau kategori.</p>' +
        '</div>'
      );
    }
    return '<div class="card-grid">' + result.items.map(resultCard).join("") + '</div>';
  }

  function resultCard(item) {
    var cat = Repidot.getCategoryById(item.categoryId);
    var loc = Repidot.getContentLocation(item);
    return (
      '<a class="card article-card" href="' + Repidot.contentUrl(item) + '">' +
        '<div class="thumb"><span class="badge badge-category">' + Repidot.escapeHtml(cat ? cat.name : "") + '</span></div>' +
        '<div class="body">' +
          '<h3>' + Repidot.escapeHtml(item.title) + '</h3>' +
          '<p style="font-size: var(--fs-small); color: var(--color-text-muted);">' + Repidot.escapeHtml(item.excerpt) + '</p>' +
          '<div class="meta">' +
            (loc ? '<span class="badge badge-location">' + RepidotIcons.locationDot + Repidot.escapeHtml(loc.name) + '</span><span>&middot;</span>' : "") +
            '<span>' + Repidot.escapeHtml(item.publishedAt) + '</span>' +
          '</div>' +
        '</div>' +
      '</a>'
    );
  }

  function buildPagination(result, state) {
    if (result.totalPages <= 1) return "";
    var buttons = "";
    for (var p = 1; p <= result.totalPages; p++) {
      var next = { q: state.q, cat: state.cat, loc: state.loc, sort: state.sort, page: p };
      buttons += '<a href="' + stateToUrl(next) + '"><button type="button"' + (p === result.page ? ' aria-current="page"' : '') + '>' + p + '</button></a>';
    }
    return '<div class="pagination" style="margin-top: var(--space-lg);">' + buttons + '</div>';
  }

  function buildFiltersForm(state, formId) {
    var catOptions = '<option value="">Semua kategori</option>' + Repidot.CATEGORIES.map(function (c) {
      return '<option value="' + c.id + '"' + (state.cat === c.id ? " selected" : "") + '>' + Repidot.escapeHtml(c.name) + '</option>';
    }).join("");

    var currentLoc = state.loc ? Repidot.getLocationBySlug(state.loc) : null;
    var chain = currentLoc ? Repidot.getAncestors(currentLoc) : [];
    function slugOfType(type) {
      if (currentLoc && currentLoc.type === type) return currentLoc.slug;
      var found = chain.filter(function (l) { return l.type === type; })[0];
      return found ? found.slug : "";
    }
    var provinceSlug = slugOfType("province");
    var regencySlug = slugOfType("regency");
    var districtSlug = slugOfType("district");
    var villageSlug = slugOfType("village");

    var provinces = Repidot.LOCATIONS.filter(function (l) { return l.type === "province"; });
    var provOptions = '<option value="">Semua provinsi</option>' + provinces.map(function (p) {
      return '<option value="' + p.slug + '"' + (provinceSlug === p.slug ? " selected" : "") + '>' + Repidot.escapeHtml(p.name) + '</option>';
    }).join("");

    return (
      '<h4 style="margin-bottom: var(--space-sm);">Filter</h4>' +
      '<form class="filters-panel" id="' + formId + '" data-preselect=\'' + JSON.stringify({ province: provinceSlug, regency: regencySlug, district: districtSlug, village: villageSlug }) + '\'>' +
        '<div class="filter-group"><span class="field-label">Kategori</span><select name="cat">' + catOptions + '</select></div>' +
        '<div class="filter-group"><span class="field-label">Provinsi</span><select name="province" data-level="province">' + provOptions + '</select></div>' +
        '<div class="filter-group"><span class="field-label">Kabupaten/Kota</span><select name="regency" data-level="regency" disabled><option value="">Pilih provinsi dahulu</option></select></div>' +
        '<div class="filter-group"><span class="field-label">Kecamatan</span><select name="district" data-level="district" disabled><option value="">Pilih kabupaten/kota dahulu</option></select></div>' +
        '<div class="filter-group"><span class="field-label">Desa/Kelurahan</span><select name="village" data-level="village" disabled><option value="">Pilih kecamatan dahulu</option></select></div>' +
        '<div class="filter-group"><span class="field-label">Urutkan</span><select name="sort">' +
          '<option value="relevansi"' + (state.sort === "relevansi" ? " selected" : "") + '>Paling relevan</option>' +
          '<option value="terbaru"' + (state.sort === "terbaru" ? " selected" : "") + '>Terbaru</option>' +
        '</select></div>' +
        '<input type="hidden" name="q" value="' + Repidot.escapeHtml(state.q) + '" />' +
        '<button type="submit" class="btn btn-primary">Terapkan Filter</button>' +
      '</form>'
    );
  }

  function buildFiltersSheet(state) {
    return (
      '<div class="filters-sheet" id="filtersSheet" aria-hidden="true">' +
        '<div class="backdrop" id="filtersSheetBackdrop"></div>' +
        '<div class="sheet-panel">' +
          '<div class="sheet-handle"></div>' +
          '<div class="sheet-top"><h3>Filter Pencarian</h3><button type="button" class="btn-icon" id="closeFilters">' + RepidotIcons.close + '</button></div>' +
          buildFiltersForm(state, "filtersFormMobile") +
        '</div>' +
      '</div>'
    );
  }

  function buildSecondaryDiscovery(result) {
    if (!result.location) return "";
    var loc = result.location;
    var others = Repidot.CATEGORIES.filter(function (c) { return !result.category || c.id !== result.category.id; });
    return (
      '<section class="secondary-discovery">' +
        '<div class="section-header"><div><h2>Informasi ' + Repidot.escapeHtml(loc.name) + ' lainnya</h2></div></div>' +
        '<div class="category-link-grid">' +
          others.map(function (c) {
            var count = Repidot.countContentFor(c.id, loc);
            return '<a class="category-link-card" href="' + Repidot.categoryLocationUrl(c.slug, loc.slug) + '">' +
              '<span class="icon">' + RepidotIcons[c.icon] + '</span>' +
              '<span class="text"><span class="name">' + Repidot.escapeHtml(c.name) + '</span>' +
              '<span class="count">' + (count > 0 ? count + " informasi" : "Belum ada") + '</span></span>' +
            '</a>';
          }).join("") +
        '</div>' +
      '</section>'
    );
  }

  // ---------------- Interactions ----------------

  function wireInteractions(state, result) {
    var input = document.getElementById("searchInput");
    var list = document.getElementById("suggestionsList");
    var debounceTimer = null;
    var activeIndex = -1;

    input.addEventListener("input", function () {
      clearTimeout(debounceTimer);
      var value = input.value;
      debounceTimer = setTimeout(function () {
        var suggestions = Repidot.getSuggestions(value, 6);
        renderSuggestions(suggestions);
      }, 200); // debounce so we don't re-filter on every keystroke
    });

    input.addEventListener("keydown", function (e) {
      var options = list.querySelectorAll("a");
      if (e.key === "ArrowDown") { e.preventDefault(); activeIndex = Math.min(activeIndex + 1, options.length - 1); highlight(options); }
      else if (e.key === "ArrowUp") { e.preventDefault(); activeIndex = Math.max(activeIndex - 1, 0); highlight(options); }
      else if (e.key === "Enter" && activeIndex >= 0 && options[activeIndex]) { e.preventDefault(); window.location.href = options[activeIndex].getAttribute("href"); }
      else if (e.key === "Escape") { closeSuggestions(); }
    });

    document.addEventListener("click", function (e) {
      if (!list.contains(e.target) && e.target !== input) closeSuggestions();
    });

    function highlight(options) {
      options.forEach(function (o, i) { o.classList.toggle("is-active", i === activeIndex); });
    }

    function renderSuggestions(suggestions) {
      activeIndex = -1;
      if (!suggestions.length) { closeSuggestions(); return; }
      list.innerHTML = suggestions.map(function (s) {
        var icon = s.type === "location" ? RepidotIcons.pin : RepidotIcons.search;
        return '<li><a href="' + s.url + '">' + icon + '<span>' + Repidot.escapeHtml(s.label) + '</span>' +
          '<span class="type-tag">' + (s.type === "location" ? "Wilayah" : "Kategori") + '</span></a></li>';
      }).join("");
      list.classList.add("is-open");
    }

    function closeSuggestions() { list.classList.remove("is-open"); }

    // Filters: desktop form + mobile sheet both submit as a GET to cari.html
    ["filtersForm", "filtersFormMobile"].forEach(function (id) {
      var form = document.getElementById(id);
      if (form) form.addEventListener("submit", function (e) {
        e.preventDefault();
        var data = new FormData(form);
        window.location.href = stateToUrl({
          q: data.get("q") || "", cat: data.get("cat") || "", loc: data.get("loc") || "",
          sort: data.get("sort") || "relevansi", page: 1
        });
      });
    });

    var openBtn = document.getElementById("openFilters");
    var sheet = document.getElementById("filtersSheet");
    var closeBtn = document.getElementById("closeFilters");
    var backdrop = document.getElementById("filtersSheetBackdrop");
    if (openBtn) openBtn.addEventListener("click", function () { sheet.classList.add("is-open"); sheet.setAttribute("aria-hidden", "false"); document.body.style.overflow = "hidden"; });
    function closeSheet() { sheet.classList.remove("is-open"); sheet.setAttribute("aria-hidden", "true"); document.body.style.overflow = ""; }
    if (closeBtn) closeBtn.addEventListener("click", closeSheet);
    if (backdrop) backdrop.addEventListener("click", closeSheet);
  }
})();
