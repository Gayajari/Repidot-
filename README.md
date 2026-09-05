# Repidot

Repidot is a location-first information portal for Indonesia: one place to
discover loker (jobs), berita (news), wisata (tourism), kuliner (culinary),
tempat (places), info publik (public information), event, and pendidikan
content, organized by where it's relevant — from a single desa up through
kecamatan, kabupaten/kota, provinsi, to all of Indonesia.

## Project structure

```
index.html          Homepage — neutral discovery entry point (search,
                     categories, location explorer, trending, highlights)
daerah.html          Reusable location page template (?slug=)
kategori.html        Reusable category + location page template (?cat=&loc=)
konten.html          Reusable content detail template (?id=)
cari.html            Smart search (keyword + category + location parsing)
404.html             Not-found page

data/                Seed data: locations.js, categories.js, content.js
js/                  Shared logic: repidot-data.js (the data/search/SEO
                     layer every template reads from), repidot-icons.js,
                     app.js (header behavior), and one page-*.js per template
css/                 Design tokens (tokens.css) plus one stylesheet per
                     concern (components, header, footer, home, location,
                     detail, search)

admin/               Admin dashboard (content, locations, media, users,
                     settings) — see admin/README.md for what's a working
                     prototype vs. what real production needs (auth,
                     a real database, real file storage)

scripts/generate-sitemap.js   Build-time sitemap generator (Node; not
                               shipped to the browser)
robots.txt, sitemap-*.xml     Generated crawler configuration
```

## Demo data vs. production data

**Everything in `data/locations.js`, `data/categories.js`, and
`data/content.js` is seed/demo data written for development.** It covers a
small, real-shaped slice of Central Java and Bandung (a handful of
provinces → regencies → districts → villages, with a few sample jobs,
news, tourism spots, culinary picks, and public-info items per category)
so every feature — location drill-down, category filtering, search
ranking, related content, the admin CRUD flow — has something real to
operate on and can be exercised end to end.

None of it should be mistaken for actual Repidot content. Concretely:

- Company names, job postings, and salaries in `data/content.js` are
  invented for demonstration and are not real listings.
- "Desa Example" (`data/locations.js`) is a placeholder village, not a
  real one — kept obviously named so it's never confused for real data.
- Only a few provinces/regencies exist. The location hierarchy is
  designed to scale to all of Indonesia (see the `type`/`parentId` shape
  in `data/locations.js`), but the rest hasn't been entered.
- "Resmi" (official source) badges only appear where `publicInfo.
  officialSource` is explicitly set `true` in the seed data — this flag
  should only ever be set from a genuinely verified source in production,
  never by default.

Moving to production means replacing these three files (or the code that
loads them) with a real database and API, and running real locations and
moderated content through the admin dashboard described in
`admin/README.md` — the page templates and rendering logic don't need to
change, since they were built against `window.REPIDOT_*` data shapes
rather than these specific files.

## Sitemaps

Run `node scripts/generate-sitemap.js [--base-url=https://example.com]`
to regenerate `sitemap-*.xml` from current data. Re-run it whenever
content or locations change before deploying.
