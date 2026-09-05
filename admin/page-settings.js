(function () {
  "use strict";

  var root = document.getElementById("settingsRoot");
  var settings = AdminStore.getSettings();

  AdminShell.render("Pengaturan");

  root.innerHTML =
    '<h1 style="font-family:var(--font-display); font-size:var(--fs-h2); margin-bottom: var(--space-md);">Pengaturan</h1>' +
    '<div class="admin-panel">' +
      '<div class="form-section-title" style="margin-top:0;">Situs</div>' +
      '<form class="admin-form" id="settingsForm">' +
        '<div class="field"><label for="siteName">Nama situs</label><input type="text" id="siteName" value="' + Repidot.escapeHtml(settings.siteName) + '" /></div>' +
        '<div class="field"><label for="tagline">Tagline</label><input type="text" id="tagline" value="' + Repidot.escapeHtml(settings.tagline) + '" /></div>' +
        '<div class="field"><label for="contactEmail">Email kontak</label><input type="email" id="contactEmail" value="' + Repidot.escapeHtml(settings.contactEmail) + '" /></div>' +
        '<div class="form-actions" style="border-top:0; padding-top:0;"><button type="submit" class="btn btn-primary">Simpan Pengaturan</button></div>' +
      '</form>' +
    '</div>' +
    '<div class="admin-panel">' +
      '<div class="form-section-title" style="margin-top:0;">Catatan</div>' +
      '<div class="admin-empty-note">Pengaturan ini tersimpan di browser (localStorage) untuk keperluan prototipe, dan belum otomatis mengubah tampilan header/footer situs publik — menyambungkannya perlu perubahan pada template halaman publik. Untuk deployment sungguhan, pengaturan situs semestinya disimpan di database dan dibaca saat halaman dirender.</div>' +
    '</div>';

  document.getElementById("settingsForm").addEventListener("submit", function (e) {
    e.preventDefault();
    var ok = AdminStore.saveSettings({
      siteName: document.getElementById("siteName").value.trim(),
      tagline: document.getElementById("tagline").value.trim(),
      contactEmail: document.getElementById("contactEmail").value.trim()
    });
    alert(ok ? "Pengaturan disimpan." : "Gagal menyimpan — penyimpanan browser mungkin penuh.");
  });
})();
