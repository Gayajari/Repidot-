(function () {
  "use strict";

  // ---- Sticky header shadow on scroll ----
  var header = document.getElementById("siteHeader");
  function onScroll() {
    if (window.scrollY > 4) {
      header.classList.add("is-scrolled");
    } else {
      header.classList.remove("is-scrolled");
    }
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---- Mobile nav drawer ----
  var mobileNav = document.getElementById("mobileNav");
  var menuOpen = document.getElementById("menuOpen");
  var menuClose = document.getElementById("menuClose");
  var backdrop = document.getElementById("mobileNavBackdrop");

  function openNav() {
    mobileNav.classList.add("is-open");
    mobileNav.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  }
  function closeNav() {
    mobileNav.classList.remove("is-open");
    mobileNav.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
  }
  menuOpen.addEventListener("click", openNav);
  menuClose.addEventListener("click", closeNav);
  backdrop.addEventListener("click", closeNav);
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeNav();
  });

  // ---- Mobile search row toggle ----
  var searchToggle = document.getElementById("mobileSearchToggle");
  var searchRow = document.getElementById("mobileSearchRow");
  searchToggle.addEventListener("click", function () {
    searchRow.classList.toggle("is-open");
    var input = searchRow.querySelector("input[name=q]");
    if (input && searchRow.classList.contains("is-open")) input.focus();
  });

  // ---- Global header search suggestions (every page, not just cari.html) ----
  // Skipped on cari.html itself: its own hero search box (js/page-cari.js)
  // already owns suggestions/keyboard nav for the primary search field.
  if (typeof Repidot !== "undefined" && typeof RepidotIcons !== "undefined" && !document.getElementById("searchForm")) {
    document.querySelectorAll('form[action="cari.html"]').forEach(function (form) {
      var input = form.querySelector('input[name="q"]');
      if (!input) return;

      var list = document.createElement("ul");
      list.className = "suggestions-dropdown";
      form.appendChild(list);

      var debounceTimer = null;
      input.addEventListener("input", function () {
        clearTimeout(debounceTimer);
        var value = input.value;
        debounceTimer = setTimeout(function () {
          var suggestions = Repidot.getSuggestions(value, 5);
          if (!suggestions.length) { list.classList.remove("is-open"); return; }
          list.innerHTML = suggestions.map(function (s) {
            var icon = s.type === "location" ? RepidotIcons.pin : RepidotIcons.search;
            return '<li><a href="' + s.url + '">' + icon + '<span>' + Repidot.escapeHtml(s.label) + '</span>' +
              '<span class="type-tag">' + (s.type === "location" ? "Wilayah" : "Kategori") + '</span></a></li>';
          }).join("");
          list.classList.add("is-open");
        }, 200);
      });

      document.addEventListener("click", function (e) {
        if (!form.contains(e.target)) list.classList.remove("is-open");
      });
      input.addEventListener("keydown", function (e) {
        if (e.key === "Escape") list.classList.remove("is-open");
      });
    });
  }
})();
