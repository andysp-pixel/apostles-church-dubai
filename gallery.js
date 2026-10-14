(() => {
  'use strict';
  document.querySelectorAll('[data-gallery]').forEach(shell => {
    const viewport = shell.querySelector('.gallery-viewport');
    const track = shell.querySelector('.gallery-track');
    const sequence = track.querySelector('.gallery-sequence');
    const button = shell.querySelector('[data-gallery-pause]');
    const photographs = [...sequence.querySelectorAll('.gallery-slide')];
    if (photographs.length < 2 || !window.requestAnimationFrame) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const hover = window.matchMedia('(hover: hover)');
    const copy = sequence.cloneNode(true);
    copy.classList.add('gallery-loop-group');
    copy.setAttribute('aria-hidden', 'true');
    copy.querySelectorAll('img').forEach(image => { image.alt = ''; });
    track.append(copy);
    button.hidden = false;
    const pixelsPerSecond = 36;
    let distance = 0, offset = 0, frameId = 0, lastTime = null, gestureTimer;
    let userPaused = motion.matches, chosenPause = false, hovering = false, focused = false, gesture = false;
    let inView = !('IntersectionObserver' in window);
    const wrap = value => distance > 0 ? ((value % distance) + distance) % distance : 0;
    const canRun = () => distance > 0 && !userPaused && !hovering && !focused && !gesture && inView && !document.hidden;
    function buttonState() {
      button.textContent = userPaused ? 'Play gallery' : 'Pause gallery';
      button.setAttribute('aria-label', userPaused ? 'Play continuous photo gallery' : 'Pause continuous photo gallery');
    }
    function frame(time) {
      frameId = 0;
      if (!canRun()) { lastTime = null; return; }
      if (lastTime !== null) offset = wrap(offset + pixelsPerSecond * Math.min(Math.max(time - lastTime, 0), 80) / 1000);
      lastTime = time;
      viewport.scrollLeft = offset;
      frameId = window.requestAnimationFrame(frame);
    }
    function update() {
      if (frameId) window.cancelAnimationFrame(frameId);
      frameId = 0; lastTime = null;
      offset = wrap(viewport.scrollLeft);
      viewport.scrollLeft = offset;
      buttonState();
      if (canRun()) frameId = window.requestAnimationFrame(frame);
    }
    function measure() {
      const progress = distance ? wrap(viewport.scrollLeft) / distance : 0;
      distance = copy.offsetLeft - sequence.offsetLeft;
      viewport.scrollLeft = progress * distance;
      update();
    }
    function gestureStart() {
      clearTimeout(gestureTimer);
      gesture = true; update();
    }
    function gestureEnd() {
      if (!gesture) return;
      clearTimeout(gestureTimer);
      gestureTimer = setTimeout(() => { gesture = false; update(); }, 1600);
    }
    button.addEventListener('click', () => { chosenPause = true; userPaused = !userPaused; focused = false; update(); });
    shell.addEventListener('mouseenter', () => { if (hover.matches) { hovering = true; update(); } });
    shell.addEventListener('mouseleave', () => { hovering = false; update(); });
    shell.addEventListener('focusin', () => { focused = true; update(); });
    shell.addEventListener('focusout', event => { if (!shell.contains(event.relatedTarget)) { focused = false; update(); } });
    viewport.addEventListener('pointerdown', gestureStart, { passive: true });
    window.addEventListener('pointerup', gestureEnd, { passive: true });
    window.addEventListener('pointercancel', gestureEnd, { passive: true });
    if (!('PointerEvent' in window)) {
      viewport.addEventListener('touchstart', gestureStart, { passive: true });
      viewport.addEventListener('touchend', gestureEnd, { passive: true });
      viewport.addEventListener('touchcancel', gestureEnd, { passive: true });
    }
    viewport.addEventListener('wheel', () => { gestureStart(); gestureEnd(); }, { passive: true });
    viewport.addEventListener('scroll', () => { if (!canRun()) offset = viewport.scrollLeft; }, { passive: true });
    viewport.addEventListener('keydown', event => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault(); gestureStart();
      const amount = Math.max(220, viewport.clientWidth * 0.6) * (event.key === 'ArrowRight' ? 1 : -1);
      if (viewport.scrollBy) viewport.scrollBy({ left: amount, behavior: motion.matches ? 'instant' : 'smooth' });
      else viewport.scrollLeft += amount;
      gestureEnd();
    });
    document.addEventListener('visibilitychange', update);
    window.addEventListener('resize', measure);
    const preferenceChanged = () => { if (motion.matches) userPaused = true; else if (!chosenPause) userPaused = false; update(); };
    if (motion.addEventListener) motion.addEventListener('change', preferenceChanged); else motion.addListener?.(preferenceChanged);
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver(entries => { inView = entries[0].isIntersecting; update(); }, { threshold: 0.1 });
      observer.observe(shell);
    }
    measure();
  });
})();
