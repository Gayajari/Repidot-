/* ==========================================================================
   REPIDOT ADMIN — DATA STORE
   Repidot is a static site with no server, so there is nowhere for admin
   writes to persist except the browser. This store treats
   window.REPIDOT_CONTENT / REPIDOT_LOCATIONS as read-only seed data and
   layers admin creates/edits/deletes on top as localStorage "overrides"
   (same keys js/repidot-data.js already reads, so a Publish here shows up
   on the public site too, in this browser, on next page load).

   This is a genuine, working CRUD demo — but it is NOT a real backend.
   See admin/README.md for what production would actually require
   (server-side auth, a real database, real file storage, secrets kept
   out of any frontend bundle).
   ========================================================================== */

var AdminStore = (function () {
  var CONTENT_KEY = "repidot_admin_content";
  var LOCATIONS_KEY = "repidot_admin_locations";
  var MEDIA_KEY = "repidot_admin_media";
  var SETTINGS_KEY = "repidot_admin_settings";
  var SESSION_KEY = "repidot_admin_session";

  function readJson(key, fallback) {
    try {
      var raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (e) { return fallback; }
  }

  function writeJson(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (e) { return false; } // quota exceeded or storage disabled
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

  function genId(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  function slugify(str) {
    return String(str || "")
      .toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  }

  /* ---------------- Content (all statuses — admin sees everything) ---------------- */

  function allContent() {
    return mergeById(window.REPIDOT_CONTENT || [], readJson(CONTENT_KEY, {}));
  }

  function getContent(id) {
    return allContent().filter(function (c) { return c.id === id; })[0] || null;
  }

  // Returns { ok, errors } — errors is a map of field -> message.
  function validateContent(item, forPublish) {
    var errors = {};
    if (!item.title || !item.title.trim()) errors.title = "Judul wajib diisi.";
    if (!item.categoryId) errors.categoryId = "Kategori wajib dipilih.";

    var locationRequiredCategories = ["loker", "wisata", "kuliner", "tempat", "info-publik", "event"];
    var hasLocation = item.provinceId || item.regencyId || item.districtId || item.villageId;
    if (forPublish && locationRequiredCategories.indexOf(item.categoryId) !== -1 && !hasLocation) {
      errors.location = "Pilih minimal satu wilayah (provinsi/kabupaten/kecamatan/desa) untuk kategori ini.";
    }

    if (forPublish && item.categoryId === "info-publik" && !item.source) {
      errors.source = "Sumber wajib diisi untuk info publik agar bisa dipertanggungjawabkan.";
    }
    if (forPublish && item.categoryId === "loker" && item.job) {
      if (!item.job.company) errors.jobCompany = "Nama perusahaan wajib diisi.";
      if (!item.job.description) errors.jobDescription = "Deskripsi pekerjaan wajib diisi.";
    }

    return { ok: Object.keys(errors).length === 0, errors: errors };
  }

  // Saves a create/edit. Publishing is blocked (returns validation errors)
  // if required fields are missing — draft/review saves are allowed with
  // incomplete data since the content is still being worked on.
  function saveContent(item) {
    var isNew = !item.id;
    if (isNew) item.id = genId("a");
    if (!item.slug) item.slug = slugify(item.title) || item.id;
    item.updatedAt = "Baru saja";
    if (!item.publishedAt) item.publishedAt = "Baru saja";
    if (!item.status) item.status = "draft";

    var check = validateContent(item, item.status === "published");
    if (!check.ok) return { ok: false, errors: check.errors, item: item };

    var overrides = readJson(CONTENT_KEY, {});
    overrides[item.id] = item;
    var wrote = writeJson(CONTENT_KEY, overrides);
    return { ok: wrote, item: item, errors: wrote ? {} : { _storage: "Penyimpanan browser penuh atau tidak tersedia." } };
  }

  function setStatus(id, status) {
    var item = getContent(id);
    if (!item) return { ok: false };
    if (status === "published") {
      var check = validateContent(item, true);
      if (!check.ok) return { ok: false, errors: check.errors };
    }
    item.status = status;
    item.updatedAt = "Baru saja";
    var overrides = readJson(CONTENT_KEY, {});
    overrides[id] = item;
    return { ok: writeJson(CONTENT_KEY, overrides) };
  }

  // Deletes an admin-created item outright, or tombstones a seed item
  // (marks it deleted without mutating the read-only seed file).
  function deleteContent(id) {
    var overrides = readJson(CONTENT_KEY, {});
    var isSeedItem = (window.REPIDOT_CONTENT || []).some(function (c) { return c.id === id; });
    overrides[id] = isSeedItem ? null : undefined;
    if (!isSeedItem) delete overrides[id];
    return writeJson(CONTENT_KEY, overrides);
  }

  function contentStats() {
    var all = allContent();
    var byStatus = { draft: 0, review: 0, published: 0, archived: 0 };
    all.forEach(function (c) { if (byStatus[c.status] !== undefined) byStatus[c.status]++; });
    return { total: all.length, byStatus: byStatus };
  }

  /* ---------------- Locations ---------------- */

  function allLocations() {
    return mergeById(window.REPIDOT_LOCATIONS || [], readJson(LOCATIONS_KEY, {}));
  }

  function saveLocation(loc) {
    if (!loc.id) loc.id = genId("l");
    if (!loc.slug) loc.slug = slugify(loc.name);
    var overrides = readJson(LOCATIONS_KEY, {});
    overrides[loc.id] = loc;
    return { ok: writeJson(LOCATIONS_KEY, overrides), location: loc };
  }

  /* ---------------- Media ---------------- */

  function allMedia() {
    return readJson(MEDIA_KEY, []);
  }

  // file: a File from an <input type=file>. Stored as a data URL — fine
  // for a handful of demo images, but real media belongs in object storage
  // (S3-compatible bucket + CDN), not localStorage. See admin/README.md.
  function addMedia(file, altText, callback) {
    var reader = new FileReader();
    reader.onload = function () {
      var list = allMedia();
      var entry = {
        id: genId("m"),
        name: file.name,
        altText: altText || "",
        dataUrl: reader.result,
        sizeKB: Math.round(file.size / 1024),
        uploadedAt: "Baru saja"
      };
      list.unshift(entry);
      var ok = writeJson(MEDIA_KEY, list);
      callback(ok ? { ok: true, item: entry } : { ok: false, error: "Penyimpanan browser penuh. Hapus beberapa media lama dan coba lagi." });
    };
    reader.onerror = function () { callback({ ok: false, error: "Gagal membaca file." }); };
    reader.readAsDataURL(file);
  }

  function updateMediaAlt(id, altText) {
    var list = allMedia();
    var item = list.filter(function (m) { return m.id === id; })[0];
    if (!item) return false;
    item.altText = altText;
    return writeJson(MEDIA_KEY, list);
  }

  function deleteMedia(id) {
    var list = allMedia().filter(function (m) { return m.id !== id; });
    return writeJson(MEDIA_KEY, list);
  }

  /* ---------------- Settings ---------------- */

  function getSettings() {
    return readJson(SETTINGS_KEY, { siteName: "Repidot", tagline: "Temukan Informasi di Sekitarmu.", contactEmail: "" });
  }

  function saveSettings(settings) {
    return writeJson(SETTINGS_KEY, settings);
  }

  /* ---------------- Session (UI prototype only — see admin/README.md) ---------------- */

  function isLoggedIn() {
    try { return window.sessionStorage.getItem(SESSION_KEY) === "1"; } catch (e) { return false; }
  }
  function logIn() {
    try { window.sessionStorage.setItem(SESSION_KEY, "1"); } catch (e) { /* ignore */ }
  }
  function logOut() {
    try { window.sessionStorage.removeItem(SESSION_KEY); } catch (e) { /* ignore */ }
  }

  return {
    allContent: allContent,
    getContent: getContent,
    validateContent: validateContent,
    saveContent: saveContent,
    setStatus: setStatus,
    deleteContent: deleteContent,
    contentStats: contentStats,
    allLocations: allLocations,
    saveLocation: saveLocation,
    allMedia: allMedia,
    addMedia: addMedia,
    updateMediaAlt: updateMediaAlt,
    deleteMedia: deleteMedia,
    getSettings: getSettings,
    saveSettings: saveSettings,
    isLoggedIn: isLoggedIn,
    logIn: logIn,
    logOut: logOut,
    slugify: slugify,
    genId: genId
  };
})();
