// The settings-file helper on guests.html. Everything stays in this tab: nothing is sent anywhere or saved.
(() => {
  "use strict";

  const form = document.querySelector("[data-env-form]");
  if (!form) return;
  const preview = form.querySelector("[data-env-preview]");
  const download = form.querySelector("[data-env-download]");
  const copy = form.querySelector("[data-env-copy]");
  const copyLabel = form.querySelector("[data-env-copy-label]");
  const announce = document.querySelector("[data-announce]");
  const KEYS = ["LIVEKIT_URL", "LIVEKIT_API_KEY", "LIVEKIT_API_SECRET", "GUEST_PAGE_URL"];

  // What each value should look like, and what to say when it doesn't.
  const CHECKS = {
    LIVEKIT_URL: [(v) => /^wss:\/\/\S+$/.test(v), "Should start with wss://", "From step 3. Starts with wss://"],
    LIVEKIT_API_KEY: [(v) => /^API\S+$/.test(v), "Should start with API", "Starts with API"],
    LIVEKIT_API_SECRET: [(v) => /^\S+$/.test(v), "Shouldn't contain spaces", "Shown once when you created the key"],
    GUEST_PAGE_URL: [(v) => /^https:\/\/\S+$/.test(v), "Should start with https://", "From step 2. Starts with https://"],
  };

  const value = (key) => {
    let v = form.elements[key].value.trim();
    // Framecast expects the page address to end in "/".
    if (key === "GUEST_PAGE_URL" && v && !v.endsWith("/")) v += "/";
    return v;
  };

  const fileText = (mask) => [
    "# Framecast: guests from anywhere (Guests tab › Anyone with a link › Load .env file…)",
    ...KEYS.map((key) => {
      const v = value(key);
      return key + "=" + (mask && key === "LIVEKIT_API_SECRET" && v ? v.slice(0, 4) + "••••••••" : v);
    }),
    "",
  ].join("\n");

  function update() {
    let complete = true;
    for (const key of KEYS) {
      const v = value(key);
      const [ok, warning, help] = CHECKS[key];
      const hint = form.querySelector(`[data-hint-for="${key}"]`);
      const bad = v !== "" && !ok(v);
      hint.textContent = bad ? warning : help;
      hint.classList.toggle("warn", bad);
      form.elements[key].setAttribute("aria-invalid", String(bad));
      if (!v) complete = false;
    }
    preview.textContent = fileText(true);
    download.disabled = !complete;
    copy.disabled = !complete;
  }

  form.addEventListener("input", update);
  form.addEventListener("submit", (e) => e.preventDefault());

  download.addEventListener("click", () => {
    const blob = new Blob([fileText(false)], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "framecast-guests.env";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 1000);
    announce.textContent = "Downloaded framecast-guests.env";
  });

  copy.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(fileText(false));
    } catch (e) {
      return;
    }
    copyLabel.textContent = "Copied";
    announce.textContent = "Copied to the clipboard";
    setTimeout(() => { copyLabel.textContent = "Copy text"; }, 1600);
  });

  update();
})();
