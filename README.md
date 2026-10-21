# Framecast website

The landing page for [Framecast](https://github.com/DhananjaySarathe/framecast-studio), the free, open-source
live-streaming studio for macOS.

It's a plain static site: one HTML page, one stylesheet, two small scripts and a few images. No build step, no
dependencies, no cookies, no analytics, and nothing loaded from other servers (system fonts only). A
Content-Security-Policy in `index.html` keeps it that way.

```
index.html            the page
assets/css/site.css   styles (light and dark follow the system; the toggle overrides)
assets/js/theme.js    applies a saved light/dark choice before the page paints
assets/js/site.js     hero animation, screenshot tabs, copy buttons, scroll reveal
assets/img/           screenshots (WebP), app icon, favicon
```

## Preview it

```bash
python3 -m http.server 8765 --bind 127.0.0.1
```

Then open http://127.0.0.1:8765.

## The download link

Both **Download for Mac** buttons in `index.html` point to:

```
https://github.com/DhananjaySarathe/framecast-studio/releases/latest/download/Framecast.dmg
```

That always serves the newest release of framecast-studio, as long as each release has a file named exactly
`Framecast.dmg`. Nothing on the site needs to change to ship a new build.

Under the main button, "All versions and release notes" links to the releases page.

What does change with a new version (search `index.html` for each):

- the version number, `1.0.0` (hero line and download card)
- the size, `71 MB` (hero line and download button)
- the SHA-256 (download card: shown text and the Copy button's `data-copy`)
- the macOS requirement, if it moves from macOS 14

## Hosting

Any static host works; there's nothing to build. Two free options:

- **GitHub Pages** (the repository has to be public on a free plan): repository Settings › Pages › Build and
  deployment › Deploy from a branch › `main`, folder `/ (root)`. The `.nojekyll` file makes Pages serve the
  files as they are.
- **Cloudflare Pages**: create a project from this repository, leave the build command empty and set the output
  directory to `/`.

## Notes

- The theme toggle stores `light` or `dark` in the browser's localStorage, only after someone clicks it. Nothing
  else is stored and nothing is sent anywhere.
- The animated hero respects "Reduce motion" (it starts paused) and has a pause button.
- Screenshots and the app icon come from the framecast-studio repository (MIT).
