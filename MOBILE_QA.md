# Redesign verification — 5 November 2026

## Performed

- Chrome browser rendering of all seven pages at iframe viewport widths 320, 360, 375, 390, 412 and 430px. No horizontal document overflow at any width.
- All seven pages also checked at 768, 1023, 1024 and 1440px, with no horizontal document overflow.
- A native-scrollbar test environment reserves 15px inside each iframe; document scrollWidth equals clientWidth at every tested size.
- Opened the phone menu at 320px and verified all seven links plus the close control. One navigation tree serves desktop and phones. Keyboard Escape and focus trapping are retained.
- Live player geometry checked at 390px: 333 × 187px (16:9 within pixel rounding). Watch and Listen tabs tested.
- Prayer draft filled and generated in the browser; no message sent.
- Broadcast recording dialog tested: correct event `5F8Do2ssXno`, title and YouTube fallback link. Dialog close tested.
- Static checks passed: seven pages, headings, duplicate IDs, local links/assets/anchors, ARIA targets, JavaScript syntax, exact giving details and IBAN checksum, unchanged original photograph hashes, Dubai calendar conversions.
- Live integration tests passed: API validation/caching, status handling, selected broadcast, autoplay-muted embeds, no player reload on unchanged polling, Watch/Listen transitions, and neutral status when live is not confirmed.

## Limits

Chrome was available for interactive checks. Safari/WebKit, Firefox and physical iPhone/Android devices were not run in this environment. The GitHub Actions Chromium/WebKit suite is included but its next run has not been observed. Playback of the external YouTube event was not confirmed; network, rights and broadcaster settings may affect it. Automatic discovery for future broadcasts requires activation of the separate API.
