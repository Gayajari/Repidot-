(function () {
  "use strict";

  var root;
  var params = new URLSearchParams(window.location.search);
  var state = {
    cat: params.get("cat") || "",
    status: "",
    q: ""
  };

  function catName(catId) {
    var c = Repidot.getCategoryById(catId);
    return c ? c.name : catId;
  }

  function statusPill(status) {
    var labels = { draft: "Draft", review: "Review", published: "Terbit", archived: "Arsip" };
    return '<span class="status-pill status-' + status + '">' + (labels[status] || status) + '</span>';
  }

  function pageTitle() {
    return state.cat ? catName(state.cat) : "Semua Konten";
  }

  function render() {
    var all = AdminStore.allContent();
    var filtered = all.filter(function (item) {
      if (state.cat && item.categoryId !== state.cat) return false;
      if (state.status && item.status !== state.status) return false;
      if (state.q && item.title.toLowerCase().indexOf(state.q.toLowerCase()) === -1) return false;
      return true;
    });

    var catOptions = '<option value="">Semua kategori</option>' + Repidot.CATEGORIES.map(function (c) {
      return '<option value="' + c.id + '"' + (state.cat === c.id ? " selected" : "") + '>' + c.name + '</option>';
    }).join("");

    var statusOptions = ["draft", "review", "published", "archived"].map(function (s) {
      var labels = { draft: "Draft", review: "Review", published: "Terbit", archived: "Arsip" };
      return '<option value="' + s + '"' + (state.status === s ? " selected" : "") + '>' + labels[s] + '</option>';
    }).join("");

    root.innerHTML =
      '<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: var(--space-sm); flex-wrap:wrap; gap:var(--space-xs);">' +
        '<h1 style="font-family:var(--font-display); font-size:var(--fs-h2);">' + pageTitle() + '</h1>' +
        '<a class="btn btn-primary" href="content-form.html' + (state.cat ? "?cat=" + state.cat : "") + '">' + RepidotIcons.plus + ' Konten Baru</a>' +
      '</div>' +
      '<div class="admin-toolbar">' +
        '<select id="filterCat"><option value="">Semua kategori</option>' + catOptions.replace('<option value="">Semua kategori</option>', "") + '</select>' +
        '<select id="filterStatus"><option value="">Semua status</option>' + statusOptions + '</select>' +
        '<input type="search" id="filterQ" placeholder="Cari judul…" value="' + Repidot.escapeHtml(state.q) + '" />' +
        '<span class="spacer"></span>' +
        '<span style="font-size: var(--fs-small); color: var(--color-text-muted);">' + filtered.length + ' dari ' + all.length + ' konten</span>' +
      '</div>' +
      (filtered.length
        ? '<div class="admin-table-wrap"><table class="admin-table"><thead><tr>' +
            '<th>Judul</th><th>Kategori</th><th>Lokasi</th><th>Status</th><th>Diperbarui</th><th>Aksi</th>' +
          '</tr></thead><tbody>' + filtered.map(row).join("") + '</tbody></table></div>'
        : '<div class="admin-empty-note">Tidak ada konten yang cocok dengan filter ini.</div>');

    wire();
  }

  function row(item) {
    var loc = Repidot.getContentLocation(item);
    var actions = '<div class="row-actions">';
    actions += '<a class="icon-btn" href="content-form.html?id=' + encodeURIComponent(item.id) + '" aria-label="Edit">' + RepidotIcons.edit + '</a>';
    if (item.status === "published") {
      actions += '<a class="icon-btn" href="../konten.html?id=' + encodeURIComponent(item.id) + '" target="_blank" rel="noopener" aria-label="Lihat">' + RepidotIcons.eye + '</a>';
      actions += '<button type="button" class="icon-btn" data-action="unpublish" data-id="' + item.id + '" aria-label="Batalkan terbit">' + RepidotIcons.close + '</button>';
    } else if (item.status === "archived") {
      actions += '<button type="button" class="icon-btn" data-action="restore" data-id="' + item.id + '" aria-label="Pulihkan ke draft">' + RepidotIcons.history + '</button>';
    } else {
      actions += '<button type="button" class="icon-btn" data-action="publish" data-id="' + item.id + '" aria-label="Terbitkan">' + RepidotIcons.checkCircle + '</button>';
    }
    if (item.status !== "archived") {
      actions += '<button type="button" class="icon-btn" data-action="archive" data-id="' + item.id + '" aria-label="Arsipkan">' + RepidotIcons.archive + '</button>';
    }
    actions += '<button type="button" class="icon-btn is-danger" data-action="delete" data-id="' + item.id + '" aria-label="Hapus">' + RepidotIcons.trash + '</button>';
    actions += '</div>';

    return (
      '<tr>' +
        '<td class="title-cell">' + Repidot.escapeHtml(item.title) + '</td>' +
        '<td>' + Repidot.escapeHtml(catName(item.categoryId)) + '</td>' +
        '<td>' + (loc ? Repidot.escapeHtml(loc.name) : '<span style="color:var(--color-text-faint);">—</span>') + '</td>' +
        '<td>' + statusPill(item.status) + '</td>' +
        '<td style="color:var(--color-text-muted);">' + Repidot.escapeHtml(item.updatedAt || item.publishedAt || "—") + '</td>' +
        '<td>' + actions + '</td>' +
      '</tr>'
    );
  }

  function wire() {
    document.getElementById("filterCat").addEventListener("change", function (e) { state.cat = e.target.value; render(); });
    document.getElementById("filterStatus").addEventListener("change", function (e) { state.status = e.target.value; render(); });
    var qInput = document.getElementById("filterQ");
    var qTimer = null;
    qInput.addEventListener("input", function (e) {
      clearTimeout(qTimer);
      var value = e.target.value;
      qTimer = setTimeout(function () { state.q = value; render(); }, 200);
    });

    root.querySelectorAll("[data-action]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        var id = btn.getAttribute("data-id");
        var action = btn.getAttribute("data-action");
        if (action === "publish") {
          var result = AdminStore.setStatus(id, "published");
          if (!result.ok && result.errors) {
            alert("Tidak bisa diterbitkan:\n" + Object.keys(result.errors).map(function (k) { return "• " + result.errors[k]; }).join("\n"));
            return;
          }
        } else if (action === "unpublish") {
          AdminStore.setStatus(id, "draft");
        } else if (action === "archive") {
          if (!confirm("Arsipkan konten ini? Konten yang diarsipkan tidak akan tampil di situs publik.")) return;
          AdminStore.setStatus(id, "archived");
        } else if (action === "restore") {
          AdminStore.setStatus(id, "draft");
        } else if (action === "delete") {
          if (!confirm("Hapus konten ini secara permanen? Tindakan ini tidak bisa dibatalkan.")) return;
          AdminStore.deleteContent(id);
        }
        render();
      });
    });
  }

  AdminShell.render("Konten");
  root = document.getElementById("contentListRoot");
  render();
})();
