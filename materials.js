/* ============================================
   ERFOLG LIVING — Materials split sticky-scroll
   Left pane pins and switches the active material's visual (and plays its
   video); the right text column scrolls. The active material is whichever
   step crosses the centre of the viewport — detected with an
   IntersectionObserver (no scroll/rAF dependency). On narrow screens the
   visuals are moved into their steps so it reads as stacked image+text cards.
   ============================================ */
(function () {
  'use strict';

  const section = document.querySelector('.materials');
  const stage = document.querySelector('.materials__stage');
  const steps = Array.prototype.slice.call(document.querySelectorAll('.step'));
  if (!section || !stage || !steps.length) return;

  const visuals = Array.prototype.slice.call(stage.querySelectorAll('.m-visual'));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktopMQ = window.matchMedia('(min-width: 920px)');

  let activeIndex = -1;
  let isDesktop = null;
  let inView = true;

  // ---- Media helpers (video is lazy-loaded on first activation) ----
  function loadVideo(visual) {
    const video = visual.querySelector('.m-visual__video');
    if (!video || video.dataset.loaded) return;
    const src = video.getAttribute('data-video');
    if (!src) return;
    video.dataset.loaded = '1';
    const source = document.createElement('source');
    source.src = src;
    source.type = 'video/mp4';
    video.appendChild(source);
    video.load();
    video.addEventListener('canplay', function () {
      if (visuals.indexOf(visual) === activeIndex && inView) playVideo(visual);
    }, { once: true });
  }

  function playVideo(visual) {
    const video = visual.querySelector('.m-visual__video');
    if (!video) return;
    if (reduceMotion) { visual.classList.add('is-playing'); return; }
    const p = video.play();
    if (p && p.catch) p.catch(function () { /* missing file / blocked — keep the still */ });
    if (video.readyState >= 2) {
      visual.classList.add('is-playing');
    } else {
      video.addEventListener('playing', function () { visual.classList.add('is-playing'); }, { once: true });
    }
  }

  function pauseVisual(visual) {
    visual.classList.remove('is-playing');
    const video = visual.querySelector('.m-visual__video');
    if (video && !video.paused) { try { video.pause(); } catch (e) { /* noop */ } }
  }

  // ---- Set the active material ----
  function setActive(i) {
    if (i === activeIndex) return;
    activeIndex = i;
    steps.forEach(function (s, idx) { s.classList.toggle('is-active', idx === i); });
    visuals.forEach(function (v, idx) {
      if (idx === i) {
        v.classList.add('is-active');
        loadVideo(v);
        if (inView) playVideo(v);
      } else {
        v.classList.remove('is-active');
        pauseVisual(v);
      }
    });
  }

  // ---- Active = the step crossing the viewport centre (thin centre band) ----
  if ('IntersectionObserver' in window) {
    const centreIO = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        const i = steps.indexOf(entry.target);
        if (i >= 0) setActive(i);
      });
    }, { root: null, rootMargin: '-49% 0px -49% 0px', threshold: 0 });
    steps.forEach(function (s) { centreIO.observe(s); });

    // ---- Pause everything when the gallery scrolls fully out of view ----
    const viewIO = new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (!inView) {
        if (activeIndex >= 0) pauseVisual(visuals[activeIndex]);
      } else if (activeIndex >= 0) {
        loadVideo(visuals[activeIndex]);
        playVideo(visuals[activeIndex]);
      }
    }, { threshold: 0 });
    viewIO.observe(document.querySelector('.materials__split') || section);
  }

  // ---- Responsive: interleave visuals into steps on mobile, back to the stage on desktop ----
  function applyLayout() {
    const desktop = desktopMQ.matches;
    if (desktop === isDesktop) return;
    isDesktop = desktop;
    if (desktop) {
      visuals.forEach(function (v) { stage.appendChild(v); });
    } else {
      steps.forEach(function (s, i) { s.insertBefore(visuals[i], s.firstChild); });
    }
  }
  if (desktopMQ.addEventListener) desktopMQ.addEventListener('change', applyLayout);
  else if (desktopMQ.addListener) desktopMQ.addListener(applyLayout);

  // ---- 3D tilt: cursor-driven depth on the pinned card (desktop, fine pointer) ----
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer && !reduceMotion) {
    const MAX_Y = 6;  // left/right tilt, degrees
    const MAX_X = 4;  // up/down tilt, degrees
    stage.addEventListener('mousemove', function (e) {
      const r = stage.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const px = (e.clientX - r.left) / r.width - 0.5;   // -0.5 .. 0.5
      const py = (e.clientY - r.top) / r.height - 0.5;
      stage.style.setProperty('--ry', (px * MAX_Y * 2).toFixed(2) + 'deg');
      stage.style.setProperty('--rx', (-py * MAX_X * 2).toFixed(2) + 'deg');
    });
    stage.addEventListener('mouseleave', function () {
      stage.style.setProperty('--rx', '0deg');
      stage.style.setProperty('--ry', '0deg');
    });
  }

  applyLayout();
  setActive(0);
})();
