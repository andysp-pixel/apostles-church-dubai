# Mobile update — 15 October 2026

The mobile presentation lives in `mobile.css` and applies up to 767px. The original `styles.css` is byte-for-byte unchanged (SHA-256 `06e8dcdde5431272af37c82f552ee683e6ec3b277bb63d151a3856f8b7ea58ed`). Desktop keeps its existing layout, colours and continuous gallery. Tablet adjustments apply only from 768–1023px.

## Delivered

- Sticky 72px header with safe-area padding, full-screen navigation, animated reveal, focus handling, Escape and scroll locking.
- Navy, white and gold mobile hero with real church photography and touch-sized visit/live actions.
- Word / Community / Service shortcuts, single-column gatherings, four community values and upcoming weekly gatherings calculated in Dubai time.
- Responsive 16:9 Live player and YouTube / Facebook / Restream links. LIVE NOW is driven by confirmed live status, never by the weekly schedule. The optional live API still requires owner activation as described in `cloudflare-live-api/ACTIVATE.md`.
- Native swipe gallery with uniform 4:3 photographs and no mobile autoplay. Original photos remain unchanged; responsive WebP variants are used only on phones.
- Location map loaded on visitor request, directions, phone/contact cards, prayer and giving links. No email address or sermon metadata has been invented.
- Responsive prayer and giving pages with readable fields and transfer details. Existing account numbers, beneficiary names and copy controls are preserved.
- HLS library loaded only on the Live page; self-hosted fonts, lazy non-hero images and reduced-motion support.

## Checks completed here

`node scripts/check.mjs`, `node scripts/check-live.mjs` and `node scripts/check-mobile.mjs` passed. They check HTML, assets, links, anchors, ARIA, desktop stylesheet preservation, original photograph hashes, responsive image files/proportions, navigation state/focus/Escape, weekly gathering dates, map activation, giving details, live discovery and Watch/Listen behavior. These are static checks and DOM simulations, not rendered browser measurements.

| Phone width | Interaction simulation | Rendered overflow / appearance |
| --- | --- | --- |
| 320px | Passed | Not run |
| 360px | Passed | Not run |
| 375px | Passed | Not run |
| 390px | Passed | Not run |
| 412px | Passed | Not run |
| 430px | Passed | Not run |

No supported browser-control skill or browser binary was available in this editing environment. The [Sites skill](skill://plugin_connector_1p_689987207de08191979cf68eca2941c6/sites/SKILL.md) explicitly says: “If `$control-browser` is unavailable, skip browser QA: do not start a preview server, install a browser, or improvise another browser-control path.” Accordingly, zero horizontal overflow and physical iPhone/Android behavior have **not** been certified here.

## Run the rendered checks

The included `.github/workflows/mobile-qa.yml` runs checks on pushes and pull requests, then uses Chromium and WebKit at all six requested phone widths and 768, 1023, 1024 and 1440px. It checks all seven pages, document overflow, header/menu behavior, hero touch targets, mobile image selection, gallery geometry, map containment and the Live player's 16:9 ratio. Results and screenshots become a workflow artifact. This workflow has been prepared but has not been executed in GitHub during this edit.

To run it in your own development environment with Node 22:

```sh
npm install --no-save --package-lock=false playwright@1.62.1
npx playwright install --with-deps chromium webkit
node scripts/check-mobile-browser.mjs
```

These dependencies are test-only; the deployed website is still buildless HTML5/CSS/JavaScript. Inspect `test-results/mobile/report.json` and the screenshots, and check a physical iPhone and Android phone before treating device compatibility as verified. An exact Google Maps pin, a public Restream viewer URL, email and additional sermon metadata can be supplied later without redesigning the mobile layout.
