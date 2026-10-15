/* Public settings only. Never put API keys or OBS ingest/stream keys in this file. */
window.CHURCH_CONFIG = {
  youtubeChannel: 'https://www.youtube.com/@Apostleschurchofchristdubai',
  // One owner-supplied broadcast. It may show a waiting room, live video or replay.
  // Replace for a new event, or activate liveStatusUrl below for automatic discovery.
  youtubeBroadcastId: '5F8Do2ssXno',
  // Optional confirmed public Restream viewing page. Blank uses the Restream platform link.
  restreamWatchUrl: '',
  facebookPage: 'https://www.facebook.com/apostlesdubai/',
  instagramPage: 'https://www.instagram.com/apostles_church_of_christ/',
  // Public details confirmed by the church. Leave blank until supplied.
  contactEmail: '',
  contactPhone: '+971 52 437 3611',
  // Confirmed HTTPS checkout link belonging to the church.
  donationUrl: '',
  // Cloudflare Stream customer playback URL, or another public HLS playback URL.
  videoHlsUrl: '',
  // Public HTTPS URL of the separately deployed YouTube status Worker (/api/live).
  // Configure Google OAuth credentials in Cloudflare Secrets, never in this file.
  liveStatusUrl: '',
  // A separate genuine audio-only HLS/AAC/MP3 stream. Not a hidden video stream.
  audioStreamUrl: '',
  // Add confirmed future events. ISO dates must include the Dubai +04:00 offset.
  // { title: 'Sunday Service', startsAt: '2026-10-18T20:00:00+04:00', location: 'Hall 601' }
  // Add actual published sermon recordings: { title, videoId, speaker, publishedAt, category: "sermon" }.
  sermons: [],
  upcomingEvents: []
};
