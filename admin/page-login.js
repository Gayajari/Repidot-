(function () {
  "use strict";

  // If a session already exists, skip straight to the dashboard.
  if (AdminStore.isLoggedIn()) {
    window.location.href = "index.html";
    return;
  }

  var form = document.getElementById("loginForm");
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    // No backend to check credentials against — see admin/README.md.
    // This only marks a UI session so the rest of the prototype is reachable.
    AdminStore.logIn();
    var params = new URLSearchParams(window.location.search);
    window.location.href = params.get("next") || "index.html";
  });
})();
