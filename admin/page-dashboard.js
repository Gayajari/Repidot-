(function () {
  "use strict";

  var stats = AdminStore.contentStats();
  var allContent = AdminStore.allContent();
  // No real traffic/analytics backend exists for this static prototype, so
  // "recent" is the best honest signal available (insertion order — admin
  // edits/creates land at the end of the merged array). See admin/README.md.
  var recent = allContent.slice().reverse().slice(0, 6);

  function catName(catId) {
    var c = Repidot.getCategoryById(catId);
    return c ? c.name : catId;
  }

  function statusPill(status) {
    var labels = { draft: "Draft", review: "Review", published: "Terbit", archived: "Arsip" };
    return '<span class="status-pill status-' + status + '">' + (labels[status] || status) + '</span>';
  }

  function recentRow(item) {
    var loc = Repidot.getContentLocation(item);
    return (
      '<tr>' +
        '<td class="title-cell">' + Repidot.escapeHtml(item.title) + '</td>' +
        '<td>' + Repidot.escapeHtml(catName(item.categoryId)) + '</td>' +
        '<td>' + (loc ? Repidot.escapeHtml(loc.name) : '<span style="color:var(--color-text-faint);">—</span>') + '</td>' +
        '<td>' + statusPill(item.status) + '</td>' +
        '<td><a class="icon-btn" href="content-form.html?id=' + encodeURIComponent(item.id) + '" aria-label="Edit">' + RepidotIcons.edit + '</a></td>' +
      '</tr>'
    );
  }

  var buildDashboard = function () {
    document.getElementById("dashboardContent").innerHTML =
      '<div class="stat-grid" style="margin-bottom: var(--space-md);">' +
        statCard("Total Konten", stats.total, "Semua status") +
        statCard("Diterbitkan", stats.byStatus.published, "Tampil di situs publik") +
        statCard("Draft", stats.byStatus.draft, "Belum diajukan review") +
        statCard("Menunggu Review", stats.byStatus.review, "Perlu ditinjau") +
      '</div>' +
      '<div class="stat-grid" style="margin-bottom: var(--space-md);">' +
        statCard("Total Wilayah", Repidot.LOCATIONS.length, "Termasuk yang ditambahkan admin") +
        statCard("Arsip", stats.byStatus.archived, "Tidak tampil di publik") +
      '</div>' +
      '<div class="admin-panel">' +
        '<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: var(--space-sm);">' +
          '<h2 style="margin-bottom:0;">Konten Terbaru</h2>' +
          '<a class="btn btn-secondary" href="content-form.html">' + RepidotIcons.plus + ' Konten Baru</a>' +
        '</div>' +
        (recent.length
          ? '<div class="admin-table-wrap"><table class="admin-table"><thead><tr><th>Judul</th><th>Kategori</th><th>Lokasi</th><th>Status</th><th></th></tr></thead><tbody>' +
              recent.map(recentRow).join("") +
            '</tbody></table></div>'
          : '<div class="admin-empty-note">Belum ada konten. Mulai dengan menambahkan konten baru.</div>') +
      '</div>' +
      '<div class="admin-panel">' +
        '<h2>Konten Populer</h2>' +
        '<div class="admin-empty-note">Metrik popularitas (jumlah kunjungan) memerlukan data trafik dari backend/analytics, yang belum tersedia di prototipe statis ini — jadi tidak ditampilkan angka rekaan di sini.</div>' +
      '</div>';
  };

  function statCard(label, value, sub) {
    return (
      '<div class="stat-card">' +
        '<div class="label">' + label + '</div>' +
        '<div class="value">' + value + '</div>' +
        '<div class="sub">' + sub + '</div>' +
      '</div>'
    );
  }

  AdminShell.render("Dashboard");
  buildDashboard();
})();
