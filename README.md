# Apostles Church of Christ Dubai

Mobile-first presentation for phones up to 767px, with navy, white and gold styling, a sticky menu, touch-sized actions, native swipe gallery and responsive WebP images. The existing desktop stylesheet and layout are preserved. See `MOBILE_QA.md` for completed checks and the browser/device checks still pending.

Seven responsive HTML5 pages: **Our Church, Live, Sermons, Prayer, Donate, About and Visit Us**. Photography-led layout, orange/red church branding, self-hosted Inter and Manrope typography, Cormorant Garamond scripture, smooth slide reveals, a skippable welcome animation and reduced-motion support. No npm install, API key, database or build step is needed to serve the website. Browser-test dependencies are optional and used only for QA.

## GitHub → Cloudflare Pages

The GitHub repository and downloadable ZIP use a **flat layout**: HTML pages, scripts and `assets/` sit at the root. Upload the ZIP contents, not the ZIP itself. Connect `andysp-pixel/apostles-church-dubai` in Cloudflare → Workers & Pages → Create application → Pages → Import an existing Git repository.

| Setting | Value |
| --- | --- |
| Production branch | `main` |
| Framework preset | None |
| Build command | `exit 0` |
| Build output directory | `.` |
| Root directory | Leave blank |

Deploy, then add the real domain under Custom domains. Future pushes to `main` deploy automatically once the Git integration is connected. These files do not connect or change your Cloudflare account by themselves. After choosing a domain, add a canonical URL, absolute Open Graph image URL and sitemap.

The ChatGPT Sites source checkout keeps public files under `dist/`. For that checkout only, the output directory is `dist`; `.openai/hosting.json` belongs to Sites and is excluded from the GitHub ZIP.

Official instructions: https://developers.cloudflare.com/pages/framework-guides/deploy-anything/

## Weekly gatherings

All times are **Asia/Dubai (GST, UTC+4)**.

| Day | Time |
| --- | --- |
| Sunday | 8:00–11:00 PM |
| Thursday | 8:00–11:00 PM |
| Saturday | **3:00–6:00 AM** |

`schedule.js` calculates the next gathering independently of the visitor’s time zone and downloads recurring `.ics` calendars. Saturday is an early morning gathering, as supplied by the owner. The full address appears in the footer and Visit Us page; mobile Home also has a compact location section: Hall 601, 6th Floor, Bank Melliran Building, Al Mankhool, Bur Dubai, near Sharaf DG Metro. Maps searches the supplied wording; an exact map pin has not been supplied.

## Automatic NIV Verse of the Day

`church.js` loads the official Bible Gateway NIV Verse of the Day JSONP feed on Our Church and Prayer. It refreshes hourly and after returning to an old tab. The provider’s reading date is displayed; its day boundary can differ from Dubai’s. No NIV database or API key is bundled. Required **Powered by BibleGateway.com** and NIV/Biblica attribution are included. The feed is permitted by the Cloudflare `_headers` policy.

If the provider or visitor connection is unavailable, the widget shows a reading link. Scripture is rendered as plain text. Bible Gateway receives a request when the widget loads. Documentation: https://www.biblegateway.com/usage/votd/docs/

## Sermons and recordings

The verified recording `G9IpNCJlAVc`, “Ministry of the Apostles - worship Vibe - Sunday Service,” is included as worship. No recent sermon titles, dates or speakers were supplied. The Sermons page has category filters, search and an empty state. Add actual recordings to `config.js`:

```js
sermons: [
  // Use verified church recordings:
  // { title: 'Real message title', videoId: '11-char-id',
  //   speaker: 'Actual speaker', publishedAt: 'YYYY-MM-DD', category: 'sermon' }
],
```

Entries are ordered by supplied publication dates; the latest sermon entries appear on Our Church. YouTube connects when a visitor plays a recording or follows a link.

## Automatic live from OBS / Restream Standard

The optional YouTube integration is prepared in `cloudflare-live-api/`. See `cloudflare-live-api/ACTIVATE.md` for activation. It uses a separate Cloudflare Worker and the church owner's read-only Google OAuth authorization; no credential appears in public files. Live videos load automatically on the Live page after setting the public `liveStatusUrl` in `config.js`. The field is blank until the API is actually deployed, so existing introduction/YouTube behavior remains usable. Google authorization, Worker deployment and an owner-run broadcast test are still required. API and player behavior are covered by `node scripts/check-live.mjs`; physical-device playback remains unverified.

## Live video and audio

The player lives on `live.html`. Until a stream is configured, Watch opens the official YouTube channel. Set public playback URLs in `config.js`:

- `videoHlsUrl`: public HTTPS HLS playback manifest, such as Cloudflare Stream Live. Configure the encoder/OBS and streaming service separately.
- `audioStreamUrl`: separate audio-only MP3, AAC or HLS broadcast. This avoids downloading hidden video.

Playback stops when switching modes. Audio is visibly unavailable until configured. Safari uses native HLS; compatible browsers use included hls.js 1.6.13. Media must permit browser playback/CORS. Never commit OBS keys, ingest secrets or API tokens. Private/signed streams require a separate server token endpoint.

## Prayer and giving

Prayer drafts stay in page memory. Visitors copy them and choose to send them through the church’s Facebook page. Nothing is sent automatically or stored by this website.

Donate preserves beneficiary names, bank details and phones from the owner’s announcement, with exact copy controls. `scripts/donation_accounts.json` is the content source. The IBAN has a valid UAE length and MOD-97 checksum; this confirms format/transcription, not ownership. A confirmed external checkout URL may be set in `donationUrl`; this site does not process payments. Church contact: +971 52 437 3611. Blank email fields stay hidden. An admin dashboard is not included.

## Images and fonts

- The gallery contains seven selected photographs supplied by the owner on 14 October 2026. Three near-duplicate/lower-quality versions were omitted. Gallery JPEGs are copied byte-for-byte; no faces, people, colours or church interiors have been generated or altered. `scripts/gallery.json` records each source filename and SHA-256 checksum.
- The supplied worship-hall photograph now supplies the Home hero and recording artwork. The welcome section uses a supplied congregation photo. Recording covers are church photographs, not a claim that these are frames from the linked YouTube recording.
- The old pastor portrait and Sunday of Glory announcement were removed from the gallery. The pastor portrait remains in About; church branding, giving announcement and intro remain where relevant.
- `assets/gallery-paper-v6.webp` is a very subtle generated matte-paper texture behind the gallery. It is decorative background only. The daily NIV section retains its decorative Bible background. No generated people are included in the gallery or the hero.
- Texture created with the built-in image_gen tool; final project asset: `dist/assets/gallery-paper-v6.webp` (GitHub export: `assets/gallery-paper-v6.webp`). Brief: wide, softly lit warm off-white cotton paper near #f1efe8, faint natural grain and barely perceptible terracotta warmth at the edges; no people, objects, text, logos, stars, religious icons, geometric ornaments or strong gradients.
- Self-hosted fonts include SIL Open Font Licenses. Inter is variable; Manrope handles body text; Cormorant Garamond handles scripture. References influenced spacing and hierarchy; no proprietary font or page code was copied.

## Editing and validation

Edit HTML directly or run `python3 scripts/build_pages.py`. The generator detects `dist/` versus a flat root. Shared sources: `scripts/components.json`, `scripts/modern_sections.py`, `scripts/about_sections.py`, `scripts/build_pages.py` and `scripts/donate_section.html`.

Run `node scripts/check.mjs` with Node 20.11+ to check seven pages, links/assets/anchors, ARIA, active navigation, address placement, giving details, JS syntax, fonts, Dubai time boundaries, recurring calendar output and NIV attribution/CSP.

For local viewing, run `python3 -m http.server 8080` in the flat checkout; add `--directory dist` in the Sites checkout. Use HTTPS in production. Mobile/tablet/desktop breakpoints, touch controls, semantic HTML and reduced-motion support are included. Static and schedule checks pass; actual Android/iOS/macOS/Linux/Windows device and browser playback testing remains unverified.

## Sources

- https://www.youtube.com/@Apostleschurchofchristdubai
- https://www.facebook.com/apostlesdubai/
- Layout references: https://www.harvestchurch.org.au/ and https://fellowshipdubai.com/
- The historical Sunday of Glory poster is a past gathering and does not define the weekly timetable.

No membership totals, unconfirmed history, email address or sermon catalogue were invented.

## Church Vision and gallery

The permanent church Vision is the owner-supplied excerpt of **Luke 1:17, Amplified Bible, Classic Edition (AMPC)**, with Isaiah 40:3 and Malachi 4:5–6 references. The automatic daily verse remains NIV. The About page now has Values, Vision and Mission sections. Footer flags are small local SVGs for UAE and Burundi; Instagram resolves from the owner’s QR to https://www.instagram.com/apostles_church_of_christ/. Link arrows and decorative stars/hearts/pins have been removed from rendered pages and dynamic link labels.

On desktop, the gallery runs on Our Church and About as a **continuous right-to-left photo strip**, rather than advancing one slide every six seconds. Several photos can be visible at once. Landscape and portrait images retain their proportions and are shown without cropping. One hidden duplicate sequence creates a seamless loop at a constant 36 pixels per second. Pause/Play, touch scrolling and keyboard navigation are supported. Motion pauses on hover/focus, while offscreen, in hidden tabs, and during touch gestures. Reduced-motion visitors start with autoplay paused; they can explicitly choose Play.

On phones the same gallery becomes a native horizontal swipe carousel with equal 4:3 image sizes. There is no mobile autoplay or duplicate photo sequence. Mobile photos use WebP source sets; desktop keeps the original image URLs. Run `python3 scripts/mobile_images.py` after adding photographs (requires Pillow) and then regenerate pages.

To add real church photos, copy authorised originals under `assets/gallery/` (or `dist/assets/gallery/` in the Sites checkout). Add entries to `scripts/gallery.json` using `src`, accurate `alt`, `caption`, `width`, `height`, `sourceFile` and `sha256`; regenerate with `python3 scripts/build_pages.py`. The checks verify photograph checksums and gallery behavior. No npm install or new hosting service is needed.

Static checks and DOM simulations pass. Visual layout, real touch interaction and playback across physical devices/browser versions remain unverified in this environment.

## Mobile maintenance

Keep `mobile.css`, `mobile.js`, `assets/mobile/`, and all regenerated HTML pages together when uploading an update. `scripts/mobile_sections.py` owns mobile-only markup and mobile image source sets. The original desktop CSS stays in `styles.css`. Mobile navigation includes Home, About Us, Our Beliefs, Services, Sermons, Events, Gallery, Live Stream, Get Involved and Contact, with Plan Your Visit. Existing Prayer and Donate pages remain accessible through the footer and Get Involved.

Mobile map loading uses the supplied address wording rather than an unverified precise pin. `restreamWatchUrl` can hold a confirmed public viewer URL; until supplied, the Restream button links to the platform and is not a direct church broadcast. The Email Us card asks visitors to request the email on Facebook until `contactEmail` is configured. Future `upcomingEvents` are combined with the next real weekly gatherings, all displayed in Dubai time.

The prepared GitHub Actions workflow includes rendered Chromium/WebKit checks at 320, 360, 375, 390, 412 and 430px. Those rendered checks have not been run in this editing environment; consult `MOBILE_QA.md`. This export does not update the existing public Cloudflare site until its contents are uploaded to the connected repository and a deployment succeeds.
