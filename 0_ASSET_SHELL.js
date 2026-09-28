/* 0_ASSET_SHELL.js — DMO prototype shell injector.
   O markup do header/nav vive ONLY aqui. Nenhuma página o copia.
   Chrome only: sem fórmulas, sem IDs, sem storage, sem fetch. */
(function () {
  "use strict";

  // Listas de navegação por área. Edita só aqui.
  var USER_NAV = [
    { id: "jobon",     label: "Planeamento", href: "20_JOB_ON_01_VISUAL_AUTHORITY_job-on.html" },
    { id: "controlo",  label: "Controlo",    href: "21_CONTROLO_01_VISUAL_AUTHORITY_controlo.html" },
    { id: "boquilhas", label: "Boquilhas",   href: "31_BOQUILHAS_01_VISUAL_AUTHORITY_boquilhas.html" }
  ];
  var ADMIN_NAV = [
    { id: "admin", label: "Admin", href: "13_ADMIN_01_VISUAL_AUTHORITY_admin.html" }
  ];

  function headerHtml(active, area) {
    var nav = area === "admin" ? ADMIN_NAV : USER_NAV;
    var items = nav.map(function (n) {
      var cls = "dmo-nav-item" + (n.id === active ? " dmo-nav-item--active" : "");
      return '<a class="' + cls + '" href="' + n.href + '">' + n.label + "</a>";
    }).join("");
    return (
      '<header class="dmo-app-header">' +
        '<div class="dmo-header-inner">' +
          '<div class="dmo-identity">DMO<span class="dmo-identity-meta">Digital Mold Operations</span></div>' +
          '<nav class="dmo-primary-nav"><div class="dmo-primary-nav-scroll">' +
            items +
          "</div></nav>" +
        "</div>" +
      "</header>"
    );
  }

  function inject() {
    var active = document.body.getAttribute("data-dmo-page") || "";
    var area = document.body.getAttribute("data-dmo-area") || "";
    var slots = document.querySelectorAll("[data-dmo-shell]");
    for (var i = 0; i < slots.length; i++) {
      slots[i].outerHTML = headerHtml(active, area);
    }
  }

  // Corre já (o placeholder já existe no DOM acima do script) — sem flash.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inject);
  } else {
    inject();
  }
})();