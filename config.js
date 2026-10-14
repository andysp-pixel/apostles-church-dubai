/* Public settings only. Never put API keys or OBS ingest/stream keys in this file. */
window.CHURCH_CONFIG = {
  youtubeChannel: 'https://www.youtube.com/@Apostleschurchofchristdubai',
  facebookPage: 'https://www.facebook.com/apostlesdubai/',
  instagramPage: 'https://www.instagram.com/apostles_church_of_christ/',
  // Public details confirmed by the church. Leave blank until supplied.
  contactEmail: '',
  contactPhone: '+971 52 437 3611',
  // Confirmed HTTPS checkout link belonging to the church.
  donationUrl: '',
  // Cloudflare Stream customer playback URL, or another public HLS playback URL.
  videoHlsUrl: '',
  // A separate genuine audio-only HLS/AAC/MP3 stream. Not a hidden video stream.
  audioStreamUrl: '',
  // Add confirmed future events. ISO dates must include the Dubai +04:00 offset.
  // { title: 'Sunday Service', startsAt: '2026-10-18T20:00:00+04:00', location: 'Hall 601' }
  // Add actual published sermon recordings: { title, videoId, speaker, publishedAt, category: "sermon" }.
  sermons: [],
  upcomingEvents: []
};
