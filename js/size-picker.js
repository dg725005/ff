// Size picker on the home page.
// Choosing a size is done by the radio buttons. This file only handles "Continue".
(function () {
  var btn = document.querySelector(".size-continue");
  if (!btn) return;

  btn.addEventListener("click", function () {
    var chosen = document.querySelector('input[name="size"]:checked');
    if (!chosen) return;
    // Example: results.html?size=XL
    window.location.href = "results.html?size=" + encodeURIComponent(chosen.value);
  });
})();
