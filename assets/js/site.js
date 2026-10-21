// Framecast site. No dependencies; nothing is loaded from other servers.
// The installer link lives in index.html (the two Download for Mac buttons): the latest GitHub release.

(() => {
  "use strict";

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // The download starts and the page stays put, so bring the first-open steps into view.
  function setupDownload() {
    const steps = $("#download");
    for (const link of $$("[data-show-steps]")) {
      link.addEventListener("click", () => {
        setTimeout(() => steps.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" }), 150);
      });
    }
  }

  function setupTheme() {
    const button = $("[data-theme-toggle]");
    const root = document.documentElement;
    const systemDark = matchMedia("(prefers-color-scheme: dark)");
    const current = () => root.dataset.theme || (systemDark.matches ? "dark" : "light");
    const label = () => button.setAttribute("aria-label", current() === "dark" ? "Switch to light mode" : "Switch to dark mode");
    button.addEventListener("click", () => {
      const next = current() === "dark" ? "light" : "dark";
      root.dataset.theme = next;
      try { localStorage.setItem("framecast-theme", next); } catch (e) {}
      label();
    });
    systemDark.addEventListener("change", label);
    label();
  }

  function setupNav() {
    const nav = $("[data-nav]");
    const update = () => nav.toggleAttribute("data-scrolled", scrollY > 8);
    addEventListener("scroll", update, { passive: true });
    update();
  }

  function setupCopy() {
    const announce = $("[data-announce]");
    const fallback = (text) => {
      const area = document.createElement("textarea");
      area.value = text;
      area.setAttribute("readonly", "");
      area.className = "sr-only";
      document.body.append(area);
      area.select();
      const ok = document.execCommand("copy");
      area.remove();
      return ok;
    };
    for (const button of $$("[data-copy]")) {
      const label = $("[data-copy-label]", button);
      let reset = 0;
      button.addEventListener("click", async () => {
        const text = button.dataset.copy;
        let ok = true;
        try { await navigator.clipboard.writeText(text); } catch (e) { ok = fallback(text); }
        if (!ok) return;
        label.textContent = "Copied";
        button.classList.add("done");
        announce.textContent = "Copied to the clipboard";
        clearTimeout(reset);
        reset = setTimeout(() => {
          label.textContent = "Copy";
          button.classList.remove("done");
          announce.textContent = "";
        }, 1600);
      });
    }
  }

  function setupTabs() {
    for (const root of $$("[data-tabs]")) {
      const list = $('[role="tablist"]', root);
      const tabs = $$('[role="tab"]', root);
      const select = (tab, focus) => {
        for (const t of tabs) {
          const on = t === tab;
          t.setAttribute("aria-selected", String(on));
          t.tabIndex = on ? 0 : -1;
          document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
        }
        if (focus) tab.focus();
        if (list.scrollWidth > list.clientWidth) {
          list.scrollTo({ left: tab.offsetLeft - (list.clientWidth - tab.offsetWidth) / 2, behavior: reduceMotion ? "auto" : "smooth" });
        }
      };
      tabs.forEach((tab, i) => {
        tab.addEventListener("click", () => select(tab));
        tab.addEventListener("keydown", (e) => {
          const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
          let next = null;
          if (step) next = tabs[(i + step + tabs.length) % tabs.length];
          else if (e.key === "Home") next = tabs[0];
          else if (e.key === "End") next = tabs[tabs.length - 1];
          if (next) { e.preventDefault(); select(next, true); }
        });
      });
    }
  }

  function setupReveal() {
    const items = $$(".reveal");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach((el) => io.observe(el));
  }

  // The hero: one presenter on two canvases, and the AI director changing the look as they talk.
  function setupStage() {
    const studio = $("[data-stage]");
    if (!studio) return;
    const stage = $(".stage", studio);
    const canvases = { h: $('[data-canvas="h"]', studio), v: $('[data-canvas="v"]', studio) };
    // The 9:16 canvas shows the same layers as the 16:9 one, placed for its own shape.
    for (const child of canvases.h.children) canvases.v.append(child.cloneNode(true));

    const SIZE = { h: [1600, 900], v: [900, 1600] };
    // Where each layer sits in each look, in canvas pixels: [x, y, width, height, corner radius].
    const LOOKS = {
      camera: { h: { cam: [0, 0, 1600, 900, 0] }, v: { cam: [0, 0, 900, 1600, 0] } },
      screen: {
        h: { screen: [80, 70, 1440, 760, 20], cam: [1290, 590, 250, 250, 125] },
        v: { screen: [40, 150, 820, 461, 20], cam: [40, 660, 820, 820, 36] },
      },
      roadmap: {
        h: { roadmap: [80, 70, 1440, 760, 20], cam: [1300, 600, 240, 240, 120] },
        v: { roadmap: [40, 150, 820, 820, 24], cam: [270, 1060, 360, 360, 180] },
      },
      bars: {
        h: { bars: [70, 120, 960, 660, 20], cam: [1080, 220, 450, 450, 32] },
        v: { bars: [40, 150, 820, 760, 24], cam: [170, 970, 560, 560, 36] },
      },
      full: { h: { bars: [0, 0, 1600, 900, 0] }, v: { bars: [0, 0, 900, 1600, 0] } },
    };
    const STEPS = [
      { look: "camera", topic: 0, heard: "“Hi everyone, welcome back to the stream.”", did: "Camera" },
      { look: "screen", topic: 1, heard: "“Let me share my screen and open the config.”", did: "Screen + camera bubble" },
      { look: "roadmap", topic: 2, heard: "“Here’s the plan for the next three months.”", did: "Roadmap + camera circle" },
      { look: "bars", topic: 3, heard: "“And this is how the last four streams went.”", did: "Bar chart + camera beside it" },
      { look: "full", topic: 3, heard: "“Stream four was the big one.”", did: "Bar chart, full screen" },
      { look: "bars", topic: 3, heard: "You press ⌃⌥⌘U", did: "Undone: back to chart + camera", undo: true },
    ];
    const STEP_MS = 4200;

    const heard = $("[data-heard]", studio);
    const didRow = $("[data-did]", studio);
    const did = $("span", didRow);
    const undo = $("[data-undo]", studio);
    const topics = $$("[data-topics] li", studio);
    const progress = $("[data-progress]", studio);
    const toggle = $("[data-stage-toggle]", studio);
    const toggleLabel = $("[data-stage-toggle-label]", studio);
    const clocks = $$("[data-tc]");

    function place(look) {
      for (const [key, canvas] of Object.entries(canvases)) {
        const [W, H] = SIZE[key];
        const boxes = LOOKS[look][key];
        for (const layer of $$("[data-ly]", canvas)) {
          const box = boxes[layer.dataset.ly];
          layer.classList.toggle("on", Boolean(box));
          if (!box) continue;
          const [x, y, w, h, r] = box;
          layer.style.left = (x / W) * 100 + "%";
          layer.style.top = (y / H) * 100 + "%";
          layer.style.width = (w / W) * 100 + "%";
          layer.style.height = (h / H) * 100 + "%";
          layer.style.borderRadius = (r / W) * 100 + "cqw";
          // In a bubble or a square, frame the presenter closer.
          if (layer.dataset.ly === "cam") layer.classList.toggle("tight", w < W * 0.9);
        }
        $("[data-lt]", canvas).classList.toggle("on", look === "camera");
      }
      stage.dataset.look = look;
    }

    function say(text, isAction) {
      heard.textContent = "";
      heard.classList.toggle("is-action", Boolean(isAction));
      const words = text.split(" ");
      words.forEach((word, i) => {
        const span = document.createElement("span");
        span.className = "w";
        span.textContent = word;
        span.style.animationDelay = i * 70 + "ms";
        heard.append(span, i < words.length - 1 ? " " : "");
      });
    }

    function decide(step) {
      place(step.look);
      did.textContent = step.did;
      didRow.classList.remove("flash");
      void didRow.offsetWidth;
      didRow.classList.add("flash");
      topics.forEach((li, k) => {
        li.classList.toggle("done", k < step.topic);
        li.classList.toggle("now", k === step.topic);
      });
    }

    let index = 1;
    let stepTimer = 0;
    let decideTimer = 0;
    let running = false;
    let userPaused = reduceMotion;
    let onScreen = true;

    function show(n) {
      const step = STEPS[n];
      clearTimeout(decideTimer);
      say(step.heard, step.undo);
      undo.classList.toggle("press", Boolean(step.undo));
      progress.classList.remove("run");
      void progress.offsetWidth;
      progress.style.animationDuration = STEP_MS + "ms";
      progress.classList.add("run");
      decideTimer = setTimeout(() => decide(step), step.undo ? 500 : 1100);
    }

    function next() {
      index = (index + 1) % STEPS.length;
      show(index);
      stepTimer = setTimeout(next, STEP_MS);
    }

    function update() {
      const shouldRun = !userPaused && onScreen && !document.hidden;
      if (shouldRun === running) return;
      running = shouldRun;
      clearTimeout(stepTimer);
      clearTimeout(decideTimer);
      studio.toggleAttribute("data-paused", !running);
      if (running) {
        show(index);
        stepTimer = setTimeout(next, STEP_MS);
      }
    }

    function setPaused(paused) {
      userPaused = paused;
      toggle.setAttribute("aria-pressed", String(paused));
      toggleLabel.textContent = paused ? "Play animation" : "Pause animation";
      update();
    }

    // First frame, without sliding into place.
    if (reduceMotion) index = 2;
    stage.classList.add("is-instant");
    decide(STEPS[index]);
    say(STEPS[index].heard);
    void stage.offsetWidth;
    stage.classList.remove("is-instant");

    toggle.addEventListener("click", () => setPaused(!userPaused));
    document.addEventListener("visibilitychange", update);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries) => {
        onScreen = entries[0].isIntersecting;
        update();
      }, { threshold: 0.15 }).observe(studio);
    }
    setPaused(userPaused);

    // One clock for both canvases (and the small ones in Features).
    let seconds = 12 * 60 + 4;
    const pad = (n) => String(n).padStart(2, "0");
    setInterval(() => {
      if (userPaused || document.hidden) return;
      seconds += 1;
      const text = pad(Math.floor(seconds / 3600)) + ":" + pad(Math.floor(seconds / 60) % 60) + ":" + pad(seconds % 60);
      for (const clock of clocks) clock.textContent = text;
    }, 1000);
  }

  setupDownload();
  setupTheme();
  setupNav();
  setupCopy();
  setupTabs();
  setupReveal();
  setupStage();
})();
