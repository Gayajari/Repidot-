/* ==========================================================================
   REPIDOT ADMIN — SHELL
   Renders the sidebar + topbar into #adminShellRoot on every admin page
   except login.html, and gates the page behind AdminStore.isLoggedIn().
   That gate is sessionStorage-only — see admin/README.md: it is a UI
   prototype, not real access control.
   ========================================================================== */

var AdminShell = (function () {
  var NAV = [
    { section: "Utama", items: [
      { label: "Dashboard", href: "index.html", icon: "grid" }
    ]},
    { section: "Konten", items: [
      { label: "Semua Konten", href: "content.html", icon: "list" },
      { label: "Loker", href: "content.html?cat=loker", icon: "briefcase" },
      { label: "Berita", href: "content.html?cat=berita", icon: "news" },
      { label: "Wisata", href: "content.html?cat=wisata", icon: "mountain" },
      { label: "Kuliner", href: "content.html?cat=kuliner", icon: "food" },
      { label: "Tempat", href: "content.html?cat=tempat", icon: "pin" },
      { label: "Info Publik", href: "content.html?cat=info-publik", icon: "shield" },
      { label: "Event", href: "content.html?cat=event", icon: "calendar" }
    ]},
    { section: "Lainnya", items: [
      { label: "Lokasi", href: "locations.html", icon: "locationDot" },
      { label: "Media", href: "media.html", icon: "image" },
      { label: "Pengguna", href: "users.html", icon: "user" },
      { label: "Pengaturan", href: "settings.html", icon: "settings" }
    ]}
  ];

  function currentFile() {
    return window.location.pathname.split("/").pop() || "index.html";
  }
  function currentCat() {
    return new URLSearchParams(window.location.search).get("cat") || "";
  }

  function isActive(href) {
    var hrefFile = href.split("?")[0];
    var hrefCat = href.indexOf("cat=") !== -1 ? href.split("cat=")[1] : "";
    if (hrefFile !== currentFile()) return false;
    if (hrefFile === "content.html") return hrefCat === currentCat();
    return true;
  }

  function renderNav() {
    return NAV.map(function (group) {
      return (
        '<div class="nav-section-label">' + group.section + '</div>' +
        group.items.map(function (item) {
          return (
            '<a href="' + item.href + '" class="' + (isActive(item.href) ? "is-active" : "") + '">' +
              RepidotIcons[item.icon] + '<span>' + item.label + '</span>' +
            '</a>'
          );
        }).join("")
      );
    }).join("");
  }

  function render(pageTitle) {
    if (!AdminStore.isLoggedIn()) {
      window.location.href = "login.html";
      return;
    }

    var root = document.getElementById("adminShellRoot");
    var contentHtml = root.innerHTML; // page-specific markup, already in the DOM

    root.innerHTML =
      '<div class="admin-shell">' +
        '<div class="admin-sidebar-backdrop" id="adminSidebarBackdrop"></div>' +
        '<aside class="admin-sidebar" id="adminSidebar">' +
          '<div class="brand">' +
            '<span class="logo-mark"><svg viewBox="0 0 24 24" fill="none"><path d="M12 22s7-6.1 7-12.5A7 7 0 0 0 5 9.5C5 15.9 12 22 12 22Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="12" cy="9.5" r="2.5" fill="currentColor"/></svg></span>' +
            '<div>Repidot<div class="tag">Admin</div></div>' +
          '</div>' +
          '<nav class="admin-nav">' + renderNav() + '</nav>' +
          '<div class="sidebar-foot">' +
            '<div class="who">' +
              '<span class="avatar">R</span>' +
              '<div><div class="name">Redaksi Repidot</div><div class="role">Editor</div></div>' +
            '</div>' +
            '<button type="button" id="adminLogoutBtn">' + RepidotIcons.logout + 'Keluar</button>' +
          '</div>' +
        '</aside>' +
        '<div class="admin-main">' +
          '<header class="admin-topbar">' +
            '<div class="left">' +
              '<button type="button" class="icon-btn admin-menu-toggle" id="adminMenuToggle" aria-label="Buka menu">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 6h16M4 12h16M4 18h16" stroke-linecap="round"/></svg>' +
              '</button>' +
              '<span class="page-title">' + pageTitle + '</span>' +
            '</div>' +
            '<a class="view-site" href="../index.html" target="_blank" rel="noopener">' + RepidotIcons.eye + ' Lihat Situs</a>' +
          '</header>' +
          '<div class="admin-content" id="adminContent">' + contentHtml + '</div>' +
        '</div>' +
      '</div>';

    var sidebar = document.getElementById("adminSidebar");
    var backdrop = document.getElementById("adminSidebarBackdrop");
    var toggle = document.getElementById("adminMenuToggle");
    if (toggle) toggle.addEventListener("click", function () {
      sidebar.classList.add("is-open");
      backdrop.classList.add("is-open");
    });
    if (backdrop) backdrop.addEventListener("click", function () {
      sidebar.classList.remove("is-open");
      backdrop.classList.remove("is-open");
    });

    var logoutBtn = document.getElementById("adminLogoutBtn");
    if (logoutBtn) logoutBtn.addEventListener("click", function () {
      AdminStore.logOut();
      window.location.href = "login.html";
    });
  }

  return { render: render };
})();
