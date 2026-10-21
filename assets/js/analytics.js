// Anonymous visit and click counts for the Framecast site, sent to Mixpanel.
// No Mixpanel library and no cookies: events go straight to Mixpanel's ingestion API.
// Nothing is sent while MIXPANEL_TOKEN is empty, on localhost, or when the browser asks not to be tracked.

// Your Mixpanel project token: Mixpanel › Project Settings › Overview › Access Keys › Project Token.
// It's meant to be public (it only lets people send events), so it's fine in this file.
const MIXPANEL_TOKEN = "e25dd6a43096def43efd8de075ded5b5";

// Where your Mixpanel project stores data (Project Settings › Overview › Data Residency):
// US "https://api-js.mixpanel.com", EU "https://api-eu.mixpanel.com", India "https://api-in.mixpanel.com".
const MIXPANEL_API = "https://api-js.mixpanel.com";

(() => {
  "use strict";

  const params = new URLSearchParams(location.search);
  const debug = params.has("mp_debug"); // add ?mp_debug to the URL to see events in the console instead
  const local = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname);
  const optedOut = navigator.globalPrivacyControl === true || navigator.doNotTrack === "1";
  const enabled = Boolean(MIXPANEL_TOKEN) && !local && !optedOut && !navigator.webdriver;
  if (!enabled && !debug) return;

  const randomId = () =>
    (crypto.randomUUID ? crypto.randomUUID() : Date.now().toString(36) + Math.random().toString(36).slice(2));

  // An anonymous ID kept in this browser so repeat visits count as one person.
  let visitor = "";
  try {
    visitor = localStorage.getItem("framecast-visitor") || "";
    if (!visitor) {
      visitor = randomId();
      localStorage.setItem("framecast-visitor", visitor);
    }
  } catch (e) {
    visitor = randomId();
  }

  const ua = navigator.userAgent;
  const os = (() => {
    if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "iOS";
    if (/Android/.test(ua)) return "Android";
    if (/Mac OS X|Macintosh/.test(ua)) return "Mac OS X";
    if (/Windows/.test(ua)) return "Windows";
    if (/CrOS/.test(ua)) return "Chrome OS";
    if (/Linux/.test(ua)) return "Linux";
    return "Other";
  })();
  const browser = (() => {
    if (/Edg\//.test(ua)) return "Microsoft Edge";
    if (/OPR\//.test(ua)) return "Opera";
    if (/Firefox\//.test(ua)) return "Firefox";
    if (/Chrome\//.test(ua)) return "Chrome";
    if (/Safari\//.test(ua)) return "Safari";
    return "Other";
  })();
  const deviceType = os === "iOS" || os === "Android" ? (/iPad|Tablet/.test(ua) || Math.min(screen.width, screen.height) >= 600 ? "Tablet" : "Phone") : "Desktop";

  let referringDomain = "$direct";
  try { if (document.referrer) referringDomain = new URL(document.referrer).hostname; } catch (e) {}

  // Sent with every event. Mixpanel adds the city, region and country from the request (ip=1).
  const base = {
    token: MIXPANEL_TOKEN,
    distinct_id: "$device:" + visitor,
    $device_id: visitor,
    $os: os,
    $browser: browser,
    device_type: deviceType,
    is_mac: os === "Mac OS X",
    $current_url: location.href,
    $referrer: document.referrer || "$direct",
    $referring_domain: referringDomain,
    $screen_width: screen.width,
    $screen_height: screen.height,
    language: navigator.language,
    mp_lib: "framecast-site",
  };
  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"]) {
    if (params.get(key)) base[key] = params.get(key);
  }

  function track(event, props = {}) {
    const payload = { event, properties: { ...base, ...props, time: Date.now(), $insert_id: randomId() } };
    if (debug) console.info("[mixpanel]", event, payload.properties);
    if (!enabled) return;
    const url = MIXPANEL_API + "/track?ip=1";
    const body = "data=" + encodeURIComponent(JSON.stringify([payload]));
    const type = "application/x-www-form-urlencoded";
    if (!(navigator.sendBeacon && navigator.sendBeacon(url, new Blob([body], { type })))) {
      fetch(url, { method: "POST", body, headers: { "Content-Type": type }, keepalive: true, mode: "no-cors" }).catch(() => {});
    }
  }

  track("Page View", { theme: document.documentElement.dataset.theme || "light", section: location.hash || "top" });

  // Clicks on anything marked data-track="Event Name"; data-track-where="hero" becomes the property where: "hero".
  document.addEventListener("click", (e) => {
    const el = e.target.closest("[data-track]");
    if (!el) return;
    const props = {};
    for (const [key, value] of Object.entries(el.dataset)) {
      if (key.startsWith("track") && key !== "track") props[key.charAt(5).toLowerCase() + key.slice(6)] = value;
    }
    if (el.matches("a[href]")) props.link = el.getAttribute("href");
    if (el.matches('[role="tab"]')) props.tab = el.textContent.trim();
    if (el.hasAttribute("data-theme-toggle")) {
      // The page switches theme in its own click handler, so read the new one afterwards.
      setTimeout(() => track(el.dataset.track, { ...props, to: document.documentElement.dataset.theme || "light" }));
      return;
    }
    track(el.dataset.track, props);
  }, true);

  // Which sections people actually reach, once each per visit.
  if ("IntersectionObserver" in window) {
    const seen = new Set();
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        const id = entry.target.id;
        if (!entry.isIntersecting || seen.has(id)) continue;
        seen.add(id);
        io.unobserve(entry.target);
        track("Section Viewed", { section: id });
      }
    }, { threshold: 0.3 });
    document.querySelectorAll("main section[id]:not(#top)").forEach((s) => io.observe(s));
  }

  // How long the visit lasted and how far down the page it got.
  const start = Date.now();
  let maxScroll = 0;
  addEventListener("scroll", () => {
    const depth = (scrollY + innerHeight) / document.documentElement.scrollHeight;
    maxScroll = Math.max(maxScroll, Math.min(100, Math.round(depth * 100)));
  }, { passive: true });
  let left = false;
  addEventListener("pagehide", () => {
    if (left) return;
    left = true;
    track("Page Leave", { seconds_on_page: Math.round((Date.now() - start) / 1000), max_scroll_percent: maxScroll });
  });
})();
