#!/usr/bin/env node
/* ==========================================================================
   REPIDOT — SITEMAP GENERATOR (build-time only)

   This runs with Node at build/deploy time and writes static .xml files
   into the project root. It is NOT loaded by any HTML page and ships zero
   bytes to the browser — the brief's "do not generate massive client-side
   sitemap files" rule is satisfied by this simply not being client code.

   Splits output into one sitemap per content type (locations, categories,
   articles) under a sitemap index, which is the standard pattern for
   scaling past the 50,000-URL-per-file limit: today each file holds a
   handful of seed URLs, but adding real locations/content later only
   grows these files — nothing about the pattern or the page code changes.
   Search-result pages (cari.html) are never included: they're tagged
   noindex in js/page-cari.js and robots.txt, so they don't belong here.

   Usage: node scripts/generate-sitemap.js [--base-url=https://example.com]
   ========================================================================== */

var fs = require("fs");
var path = require("path");

var ROOT = path.join(__dirname, "..");
var BASE_URL = (process.argv.find(function (a) { return a.indexOf("--base-url=") === 0; }) || "--base-url=https://www.repidot.id")
  .replace("--base-url=", "")
  .replace(/\/$/, "");

// ---- Load the seed data the same way the browser does, without a browser ----
function loadDataFile(relPath) {
  var code = fs.readFileSync(path.join(ROOT, relPath), "utf8");
  var sandbox = { window: {} };
  new Function("window", code)(sandbox.window);
  return sandbox.window;
}

var locData = loadDataFile("data/locations.js");
var catData = loadDataFile("data/categories.js");
var contentData = loadDataFile("data/content.js");

var LOCATIONS = locData.REPIDOT_LOCATIONS || [];
var CATEGORIES = catData.REPIDOT_CATEGORIES || [];
var CONTENT = (contentData.REPIDOT_CONTENT || []).filter(function (c) { return c.status === "published"; });

var LOCATION_FIELD = { province: "provinceId", regency: "regencyId", district: "districtId", village: "villageId" };

function getLocationById(id) { return LOCATIONS.filter(function (l) { return l.id === id; })[0] || null; }
function countContentFor(catId, loc) {
  var field = LOCATION_FIELD[loc.type];
  if (!field) return 0;
  return CONTENT.filter(function (c) { return c.categoryId === catId && c[field] === loc.id; }).length;
}
function contentLocation(item) {
  var id = item.villageId || item.districtId || item.regencyId || item.provinceId;
  return id ? getLocationById(id) : null;
}

// ---- URL set builders ----

function urlEntry(loc, priority, changefreq) {
  return { loc: loc, priority: priority, changefreq: changefreq };
}

function buildLocationUrls() {
  var urls = [urlEntry(BASE_URL + "/index.html", "1.0", "daily")];
  LOCATIONS.forEach(function (l) {
    urls.push(urlEntry(BASE_URL + "/daerah.html?slug=" + encodeURIComponent(l.slug), l.type === "country" ? "0.9" : "0.6", "weekly"));
  });
  return urls;
}

function buildCategoryUrls() {
  var urls = [];
  LOCATIONS.forEach(function (l) {
    CATEGORIES.forEach(function (c) {
      // Only real, non-empty combinations — an indexable page with zero
      // content is thin/duplicate-empty-state, not worth submitting.
      if (countContentFor(c.id, l) > 0) {
        urls.push(urlEntry(BASE_URL + "/kategori.html?cat=" + c.slug + "&loc=" + encodeURIComponent(l.slug), "0.7", "daily"));
      }
    });
  });
  return urls;
}

function buildArticleUrls() {
  return CONTENT.map(function (item) {
    return urlEntry(BASE_URL + "/konten.html?id=" + encodeURIComponent(item.id), "0.5", "weekly");
  });
}

// ---- XML rendering ----

function renderUrlset(urls) {
  var body = urls.map(function (u) {
    return (
      "  <url>\n" +
      "    <loc>" + escapeXml(u.loc) + "</loc>\n" +
      "    <changefreq>" + u.changefreq + "</changefreq>\n" +
      "    <priority>" + u.priority + "</priority>\n" +
      "  </url>"
    );
  }).join("\n");
  return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + body + "\n</urlset>\n";
}

function renderIndex(files) {
  var today = new Date().toISOString().slice(0, 10);
  var body = files.map(function (f) {
    return "  <sitemap>\n    <loc>" + escapeXml(BASE_URL + "/" + f) + "</loc>\n    <lastmod>" + today + "</lastmod>\n  </sitemap>";
  }).join("\n");
  return '<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + body + "\n</sitemapindex>\n";
}

function escapeXml(s) {
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ---- Write files ----

var files = {
  "sitemap-locations.xml": buildLocationUrls(),
  "sitemap-categories.xml": buildCategoryUrls(),
  "sitemap-articles.xml": buildArticleUrls()
};

Object.keys(files).forEach(function (name) {
  fs.writeFileSync(path.join(ROOT, name), renderUrlset(files[name]));
  console.log("Wrote " + name + " (" + files[name].length + " URLs)");
});

fs.writeFileSync(path.join(ROOT, "sitemap-index.xml"), renderIndex(Object.keys(files)));
console.log("Wrote sitemap-index.xml");
