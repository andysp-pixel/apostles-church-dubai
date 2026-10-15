# Activate automatic YouTube live broadcasts

Restream **Standard** can send your broadcast to YouTube. The Restream website player requires Business/Enterprise; this integration uses YouTube's player instead.

The website is prepared, but live discovery stays disabled until this separate Worker is deployed and Google authorization is configured. The current church introduction and YouTube links keep working.

## 1. Send your broadcast to YouTube

In Restream, open **Channels → Add New → YouTube** and connect the church owner's channel. Enable that destination for your OBS/Restream broadcast. On YouTube, choose **Public** and allow embedding. Enable live streaming first if your channel has not used it before. Turn on **Auto-start** if you want the encoder to start a scheduled broadcast without a separate Go Live click.

## 2. Authorize a read-only Google connection

Use the Google account that owns the church channel. This Worker calls `liveBroadcasts.list` with the `youtube.readonly` OAuth scope. An ordinary API key is insufficient for that endpoint.

1. Create/select a Google Cloud project and enable **YouTube Data API v3**.
2. Configure Google Auth Platform for this church-owned application. Follow Google's consent, publishing and verification requirements. For initial testing, add the channel owner as a test user. Testing-mode refresh tokens for this scope can expire after seven days; finish Google's production setup for ongoing use.
3. Create an OAuth client of type **Web application**. Add this authorized redirect URI: `https://developers.google.com/oauthplayground`.
4. In Google's **OAuth 2.0 Playground**, open settings, select **Use your own OAuth credentials**, and enter this client's ID and secret there.
5. Request only `https://www.googleapis.com/auth/youtube.readonly`, authorize the church channel, and exchange the authorization code for tokens. Retain the **refresh token** privately; the Worker renews short-lived access tokens automatically.
6. Get the church **Channel ID**, starting with `UC`, from YouTube's advanced account settings. The Worker filters every result to this channel.

Do not commit credentials, put them in website JavaScript, or include them in screenshots/chat. Add them directly to Cloudflare Secrets below. The public Channel ID is safe to share.

## 3. Deploy the separate API Worker

In Cloudflare **Workers & Pages → Create application → Worker**, create a separate Worker named `apostles-church-live-api`. Open **Edit code**, replace the starter with the contents of `worker.mjs`, and deploy. Keep the existing `apostles-church-dubai-web` website Worker intact.

Under the new Worker's **Settings → Variables and Secrets**, add:

| Name | Type | Value |
| --- | --- | --- |
| `YOUTUBE_CLIENT_ID` | Secret | Your OAuth client ID |
| `YOUTUBE_CLIENT_SECRET` | Secret | Your OAuth client secret |
| `YOUTUBE_REFRESH_TOKEN` | Secret | The authorized church-channel refresh token |
| `YOUTUBE_CHANNEL_ID` | Text | The church Channel ID |
| `ALLOWED_ORIGINS` | Text | `https://apostleschurchdubai.org,https://www.apostleschurchdubai.org` |

Save/deploy the settings. Use Cloudflare's actual returned HTTPS Worker URL and append `/api/live`. Do not guess the URL. An optional CLI configuration is included in `wrangler.jsonc`; fill its Channel ID and provision the three secrets before deploying it.

The endpoint returns:

- `live`: a public, embeddable broadcast belonging to the configured channel.
- `external`: a public broadcast whose embedding is disabled; viewers receive a YouTube link.
- `offline`: no eligible public live broadcast was found.
- `unavailable` with HTTP 503: credentials, quota, authorization or provider access need attention. This is not reported as offline.

Private/unlisted streams, other channel broadcasts, tokens and account details are never included in public responses.

## 4. Connect the website

In the website's public `config.js`, set **only** the returned public endpoint URL:

```js
liveStatusUrl: 'https://YOUR-ACTUAL-WORKER-URL/api/live',
```

Upload the updated `config.js`, `app.js`, `live-status.js` and HTML files from this project to the website repository/deployment. In the Sites source checkout these files are under `dist/`; the downloadable website ZIP is flat at the root. The API folder is a separate Worker and is not the website's build output.

YouTube video automatically appears on **Live**, initially muted to respect browser playback rules. Viewers can turn on sound. Broadcast discovery is cached for two minutes, and the visible page checks once a minute: switching can take approximately three minutes plus provider/network delays. No per-stream website edit is needed. Every fresh API result rechecks public visibility and embedding permission. If the visitor selects audio or the introduction, automatic video does not interrupt that choice; selecting Watch resumes it.

The cache is per Cloudflare location. `liveBroadcasts.list` costs one quota unit per request; distributed traffic and concurrent cache misses still consume project quota. Quota exhaustion produces unavailable status and the YouTube link remains usable. This avoids the lower default limit of 100 daily `search.list` calls. Monitor quota in Google Cloud.

## 5. Verify with your own live test

Start a short **Public** test broadcast with embedding enabled through OBS/Restream. Open the API URL: expect `state: live` and the correct church video ID. Open the website Live page on desktop and phone; enable sound, switch Watch/Listen, and stop the test. Confirm the player returns to the offline state. This end-to-end broadcast test requires the owner's Google connection and was not run in the prepared project.

Local checks: `node scripts/check.mjs` and `node scripts/check-live.mjs`.

Official sources:

- https://support.restream.io/en/articles/4996608-stream-to-your-website
- https://support.restream.io/en/articles/3703373-stream-to-youtube
- https://support.google.com/youtube/answer/9854503
- https://developers.google.com/youtube/v3/live/docs/liveBroadcasts/list
- https://developers.google.com/identity/protocols/oauth2/web-server
- https://developers.google.com/oauthplayground/
- https://developers.google.com/youtube/v3/determine_quota_cost
- https://developers.cloudflare.com/workers/configuration/secrets/
