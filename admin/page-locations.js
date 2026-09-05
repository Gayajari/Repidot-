(function () {
  "use strict";

  var root;
  var TYPE_LABEL = { country: "Negara", province: "Provinsi", regency: "Kabupaten/Kota", district: "Kecamatan", village: "Desa/Kelurahan" };
  var CHILD_TYPE = { country: "province", province: "regency", regency: "district", district: "village" };

  function treeNode(loc, depth) {
    var children = Repidot.getChildren(loc.id);
    return (
      '<div style="padding-left:' + (depth * 20) + 'px; display:flex; align-items:center; gap:var(--space-2xs); padding-block:6px; border-bottom:1px solid var(--color-border);">' +
        '<span class="status-pill" style="background:var(--color-bg-alt); color:var(--color-text-muted);">' + TYPE_LABEL[loc.type] + '</span>' +
        '<span style="font-weight:var(--fw-medium);">' + Repidot.escapeHtml(loc.name) + '</span>' +
        '<span style="color:var(--color-text-faint); font-size:var(--fs-caption);">' + children.length + ' turunan</span>' +
        '<a class="icon-btn" style="margin-left:auto;" href="content.html?loc=' + loc.slug + '" title="Lihat konten di sini">' + RepidotIcons.list + '</a>' +
      '</div>' +
      children.map(function (c) { return treeNode(c, depth + 1); }).join("")
    );
  }

  function typeOptions(selected) {
    return Object.keys(CHILD_TYPE).map(function (t) { return CHILD_TYPE[t]; }).map(function (t) {
      return '<option value="' + t + '"' + (selected === t ? " selected" : "") + '>' + TYPE_LABEL[t] + '</option>';
    }).join("");
  }

  function parentOptionsFor(type) {
    var parentType = Object.keys(CHILD_TYPE).filter(function (k) { return CHILD_TYPE[k] === type; })[0];
    if (parentType === "country") return '<option value="id">Indonesia</option>';
    return Repidot.LOCATIONS.filter(function (l) { return l.type === parentType; })
      .map(function (l) { return '<option value="' + l.id + '">' + Repidot.escapeHtml(l.name) + '</option>'; }).join("");
  }

  function render() {
    var indonesia = Repidot.getLocationById("id");
    root.innerHTML =
      '<h1 style="font-family:var(--font-display); font-size:var(--fs-h2); margin-bottom: var(--space-md);">Lokasi</h1>' +
      '<div class="admin-panel" style="margin-bottom: var(--space-md);">' +
        '<div class="form-section-title" style="margin-top:0;">Tambah Wilayah</div>' +
        '<form class="admin-form" id="locationForm">' +
          '<div class="form-grid cols-2">' +
            '<div class="field"><label for="locType">Jenis wilayah</label><select id="locType">' + typeOptions("province") + '</select></div>' +
            '<div class="field"><label for="locParent">Induk wilayah</label><select id="locParent">' + parentOptionsFor("province") + '</select></div>' +
          '</div>' +
          '<div class="field"><label for="locName">Nama wilayah</label><input type="text" id="locName" placeholder="mis. Purbalingga" /></div>' +
          '<div class="form-actions" style="border-top:0; padding-top:0;"><button type="submit" class="btn btn-primary">' + RepidotIcons.plus + ' Tambah</button></div>' +
        '</form>' +
      '</div>' +
      '<div class="admin-panel">' +
        '<div class="form-section-title" style="margin-top:0;">Hierarki Wilayah</div>' +
        (indonesia ? treeNode(indonesia, 0) : '<div class="admin-empty-note">Data lokasi tidak tersedia.</div>') +
      '</div>';

    wire();
  }

  function wire() {
    var typeSel = document.getElementById("locType");
    var parentSel = document.getElementById("locParent");
    typeSel.addEventListener("change", function () {
      parentSel.innerHTML = parentOptionsFor(typeSel.value);
    });

    document.getElementById("locationForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var name = document.getElementById("locName").value.trim();
      if (!name) { alert("Nama wilayah wajib diisi."); return; }
      AdminStore.saveLocation({ name: name, type: typeSel.value, parentId: parentSel.value });
      // Reload so js/repidot-data.js re-merges the new location from
      // storage — it computes Repidot.LOCATIONS once per page load.
      window.location.reload();
    });
  }

  AdminShell.render("Lokasi");
  render();
})();
