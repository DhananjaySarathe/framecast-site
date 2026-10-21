# Framecast website

The landing page for [Framecast](https://github.com/DhananjaySarathe/framecast-studio), the free, open-source
live-streaming studio for macOS.

It's a plain static site: two HTML pages, one stylesheet, a few small scripts and some images. No build step, no
dependencies, no cookies, and system fonts only. It talks to two outside services: Mixpanel, for anonymous visit
and click counts (off until you add a token, see below), and YouTube, whose player (from youtube-nocookie.com)
loads only when someone presses play on the demo. The Content-Security-Policy in each page allows just those.

```
index.html                        the landing page
guests.html                       how to host the guest page so guests can join from anywhere
downloads/framecast-guest-page.zip  the guest page for Framecast 1.0.0 (what guests.html offers)
assets/css/site.css               styles (light by default; the toggle switches to dark)
assets/js/theme.js                applies a saved light/dark choice before the page paints
assets/js/analytics.js            Mixpanel events (token and region at the top)
assets/js/site.js                 hero animation, demo video, screenshot tabs, copy buttons, scroll reveal
assets/js/guests.js               the settings-file helper on guests.html (runs only in the browser)
assets/img/                       screenshots (WebP), app icon, favicon
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

## Mixpanel

Open `assets/js/analytics.js` and fill in the two values at the top:

- `MIXPANEL_TOKEN`: Mixpanel › Project Settings › Overview › Access Keys › **Project Token**. It's public by
  design (it can only send events), so it's fine to commit. Don't use an API secret or a service account here.
- `MIXPANEL_API`: matches your project's Data Residency (same settings page). US is the default; change it for
  an EU or India project.

Nothing is sent while the token is empty, on localhost/127.0.0.1, or when the visitor's browser sends Do Not Track
or Global Privacy Control. Add `?mp_debug` to the page address to print events in the browser console instead.

Events (every event also carries `$os`, `$browser`, `device_type`, `is_mac`, `$referrer`, `$referring_domain`,
screen size, language and any `utm_*` tags; Mixpanel adds city, region and country from the visitor's IP address):

| Event | When | Extra properties |
|---|---|---|
| Page View | a page loads | `theme`, `section` |
| Download Click | a Download for Mac button | `where` (hero, download section) |
| Section Viewed | a section scrolls into view, once per visit | `section` |
| Demo Video Play | the demo video's play button | |
| Live Example Click | "Watch the live stream" under the demo | |
| Social Click | Star on GitHub, Follow on X, Subscribe on YouTube | `network`, `where` (top bar, footer) |
| Guest Page Download | the guest page zip on guests.html | |
| Guest Setup Click | a link to guests.html | `where` |
| Guest Step | a step in the guest mode walkthrough on the home page | `step` (download, host, invite) |
| Env File Download / Env File Copy | the settings-file buttons on guests.html (values are never sent) | |
| GitHub Click, License Click, Release Notes Click | those links | `where` |
| Cloudflare Click, LiveKit Click | sign-up links on guests.html | |
| Nav Click, Screenshot Tab, Copy, Theme Toggle | navigation, screenshot tabs, copy buttons, theme | `tab`, `what`, `to` |
| Page Leave | the visitor leaves | `seconds_on_page`, `max_scroll_percent` |

Visitors are counted with an anonymous random ID kept in the browser's localStorage (`framecast-visitor`).
To track another link or button, add `data-track="Event Name"` (and optional `data-track-where="…"`) to it.

## The guest page download

`downloads/framecast-guest-page.zip` holds the same four files Framecast's `scripts/export_guest_page.sh` writes
(index.html, livekit-client.umd.js, its license and `_headers`), with the files at the top of the zip. When a new
Framecast version changes the guest page, rebuild the zip from framecast-studio and update "for Framecast 1.0.0"
and the size on guests.html:

```bash
cd ../framecast-studio && ./scripts/export_guest_page.sh && (cd build/guest-page && zip -q -X ../../../framecast-site/downloads/framecast-guest-page.zip *)
```

## Follow links

The black bar at the top of both pages (it folds away on scroll) and the footer link to:

- GitHub: https://github.com/DhananjaySarathe/framecast-studio
- X: https://x.com/dhananjay11211
- YouTube: https://www.youtube.com/@ChilledBeer (with `?sub_confirmation=1`, which opens the subscribe prompt)

Under the demo video, "Watch the live stream" opens https://www.youtube.com/live/WnFP2bDTrdY.

## The demo video

The Demo section plays https://youtu.be/71M55RDe9Cg. To change it, replace the video ID `71M55RDe9Cg` in
`index.html` (it's in the poster link's `href` and `data-video`).

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
