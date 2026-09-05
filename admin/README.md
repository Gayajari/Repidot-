# Repidot Admin — status & what production needs

This admin dashboard is a **working UI prototype** built on top of Repidot's
static site (no server, no database). To make Content, Locations, and Media
management demonstrable without a backend, it persists everything in the
browser:

- `localStorage` — content overrides, location overrides, media, settings
- `sessionStorage` — the "logged in" flag

That is enough to click through the full Create → Review → Publish →
Archive workflow and see it reflected on the public site *in this browser,
on this device*. It is **not** real infrastructure. Specifically:

## Authentication (Section 10 of the Phase 6 brief)

`admin/login.html` accepts any email/password and simply sets a
`sessionStorage` flag. There is no server to check credentials against, so
this is explicitly a UI stub — never treat it as access control. A real
deployment needs:

- A real identity provider or auth service (e.g. session cookies issued by
  a backend, or a managed auth provider) — not a flag set by client-side JS.
- Every admin read/write (`content.html`, `content-form.html`,
  `locations.html`, `media.html`, `users.html`, `settings.html`) served
  from an **authenticated API**, with the server rejecting unauthenticated
  or unauthorized requests. The current pages fetch from
  `window.REPIDOT_CONTENT` / `localStorage` directly, which anyone with the
  URL can open — fine for a demo, not for admin operations on real data.
- Role/permission checks server-side (who can publish, who can only draft),
  not just hiding buttons in the UI.

## Secrets

There are no API keys or credentials anywhere in this codebase, and there
should never be — this is plain static HTML/CSS/JS shipped to a browser,
which means anything written into it is public. When a real backend exists,
its secrets (database URL, auth provider keys, storage bucket credentials)
belong in that backend's environment variables, never in files under this
`admin/` folder or any other client-side code.

## Data persistence

`admin/js/admin-store.js` layers admin edits on top of the read-only seed
arrays (`data/content.js`, `data/locations.js`) using `localStorage`. This
means:

- Edits are per-browser, not shared between admins or devices.
- Clearing browser storage clears all admin changes.
- There is no concurrent-edit handling, audit log, or backup.

Production needs a real database (with the location hierarchy and content
tables Phase 3/4 already modeled) behind an API, so every admin sees the
same data and writes are durable.

## Media

`admin/media.html` stores uploads as base64 data URLs in `localStorage`,
which is only viable for a handful of small demo images. Real media needs
object storage (an S3-compatible bucket or similar) behind a CDN, with the
admin UI uploading directly to that storage and saving just the resulting
URL — not the file bytes — in the content record.

## Summary

Everything in `admin/` demonstrates the intended workflows, fields, and
validation rules end-to-end. Wiring it to a real backend means replacing
the bodies of the functions in `admin-store.js` with real API calls; the
page code that calls them (`page-*.js`) shouldn't need to change.
