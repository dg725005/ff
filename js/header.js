// Opens and closes the phone menu. Links are real HTML, so Google sees them without this script.
(function () {
  var btn = document.querySelector(".menu-btn");
  var nav = document.getElementById("site-nav");
  var scrim = document.querySelector(".scrim");
  if (!btn || !nav) return;

  function setOpen(open) {
    btn.setAttribute("aria-expanded", open);
    btn.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    nav.classList.toggle("is-open", open);
    scrim.classList.toggle("is-open", open);
    document.body.classList.toggle("menu-open", open);
  }
  btn.addEventListener("click", function () { setOpen(btn.getAttribute("aria-expanded") !== "true"); });
  scrim.addEventListener("click", function () { setOpen(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") { setOpen(false); btn.focus(); } });
  window.matchMedia("(min-width:768px)").addEventListener("change", function () { setOpen(false); });
})();
