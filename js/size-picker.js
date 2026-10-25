// Size picker on the home page.
// Picking a size is handled by the radio buttons themselves. This file only reacts to "Continue".
(function () {
  var btn = document.querySelector(".size-continue");
  var status = document.querySelector(".size-status");
  if (!btn) return;

  btn.addEventListener("click", function () {
    var chosen = document.querySelector('input[name="size"]:checked');
    if (!chosen) return;
    var size = chosen.value; // "M", "L", "XL" or "2XL"

    // Other scripts can listen for this: document.addEventListener("size:continue", ...)
    document.dispatchEvent(new CustomEvent("size:continue", { detail: { size: size } }));

    // TEMPORARY: shows the chosen size until the real Continue behaviour is decided.
    if (status) status.textContent = "Size " + size + " selected.";
  });
})();
