(function () {
  "use strict";

  var root;
  var state = { q: "" };

  function render() {
    var all = AdminStore.allMedia();
    var filtered = state.q
      ? all.filter(function (m) { return (m.name + " " + m.altText).toLowerCase().indexOf(state.q.toLowerCase()) !== -1; })
      : all;

    root.innerHTML =
      '<div style="display:flex; align-items:center; justify-content:space-between; margin-bottom: var(--space-sm); flex-wrap:wrap; gap:var(--space-xs);">' +
        '<h1 style="font-family:var(--font-display); font-size:var(--fs-h2);">Media</h1>' +
        '<input type="search" id="mediaSearch" placeholder="Cari media…" value="' + Repidot.escapeHtml(state.q) + '" style="height:38px; padding-inline: var(--space-2xs); border-radius: var(--radius-sm); border: 1px solid var(--color-border-strong);" />' +
      '</div>' +
      '<div class="admin-panel" style="margin-bottom: var(--space-md);">' +
        '<div class="form-section-title" style="margin-top:0;">Unggah Media Baru</div>' +
        '<div class="upload-drop">' +
          RepidotIcons.upload +
          '<p style="margin-top: var(--space-2xs);">Pilih gambar dari perangkatmu. Disimpan langsung di browser ini (localStorage) — lihat catatan produksi di admin/README.md.</p>' +
          '<input type="file" id="mediaFile" accept="image/*" />' +
          '<input type="text" id="mediaAlt" placeholder="Teks alternatif (alt text)" style="max-width:320px; margin: var(--space-xs) auto 0; height:40px; padding-inline:var(--space-xs); border-radius:var(--radius-sm); border:1px solid var(--color-border-strong); display:block;" />' +
          '<div id="uploadError" style="color:var(--color-danger); font-size:var(--fs-small); margin-top:var(--space-2xs); display:none;"></div>' +
        '</div>' +
      '</div>' +
      (filtered.length
        ? '<div class="media-grid">' + filtered.map(tile).join("") + '</div>'
        : '<div class="admin-empty-note">' + (all.length ? "Tidak ada media yang cocok dengan pencarian." : "Belum ada media. Unggah gambar pertama di atas.") + '</div>');

    wire();
  }

  function tile(m) {
    return (
      '<div class="media-tile" data-id="' + m.id + '">' +
        '<div class="thumb"><img src="' + m.dataUrl + '" alt="' + Repidot.escapeHtml(m.altText) + '" loading="lazy" /></div>' +
        '<div class="info">' +
          '<div class="filename">' + Repidot.escapeHtml(m.name) + '</div>' +
          '<div class="hint">' + m.sizeKB + ' KB</div>' +
          '<input class="alt-input" type="text" value="' + Repidot.escapeHtml(m.altText) + '" placeholder="Alt text" data-alt-for="' + m.id + '" />' +
        '</div>' +
        '<div class="tile-actions">' +
          '<button type="button" class="icon-btn is-danger" data-delete="' + m.id + '" aria-label="Hapus">' + RepidotIcons.trash + '</button>' +
        '</div>' +
      '</div>'
    );
  }

  function wire() {
    var searchInput = document.getElementById("mediaSearch");
    var qTimer = null;
    searchInput.addEventListener("input", function (e) {
      clearTimeout(qTimer);
      var value = e.target.value;
      qTimer = setTimeout(function () { state.q = value; render(); }, 200);
    });

    document.getElementById("mediaFile").addEventListener("change", function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var altText = document.getElementById("mediaAlt").value.trim();
      var errorBox = document.getElementById("uploadError");
      errorBox.style.display = "none";
      AdminStore.addMedia(file, altText, function (result) {
        if (!result.ok) {
          errorBox.textContent = result.error;
          errorBox.style.display = "block";
          return;
        }
        render();
      });
    });

    root.querySelectorAll("[data-alt-for]").forEach(function (input) {
      var timer = null;
      input.addEventListener("input", function () {
        clearTimeout(timer);
        var id = input.getAttribute("data-alt-for");
        var value = input.value;
        timer = setTimeout(function () { AdminStore.updateMediaAlt(id, value); }, 400);
      });
    });

    root.querySelectorAll("[data-delete]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (!confirm("Hapus media ini? Konten yang masih memakainya sebagai thumbnail akan kehilangan gambar.")) return;
        AdminStore.deleteMedia(btn.getAttribute("data-delete"));
        render();
      });
    });
  }

  AdminShell.render("Media");
  root = document.getElementById("mediaRoot");
  render();
})();
