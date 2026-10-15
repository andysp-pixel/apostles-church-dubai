/* A public status endpoint only. OAuth/OBS/Restream secrets never belong here. */
(() => {
  'use strict';
  function validate(data) {
    if (!data || !['live', 'external', 'offline'].includes(data.state) || !Number.isFinite(Date.parse(data.checkedAt)) || Math.abs(Date.now() - Date.parse(data.checkedAt)) > 300000) throw new Error('Invalid live status');
    if (data.state !== 'offline' && !/^[\w-]{11}$/.test(data.videoId || '')) throw new Error('Invalid video');
    return { state: data.state, videoId: data.videoId || '', title: typeof data.title === 'string' ? data.title.slice(0, 250) : 'Church live broadcast' };
  }
  function monitor({ url, onStatus, onError, fetcher = (...args) => fetch(...args), isVisible = () => !document.hidden }) {
    if (new URL(url).protocol !== 'https:') throw new Error('HTTPS required');
    let timer, stopped = false, controller, busy = false;
    async function check() {
      clearTimeout(timer);
      if (stopped || busy) return;
      busy = true;
      if (isVisible()) {
        controller = new AbortController(); const timeout = setTimeout(() => controller.abort(), 12000);
        try {
          const response = await fetcher(url, { mode: 'cors', credentials: 'omit', cache: 'no-store', signal: controller.signal });
          if (!response.ok) throw new Error('Live check unavailable');
          const data = validate(await response.json()); if (!stopped) onStatus(data);
        } catch { if (!stopped) onError(); }
        finally { clearTimeout(timeout); controller = null; }
      }
      busy = false;
      if (!stopped) timer = setTimeout(check, 60000);
    }
    return { start: check, stop() { stopped = true; clearTimeout(timer); controller?.abort(); } };
  }
  window.ChurchLiveStatus = { monitor, validate };
})();
