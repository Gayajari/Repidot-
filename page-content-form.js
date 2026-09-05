(function () {
  "use strict";

  var params = new URLSearchParams(window.location.search);
  var editId = params.get("id");
  var existing = editId ? AdminStore.getContent(editId) : null;
  var presetCat = params.get("cat") || (existing && existing.categoryId) || "loker";

  // Working copy — never mutated back into storage until a save button is
  // pressed, so navigating away without saving discards changes.
  var draft = existing ? JSON.parse(JSON.stringify(existing)) : {
    id: null, title: "", slug: "", categoryId: presetCat, subcategory: "",
    provinceId: null, regencyId: null, districtId: null, villageId: null,
    thumbnailMediaId: null, excerpt: "", body: [""], source: "", author: "Redaksi Repidot",
    publishedAt: "", updatedAt: "", tags: [], status: "draft"
  };

  function fieldHtml(id, label, inputHtml, hint) {
    return (
      '<div class="field" id="field-' + id + '">' +
        '<label for="' + id + '">' + label + '</label>' +
        inputHtml +
        (hint ? '<div class="hint">' + hint + '</div>' : "") +
        '<div class="error"></div>' +
      '</div>'
    );
  }

  function repeatableHtml(name, label, values) {
    values = (values && values.length ? values : [""]);
    return (
      '<div class="field">' +
        '<label>' + label + '</label>' +
        '<div class="repeatable-list" data-repeatable="' + name + '">' +
          values.map(function (v) { return repeatableRow(v); }).join("") +
        '</div>' +
        '<button type="button" class="btn btn-secondary repeatable-add" data-add-for="' + name + '">' + RepidotIcons.plus + ' Tambah baris</button>' +
      '</div>'
    );
  }
  function repeatableRow(value) {
    return (
      '<div class="repeatable-row">' +
        '<input type="text" value="' + Repidot.escapeHtml(value || "") + '" />' +
        '<button type="button" class="icon-btn is-danger repeatable-remove" aria-label="Hapus baris">' + RepidotIcons.trash + '</button>' +
      '</div>'
    );
  }
  function readRepeatable(name) {
    var container = document.querySelector('[data-repeatable="' + name + '"]');
    if (!container) return [];
    return Array.prototype.map.call(container.querySelectorAll("input"), function (i) { return i.value.trim(); })
      .filter(function (v) { return v.length > 0; });
  }

  function mediaOptions(selectedId) {
    var media = AdminStore.allMedia();
    var opts = '<option value="">Tanpa thumbnail</option>';
    if (!media.length) return opts;
    return opts + media.map(function (m) {
      return '<option value="' + m.id + '"' + (selectedId === m.id ? " selected" : "") + '>' + Repidot.escapeHtml(m.name) + '</option>';
    }).join("");
  }

  function categorySpecificHtml(catId) {
    if (catId === "loker") {
      var j = draft.job || {};
      return (
        '<div class="form-section-title">Detail Loker</div>' +
        '<div class="form-grid cols-2">' +
          fieldHtml("jobCompany", "Perusahaan", '<input type="text" id="jobCompany" value="' + Repidot.escapeHtml(j.company) + '" />') +
          fieldHtml("jobEducation", "Pendidikan", '<input type="text" id="jobEducation" value="' + Repidot.escapeHtml(j.education) + '" placeholder="mis. SMA/SMK sederajat" />') +
          fieldHtml("jobSalary", "Gaji", '<input type="text" id="jobSalary" value="' + Repidot.escapeHtml(j.salary) + '" placeholder="mis. Rp 2.500.000 (opsional)" />') +
          fieldHtml("jobType", "Jenis pekerjaan", '<input type="text" id="jobType" value="' + Repidot.escapeHtml(j.jobType) + '" placeholder="mis. Penuh waktu" />') +
          fieldHtml("jobDeadline", "Deadline", '<input type="text" id="jobDeadline" value="' + Repidot.escapeHtml(j.deadline) + '" placeholder="mis. 7 hari lagi" />') +
        '</div>' +
        fieldHtml("jobDescription", "Deskripsi pekerjaan", '<textarea id="jobDescription">' + Repidot.escapeHtml(j.description) + '</textarea>') +
        repeatableHtml("jobRequirements", "Persyaratan", j.requirements) +
        fieldHtml("jobHowToApply", "Cara melamar", '<textarea id="jobHowToApply">' + Repidot.escapeHtml(j.howToApply) + '</textarea>')
      );
    }
    if (catId === "wisata") {
      var t = draft.tourism || {};
      return (
        '<div class="form-section-title">Detail Wisata</div>' +
        repeatableHtml("tourismHighlights", "Highlight", t.highlights) +
        repeatableHtml("tourismFacilities", "Fasilitas (opsional)", t.facilities) +
        '<div class="form-grid cols-2">' +
          fieldHtml("tourismHours", "Jam buka (opsional)", '<input type="text" id="tourismHours" value="' + Repidot.escapeHtml(t.openingHours) + '" />') +
          fieldHtml("tourismPrice", "Harga tiket (opsional)", '<input type="text" id="tourismPrice" value="' + Repidot.escapeHtml(t.price) + '" />') +
        '</div>' +
        fieldHtml("tourismMapNote", "Catatan lokasi/peta (opsional)", '<textarea id="tourismMapNote">' + Repidot.escapeHtml(t.mapNote) + '</textarea>', "Jangan diisi kalau lokasi persisnya belum dikonfirmasi — jangan mengarang.")
      );
    }
    if (catId === "info-publik") {
      var p = draft.publicInfo || {};
      return (
        '<div class="form-section-title">Detail Info Publik</div>' +
        '<div class="field-checkbox" style="margin-bottom: var(--space-xs);">' +
          '<input type="checkbox" id="publicOfficial"' + (p.officialSource ? " checked" : "") + ' />' +
          '<label for="publicOfficial">Sumber resmi terverifikasi</label>' +
        '</div>' +
        '<div class="hint" style="margin-top:-8px; margin-bottom: var(--space-sm);">Aktifkan badge "Resmi" hanya jika sumber benar-benar sudah diverifikasi — jangan dicentang secara default.</div>' +
        fieldHtml("publicArea", "Wilayah cakupan", '<input type="text" id="publicArea" value="' + Repidot.escapeHtml(p.area) + '" placeholder="mis. Kabupaten Banyumas" />') +
        repeatableHtml("publicEligibility", "Siapa yang berhak (opsional)", p.eligibility) +
        repeatableHtml("publicImportantDates", "Tanggal penting (opsional)", p.importantDates) +
        fieldHtml("publicNotes", "Catatan (opsional)", '<textarea id="publicNotes">' + Repidot.escapeHtml(p.notes) + '</textarea>')
      );
    }
    return "";
  }

  function locationSelectsHtml() {
    return (
      '<div class="form-grid cols-4">' +
        fieldHtml("locProvince", "Provinsi", '<select id="locProvince"><option value="">— Pilih provinsi —</option></select>') +
        fieldHtml("locRegency", "Kabupaten/Kota", '<select id="locRegency" disabled><option value="">Pilih provinsi dahulu</option></select>') +
        fieldHtml("locDistrict", "Kecamatan (opsional)", '<select id="locDistrict" disabled><option value="">Pilih kabupaten/kota dahulu</option></select>') +
        fieldHtml("locVillage", "Desa/Kelurahan (opsional)", '<select id="locVillage" disabled><option value="">Pilih kecamatan dahulu</option></select>') +
      '</div>' +
      '<div class="field" id="field-location"><div class="error"></div></div>'
    );
  }

  function buildForm() {
    var catOptions = Repidot.CATEGORIES.map(function (c) {
      return '<option value="' + c.id + '"' + (draft.categoryId === c.id ? " selected" : "") + '>' + c.name + '</option>';
    }).join("");

    var statusOptions = ["draft", "review", "published", "archived"].map(function (s) {
      var labels = { draft: "Draft", review: "Review", published: "Terbit", archived: "Arsip" };
      return '<option value="' + s + '"' + (draft.status === s ? " selected" : "") + '>' + labels[s] + '</option>';
    }).join("");

    document.getElementById("formRoot").innerHTML =
      '<h1 style="font-family:var(--font-display); font-size:var(--fs-h2); margin-bottom: var(--space-md);">' +
        (editId ? "Edit Konten" : "Konten Baru") +
      '</h1>' +
      '<div class="validation-summary" id="validationSummary"></div>' +
      '<form class="admin-form" id="contentForm">' +

        '<div class="admin-panel">' +
          '<div class="form-section-title" style="margin-top:0;">Informasi Dasar</div>' +
          '<div class="form-grid cols-2">' +
            fieldHtml("title", "Judul", '<input type="text" id="title" value="' + Repidot.escapeHtml(draft.title) + '" />') +
            fieldHtml("slug", "Slug", '<input type="text" id="slug" value="' + Repidot.escapeHtml(draft.slug) + '" />', "Dibuat otomatis dari judul — bisa diedit manual.") +
          '</div>' +
          '<div class="form-grid cols-2">' +
            fieldHtml("categoryId", "Kategori", '<select id="categoryId">' + catOptions + '</select>') +
            fieldHtml("subcategory", "Subkategori (opsional)", '<input type="text" id="subcategory" value="' + Repidot.escapeHtml(draft.subcategory) + '" />') +
          '</div>' +
          fieldHtml("excerpt", "Ringkasan (excerpt)", '<textarea id="excerpt">' + Repidot.escapeHtml(draft.excerpt) + '</textarea>') +
          fieldHtml("body", "Isi konten", '<textarea id="body" style="min-height:160px;">' + Repidot.escapeHtml((draft.body || []).join("\n\n")) + '</textarea>', "Satu paragraf per baris kosong.") +
          fieldHtml("thumbnail", "Thumbnail", '<select id="thumbnail">' + mediaOptions(draft.thumbnailMediaId) + '</select>', 'Unggah gambar dulu di <a href="media.html" target="_blank">Media</a> kalau belum ada pilihan.') +
        '</div>' +

        '<div class="admin-panel">' +
          '<div class="form-section-title" style="margin-top:0;">Lokasi</div>' +
          locationSelectsHtml() +
        '</div>' +

        '<div class="admin-panel" id="categorySpecificPanel">' + categorySpecificHtml(draft.categoryId) + '</div>' +

        '<div class="admin-panel">' +
          '<div class="form-section-title" style="margin-top:0;">Sumber &amp; Metadata</div>' +
          '<div class="form-grid cols-2">' +
            fieldHtml("source", "Sumber", '<input type="text" id="source" value="' + Repidot.escapeHtml(draft.source) + '" />') +
            fieldHtml("author", "Penulis", '<input type="text" id="author" value="' + Repidot.escapeHtml(draft.author) + '" />') +
          '</div>' +
          '<div class="form-grid cols-2">' +
            fieldHtml("publishedAt", "Tanggal publikasi", '<input type="text" id="publishedAt" value="' + Repidot.escapeHtml(draft.publishedAt) + '" placeholder="mis. 2 jam lalu, atau 1 Sep 2026" />') +
            fieldHtml("updatedAt", "Tanggal diperbarui (opsional)", '<input type="text" id="updatedAt" value="' + Repidot.escapeHtml(draft.updatedAt) + '" />') +
          '</div>' +
          fieldHtml("tags", "Tag", '<input type="text" id="tags" value="' + Repidot.escapeHtml((draft.tags || []).join(", ")) + '" />', "Pisahkan dengan koma.") +
          fieldHtml("status", "Status", '<select id="status">' + statusOptions + '</select>') +
        '</div>' +

        '<div class="form-actions">' +
          '<button type="submit" class="btn btn-secondary" data-target-status="draft">Simpan sebagai Draft</button>' +
          '<button type="submit" class="btn btn-secondary" data-target-status="review">Ajukan Review</button>' +
          '<button type="submit" class="btn btn-primary" data-target-status="published">Simpan &amp; Terbitkan</button>' +
          (editId ? '<a class="btn btn-secondary" href="content.html" style="margin-left:auto;">Batal</a>' : "") +
        '</div>' +
      '</form>';

    wireLocationSelects();
    wireRepeatables();
    wireCategorySwitch();
    wireSubmit();
  }

  /* ---------------- Location cascade ---------------- */

  function wireLocationSelects() {
    var provinceSel = document.getElementById("locProvince");
    var regencySel = document.getElementById("locRegency");
    var districtSel = document.getElementById("locDistrict");
    var villageSel = document.getElementById("locVillage");

    Repidot.LOCATIONS.filter(function (l) { return l.type === "province"; }).forEach(function (p) {
      var opt = document.createElement("option");
      opt.value = p.id; opt.textContent = p.name;
      if (draft.provinceId === p.id) opt.selected = true;
      provinceSel.appendChild(opt);
    });

    function fillChildren(select, parentId, placeholder, selectedId) {
      select.innerHTML = '<option value="">' + placeholder + '</option>';
      if (!parentId) { select.disabled = true; return; }
      select.disabled = false;
      Repidot.getChildren(parentId).forEach(function (child) {
        var opt = document.createElement("option");
        opt.value = child.id; opt.textContent = child.name;
        if (selectedId === child.id) opt.selected = true;
        select.appendChild(opt);
      });
    }

    fillChildren(regencySel, draft.provinceId, "— Pilih kabupaten/kota —", draft.regencyId);
    fillChildren(districtSel, draft.regencyId, "Pilih kabupaten/kota dahulu", draft.districtId);
    fillChildren(villageSel, draft.districtId, "Pilih kecamatan dahulu", draft.villageId);
    if (draft.provinceId) regencySel.querySelector("option").textContent = "— Pilih kabupaten/kota —";
    if (draft.regencyId) districtSel.querySelector("option").textContent = "— Pilih kecamatan (opsional) —";
    if (draft.districtId) villageSel.querySelector("option").textContent = "— Pilih desa/kelurahan (opsional) —";

    provinceSel.addEventListener("change", function () {
      fillChildren(regencySel, provinceSel.value || null, "— Pilih kabupaten/kota —", null);
      fillChildren(districtSel, null, "Pilih kabupaten/kota dahulu", null);
      fillChildren(villageSel, null, "Pilih kecamatan dahulu", null);
    });
    regencySel.addEventListener("change", function () {
      fillChildren(districtSel, regencySel.value || null, "— Pilih kecamatan (opsional) —", null);
      fillChildren(villageSel, null, "Pilih kecamatan dahulu", null);
    });
    districtSel.addEventListener("change", function () {
      fillChildren(villageSel, districtSel.value || null, "— Pilih desa/kelurahan (opsional) —", null);
    });
  }

  /* ---------------- Repeatable list rows ---------------- */

  function wireRepeatables() {
    document.getElementById("formRoot").addEventListener("click", function (e) {
      var addBtn = e.target.closest("[data-add-for]");
      if (addBtn) {
        var container = document.querySelector('[data-repeatable="' + addBtn.getAttribute("data-add-for") + '"]');
        container.insertAdjacentHTML("beforeend", repeatableRow(""));
        return;
      }
      var removeBtn = e.target.closest(".repeatable-remove");
      if (removeBtn) {
        var row = removeBtn.closest(".repeatable-row");
        var list = row.parentElement;
        if (list.children.length > 1) row.remove();
        else row.querySelector("input").value = "";
      }
    });
  }

  /* ---------------- Category switch re-renders specific fields ---------------- */

  function wireCategorySwitch() {
    document.getElementById("categoryId").addEventListener("change", function (e) {
      draft.categoryId = e.target.value;
      document.getElementById("categorySpecificPanel").innerHTML = categorySpecificHtml(draft.categoryId);
    });

    var titleInput = document.getElementById("title");
    var slugInput = document.getElementById("slug");
    var slugTouched = !!draft.slug;
    slugInput.addEventListener("input", function () { slugTouched = true; });
    titleInput.addEventListener("input", function () {
      if (!slugTouched) slugInput.value = AdminStore.slugify(titleInput.value);
    });
  }

  /* ---------------- Submit / validation ---------------- */

  function clearErrors() {
    document.querySelectorAll(".field").forEach(function (f) { f.classList.remove("has-error"); f.querySelector(".error") && (f.querySelector(".error").textContent = ""); });
    var summary = document.getElementById("validationSummary");
    summary.classList.remove("is-visible");
    summary.innerHTML = "";
  }

  function showErrors(errors) {
    var summary = document.getElementById("validationSummary");
    var fieldMap = { title: "title", categoryId: "categoryId", location: "location", source: "source", jobCompany: "jobCompany", jobDescription: "jobDescription" };
    var messages = [];
    Object.keys(errors).forEach(function (key) {
      messages.push(errors[key]);
      var fieldId = fieldMap[key];
      if (fieldId) {
        var field = document.getElementById("field-" + fieldId);
        if (field) { field.classList.add("has-error"); var err = field.querySelector(".error"); if (err) err.textContent = errors[key]; }
      }
    });
    summary.innerHTML = "<strong>Tidak bisa disimpan:</strong><ul>" + messages.map(function (m) { return "<li>" + m + "</li>"; }).join("") + "</ul>";
    summary.classList.add("is-visible");
    summary.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function collectItem(targetStatus) {
    var catId = document.getElementById("categoryId").value;
    var item = {
      id: draft.id,
      title: document.getElementById("title").value.trim(),
      slug: document.getElementById("slug").value.trim(),
      categoryId: catId,
      subcategory: document.getElementById("subcategory").value.trim() || undefined,
      provinceId: document.getElementById("locProvince").value || null,
      regencyId: document.getElementById("locRegency").value || null,
      districtId: document.getElementById("locDistrict").value || null,
      villageId: document.getElementById("locVillage").value || null,
      thumbnailMediaId: document.getElementById("thumbnail").value || null,
      excerpt: document.getElementById("excerpt").value.trim(),
      body: document.getElementById("body").value.split(/\n\s*\n/).map(function (p) { return p.trim(); }).filter(Boolean),
      source: document.getElementById("source").value.trim() || null,
      author: document.getElementById("author").value.trim() || null,
      publishedAt: document.getElementById("publishedAt").value.trim(),
      updatedAt: document.getElementById("updatedAt").value.trim(),
      tags: document.getElementById("tags").value.split(",").map(function (t) { return t.trim(); }).filter(Boolean),
      status: targetStatus
    };

    if (catId === "loker") {
      item.job = {
        position: item.title,
        company: document.getElementById("jobCompany").value.trim(),
        education: document.getElementById("jobEducation").value.trim(),
        salary: document.getElementById("jobSalary").value.trim() || null,
        jobType: document.getElementById("jobType").value.trim(),
        deadline: document.getElementById("jobDeadline").value.trim(),
        description: document.getElementById("jobDescription").value.trim(),
        requirements: readRepeatable("jobRequirements"),
        howToApply: document.getElementById("jobHowToApply").value.trim()
      };
    } else if (catId === "wisata") {
      item.tourism = {
        highlights: readRepeatable("tourismHighlights"),
        facilities: readRepeatable("tourismFacilities"),
        openingHours: document.getElementById("tourismHours").value.trim() || null,
        price: document.getElementById("tourismPrice").value.trim() || null,
        mapNote: document.getElementById("tourismMapNote").value.trim() || null
      };
    } else if (catId === "info-publik") {
      item.publicInfo = {
        officialSource: document.getElementById("publicOfficial").checked,
        area: document.getElementById("publicArea").value.trim(),
        eligibility: readRepeatable("publicEligibility"),
        importantDates: readRepeatable("publicImportantDates"),
        notes: document.getElementById("publicNotes").value.trim() || null
      };
    }

    return item;
  }

  function wireSubmit() {
    var form = document.getElementById("contentForm");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var clicked = e.submitter || form.querySelector("[data-target-status]");
      var targetStatus = clicked.getAttribute("data-target-status") || "draft";

      clearErrors();
      var item = collectItem(targetStatus);
      var result = AdminStore.saveContent(item);
      if (!result.ok) { showErrors(result.errors); return; }

      window.location.href = "content.html";
    });
  }

  AdminShell.render(editId ? "Edit Konten" : "Konten Baru");
  buildForm();
})();
