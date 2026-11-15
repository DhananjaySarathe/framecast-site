// Runs before the page paints: marks that scripts run, applies a light/dark choice saved on this device,
// and sets data-os="windows" on Windows PCs so the page offers the Windows download first.
// ?platform=windows or ?platform=mac in the address overrides the detection.
(function () {
  var root = document.documentElement;
  root.classList.add("js");
  try {
    var saved = localStorage.getItem("framecast-theme");
    if (saved === "light" || saved === "dark") root.dataset.theme = saved;
  } catch (e) {}
  var forced = (location.search.match(/[?&]platform=(windows|mac)\b/) || [])[1];
  var onWindows = /Windows NT/.test(navigator.userAgent);
  if (forced ? forced === "windows" : onWindows) root.dataset.os = "windows";
})();
