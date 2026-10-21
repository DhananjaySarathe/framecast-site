// Runs before the page paints: marks that scripts run, and applies a light/dark choice saved on this device.
(function () {
  var root = document.documentElement;
  root.classList.add("js");
  try {
    var saved = localStorage.getItem("framecast-theme");
    if (saved === "light" || saved === "dark") root.dataset.theme = saved;
  } catch (e) {}
})();
