# Apostles Church of Christ Dubai

Complete responsive church website using the owner's navy/orange reference design. HTML, CSS, JavaScript and assets are in the repository root, preserving the existing GitHub and Cloudflare layout.

Production Worker: `apostles-church-dubai-web`.
Cloudflare builds track `main`; build command is empty and deploy command is `npx wrangler deploy`. The tracked Wrangler configuration deploys the root website, and `.assetsignore` excludes development scripts, API source and documentation from public assets.

All seven pages use one navigation tree. The worship hero, overlapping Live card, ministry shortcuts, service cards, recording cards, supplied photo grid and compact footer adapt to phones and computers. Original photographs, giving details, telephone, location and service times are preserved.

Edit the root HTML directly. Earlier Python generation helpers are retained for reference and must not regenerate this redesigned HTML. Shared presentation is in `styles.css` and `design.css`.

Public settings are in `config.js`. The selected YouTube broadcast is `5F8Do2ssXno`. Its state may be live, waiting or replay; no LIVE NOW claim is shown without a confirmed API response. Automatic discovery of later broadcasts requires the separate API activation in `cloudflare-live-api/ACTIVATE.md`. Do not put API credentials or stream keys in browser files.

Prayer requests are prepared locally for visitors to copy and send through the church's Facebook page. No email submission, payment processor or unconfigured audio stream has been added.

Run `node scripts/check.mjs` and `node scripts/check-live.mjs`. GitHub Actions additionally checks Chromium and WebKit responsive layouts. See `MOBILE_QA.md` for performed checks and limits.
